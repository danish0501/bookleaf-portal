# BookLeaf Author Support Portal — RESTful API Specification (v1)

Base URL: `http://localhost:5000/api/v1` (Production: configurable via `FRONTEND_URL` and `PORT`)

All requests and responses use JSON. Authenticated requests use HttpOnly JWT cookies or `Authorization: Bearer <token>`.

---

## 1. Authentication Endpoints

### 1.1 POST `/api/v1/auth/login`
Authenticates an author or admin account. Sets an HttpOnly `token` cookie and returns user profile.

- **Request Body**:
```json
{
  "email": "author@email.com",
  "password": "Author@123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "67...a1",
    "name": "Priya Sharma",
    "email": "priya.sharma@email.com",
    "role": "AUTHOR",
    "author_id": "AUTH001",
    "city": "Mumbai",
    "joined_date": "2023-03-15"
  }
}
```
- **Error (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Invalid email or password. Please verify your credentials."
}
```

### 1.2 POST `/api/v1/auth/logout`
Clears the session cookie.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

### 1.3 GET `/api/v1/auth/me`
Retrieves the currently authenticated user's session profile.
- **Headers**: Cookie `token=...` or `Authorization: Bearer <token>`
- **Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "67...a1",
    "name": "Priya Sharma",
    "email": "priya.sharma@email.com",
    "role": "AUTHOR",
    "author_id": "AUTH001"
  }
}
```

---

## 2. Author Portal Endpoints (`/api/v1/author/*`)
*Protected by `authenticate` and `requireRole('AUTHOR')`.*

### 2.1 GET `/api/v1/author/dashboard`
Returns aggregated statistics calculated strictly from the authenticated author's database records.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalBooks": 2,
      "publishedBooks": 2,
      "inProductionBooks": 0,
      "totalCopiesSold": 531,
      "totalRoyaltyEarned": 19908,
      "royaltyPaid": 16338,
      "royaltyPending": 3570
    },
    "books": [
      {
        "id": "67...01",
        "book_id": "BK001",
        "title": "Whispers of the Ganges",
        "status": "Published & Live",
        "isbn": "978-93-5XXXX-01-1",
        "totalCopiesSold": 342,
        "royaltyEarned": 11970,
        "royaltyPending": 3570
      }
    ],
    "recentTickets": []
  }
}
```

### 2.2 GET `/api/v1/author/books`
Returns the complete list of books authored by the current user. Gracefully handles null ISBNs, MRP, and production stages.
- **Response (200 OK)**: Array of Book documents.

### 2.3 GET `/api/v1/author/tickets`
Returns all tickets submitted by the authenticated author.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "67...10",
      "ticket_id": "TKT-1001",
      "subject": "Question regarding royalty threshold",
      "status": "OPEN",
      "category": "Royalty & Payments",
      "priority": "MEDIUM",
      "bookTitle": "Turban Tales",
      "createdAt": "2026-10-14T17:00:00.000Z"
    }
  ]
}
```

### 2.4 POST `/api/v1/author/tickets`
Submits a new support query. Validates book ownership, stores the ticket in MongoDB, and triggers AI classification.
- **Request Body**:
```json
{
  "bookId": "67...01",
  "subject": "Copies received have binding defects",
  "description": "The author copies delivered today had several misaligned pages and cracked spine binding.",
  "attachmentName": "defective_pages.jpg"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Support ticket submitted successfully",
  "data": {
    "id": "67...b2",
    "ticket_id": "TKT-1004",
    "subject": "Copies received have binding defects",
    "status": "OPEN",
    "category": "Printing & Quality",
    "priority": "HIGH",
    "createdAt": "2026-10-14T17:15:00.000Z"
  }
}
```

### 2.5 GET `/api/v1/author/tickets/:id`
Retrieves ticket details and public conversation thread. Internal notes are strictly excluded.
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "67...b2",
      "ticket_id": "TKT-1004",
      "subject": "Copies received have binding defects",
      "description": "...",
      "status": "OPEN",
      "category": "Printing & Quality",
      "priority": "HIGH",
      "book": { "title": "Turban Tales", "status": "Published & Live" }
    },
    "messages": [
      {
        "id": "67...c1",
        "senderRole": "AUTHOR",
        "senderName": "Arjun Malhotra",
        "content": "...",
        "createdAt": "..."
      }
    ]
  }
}
```

### 2.6 POST `/api/v1/author/tickets/:id/messages`
Adds a public follow-up message to the ticket conversation.
- **Request Body**:
```json
{
  "content": "Attaching the photo for verification as requested."
}
```

---

## 3. Operations Admin Endpoints (`/api/v1/admin/*`)
*Protected by `authenticate` and `requireRole('ADMIN')`.*

### 3.1 GET `/api/v1/admin/dashboard`
Returns operational metrics, domain category distributions, priority breakdowns, and recent queue entries.

### 3.2 GET `/api/v1/admin/tickets`
Searchable, filterable, paginated ticket queue with default operational sorting (Critical/High unresolved tickets first, then oldest open tickets).
- **Query Parameters**:
  * `page` (number, default: 1)
  * `limit` (number, default: 10)
  * `status` (`ALL`, `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
  * `category` (one of the 6 permitted categories or `ALL`)
  * `priority` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `ALL`)
  * `search` (string: matches Ticket ID, Subject, or Description)
  * `sortBy` (`default`, `priority_desc`, `created_desc`, `created_asc`, `updated_desc`)

### 3.3 GET `/api/v1/admin/tickets/:id`
Returns full ticket details, author metadata (phone, email, city, ID), book data, conversation messages, private internal notes, and admin user list.

### 3.4 PATCH `/api/v1/admin/tickets/:id`
Overrides ticket properties (status, category, priority, admin assignment).
- **Request Body**:
```json
{
  "status": "IN_PROGRESS",
  "overriddenCategory": "Printing & Quality",
  "overriddenPriority": "HIGH",
  "assignedAdmin": "67...01"
}
```

### 3.5 POST `/api/v1/admin/tickets/:id/notes`
Adds a private internal note. Never exposed to author endpoints.
- **Request Body**:
```json
{
  "content": "Spoke to Delhi print manager; replacement batch approved for print run tomorrow."
}
```

### 3.6 POST `/api/v1/admin/tickets/:id/ai-classify`
Re-runs AI classification and priority scoring using Gemini or fallback engine.

### 3.7 POST `/api/v1/admin/tickets/:id/ai-draft`
Generates a response draft grounded in BookLeaf Knowledge Base, author profile, and book details.
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "AI draft response generated successfully",
  "data": {
    "draft": "Dear Arjun,\n\nThank you for reaching out regarding the binding defect on your copies...",
    "isLiveAI": true
  }
}
```

### 3.8 POST `/api/v1/admin/tickets/:id/messages`
Sends an approved, edited public response to the author. Automatically transitions ticket status to `IN_PROGRESS`.
- **Request Body**:
```json
{
  "content": "Dear Arjun, our Delhi printing facility has approved a 100% free reprint for your copies..."
}
```
