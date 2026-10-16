# BookLeaf Author Support Portal — Approach & Architectural Rationale

## 1. What Was Prioritized

In alignment with the assignment criteria, the focus was placed on **working business functionality, reliable AI integration, rock-solid security, and domain accuracy** over superficial animations:

1. **Dataset Integrity & Edge Cases**: The full dataset of 10 authors and 18 books was preserved with zero fabricated numbers. Edge cases (books in production with null publication dates, missing ISBNs, missing MRPs, null print partners, and zero royalties) were made first-class citizens in both backend schemas and frontend UI.
2. **AI Reliability & Graceful Degradation**: Gemini `@google/genai` SDK integration with strict Zod validation. If an API key is missing or the external API experiences rate limiting/errors, ticket submission and drafting never fail—the system falls back to a deterministic rule-based knowledge base engine.
3. **Multi-Tenant Author Isolation**: Strict database-level scoping ensuring authors can only query their own books and tickets. Attempting to open another author's book or ticket produces `403 Forbidden`.
4. **Internal Notes Segregation**: Private administrative notes are physically stored in a segregated collection and are completely absent from author-facing endpoints.
5. **Practical UX & Smart Polling**: Clean editorial SaaS interface with lightweight 6-second polling that automatically pauses when tabs are hidden, avoiding WebSocket connection bloat.

---

## 2. Key Architecture Decisions & Trade-Offs

- **Next.js 14 App Router + Express.js API Monorepo**: Decoupled backend REST API from the presentation layer. This allows independent scaling, clean middleware piping (Helmet, CORS, Rate Limiting), and easy deployment (e.g., Render/Railway for API, Vercel for frontend).
- **MongoDB & Mongoose**: Selected for hierarchical author-book models and flexible ticket metadata (AI metrics, overrides, conversation history). Virtual getters (`effectiveCategory`, `effectivePriority`) unify operational overrides seamlessly.
- **Polling vs. WebSockets**: WebSockets introduce persistent stateful connection management, firewall complexities, and reconnect storms for a ticket queue. Smart polling with HTML5 visibility change detection delivers near-real-time responsiveness with zero connection leak overhead.

---

## 3. AI Model & Prompt Engineering Strategy

- **Model Choice**: `gemini-3.8-flash` via `@google/genai`. Offers state-of-the-art reasoning, high throughput, low latency, and cost-effective token consumption.
- **Classification & Priority Scoring**: System prompt calibrates the model against BookLeaf's 6 exact categories and 4 priority tiers. A strict JSON schema enforced by Zod eliminates parsing errors.
- **Knowledge-Base-Grounded Response Drafting**: Draft prompts are seeded with BookLeaf's operational policies (80/20 royalty split, quarterly cycle within 45 days, ₹1,000 rollover threshold, Delhi in-house facility, 5–7 day turnaround, 24–48h stock sync, free reprint guarantee).
- **Tone Guidelines**: Empathetic, respectful partner mindset; validates concerns first, includes concrete numbers/dates, avoids vague reassurances, and never hallucinates completed actions.

---

## 4. Cost Awareness & Error Management

- **Token Efficiency**: The entire database is never dumped into prompts. Prompts receive strictly the active ticket context, author summary, relevant book metrics, and the last 4 public messages (~800–1,200 tokens per call).
- **Defensive Error Handling**: All AI calls are wrapped in defensive try/catch blocks. Failed calls populate `aiAnalysisStatus: 'FALLBACK'` or `'FAILED'` and allow manual admin overrides and on-demand retries.

---

## 5. Production Evolution Roadmap

To transition this system to enterprise production scale (1,200+ monthly books):
1. **Email Integration**: Webhook triggers (SendGrid/Postmark) for inbound email-to-ticket conversion and outbound status notifications.
2. **File Storage**: Replace UI file simulation with AWS S3 / Cloudinary pre-signed upload URLs with virus scanning.
3. **Vector Search / RAG**: Implement embeddings (e.g., `text-embedding-004`) in MongoDB Atlas Vector Search for retrieval over expanding company documentation.
4. **Automated Escalation Triggers**: Background cron worker flagging unassigned critical tickets older than 4 hours directly to operations leads.
