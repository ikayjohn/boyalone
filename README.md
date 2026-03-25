# boyalone

Marketing site and event registration app for the Omah Lay "Spirit Warehouse Session, Lagos" experience.

Built with Next.js 16, React 19, Tailwind CSS 4, Prisma 7, and PostgreSQL.

## Features

- Public landing page with hero media, schedule, archive, and footer links
- Signup modal on the homepage for the Lagos session
- QR pass generation after successful signup
- Ticket verification and check-in flow at `/verify/[id]`
- Admin login and dashboard for signups, exports, and session management
- Excel export for attendee data

## Tech Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Prisma 7
- PostgreSQL
- `@prisma/adapter-pg` + `pg`
- `qrcode`
- `exceljs`

## Environment Variables

Create a `.env` file with:

```env
DATABASE_URL="postgresql://..."
ADMIN_PASSWORD="your-admin-password"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

Notes:

- `DATABASE_URL` is required for Prisma and all dynamic app routes.
- `ADMIN_PASSWORD` is used by the admin login flow.
- `NEXT_PUBLIC_BASE_URL` is used when generating QR verification URLs.

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run build
npm start
```

## App Routes

- `/` - public landing page
- `/admin/login` - admin login
- `/admin` - admin dashboard
- `/signup/[city]` - legacy signup page route
- `/verify/[id]` - ticket verification/check-in page

## API Routes

- `POST /api/signup` - create a signup, unique pass ID, and QR code
- `GET /api/sessions/[city]` - fetch session details
- `GET /api/verify/[id]` - fetch attendee record by pass ID
- `POST /api/verify/[id]` - mark attendee as checked in
- `POST /api/admin/login` - admin authentication
- `GET /api/admin/signups` - admin signup listing
- `GET /api/admin/sessions` - admin session listing
- `POST /api/admin/sessions` - create a session
- `GET /api/admin/export` - export signups to Excel

## Signup And QR Flow

1. User opens the signup modal on the homepage.
2. The frontend loads the Lagos session from `/api/sessions/lagos`.
3. On submit, `/api/signup` validates the request and checks duplicates/capacity.
4. The backend generates a unique ID and QR code.
5. The QR pass is shown immediately in the UI.

Current behavior:

- Passes are shown on-screen after signup.
- The app does not send confirmation emails yet.

## Admin Access

Admin login URL:

```text
/admin/login
```

After login, a cookie-based session allows access to:

```text
/admin
```

## Database

Prisma schema is located at:

```text
prisma/schema.prisma
```

Current models:

- `Session`
- `Signup`

## Notes

- This repo ignores `.env` files and generated Prisma output.
- Prisma 7 in this project uses the Postgres driver adapter in `src/lib/db.ts`.
- The admin session creation route prevents duplicate city/cityCode creation.
