# Finance App

A financial web application built with React, TypeScript, and Supabase. Features Chart of Accounts, Transactions (Income/Expense/Transfer), and Contacts management.

## Features

- **Chart of Accounts**: Hierarchical account structure with auto-generated account numbers
- **Transactions**: Income, Expense, and Transfer transactions with multi-line items
- **Contacts**: Manage payers and payees
- **Notion Light Mode Styling**: Clean, minimal interface

## Tech Stack

- React 18
- TypeScript
- Vite
- Supabase (Database, Auth, Storage)
- React Router

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a project at [supabase.com](https://supabase.com)
   - Run the migration file: `supabase/migrations/001_initial_schema.sql`
   - Create a storage bucket named `transaction-attachments`
   - Set storage policies (public read/write for single-user setup)

3. Configure environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase URL and anon key:
     ```
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Deployment

The app is configured for Vercel deployment. Set the environment variables in your Vercel project settings.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── modules/          # Feature modules
│   ├── chart-of-accounts/
│   ├── transactions/
│   └── contacts/
├── lib/              # Utilities and types
└── styles/           # Global styles
```

## License

MIT
