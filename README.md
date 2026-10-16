# BookLeaf Publishing — Author Support & Communication Portal

A full-stack, enterprise-grade publishing support platform built for **BookLeaf Publishing**. Designed to scale author communications across thousands of authors in India and the US, the platform features multi-tenant author data isolation, real-time ticket conversations, administrative overrides, and Google Gemini AI-powered response drafting grounded in BookLeaf's authoritative policies.

---

## 1. Architecture & Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom editorial design system
- **State & Real-time**: React Context (`AuthContext`, `ToastContext`), Smart Polling hook (`usePolling`) with HTML5 visibility change detection
- **Visualization**: Recharts (domain category distribution)
- **Icons**: Lucide React

### Backend
- **Framework**: Express.js with Node.js
- **Language**: TypeScript (strict mode)
- **Validation**: Zod schema validation on all incoming request bodies and query parameters
- **Security**: Helmet, CORS with origin credentials, CookieParser, Express Rate Limiting
- **Authentication**: JWT stored in secure `HttpOnly`, `SameSite` cookies with Bearer token header support
- **Password Hashing**: Bcrypt with 10 salt rounds
- **Testing**: Vitest & Supertest automated test suite (15/15 passing tests)

### Database
- **Engine**: MongoDB with Mongoose ODM
- **Seeding**: Idempotent seed script importing all 10 authors and 18 books from `FULLSTACK-SAMPLEDATA.json`

### AI Intelligence Layer
- **SDK**: Official `@google/genai` SDK
- **Model**: Google Gemini (`gemini-3.8-flash` or configurable via environment variables)
- **Capabilities**:
  1. Auto-classification into BookLeaf's 6 exact operational domains.
  2. Automatic operational priority scoring (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
  3. Grounded response draft generation trained on BookLeaf's royalty, print, ISBN, and distribution policies.
  4. Resilient deterministic rule-based fallback engine when Gemini API is unconfigured or rate-limited.

---

## 2. Prerequisites

- **Node.js**: `v18.0.0` or later (`v24.11.0` verified)
- **npm**: `v9.0.0` or later (`v11.15.0` verified)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI
- *(Optional)* **Google Gemini API Key**: Obtainable free from [Google AI Studio](https://aistudio.google.com/)

---

## 3. Quick Start & Local Setup

### Step 1: Clone and Navigate
```bash
cd bookleaf-assignment
```

### Step 2: Configure Environment Variables
Copy the `.env.example` file to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Ensure `backend/.env` has the following configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bookleaf
JWT_SECRET=bookleaf_super_secret_jwt_key_2026_dev
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

# Optional: Add your Google Gemini API Key for live AI responses
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
```

> **Note on AI Fallback**: If `GEMINI_API_KEY` is left blank or omitted, the application **remains fully functional**! The built-in BookLeaf Knowledge Base Rules Engine automatically classifies tickets and drafts grounded responses.

### Step 3: Install Dependencies
Install dependencies for both backend and frontend:
```bash
# In backend directory
cd backend
npm install

# In frontend directory
cd ../frontend
npm install
cd ..
```

### Step 4: Seed Database (Idempotent Import)
Run the automated seed script to import all 10 authors and 18 books from `FULLSTACK-SAMPLEDATA.json` and initialize the default administrator account:
```bash
npm run seed --prefix backend
```

Output:
```text
[Database] MongoDB connected successfully
[Seed] Created admin account: admin@bookleaf.com
[Seed] Authors: 10 created, 0 updated (Total: 10)
[Seed] Books processed: 18 (Expected: 18)
[Seed] Seeding realistic sample tickets...
--- Database Seeding Complete ---
```

---

## 4. Development & Running the Application

Open two terminal windows:

**Terminal 1 — Express Backend API (Port 5000)**:
```bash
npm run dev --prefix backend
```
API runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

**Terminal 2 — Next.js Frontend (Port 3000)**:
```bash
npm run dev --prefix frontend
```
Frontend runs at: `http://localhost:3000`

---

## 5. Demo Login Credentials

The application includes an instant **"Switch Demo Persona"** dropdown in the header navbar and the login screen:

| Role | Name | Email | Password | Key Context / Features |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Operations Admin | `admin@bookleaf.com` | `Admin@123` | Ticket queue, overrides, private internal notes, AI response drafting |
| **AUTHOR** | Priya Sharma (`AUTH001`) | `priya.sharma@email.com` | `Author@123` | 2 published titles, ₹3,570 pending royalty |
| **AUTHOR** | Rohit Kapoor (`AUTH002`) | `rohit.kapoor@email.com` | `Author@123` | High volume seller: 2,079 total copies sold, ₹5,280 pending |
| **AUTHOR** | Sneha Kulkarni (`AUTH007`) | `sneha.kulkarni@email.com` | `Author@123` | 3 books including *"Midnight in Mysore"* (In Production) |
| **AUTHOR** | Arjun Malhotra (`AUTH006`) | `arjun.malhotra@email.com` | `Author@123` | 1 book, ₹2,464 pending royalty, active support query |
| **AUTHOR** | Kavita Deshmukh (`AUTH009`) | `kavita.deshmukh@email.com` | `Author@123` | 2 books including *"Raising Roots"* (Typesetting stage) |

---

## 6. Automated Testing & Verification

The backend includes a comprehensive Vitest + Supertest automated test suite covering:
- Authentication success & invalid credential rejections
- Route protection and RBAC (`AUTHOR` vs `ADMIN`)
- Multi-tenant data isolation & book ownership validation
- Segregation and total redaction of internal admin notes from authors
- Ticket creation, status updates, and priority overrides
- AI classification and draft response generation

Run the tests:
```bash
npm run test --prefix backend
```

**Result**: `15 passed (15 tests)` in `1.48s`.

---

## 7. AI Prompt Strategy & Cost Awareness

### A. Classification & Priority Scoring
- Prompts constrain Gemini strictly to BookLeaf's 6 operational categories and 4 priority levels.
- System prompt uses structured JSON outputs validated against Zod schema.
- Cost-saving: Only the subject, description, and high-level book context are passed (~350 tokens).

### B. Grounded Response Drafts
- Sourced from BookLeaf's authoritative policies:
  * 80/20 royalty split, quarterly reconciliation, 45-day payment window, ₹1,000 threshold.
  * Delhi in-house printing & warehouse, 5–7 business days turnaround, 100% free reprint for verified defects.
  * 48-hour ISBN mismatch resolution SLA.
  * 24–48 hour Amazon/Flipkart distributor stock re-sync.
- Context injection is capped: only the author profile, relevant book metrics, and the last 4 public conversation messages are provided (~800–1,200 tokens).

### C. Graceful Degradation
- If Gemini is unreachable or unconfigured, ticket creation **never fails**.
- A deterministic rule-based engine classifies the query using regex keyword pattern matching and flags `aiAnalysisStatus: 'FALLBACK'`.
- Admins can edit drafts, override classifications, or click **"Re-evaluate AI"** at any time.

---

## 8. Deployment Guide

### A. Frontend (Vercel)
1. Push repository to GitHub/GitLab.
2. In Vercel, import the repository and set **Root Directory** to `frontend`.
3. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api.onrender.com/api/v1`
4. Deploy.

### B. Backend API (Render / Railway)
1. Create a new Web Service on Render or Railway pointing to `backend`.
2. Build Command: `npm install && npm run build`
3. Start Command: `npm run start`
4. Set Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/bookleaf?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<random-secure-string>`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
   - `GEMINI_API_KEY`: `<your-gemini-key>`
   - `GEMINI_MODEL`: `gemini-3.8-flash`

---

## 9. Security Considerations

- **HttpOnly Cookies**: Prevents client-side script access to JWT tokens, eliminating XSS token theft.
- **Role-Based Access Control**: Middleware (`requireRole('AUTHOR')`, `requireRole('ADMIN')`) guarantees that authors cannot access operational routes.
- **Strict Ownership Checks**: Backend independently validates that a submitted `bookId` belongs to `req.user._id`.
- **Private Notes Isolation**: Stored in a distinct database model and filtered completely out of author responses.
- **Rate Limiting**: Defends against brute-force password guessing (30 attempts / 15m) and API scraping (300 req / 15m).

---

## 10. Known Limitations & Future Improvements

1. **File Attachments (UI-Only Simulation)**: The support query creation form includes optional file attachment UI simulation (file name selection) as permitted by the technical specification. In a production system, this would be wired to an object store (e.g., AWS S3 or Cloudinary) with pre-signed upload URLs and automated file sanitization.
2. **Real-Time Synchronization (Smart Polling)**: The application utilizes a lightweight 6-second polling hook with HTML5 `visibilitychange` detection that suspends when browser tabs are hidden. While highly efficient and resilient against connection drops, future iterations could offer WebSockets or Server-Sent Events (SSE) for sub-second updates at scale.
3. **Upstream AI Availability & Graceful Fallback**: The backend is configured for Google's current stable `gemini-3.8-flash` model. Upstream API requests to this model may occasionally experience temporary high-demand spikes (HTTP 503). The system is architected for zero-downtime graceful degradation: when the external model is unavailable or rate-limited, the application automatically engages the deterministic BookLeaf Knowledge Base heuristics engine (`isFallback: true`), guaranteeing uninterrupted ticket submission, classification, and drafting.

---

## 11. Documentation Index

- **System Architecture**: [`docs/architecture.md`](file:///c:/Users/admin/Desktop/bookleaf-assignment/docs/architecture.md)
- **API Reference**: [`docs/api.md`](file:///c:/Users/admin/Desktop/bookleaf-assignment/docs/api.md)
- **One-Page Approach Writeup**: [`docs/approach.md`](file:///c:/Users/admin/Desktop/bookleaf-assignment/docs/approach.md)
