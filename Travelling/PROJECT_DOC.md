# Travel Booking Project Documentation

## Architecture Overview
- Monorepo under `Travelling/app` with a Vite/React SPA frontend and an ASP.NET Core 8 minimal API backend
- Frontend communicates with backend REST endpoints (`/auth`, `/api/v1/destinations`, `/bookings`, `/api/reviews`, `/payment`, admin routes)
- SQLite is used for development and PostgreSQL for production through Entity Framework Core; RabbitMQ handles asynchronous booking/email/cancellation workflows
- Infrastructure includes Serilog-based logging, JWT authentication, rate limiting, and hosted background services for reminders and email queues

## Frontend (`Travelling/app/frontend/frontend`)
- Tooling: Vite 7, TypeScript, React 18, TailwindCSS, PostCSS, Prettier
- Libraries: React Router, Axios, React Hot Toast, Framer Motion, Recharts, Leaflet + Leaflet Routing Machine, Lucide icons, Google OAuth client
- State & contexts: `AuthContext` manages JWT sessions + Google login, `DestinationsContext` caches destination listings
- Key pages/components: LandingPage, UserDashboard, AdminDashboard, StartBookingPage, PaymentPage, Destination modals, reviews widgets, weather widget, booking cards
- API helpers:
  - `src/lib/api.ts` centralizes Axios client with base URL + interceptors
  - `src/api/weather.ts` integrates OpenWeatherMap (requires `VITE_OPENWEATHER_API_KEY`)
  - `src/api/paymentApi.ts` wraps Razorpay order + verification endpoints and loads the checkout script
  - `src/lib/googleMaps.ts` dynamically loads Google Maps JavaScript API
- Environment variables: `VITE_API_URL`, `VITE_OPENWEATHER_API_KEY`, `VITE_RAZORPAY_KEY_ID`, `VITE_GOOGLE_CLIENT_ID`, etc.

## Backend (`Travelling/app/backend/Travel.Api/Travel.Api`)
- Framework: ASP.NET Core 8 minimal APIs with dependency injection configured in `Program.cs`
- Data layer: EF Core DbContext, SQLite dev connection (`appsettings.local.json`) and PostgreSQL production connection
- Authentication & security: JWT Bearer tokens, cookie storage for AuthToken, BCrypt password hashing, Google OAuth validation via `Google.Apis.Auth`, global/auth-specific rate limiters, custom `ExceptionHandlingMiddleware`
- Services & Hosted workers:
  - Email: `SmtpEmailService`, `EmailTemplateBuilder`, booking/cancellation/reschedule consumers
  - OTP: `OtpService`, `OtpRateLimiter`
  - Booking: `BookingService`, reminder hosted service, RabbitMQ publisher/consumers
  - Reviews: `ReviewService`
  - Messaging: `RabbitMqService` sets up booking/email/cancellation/reschedule queues with DLX + retries
- Logging & monitoring: Serilog writing structured logs to rotating files under `Travel.Api/logs`
- Configuration: `appsettings.json`, environment override `appsettings.local.json`, Dockerfile and docker-compose for containerized deployment

## Core REST APIs (partial list)
- **Auth** (`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`) — JWT issuance, cookie storage, Google login handled separately at `/api/auth/google`
- **Destinations** (`/api/v1/destinations`, `/api/v1/destinations/{id}`, POST/PATCH/DELETE admin endpoints) — CRUD with pagination and geo data
- **Bookings** (`/bookings`, `/bookings/{userId}`, `/shortest-path`) — booking creation, per-user listing, nearest-neighbor itinerary helper
- **Reviews** (`/api/reviews`, `/api/reviews/{destinationId}`, `/api/reviews/average/{destinationId}`)
- **Payments** (`/payment/create-order`, `/payment/verify-payment`) — Razorpay order/token flow using `JwtHelper`
- **Emails/Admin** (`/email/send`, `/admin/bookings`, `/admin/trip-cancellations/*`, `/admin/test-email`) — operational tooling and moderation endpoints

## External Integrations
- **OpenWeatherMap** for contextual weather data in Destination & Weather widgets (REST API key via Vite env)
- **Razorpay Checkout** for payment processing, embedding hosted script and verifying signatures server-side
- **Google Maps + Places** for maps, routing, and autocomplete experiences
- **Google OAuth** for social login (`@react-oauth/google` on frontend and token verification backend)
- **Leaflet & Leaflet Routing Machine** for itinerary visualization
- **MailKit SMTP** for OTPs, booking confirmations, and admin notifications
- **RabbitMQ** for decoupled booking/email/cancellation pipelines with DLX-based retries

## Deployment & Operations Notes
- Backend ships Dockerfile + `docker-compose.yml` for API, RabbitMQ, and database orchestration
- Ensure RabbitMQ credentials/queues match `appsettings.json` (`RabbitMQ` section) and that DLX exchange exists
- Configure SMTP credentials and admin notification email before enabling email features; test via `/admin/test-email`
- Apply EF Core migrations automatically at startup; ensure PostgreSQL connection string is set in production
- Frontend built with `npm run build` (Vite) and can deploy to Netlify/Vercel using provided configs (`netlify.toml`, `vercel.json`)
- Environment secrets should be stored in `.env` (frontend) and user-secrets or deployment env vars (backend)
