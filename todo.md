# Pickleball Court Booking System — TODO

## Database
- [x] Add `bookings` table to drizzle/schema.ts (name, email, date, startTime, duration, amountPaid, stripeSessionId, status)
- [x] Generate and apply migration SQL

## Backend API
- [x] Add booking query helpers to server/db.ts
- [x] Add `bookings.getAvailableSlots` public procedure (date-based slot availability)
- [x] Add `bookings.createCheckoutSession` public procedure (Stripe Checkout session)
- [x] Add `bookings.getBySessionId` public procedure (confirmation page lookup)
- [x] Add Stripe webhook handler at POST /api/stripe/webhook (raw body, signature verify)
- [x] Add `admin.listBookings` admin-only procedure (full schedule)
- [x] Add `admin.cancelBooking` admin-only procedure
- [x] Add `admin.addBooking` admin-only procedure (manual add)
- [x] Add `admin.getStats` admin-only procedure (dashboard stats)

## Customer Booking Page
- [x] Date picker with calendar UI
- [x] Available time slots grid (8am–9pm, hourly)
- [x] Duration selector (1hr $20 / 2hr $40)
- [x] Contact info form (name, email)
- [x] Stripe Checkout redirect on submit
- [x] Disable already-booked slots in real time

## Booking Confirmation Page
- [x] Route /booking/confirmation?session_id=...
- [x] Fetch booking details by Stripe session ID
- [x] Display full booking summary (name, date, time, duration, amount)
- [x] Elegant success state with court details

## Admin Dashboard
- [x] Role-gated route /admin (owner only)
- [x] Stats cards (total bookings, revenue, today's bookings)
- [x] Full schedule table with date, time, customer name, email, duration, status
- [x] Calendar week view of bookings
- [x] Cancel booking action with confirmation dialog
- [x] Manual add booking dialog form
- [x] Filter/search bookings by date or name

## Stripe Integration
- [x] Add Stripe via webdev_add_feature
- [x] Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
- [x] VITE_STRIPE_PUBLISHABLE_KEY for frontend

## Styling & Polish
- [x] Elegant color palette (deep green + white + gold accents)
- [x] Google Fonts (Playfair Display + Inter)
- [x] Smooth animations and transitions
- [x] Responsive mobile layout
- [x] Empty states and loading skeletons

## Tests
- [x] Vitest: slot availability logic
- [x] Vitest: booking creation after webhook
- [x] Vitest: admin role gate

## Customer Email Notifications
- [x] Install resend npm package
- [x] Add RESEND_API_KEY secret
- [x] Create server/email.ts with sendBookingConfirmation helper (HTML template)
- [x] Call sendBookingConfirmation in Stripe webhook after booking is created
- [x] Also send owner notification via notifyOwner on new booking
- [x] Write Vitest test for email helper


## Membership System (Stripe Subscriptions)
- [x] Add `memberships` and `subscriptions` tables to drizzle/schema.ts
- [x] Generate and apply migration SQL for membership tables
- [x] Add membership query helpers to server/db.ts
- [x] Create Stripe products/prices for Silver ($50/mo) and Gold ($100/mo)
- [x] Add `memberships.createCheckoutSession` procedure for subscription checkout
- [x] Add `memberships.getActiveSubscription` procedure (user's current membership)
- [x] Add `memberships.cancelSubscription` procedure
- [x] Add Stripe webhook handler for subscription events (customer.subscription.created, customer.subscription.updated, customer.subscription.deleted)
- [x] Build /memberships page with tier cards and checkout buttons
- [x] Build /account/membership page to view/manage active subscription
- [x] Apply membership discount to booking prices (if applicable)
- [x] Write Vitest tests for membership procedures

## Player Sign-Up & Login
- [x] Add password hash field to users table (or a separate player_accounts table)
- [x] Generate and apply migration SQL
- [x] Add `auth.register` public procedure (name, email, password → hashed, creates user)
- [x] Add `auth.emailLogin` public procedure (email, password → session cookie)
- [x] Build /signup page with name, email, password, confirm password fields
- [x] Build /login page with email and password fields
- [x] Add sign-up/login links to homepage nav
- [x] Redirect to /book after successful login/signup
- [x] Show logged-in user name in nav with logout button
- [x] Write Vitest tests for register and login procedures
