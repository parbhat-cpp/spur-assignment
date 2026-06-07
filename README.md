# Spur Assignment

A full-stack customer support chat application with a TypeScript/Express backend, a TanStack Start + React frontend, PostgreSQL via Drizzle ORM, and AI responses powered by Groq.

## Project Structure

```text
backend/   Express API, auth, conversations, AI integration, Drizzle schema
frontend/  TanStack Start app, chat UI, auth screens, query/store management
```

## Tech Stack

- **Backend:** Express, TypeScript, Drizzle ORM, PostgreSQL, JWT, bcrypt, Groq SDK
- **Frontend:** React 19, TanStack Start/Router/Query/Store, Tailwind CSS v4, shadcn/ui, Vite
- **AI:** Groq chat completions using `meta-llama/llama-4-scout-17b-16e-instruct`

## Prerequisites

- Node.js 20+ recommended
- npm
- PostgreSQL database
- Groq API key

## Setup

### 1) Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=5000
NODE_ENV=development
DB_URL=postgresql://user:password@localhost:5432/spur
# or DATABASE_URL=postgresql://user:password@localhost:5432/spur
JWT_SECRET=replace_with_a_long_secret
GROQ_API_KEY=your_groq_api_key
CORS_ORIGIN=http://localhost:3000
```

Run the backend in development:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm start
```

### 2) Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_BACKEND_URL=http://localhost:5000/api
VITE_GUEST_EMAIL=guest@example.com
VITE_GUEST_PASSWORD=guest-password
```

Run the frontend in development:

```bash
npm run dev
```

Other available scripts:

```bash
npm run build
npm run preview
npm run test
npm run lint
npm run format
npm run check
```

## Database Schema

The backend uses Drizzle ORM with three main tables:

### `users`
- `id` UUID primary key
- `fullname` varchar(255)
- `email` varchar(255), unique
- `password` varchar(255)
- `createdAt` timestamp
- `updatedAt` timestamp

### `conversations`
- `id` UUID primary key
- `title` varchar(255)
- `userId` UUID foreign key to `users.id`
- `createdAt` timestamp
- `updatedAt` timestamp

### `messages`
- `id` UUID primary key
- `conversationId` UUID foreign key to `conversations.id`
- `sender` varchar(255)
- `content` varchar(1000)
- `createdAt` timestamp

## API Base Path

All backend routes are mounted under `/api`.

## API Endpoints

### Auth

#### `POST /api/auth/login`
Logs a user in and sets an HTTP-only cookie.

Request body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### `POST /api/auth/signup`
Creates a new user and sets an HTTP-only cookie.

Request body:

```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### `GET /api/auth/user?email=...`
Fetches user details by email. Requires authentication.

### Conversations

All conversation routes require authentication.

#### `GET /api/conversation?cursor=...`
Returns paginated conversations for the authenticated user.

- `cursor` is optional and is used for pagination
- Response includes grouped conversations and `nextCursor`

#### `GET /api/conversation/:conversationId`
Returns a single conversation with its messages.

#### `POST /api/conversation/chat/:conversationId`
Sends a message to the AI for an existing conversation.

Request body:

```json
{
  "message": "Where is my order?"
}
```

If the frontend omits the conversation id, the backend creates a new conversation, stores the user and AI messages, and returns the new conversation id.

#### `DELETE /api/conversation/delete/:conversationId`
Deletes a conversation for the authenticated user.

## Frontend Routes

- `/` — login and signup screen
- `/chat` — chat dashboard and conversation list
- `/chat/:conversationId` — conversation detail view

## AI Behavior

The backend chat flow:

- Builds a support-style system prompt
- Calls Groq for a JSON-formatted response
- Generates a suggested title for new conversations
- Truncates overly long user messages before sending them to the model

## Notes

- Auth uses a JWT stored in an HTTP-only cookie.
- Frontend fetch calls use `credentials: 'include'`, so the backend CORS configuration must allow credentials.
- Guest login is supported through the frontend environment variables.
- The app expects the backend to be reachable at the URL provided in `VITE_BACKEND_URL`.

## Useful Commands

### Backend

```bash
npm run dev
npm run build
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
npm run format
npm run check
```
