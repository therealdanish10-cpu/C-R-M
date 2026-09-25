# Freelancer Cold-Calling CRM Dashboard

A modern, responsive Next.js application built for cold-calling freelancers to track leads, calls, meetings, and closed sales with Supabase Auth and PostgreSQL.

## Features

- **Supabase Auth & Freelancer Resolution**:
  - Automatically queries `freelancers` table where `user_id = auth.uid()` to fetch the active freelancer ID.
  - Strictly queries `leads`, `calls`, `meetings`, and `sales` belonging to the logged-in freelancer (`leads.assigned_to = freelancer.id`, `calls.freelancer_id = freelancer.id`, etc.).
- **Top 4 Stats Bar (Card-based layout)**:
  - **Total Leads Assigned**: count of assigned leads.
  - **Calls Made This Week**: calls logged in the last 7 days (`call_time >= NOW() - 7 days`).
  - **Meetings Booked**: scheduled meetings (`status = 'scheduled'`).
  - **Sales Closed This Month**: sales closed in current calendar month (`sold_at >= start of month`).
- **Interactive Leads Table**:
  - **Columns**: Business Name, Phone (with click-to-call `tel:`), Category, Status, Last Call Date, Actions ("View" -> `/leads/[id]`).
  - **Colored Status Badges**:
    - `new` = Gray
    - `contacted` = Blue
    - `interested` = Yellow
    - `meeting_booked` = Purple
    - `sold` = Green
    - `not_interested` / `dead` = Red
  - **Last Call Date**: Most recent `call_time` or "No calls yet".
  - **Filters**: Status dropdown filter (`all`, `new`, `contacted`, `interested`, `meeting_booked`, `sold`, `not_interested`, `dead`) and Search box (filters by business name or phone).
  - **Sorting**: Default sort by `created_at` descending; clickable column headers to re-sort by Status, Last Call Date, or Business Name with ascending/descending toggles.
- **Mobile Responsive**:
  - Fully responsive card view and horizontal-scrolling table optimized for cold-calling on smartphones.
  - Direct click-to-call buttons for mobile freelancers.
- **Lead Detail View (`/leads/[id]`)**:
  - Full lead breakdown with call log history, meeting schedule, and sales records.

## Getting Started

### 1. Configure Supabase Credentials
Create a `.env.local` file in the root directory (copied from `.env.local.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

*(Note: If `.env.local` is not configured, the dashboard automatically runs in interactive demo mode with realistic mock pipeline data for instant evaluation).*

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the freelancer dashboard.
