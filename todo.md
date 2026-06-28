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
