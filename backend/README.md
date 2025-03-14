# AuditMyModel Backend

This is the backend service for AuditMyModel, a tool for auditing AI models. It's built with Next.js, TypeScript, and Supabase.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

3. Run the development server:
```bash
npm run dev
```

The server runs on port 5001 to match the frontend's expected API endpoint.

## Integration with Frontend

The backend is designed to work seamlessly with the frontend application:

1. The frontend expects API endpoints on port 5001
2. CORS headers are configured to allow cross-origin requests
3. Authentication is handled via Supabase Auth with JWT tokens
4. Direct Supabase client access is also supported (used by some frontend components)

## API Endpoints

### Auth
- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/login`: Login a user
- `POST /api/auth/logout`: Logout a user
- `GET /api/auth/user`: Get current user information
- `POST /api/auth/register`: Alternative registration endpoint
- `GET /api/auth/me`: Get current user information
- `PUT /api/auth/update-profile`: Update user profile

### Audits
- `POST /api/audits`: Create a new audit
- `GET /api/audits`: List all audits for the current user
- `GET /api/audits/:id`: Get audit details
- `PUT /api/audits/:id`: Update an audit
- `DELETE /api/audits/:id`: Delete an audit

### Upload and Analysis
- `POST /api/upload`: Generic file upload endpoint
- `POST /api/excel/upload`: Excel file upload endpoint
- `POST /api/excel/analyze`: Excel file analysis endpoint

## Database Schema

The Supabase database includes these main tables:
- `auth.users`: Managed by Supabase Auth
- `public.profiles`: User profiles
- `public.audits`: Audit records

## Authentication

Authentication is handled via Supabase Auth with JWT tokens. Tokens are passed via the Authorization header as Bearer tokens. 