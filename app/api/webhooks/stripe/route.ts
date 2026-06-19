import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/db/init';
import { orders, cartItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook handler for checkout.session.completed events.
 *
 * Security:
 * - Verifies the webhook signature using STRIPE_WEBHOOK_SECRET
 * - Uses raw request body (not parsed JSON) for signature verification
 * - Idempotent: checks order status before updating to prevent duplicate processing
 *
 * Flow:
 * 1. Verify Stripe webhook signature
 * 2. Extract order ID from session metadata
 * 3. Update order status: pending → confirmed
 * 4. Store the payment_intent ID for future refunds
 * 5. Clear the user's cart
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json(
        { error: `Webhook Error: ${message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout: update order status and clear cart.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  const userId = session.metadata?.userId;

  if (!orderId || !userId) {
    console.error('Webhook: Missing orderId or userId in session metadata');
    return;
  }

  await initializeDatabase();

  // Idempotency check: only update if still pending
  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    console.error(`Webhook: Order ${orderId} not found`);
    return;
  }

  if (order.status !== 'pending') {
    console.log(`Webhook: Order ${orderId} already processed (status: ${order.status})`);
    return;
  }

  // Update order status to confirmed and store payment intent ID
  await db
    .update(orders)
    .set({
      status: 'confirmed',
      stripePaymentIntentId: session.payment_intent as string,
    })
    .where(eq(orders.id, orderId));

  // Clear the user's cart
  await db.delete(cartItems).where(eq(cartItems.userId, userId));

  console.log(`Webhook: Order ${orderId} confirmed, cart cleared for user ${userId}`);
}

/**
 * Handle expired checkout session: cancel the pending order.
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('Webhook: Missing orderId in expired session metadata');
    return;
  }

  await initializeDatabase();

  // Only cancel if still pending
  const [order] = await db
    .select({ status: orders.status })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (order && order.status === 'pending') {
    await db
      .update(orders)
      .set({ status: 'cancelled' })
      .where(eq(orders.id, orderId));

    console.log(`Webhook: Order ${orderId} cancelled (session expired)`);
  }
}
