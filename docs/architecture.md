# BookLeaf Publishing — Architecture & Technical Design

## 1. Executive Architecture Summary

The **BookLeaf Author Support & Communication Portal** is an enterprise-grade full-stack web application architected to streamline author communications, publication tracking, royalty reconciliation, and operational query management at scale. The platform features strict role-based access control (RBAC), multi-tenant author data isolation, an intelligent Google Gemini AI integration engine with deterministic fallback rules, and near-real-time synchronization between authors and operations personnel.

```mermaid
graph TD
    subgraph ClientLayer ["Client Presentation Layer (Next.js 14)"]
        AP["Author Portal (/author/*)"]
        AD["Admin Operations Console (/admin/*)"]
        AUTH["Unified Authentication (/login)"]
        POLL["Lightweight Smart Polling Hook (5-10s)"]
    end

    subgraph SecurityLayer ["Security & Gateway Layer"]
        CORS["CORS Protection"]
        HELMET["Helmet HTTP Headers"]
        RATELIMIT["Rate Limiting Middleware"]
        COOKIE["HttpOnly SameSite Cookie Token"]
        ZOD["Zod Request Validation"]
    end

    subgraph ApiLayer ["REST API Engine (Express.js / TypeScript)"]
        AUTH_ROUTER["/api/v1/auth"]
        AUTHOR_ROUTER["/api/v1/author"]
        ADMIN_ROUTER["/api/v1/admin"]
    end

    subgraph ServiceLayer ["Business & AI Intelligence Layer"]
        AUTH_SVC["Bcrypt & JWT Auth Service"]
        TICKET_SVC["Ticket Lifecycle Engine"]
        AI_SVC["Gemini AI Service (@google/genai)"]
        KB_ENGINE["Knowledge Base Fallback Rules Engine"]
    end

    subgraph PersistenceLayer ["Persistence Layer (MongoDB)"]
        USERS_COL["users collection"]
        BOOKS_COL["books collection"]
        TICKETS_COL["tickets collection"]
        MESSAGES_COL["messages collection (Public)"]
        NOTES_COL["internalNotes collection (Private)"]
    end

    AP --> SECURITY_LAYER
    AD --> SECURITY_LAYER
    AUTH --> SECURITY_LAYER
    POLL --> SECURITY_LAYER

    SECURITY_LAYER --> ApiLayer
    ApiLayer --> ServiceLayer
    ServiceLayer --> PersistenceLayer
    AI_SVC -.->|External API| GEMINI["Google Gemini API (gemini-3.8-flash)"]
```

---

## 2. Technology Stack & Rationale

| Layer | Technology | Architectural Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | Server & Client components, robust routing, optimized bundle size, fast rendering, strict TypeScript compliance. |
| **Styling & Design System** | **Tailwind CSS** | Editorial publishing aesthetic, responsive design, consistent design tokens, accessible focus states, zero CSS bloat. |
| **Data Visualization** | **Recharts** | Lightweight, responsive SVG bar charts rendering domain distribution without client-side lag. |
| **Icons & Micro-interactions** | **Lucide React** | Consistent, tree-shakeable iconography. |
| **Backend Server** | **Express.js with TypeScript** | Clean decoupled REST API, versioned endpoints (`/api/v1`), explicit middleware piping, centralized error handling. |
| **Schema Validation** | **Zod** | Strict runtime request body and query validation, ensuring no malformed or injected data enters controllers. |
| **Database & ODM** | **MongoDB & Mongoose** | Flexible document modeling for complex books, royalty figures, conversation threads, and decoupled internal notes. |
| **Authentication & RBAC** | **JWT in HttpOnly Cookies + bcryptjs** | Secure against XSS token theft, strict role validation (`AUTHOR` vs `ADMIN`), and author ownership checks. |
| **AI Intelligence Engine** | **Google Gemini (`@google/genai`)** | Official current SDK, structured JSON output validation, grounded response drafting, and token-conscious context prompts. |

---

## 3. Data Schema & Collection Relationships

```mermaid
erDiagram
    User ||--o{ Book : "authors"
    User ||--o{ Ticket : "creates"
    Book ||--o{ Ticket : "references (optional)"
    Ticket ||--o{ Message : "contains (public)"
    Ticket ||--o{ InternalNote : "contains (confidential)"
    User ||--o{ Message : "sends"
    User ||--o{ InternalNote : "writes"

    User {
        ObjectId _id PK
        string email UK
        string passwordHash
        string role "AUTHOR | ADMIN"
        string author_id "AUTH001-AUTH010"
        string admin_id "ADM001"
        string name
        string phone
        string city
        string joined_date
    }

    Book {
        ObjectId _id PK
        string book_id UK "BK001-BK018"
        ObjectId author FK
        string author_id
        string title
        string isbn "null if in production"
        string genre
        string publication_date "null if in production"
        string status "Published & Live | In Production"
        number mrp
        number author_royalty_per_copy
        number total_copies_sold
        number total_royalty_earned
        number royalty_paid
        number royalty_pending
        string last_royalty_payout_date
        string print_partner "In-House | Repro India | Epitome Books"
        string[] available_on "Amazon, Flipkart, BookLeaf Store"
    }

    Ticket {
        ObjectId _id PK
        string ticket_id UK "TKT-1001+"
        ObjectId author FK
        ObjectId book FK "optional"
        string subject
        string description
        string status "OPEN | IN_PROGRESS | RESOLVED | CLOSED"
        string aiCategory
        string aiPriority
        number aiConfidence
        string aiReasoning
        string aiAnalysisStatus "SUCCESS | FALLBACK | FAILED | PENDING"
        string overriddenCategory "optional"
        string overriddenPriority "optional"
        ObjectId assignedAdmin FK "optional"
        string attachmentName "optional"
        string lastDraftResponse "optional"
        Date createdAt
        Date updatedAt
    }

    Message {
        ObjectId _id PK
        ObjectId ticket FK
        ObjectId sender FK
        string senderRole "AUTHOR | ADMIN"
        string senderName
        string content
        Date createdAt
    }

    InternalNote {
        ObjectId _id PK
        ObjectId ticket FK
        ObjectId admin FK
        string adminName
        string content
        Date createdAt
    }
```

---

## 4. Multi-Tenant Data Isolation & Security Architecture

1. **Strict Ownership Verification**:
   - When an author requests `/api/v1/author/dashboard`, `/api/v1/author/books`, or `/api/v1/author/tickets`, the query is hard-filtered by `author: req.user._id`.
   - When raising a ticket linked to a `bookId`, the backend validates that `Book.findOne({ _id: bookId, author: req.user._id })` exists. If an author attempts to select another author's book, the API immediately halts execution with `403 Forbidden`.
   
2. **Segregation of Internal Notes**:
   - Internal notes are stored in a dedicated `InternalNote` Mongoose collection.
   - Author-facing endpoints (`/api/v1/author/tickets/:id`) do not query or join the `InternalNote` collection under any circumstances.
   - Internal notes are only queryable via the admin endpoint protected by `requireRole('ADMIN')`.

3. **HTTP Cookie Security & CSRF Defense**:
   - JWT tokens are issued inside HttpOnly, SameSite cookies with a 7-day expiration.
   - Cross-Site Request Forgery is mitigated by restrictive SameSite attributes, CORS origin whitelisting (`env.FRONTEND_URL`), and standard JSON Content-Type validation.

---

## 5. AI Integration Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Author as Author User
    participant API as Express API (/api/v1/author/tickets)
    participant DB as MongoDB
    participant AISvc as AIService
    participant Gemini as Google Gemini API (@google/genai)
    actor Admin as Operations Admin

    Author->>API: Submit Ticket (subject, description, bookId)
    API->>API: Validate Author & Book Ownership
    API->>DB: Save Ticket with status='OPEN', aiStatus='PENDING'
    API->>DB: Create initial Message record
    
    API->>AISvc: classifyTicket(subject, description, bookContext)
    alt Gemini Key Present & Healthy
        AISvc->>Gemini: generateContent(Prompt with 6 domains & priority rules)
        Gemini-->>AISvc: Structured JSON {category, priority, confidence, reasoning}
        AISvc->>AISvc: Zod Schema Validation
    else Key Missing or Gemini Error
        AISvc->>AISvc: Fallback Rule-Based Keywords Matcher
    end
    AISvc-->>API: Return Classification Result
    API->>DB: Update Ticket with category, priority, confidence, aiAnalysisStatus
    API-->>Author: 201 Created Response

    Admin->>API: Open Ticket Detail View
    API-->>Admin: Full Ticket Context + Book Data + History
    Admin->>API: Click "Generate AI Draft"
    API->>AISvc: generateDraftResponse(ticket, author, book, messages)
    AISvc->>Gemini: Prompt with BookLeaf Knowledge Base Context
    Gemini-->>AISvc: Empathetic, policy-grounded draft
    AISvc-->>API: Draft text
    API-->>Admin: Render Draft in Interactive Editor
    Admin->>API: Edit Draft & Click "Approve & Send to Author"
    API->>DB: Save Message (senderRole='ADMIN')
    API->>DB: Update Ticket status='IN_PROGRESS'
    Author->>API: Smart Polling detects new admin message (no refresh needed)
```

---

## 6. Real-Time Updates & Smart Polling

Rather than introducing heavy, stateful WebSocket connection overhead for an author support dashboard, the platform employs a high-efficiency **Smart Polling Architecture**:
- Ticket conversation threads and dashboard queues poll every **5 to 10 seconds** (configured at 6s).
- The custom React hook `usePolling` listens to the HTML5 `visibilitychange` API:
  * When an author or admin switches tabs or minimizes the browser window (`document.hidden === true`), polling is **completely suspended**, eliminating unnecessary network requests and server CPU usage.
  * When the tab becomes active again, polling triggers an immediate refresh and resumes the interval.
  * When components unmount, the timer is cleanly deregistered.
