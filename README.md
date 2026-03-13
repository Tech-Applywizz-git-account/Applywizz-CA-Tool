# ApplyWizz CA Performance Tracker

This is a Next.js application for tracking performance and incentives for Career Associates.

## Prerequisites

- Node.js (v18 or later)
- Supabase Project

## Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory (one has been created for you with dummy values):
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
    ```
4.  Set up your Supabase database with the required tables (`users`, `clients`, `teams`, `work_history`, `incentives`).

## Running Locally

To start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Role Definitions

- **Admin**: Full system access and user management.
- **CEO/COO/CPO/CRO**: Executive dashboards with oversight on teams and performance.
- **Team Lead**: Manages specific teams of Career Associates.
- **Career Associate (CA)**: Standard role with higher mandatory profile targets.
- **Junior CA**: Standard role with lower mandatory profile targets.
- **Career Associative Trainee**: New trainee role with zero incentives and a base salary of ₹5,000.

## Exception Handling

The application includes `try-catch` blocks in API routes and handles common Supabase errors in the frontend components.
