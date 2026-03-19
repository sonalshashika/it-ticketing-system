# IT Ticketing and Task Reminder System

A production-style IT Ticketing and Reminder web application built with Next.js 14, React, Tailwind CSS, and Firebase.

## Features
- **Role-Based Access Control**: Employee, IT Staff, and Admin roles.
- **Ticket Management**: Create, assign, comment, and resolve support requests.
- **Task Reminders**: Users can set up and track personal reminders.
- **Dashboard Summary**: Real-time stats from Firestore.
- **Responsive UI**: Fully accessible, mobile-friendly interface built with Tailwind and React hook form.
- **Security**: Robust Firestore Security Rules implementing complex access policies.

## Prerequisites
- Node.js 18.x or later
- A Firebase project with Auth (Email/Password), Firestore, and Storage enabled.

## Environment Variables
Create a `.env.local` file at the root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

## Running Locally
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Access at `http://localhost:3000`

## Testing
Run unit and structure tests using Jest and React Testing Library:
```bash
npm test
```

## Deployment / Production Checklist
This project is optimized for deployment on Vercel.

1. **Firebase Security Rules:** Before going live, ensure that the rules in `firestore.rules` and `storage.rules` have been deployed to your Firebase console.
   ```bash
   firebase deploy --only firestore:rules,storage
   ```
2. **Environment Variables:** Add all `NEXT_PUBLIC_FIREBASE_*` variables to your hosting provider's build environment.
3. **Database Indexes:** If composite queries are added in the future, watch for Firebase console links prompting you to create indexes, and deploy `firestore.indexes.json`.
4. **Vercel Deployment:**
   - Link your GitHub repository to Vercel.
   - The framework preset should auto-detect "Next.js".
   - Deploy!

## Architecture Details
- **Next.js App Router**: Optimized for server components where possible, though much of this app uses client components (`"use client"`) due to Firebase SDK requirements and real-time listeners.
- **Tailwind Merge + Clsx**: Clean utility handling in standard UI components (inspired by shadcn/ui).
- **Zod + React Hook Form**: (Supported but mostly using controlled states for simplicity here).
