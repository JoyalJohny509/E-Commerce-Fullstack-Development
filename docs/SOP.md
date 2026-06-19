# LUXE Store — Statement of Purpose & Architectural Justification

## 1. Project Mission

The **LUXE Store** is a full-stack, production-grade e-commerce application designed to showcase a secure, scalable transactional architecture integrated with modern AI-driven discovery patterns. The project was upgraded from a prototype to a production-ready application to demonstrate:
1. **Database Reliability and Type-Safety**: Moving database operations from error-prone raw SQL queries to a strictly typed Object-Relational Mapping (ORM) layer.
2. **Strict Financial Compliance**: Eliminating raw credit card input forms that violate PCI-DSS standards, replacing them with a secure, webhook-driven Stripe payment gateway.
3. **Advanced AI Discovery (RAG)**: Implementing a custom vector similarity search using PostgreSQL `pgvector` alongside a Retrieval-Augmented Generation (RAG) summarization pipeline backed by anti-hallucination guardrails.

The final deliverable satisfies the technical benchmarks expected of a high-tier software engineering research project.

---

## 2. Module Interoperability

The architecture is built from four core decoupled modules that synchronize to deliver a seamless shopping experience:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Authentication Module                           │
│  - Issuance of Jose JWT Session Tokens inside Secure HttpOnly Cookie   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Identifies User Session
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            Cart Module                                 │
│  - Tracks quantities, maps users to products via unique constraints    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Provides line-items for payment
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Checkout Module                               │
│  - Validates cart values, locks database order, redirects to Stripe    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Confirms transaction & triggers state update
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Search & AI Module                            │
│  - Vector embeddings query, similarity matching, grounded summarization│
└────────────────────────────────────────────────────────────────────────┘
```

1. **Authentication ↔ Cart & Checkout**: The custom JWT authentication middleware inspects request cookies to identify the active user. The Cart and Checkout routes consume this authenticated context to load user-specific database rows, preventing cross-user cart exposure (IDOR protection).
2. **Cart ↔ Checkout ↔ Stripe**: The checkout route reads the user's current items, computes cart totals, locks a record in the database as a `pending` order, and requests a Stripe Checkout URL. When Stripe triggers a cryptographic webhook, the fulfillment handler updates the order status to `confirmed` and clears the user's cart.
3. **Product Catalog ↔ AI Semantic Search**: Product changes or updates trigger vector embedding recalculations. The search component can toggle on AI Search, converting the input query to a vector embedding, searching against product vectors via `pgvector`, and passing the top results to a localized LLM summarizer.

---

## 3. Technology Justification

Every technology in the LUXE Store stack was selected to maximize type safety, minimize operational overhead, and maintain high performance.

### Drizzle ORM vs. Prisma
While Prisma is a popular choice for Node.js developers, **Drizzle ORM** was selected for three core engineering reasons:
1. **Serverless Footprint**: Prisma relies on a heavy Rust-based query engine binary (~2-3MB+) which increases serverless cold-start times on edge/Vercel functions. Drizzle is a lightweight, zero-dependency, pure TypeScript ORM (~50KB) that communicates directly via standard Postgres drivers.
2. **SQL Closeness**: Drizzle matches SQL query constructs 1:1, allowing optimization of database calls while retaining complete type-safety.
3. **Zero Code-Generation**: Drizzle infers TypeScript types directly from the schema code. It eliminates the need for a separate compilation step (like `prisma generate`), reducing build times.

### Stripe Hosted Checkout vs. Embedded Stripe Elements
To process customer payments securely, we chose **Stripe Hosted Checkout** over embedded Stripe Elements:
1. **PCI-DSS SAQ-A Compliance**: Enforcing embedded inputs requires strict validation. Stripe Hosted Checkout relocates the payment inputs to Stripe's servers. The merchant server is never exposed to raw card data, reducing security liabilities.
2. **Out-of-the-Box Features**: It supports multi-device payment methods (Apple Pay, Google Pay) and handles 3D Secure verification out of the box.

### Supabase pgvector vs. Dedicated Vector Databases (Pinecone, Milvus)
For semantic vector storage, we chose **Supabase pgvector** instead of setting up a separate vector database:
1. **Single Database Architecture**: Keeping data in a single Postgres database prevents synchronization issues between the main product tables and a separate vector store.
2. **Relational Joining**: Using `pgvector` allows us to perform similarity searches and filter by category or price in a single, high-speed query, rather than querying a separate vector database and manually stitching relational records.

---

## 4. Research & Engineering Contributions

The upgraded LUXE Store showcases several advanced engineering patterns:

### 1. Robust Vector RAG Pipeline with Hallucination Guardrails
Typical AI e-commerce implementations pass search queries directly to an LLM, making them vulnerable to hallucinating products that do not exist in the store. The LUXE Store's search pipeline mitigates this risk by separating retrieval from summarization:
- **Cosine Distance Filter**: The database uses pgvector to calculate cosine distance (`<=>`). Results with similarity scores below `0.3` are discarded.
- **System-Prompt Grounding**: The LLM prompt restricts output generation to the retrieved product context.
- **Reference Matcher**: A post-processing guardrail checks the LLM summary for product names. If the summary references any product not retrieved from the database, the summary is discarded and the system falls back to returning the raw product matches.

### 2. Cryptographically Signed, Idempotent Transaction Webhook
The Stripe webhook endpoint implements secure transaction handling:
- **Cryptographic Signatures**: The webhook validates incoming payloads using Stripe's webhook signing secret, preventing unauthorized payment spoofing.
- **Idempotency checks**: The webhook handler checks the database state before applying updates. If a webhook is delivered multiple times, the transaction is updated only once, preventing double-processing issues.

### 3. Edge-Compatible, Stateless JWT Session Lifecycle
The authentication architecture uses the lightweight `jose` library rather than node-dependent cryptographic packages, ensuring the authentication checks can run on edge middleware functions. Session tokens are stored in secure, HttpOnly, SameSite=Lax cookies, creating a strong defense against XSS and CSRF attacks.
