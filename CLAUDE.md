# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ATS Pro** - A multi-tenant SaaS Applicant Tracking System built with React, TypeScript, and Supabase.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + Lucide React Icons
- Database: Supabase (PostgreSQL)
- State Management: React Hooks
- Routing: React Router DOM v7
- Drag & Drop: @dnd-kit
- Authentication: Supabase Auth

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on all files
```

### Environment Setup
- Copy `.env.local` to `.env` and configure:
  - `VITE_SUPABASE_URL` - Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Architecture

### Multi-Tenancy
- **Company-based isolation**: All data queries MUST filter by `company_id`
- **User-Company relationship**: Users belong to a company via `users.company_id`
- **Authentication flow**: User authentication → company lookup → data access
- The `getCurrentUserCompanyId()` function in `src/lib/supabase.ts` handles complex company resolution including fallbacks via team invitations and RPC calls

### Data Layer Pattern
Custom hooks in `src/hooks/` provide centralized data management:
- `useRecruitmentData.ts` - Main hook for jobs, candidates, applications, interviews (48KB file)
- `useAuth.ts` - Authentication and user session management
- `useContacts.ts` - External contact management
- `useCustomStages.ts` - Pipeline stage customization
- `useSpocs.ts` - Single Points of Contact (internal/external)
- `useTeamManagement.ts` - User roles and permissions
- `useAuditLogs.ts` - Activity tracking
- `useFileUpload.ts` - File storage operations

**Pattern**: Each hook provides state, loading states, error handling, and CRUD operations. Always filter by `company_id`.

### Component Structure
```
src/
├── components/
│   ├── applications/   # Application pipeline (Kanban board)
│   ├── auth/          # Login, signup, auth provider
│   ├── candidates/    # Talent pool management
│   ├── clients/       # Client relationship management
│   ├── common/        # Shared UI components, ErrorBoundary, Toasts
│   ├── dashboard/     # Overview metrics
│   ├── forms/         # Reusable form components
│   ├── interviews/    # Interview scheduling
│   ├── jobs/          # Job posting management
│   ├── layout/        # Sidebar, Header
│   ├── modals/        # Modal dialogs
│   ├── reports/       # Analytics and reporting
│   ├── settings/      # Company and system settings
│   └── team/          # Team member management
├── hooks/             # Custom React hooks (data layer)
├── lib/               # External integrations (Supabase, job skills API)
├── types/             # TypeScript interfaces (index.ts)
└── utils/             # Utility functions
```

### Routing
- React Router DOM v7 handles all routing in `App.tsx`
- Protected routes require authentication
- Dynamic routes: `/jobs/:id`, `/candidates/:id`, `/applications/:id`
- Unauthenticated users see landing page, login, or signup

### Database Schema
- **Core Tables**: `companies`, `users`, `roles`, `jobs`, `candidates`, `applications`, `interviews`, `clients`, `contacts`
- **Custom Stages**: `custom_stages` table enables company-specific pipeline customization with parent-child relationships
- **SPOC Management**: Dual table structure - `spocs` (deprecated?) and `client_spocs` for contact management
- **Multi-tenant isolation**: RLS policies enforce company_id filtering at database level
- **Migrations**: Located in `supabase/migrations/` (12+ migration files)

### Recent Enhancements (2025-10-03)

1. **Email Notifications**: Full email system implemented via Supabase Edge Functions
   - Interview invitations
   - Application status updates
   - Team member invitations
   - Email service client at `src/lib/emailService.ts`
   - Edge function at `supabase/functions/send-email/index.ts`

2. **File Upload System**: Enhanced with drag-and-drop support
   - Comprehensive file upload hook at `src/hooks/useFileUpload.ts`
   - Drag-and-drop component at `src/components/common/FileUploadDragDrop.tsx`
   - Supabase Storage integration for candidate files

3. **Advanced Search**: Powerful search component with multiple criteria
   - Component at `src/components/common/AdvancedSearch.tsx`
   - Supports text, number, date, and select field types
   - Multiple operators (contains, equals, between, etc.)

4. **Toast Notifications**: Global toast context for better UX
   - Toast context provider at `src/contexts/ToastContext.tsx`
   - Centralized error handling across the app

### Known Issues & Considerations

1. **Company ID Resolution**: The `getCurrentUserCompanyId()` function has complex fallback logic. Always use this function instead of direct queries when fetching company context.

2. **SPOC Tables Consolidation**:
   - **Use these tables**: `external_spocs`, `internal_spocs`, `internal_spoc_clients`
   - **Deprecated tables**: `spocs`, `client_spocs` (marked for removal)
   - See `SPOC_TABLES_GUIDE.md` for migration guide

3. **Email System**: Requires `RESEND_API_KEY` environment variable in Supabase Edge Functions for production use.

## Code Style & Patterns

### TypeScript
- All types defined in `src/types/index.ts`
- Strict mode enabled in tsconfig
- Use interfaces for data models, types for unions/utilities

### Component Patterns
- Functional components with hooks
- Props destructuring
- Error boundaries wrap main application (`ErrorBoundary` component)
- Loading states for all async operations
- Company-scoped data fetching in all hooks

### State Management
- Local component state via `useState`
- Data fetching via custom hooks
- No global state library (Redux, Zustand, etc.)
- Custom `useToast` for notifications

### Supabase Client
- Single client instance via `src/lib/supabase.ts`
- HMR-safe client initialization (prevents duplicate instances)
- Never create service role client in browser code
- All admin operations must use Edge Functions or server

## Testing & Quality

### Linting
- ESLint with TypeScript support
- React Hooks rules enforced
- React Refresh for fast HMR

### Build Validation
```bash
npm run build   # Ensure TypeScript compilation succeeds
npm run lint    # Check for linting errors
```

## Database Migrations

- All migrations in `supabase/migrations/`
- Schema changes require new migration files
- Recent migrations include: custom stages, application questions, file uploads, audit logs
- Never modify existing migration files; create new ones

## External Integrations

### Job Skills API
- `src/lib/jobSkillsApi.ts` - External API for job skill recommendations
- Used in job creation/editing forms

### Supabase Features Used
- Authentication (email/password)
- Real-time subscriptions (not actively used but available)
- Row Level Security (RLS) for multi-tenancy
- JSONB columns for flexible data (e.g., `contract_details` in clients)

## Important Context from ATS_FUNCTIONALITY_ANALYSIS.md

### Fully Functional Modules
- Authentication & user management
- Client management with SPOC integration (use new `external_spocs` tables)
- Custom pipeline stages with drag-and-drop
- Job management with external skills API
- Candidate management with profiles
- Application pipeline (Kanban)
- Interview management (complete with participants)
- Email notifications (via Supabase Edge Functions)
- File upload with drag-and-drop (Supabase Storage)
- Advanced search and filtering
- Reports & analytics dashboard
- Team management UI

### System Status

All core ATS functionality is implemented and operational. The system is production-ready with the following features:
- Multi-tenant SaaS architecture
- Complete recruitment workflow (jobs → applications → interviews → hiring)
- Client and SPOC management
- Team collaboration tools
- File management and storage
- Email notifications
- Analytics and reporting

### Future Enhancements (Optional)

Potential areas for future development:
- AI-powered candidate matching
- Resume parsing automation
- Advanced diversity analytics
- Integration with external job boards
- Automated workflow triggers
- Mobile-responsive optimizations
