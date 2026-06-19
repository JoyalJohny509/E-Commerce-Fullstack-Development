import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { orders, orderItems, cartItems, products } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { eq } from 'drizzle-orm';

/**
 * POST /api/checkout/session
 *
 * Creates a Stripe Checkout Session and a pending order in the database.
 * Returns the Stripe Checkout URL for client-side redirect.
 *
 * Flow:
 * 1. Authenticate user via JWT cookie
 * 2. Fetch user's cart items with product details
 * 3. Calculate totals (subtotal, shipping, tax)
 * 4. Create a pending order in the database
 * 5. Create a Stripe Checkout Session with line items
 * 6. Store the stripe_session_id on the order
 * 7. Return the checkout URL
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { shippingAddress } = await request.json();

    if (!shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Shipping address is required' },
        { status: 400 }
      );
    }

    await initializeDatabase();

    // Fetch cart items with product details
    const cartRows = await db
      .select({
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        name: products.name,
        description: products.description,
        price: products.price,
        image: products.image,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, session.userId));

    if (cartRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = cartRows.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 100 ? 0 : 9.99;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const orderId = `ORD-${Date.now()}`;
    const createdAt = new Date();
    const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Build Stripe line items from cart
    const lineItems = cartRows.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || undefined,
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
            description: 'Standard shipping',
          },
          unit_amount: Math.round(shipping * 100),
        },
        quantity: 1,
      });
    }

    // Add tax as a line item
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Sales Tax',
            description: '8% sales tax',
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    // Determine base URL for redirects
    const origin = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/checkout/cancel?order_id=${orderId}`,
      metadata: {
        orderId,
        userId: session.userId,
      },
      customer_email: session.email,
    });

    // Create a pending order in the database
    await db.insert(orders).values({
      id: orderId,
      userId: session.userId,
      subtotal,
      shipping,
      tax,
      total,
      status: 'pending',
      paymentMethod: 'stripe',
      shippingAddress: JSON.stringify(shippingAddress),
      stripeSessionId: stripeSession.id,
      createdAt,
      estimatedDelivery,
    });

    // Insert order items
    await db.insert(orderItems).values(
      cartRows.map((item) => ({
        orderId,
        productId: item.productId,
        productName: item.name,
        productImage: item.image,
        price: item.price,
        quantity: item.quantity,
      }))
    );

    return NextResponse.json({
      success: true,
      sessionUrl: stripeSession.url,
      orderId,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
