# WhyNot Innovations - Development Queries

This file tracks all development requests and changes made to the project.

---

## Query 1 - Initial Site Setup
**Date:** December 18, 2025

**Request:**
Create a Next.js (App Router) site for "whynotinnovations" with Tailwind. Add a clean layout with a top nav (logo left, links right). Links: Home (/), About (/about), Contact (/contact), Participant Portal (/app). Create pages:
- app/page.tsx (home hero + brief sections: What We Do, How It Works, Call To Action)
- app/about/page.tsx
- app/contact/page.tsx (simple form UI only; no backend yet)
- app/app/page.tsx (participant dashboard placeholder)

Make the design modern and minimal, with a consistent container width, good spacing, and a footer.

**Changes Made:**
- Updated `app/globals.css` with custom design system (colors, buttons, cards, form inputs, dark mode support)
- Updated `app/layout.tsx` with sticky header nav, footer, and responsive layout
- Created `app/page.tsx` - Home page with hero, What We Do (3 cards), How It Works (4 steps), CTA section
- Created `app/about/page.tsx` - Mission, values, story, and stats sections
- Created `app/contact/page.tsx` - Contact form, contact info, office hours, FAQ
- Created `app/app/page.tsx` - Participant portal with login form and dashboard preview

---

## Query 2 - Firebase Authentication Setup
**Date:** December 18, 2025

**Request:**
Add Firebase client initialization using env vars and create a module src/lib/firebaseClient.ts that exports app, auth. Add an AuthProvider using React context in src/components/AuthProvider.tsx that listens to Firebase onAuthStateChanged and exposes { user, loading }. Wrap the entire app with AuthProvider in app/layout.tsx. Add a src/components/UserBadge.tsx that shows: loading spinner, or "Sign in" button if logged out, or user photo/name + "Sign out" button if logged in.

**Changes Made:**
- Created `src/lib/firebaseClient.ts` - Firebase initialization with env vars, exports `app` and `auth`
- Created `src/components/AuthProvider.tsx` - React context provider with `onAuthStateChanged` listener, exports `useAuth` hook with `{ user, loading }`
- Created `src/components/UserBadge.tsx` - Shows loading spinner, sign-in button, or user avatar with sign-out button
- Created `src/components/Header.tsx` - Extracted header to client component with UserBadge integration
- Updated `app/layout.tsx` - Wrapped app with AuthProvider, imported Header component
- Updated `tsconfig.json` - Changed paths to map `@/*` to `./src/*`

**Environment Variables Required:**
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## Query 3 - Protected Routes & Session Management
**Date:** December 18, 2025

**Request:**
Implement protected routes for /app/**. On successful login, store the Firebase ID token in an httpOnly cookie by calling a Next.js route handler. Create app/api/auth/session/route.ts with POST to set cookie and DELETE to clear cookie (cookie name: wn_session). After sign-in on client, call POST /api/auth/session with the ID token; on sign-out call DELETE /api/auth/session. Add middleware.ts that blocks requests to /app and /app/* if cookie wn_session is missing; redirect to /login?next=.... Create app/login/page.tsx with sign-in and a message explaining access is for participants. After sign-in, redirect to next or /app.

**Changes Made:**
- Created `app/api/auth/session/route.ts` - POST sets httpOnly cookie `wn_session`, DELETE clears it
- Created `middleware.ts` - Checks for `wn_session` cookie on `/app` and `/app/*` routes, redirects to `/login?next=...` if missing
- Created `app/login/page.tsx` - Login page with email/password form, participant access message, redirects to `next` param or `/app` after sign-in
- Updated `src/components/UserBadge.tsx` - Calls session API on sign-out (DELETE)

**Flow:**
1. User visits `/app` → middleware checks for `wn_session` cookie
2. If missing → redirect to `/login?next=/app`
3. User enters email/password → Firebase auth
4. On success → POST `/api/auth/session` with ID token → cookie set
5. Redirect to `/app` (or `next` param)
6. On sign out → DELETE `/api/auth/session` → cookie cleared

---

## Query 4 - Switch to Email/Password Authentication
**Date:** December 18, 2025

**Request:**
Change authentication from Google sign-in to email/password only.

**Changes Made:**
- Updated `app/login/page.tsx` - Replaced Google sign-in with email/password form, added registration toggle, form validation, and error handling
- Updated `src/components/UserBadge.tsx` - Simplified to redirect to `/login` page instead of inline Google popup, removed Google-specific code

**Features:**
- Email/password sign-in form
- Registration form with password confirmation
- Toggle between sign-in and create account
- Form validation (required fields, password length, password match)
- Firebase error message handling
- Loading states during submission

---

## Query 5 - Participant Portal Shell
**Date:** December 18, 2025

**Request:**
Build a participant portal shell under /app with a left sidebar and main content. Sidebar links: Dashboard (/app), Projects (/app/projects), Profile (/app/profile). Create pages for /app/projects and /app/profile with placeholders. Show UserBadge in the portal header. Ensure responsive layout: sidebar collapses on small screens.

**Changes Made:**
- Created `app/app/layout.tsx` - Portal layout with:
  - Left sidebar with navigation links (Dashboard, Projects, Profile)
  - Portal header with mobile menu button and UserBadge
  - Main content area
  - Responsive design: sidebar slides in/out on mobile with backdrop overlay
  - "Back to main site" link in sidebar footer
- Updated `app/app/page.tsx` - Dashboard page with:
  - Welcome message with user name
  - Stats grid (projects, tasks, hours, achievements)
  - Recent activity list
  - Upcoming events list
  - Quick action buttons
- Created `app/app/projects/page.tsx` - Projects page with:
  - Project cards with status, progress bar, due date, team size
  - Filter buttons (All, Active, Completed, Pending)
  - Empty state when no projects match filter
- Created `app/app/profile/page.tsx` - Profile page with:
  - User profile card with avatar, name, email, badges
  - Statistics sidebar
  - Personal information form
  - Notification settings with toggles
  - Danger zone (delete account, export data)

**Layout Structure:**
```
┌─────────────────────────────────────────────────┐
│ Main Site Header (from root layout)             │
├──────────────┬──────────────────────────────────┤
│              │ Portal Header (UserBadge)        │
│   Sidebar    ├──────────────────────────────────┤
│   - Dashboard│                                  │
│   - Projects │     Main Content Area            │
│   - Profile  │                                  │
│              │                                  │
│   ───────    │                                  │
│   Back link  │                                  │
└──────────────┴──────────────────────────────────┘
```

---

## Query 6 - Smart Navigation & User Experience Improvements
**Date:** December 18, 2025

**Request:**
Update the main navbar so that "Participant Portal" goes to /app if logged in, otherwise to /login. Add a small banner on the home page CTA encouraging participants to sign in. Make sure protected pages show a friendly message if user is null (should rarely happen due to middleware), and provide a button back to login.

**Changes Made:**
- Updated `src/components/Header.tsx` - "Participant Portal" link now conditionally routes to `/app` if user is logged in, otherwise `/login`
- Updated `app/page.tsx` - Made home page a client component, added:
  - Conditional banner above CTA section encouraging existing participants to sign in (only shown when not logged in)
  - Dynamic button text ("Go to Portal" vs "Get Started" / "Join Now") based on auth state
  - Hero button routes to `/app` if logged in, `/login` otherwise
- Updated `app/app/layout.tsx` - Added fallback UI for when user is null:
  - Loading spinner while checking auth state
  - Friendly error message with icon if user is null
  - "Sign In" button that redirects to login with `next` param
  - "Back to Home" link as alternative

**Features:**
- Smart navigation based on authentication state
- Contextual messaging on home page
- Graceful error handling for edge cases
- User-friendly fallback UI

---

## Query 7 - Innovations Management System
**Date:** December 18, 2025

**Request:**
An innovation is just a project. Store them in Firebase, and only an admin can add, edit, or delete those entries. Need a table of admins and a table of innovations.

**Changes Made:**
- Updated `src/lib/firebaseClient.ts` - Added Firestore (`db`) export
- Created `src/types/innovation.ts` - TypeScript interfaces for `Innovation` and `Admin`
- Created `src/lib/admin.ts` - Admin checking utilities:
  - `isAdmin(userId)` - Check if user is admin
  - `getAdmin(userId)` - Get admin document
- Created `app/api/admin/check/route.ts` - API endpoint to check admin status
- Created `app/api/admin/innovations/route.ts` - CRUD API for innovations:
  - GET - List all innovations (public)
  - POST - Create innovation (admin only)
- Created `app/api/admin/innovations/[id]/route.ts` - Individual innovation operations:
  - GET - Get single innovation (public)
  - PUT - Update innovation (admin only)
  - DELETE - Delete innovation (admin only)
- Created `app/admin/page.tsx` - Admin interface for managing innovations:
  - Admin access check with friendly error message
  - List all innovations with status badges
  - Create/Edit form modal
  - Delete functionality with confirmation
  - Tags support (comma-separated)

**Firebase Collections:**
- `admins` - Stores admin users (document ID = Firebase Auth UID)
  - Fields: `email`, `userId`, `createdAt`, `createdBy`
- `innovations` - Stores innovation/project entries
  - Fields: `title`, `description`, `status` (active/completed/pending), `tags[]`, `createdAt`, `updatedAt`, `createdBy`

**Security:**
- Admin checks performed server-side in API routes
- Only users in `admins` collection can create/edit/delete innovations
- Public read access to innovations (GET endpoints don't require auth)

**To Add an Admin:**
Manually add a document to the `admins` collection in Firestore:
- Document ID: Firebase Auth UID of the user
- Fields: `email` (string), `userId` (string, same as doc ID), `createdAt` (timestamp)

---

## Query 8 - Connect Projects Page to Innovations
**Date:** December 18, 2025

**Request:**
The projects page should only show projects from the innovations table.

**Changes Made:**
- Updated `app/app/projects/page.tsx` - Replaced mock data with real Firebase data:
  - Fetches innovations from `/api/admin/innovations` endpoint
  - Maps innovation data structure to project display format
  - Added loading and error states
  - Removed "New Project" button (only admins can create via `/admin`)
  - Progress bar calculated from status (completed=100%, active=50%, pending=0%)
  - Displays tags, creation date, and update date
  - Status filtering still works (All, Active, Completed, Pending)

**Features:**
- Real-time data from Firebase
- Loading spinner while fetching
- Error handling with retry button
- Empty state when no projects match filter
- All innovations displayed as projects

---

## Query 9 - Firestore Security Rules
**Date:** December 18, 2025

**Request:**
I get a failed to fetch innovations, I need rules file for these and admins.

**Changes Made:**
- Created `firestore.rules` - Firestore security rules:
  - **Innovations collection:**
    - Public read access (anyone can read)
    - Only admins can create, update, or delete
  - **Admins collection:**
    - Users can read their own admin document (to check if they're admin)
    - Only existing admins can create, update, or delete admin documents
  - Helper function `isAdmin()` checks if user exists in admins collection
- Created `firebase.json` - Firebase configuration file:
  - References `firestore.rules` for Firestore rules
  - Includes hosting configuration for Next.js deployment

**Security Rules Summary:**
```
Innovations:
  - Read: Public (anyone)
  - Create/Update/Delete: Admins only

Admins:
  - Read: Own document only (to check admin status)
  - Create/Update/Delete: Admins only
```

**To Deploy Rules:**
```bash
firebase deploy --only firestore:rules
```

**Note:** After creating the rules file, you must deploy it to Firebase for it to take effect. The rules prevent unauthorized access and allow public read access to innovations while protecting write operations.

---

## Query 10 - Simplify Dashboard to Innovations List
**Date:** December 18, 2025

**Request:**
The dashboard is really just a list of innovations and a button to create a new innovation. We can then get rid of the projects page.

**Changes Made:**
- Updated `app/app/page.tsx` - Dashboard now shows:
  - Welcome message with user name
  - List of all innovations in a responsive grid (2-3 columns)
  - "Create Innovation" button (only visible to admins)
  - Admin status check on page load
  - Loading and error states
  - Empty state with different messages for admins vs regular users
  - Innovation cards with title, description, status badge, tags, progress bar, and creation date
- Updated `app/app/layout.tsx` - Removed "Projects" link from sidebar navigation
- Deleted `app/app/projects/page.tsx` - Projects page no longer needed

**Features:**
- Dashboard is now the main innovations view
- Admin-only "Create Innovation" button redirects to `/admin` page
- Clean, focused interface showing all available innovations
- Progress calculated from status (completed=100%, active=50%, pending=0%)
- Responsive grid layout (1 column mobile, 2 columns tablet, 3 columns desktop)

---

## Query 11 - Admin Badge and Create Button Visibility
**Date:** December 18, 2025

**Request:**
If I am an admin, let's add the word "Admin" by the person's name and let's add a button to create a new innovation.

**Changes Made:**
- Updated `src/components/UserBadge.tsx` - Added admin status check and display:
  - Checks admin status on component mount
  - Displays "Admin" label below user's name (only for admins)
  - Shows user name and admin badge in a stacked layout on desktop
  - Admin label styled with accent color for visibility
- Dashboard already has "Create Innovation" button (from Query 10):
  - Button visible in header (top right)
  - Also visible in empty state
  - Redirects to `/admin` page for creating innovations

**Features:**
- Admin badge appears next to user's name in header
- Badge only shows for authenticated admin users
- Create Innovation button prominently displayed for admins
- Clear visual indication of admin status throughout the app

---

## Query 12 - Fix Admin Status Checking
**Date:** December 18, 2025

**Request:**
Fix admin status checking - not seeing admin indication and getting 500 errors when checking admin status.

**Changes Made:**
- Updated `src/components/UserBadge.tsx` - Changed from API route to direct Firestore check:
  - Removed `/api/admin/check` API call
  - Added direct `getDoc` call to check `admins/{userId}` document
  - Added green dot indicator on avatar for mobile users
  - Added console logging for debugging
- Updated `app/admin/page.tsx` - Fixed admin check and operations:
  - Changed admin check to use direct Firestore calls instead of broken API route
  - Changed all CRUD operations to use direct Firestore calls (addDoc, updateDoc, deleteDoc, getDocs)
  - Removed dependency on server-side API routes that were using client SDK incorrectly
- Updated `app/app/page.tsx` - Fixed admin check:
  - Changed from `/api/admin/check` API route to direct Firestore check
  - Changed innovations fetching to use direct Firestore calls

**Technical Details:**
- The `/api/admin/check` route was using client-side Firebase SDK in a server route, causing 500 errors
- Direct Firestore calls from client work properly with Firestore security rules
- Firestore rules allow users to read their own admin document: `allow read: if request.auth != null && request.auth.uid == adminId`

**Benefits:**
- More reliable admin status checking
- Faster operations (no API route overhead)
- Better error handling
- Works correctly with Firestore security rules

---

## Query 13 - Add Website Link Field to Innovations
**Date:** December 18, 2025

**Request:**
When adding an innovation, include a link to the innovation website for user testing.

**Changes Made:**
- Updated `src/types/innovation.ts` - Added `link?: string` field to `Innovation` interface
- Updated `app/admin/page.tsx` - Added link field to form:
  - Added `link` to form state
  - Added URL input field in create/edit form with placeholder and helper text
  - Updated form submission to save link (or undefined if empty)
  - Updated edit handler to populate link field
  - Display link as clickable "Test Innovation Website" button in admin list
- Updated `app/app/page.tsx` - Display link in user-facing innovations:
  - Added "Test Innovation" link button with external link icon
  - Link opens in new tab with proper security attributes

**Features:**
- Optional URL field for innovation website links
- URL validation via HTML5 input type
- Clickable links in both admin and user views
- External link icon for visual clarity
- Opens in new tab with security attributes (noopener, noreferrer)

---

## Query 14 - Playful Color Scheme Update
**Date:** December 18, 2025

**Request:**
Change the color scheme to something more playful to match the "why not" rebellious nature of the website.

**Changes Made:**
- Updated `app/globals.css` - New color palette:
  - **Light Mode:**
    - Background: Soft purple-tinted white (`#fef9ff`)
    - Accent: Vibrant purple (`#a855f7`)
    - Accent Dark: Deeper purple (`#9333ea`)
    - Borders: Light purple (`#e9d5ff`)
    - Muted text: Purple-tinted gray (`#8b5a9f`)
  - **Dark Mode:**
    - Background: Deep purple-black (`#1a0a1f`)
    - Accent: Bright purple (`#c084fc`)
    - Cards: Rich purple-tinted dark (`#2d1b3d`)
    - Borders: Deep purple (`#4c1d95`)
- Updated `app/page.tsx` - Enhanced visual effects:
  - Hero section: Gradient background (purple → pink → violet) with multiple blur effects
  - Title: Gradient text effect on "WhyNot Innovations" (purple to pink)
  - CTA section: Vibrant gradient background (purple → pink → violet) with enhanced decorative elements
  - Updated button focus states with purple glow

**Design Philosophy:**
- Purple, pink, and violet colors represent creativity and innovation
- Gradients add depth and energy
- Blur effects create modern, playful aesthetic
- Maintains accessibility with proper contrast ratios

---

## Query 15 - Lightbulb Icon with Question Marks
**Date:** December 18, 2025

**Request:**
Replace the current "W in a rounded corner square" icon with a lightbulb containing question marks. The question marks should be different colors and the lightbulb should be broken, representing breaking out of a box.

**Changes Made:**
- Created `src/components/LightbulbIcon.tsx` - New icon component:
  - Yellow lightbulb with visible crack lines (red)
  - Three colorful question marks inside (purple, pink, violet)
  - Pieces breaking away from the bulb (breaking out effect)
  - Glow effect around the bulb
  - Gray metal socket/base at bottom
  - Scalable SVG component with size prop
- Updated `src/components/Header.tsx` - Replaced "W" icon with LightbulbIcon
- Updated `app/layout.tsx` - Replaced "W" icon in footer with LightbulbIcon
- Updated `app/about/page.tsx` - Added large lightbulb icons:
  - 80px icon in hero section
  - 120px icon in Mission section (replaced "W" text)
  - Updated hero section with gradient background matching color scheme

**Icon Features:**
- Broken/cracked lightbulb with red crack lines
- Three question marks in different colors (purple #A855F7, pink #EC4899, violet #8B5CF6)
- Pieces breaking away from bulb (6 pieces at different angles)
- Radial glow effect
- Gradient background containers (purple to pink)

**Size Updates:**
- Header/Footer: 40px icon in 48px container (increased from 28px/36px)
- About page hero: 80px icon
- About page mission: 120px icon

**Symbolism:**
- Lightbulb = Ideas and innovation
- Question marks = "Why not?" questioning mindset
- Broken bulb = Breaking out of constraints/boxes
- Colorful = Playful, creative approach

---

---
