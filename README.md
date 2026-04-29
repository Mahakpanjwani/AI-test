# Receptionist Mobile App (Full Stack)

This repository contains a complete starter implementation for a receptionist visitor-management system:

- **Mobile frontend**: Expo React Native app
- **Backend API**: Node.js + Express + TypeScript
- **Database**: SQLite via Prisma ORM
- **Email + digital ID card**: Nodemailer + PDFKit

## Features implemented

- Login with employee ID + password
- Check-In flow with visitor type and full form
- Employee search and selection for "Person to meet"
- Auto timestamp at check-in
- Confirmation popup after check-in
- Email to visitor with attached digital ID card PDF
- Email to host employee notifying arrival
- Check-Out endpoint and UI flow
- Dashboard API and screen for daily visitor logs + currently checked-in visitors
- Mandatory check-out strategy implemented via rules, reminders, and admin escalation hooks

## Monorepo structure

- `backend/` API + Prisma + business rules
- `frontend/` Expo React Native app

## Quick start

### 1) Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Backend runs on `http://localhost:4000`.

### 2) Frontend

```bash
cd frontend
npm install
npm start
```

Set `EXPO_PUBLIC_API_BASE_URL` in `frontend/.env` if needed (default: `http://localhost:4000`).

## Mandatory Check-Out model

To push every visitor to check-out, this implementation includes:

1. **Active visit lock:** no second check-in is allowed for same phone/email while an active visit exists.
2. **Late-visit reminders:** periodic job scans open visits older than configured SLA and sends reminders.
3. **Host accountability:** reminder escalations go to host + receptionist.
4. **Exit-gate verification policy:** security verifies digital ID card status (ACTIVE/CHECKED-OUT) by QR/token.
5. **Dashboard pressure:** "Open Visits" count is highly visible and auditable per day.

You can enforce stricter policy by requiring guard checkout verification before egress.

## Environment variables (backend)

- `PORT=4000`
- `DATABASE_URL="file:./dev.db"`
- `JWT_SECRET="change-me"`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `APP_BASE_URL="http://localhost:4000"`

If SMTP vars are missing, backend logs email payload to console (dev mode).
