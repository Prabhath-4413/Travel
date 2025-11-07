# SuiteSavvy Travel Booking System - Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Authentication & Authorization](#authentication--authorization)
7. [Email System](#email-system)
8. [Message Queue (RabbitMQ)](#message-queue-rabbitmq)
9. [Frontend Features](#frontend-features)
10. [Setup & Installation](#setup--installation)
11. [Configuration](#configuration)
12. [Key Components](#key-components)

---

## Project Overview

**SuiteSavvy** is a comprehensive travel booking system built with a modern full-stack architecture. It allows users to:
- Browse and book travel packages/destinations
- Create custom itineraries with multiple destinations
- Request and track trip cancellations
- Receive confirmation and status update emails
- View booking history and manage preferences

The system features a **reactive email notification system** that automatically sends confirmations, reminders, and status updates through both user-facing and admin-notification queues.

**Key Features:**
- ✈️ Multi-destination booking support
- 📧 Automated email confirmations and notifications
- 🛑 Trip cancellation management with approval workflow
- 👤 User authentication with JWT tokens
- 🔐 Role-based access control (User/Admin)
- 📦 Travel package and destination management
- 🔄 RabbitMQ-based asynchronous email delivery
- ⭐ Post-trip ratings and reviews

---

## Technology Stack

### Backend
- **Framework:** ASP.NET Core 8.0
- **Language:** C#
- **Database:** PostgreSQL 14+
- **ORM:** Entity Framework Core 8.0.8
- **Authentication:** JWT (JSON Web Tokens)
- **Message Queue:** RabbitMQ 6.5.0
- **Email:** MailKit 4.14.1, MimeKit 4.14.0
- **Security:** BCrypt.Net-Next 4.0.3

### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 7.1.12
- **Styling:** Tailwind CSS 3.4.18
- **Routing:** React Router DOM 7.9.3
- **HTTP Client:** Axios 1.7.7
- **Animations:** Framer Motion 11.18.2
- **UI Icons:** Lucide React 0.544.0
- **Maps:** Leaflet 1.9.4, React Leaflet 4.3.3
- **Notifications:** React Hot Toast 2.6.0

### DevOps & Deployment
- **Containerization:** Docker
- **Hosting:** Netlify (Frontend), Vercel (Alternate)
- **Database:** Docker Compose PostgreSQL

---

## Project Structure

```
Travelling/
├── app/
│   ├── backend/
│   │   └── Travel.Api/
│   │       └── Travel.Api/
│   │           ├── Controllers/           # API endpoints
│   │           │   ├── TripCancellationController.cs
│   │           │   ├── FeedbackController.cs
│   │           │   └── PackagesController.cs
│   │           ├── Models/               # Data models & DTOs
│   │           │   ├── Entities.cs       # Database entities
│   │           │   ├── MessageDtos.cs    # Message queue DTOs
│   │           │   ├── EmailDtos.cs
│   │           │   ├── TripCancellationDtos.cs
│   │           │   └── BaseMessage.cs
│   │           ├── Services/             # Business logic
│   │           │   ├── EmailTemplateBuilder.cs
│   │           │   ├── BookingEmailConsumerService.cs
│   │           │   ├── CancellationEmailConsumerService.cs
│   │           │   ├── EmailConsumerService.cs
│   │           │   ├── EmailConsumerServiceV2.cs
│   │           │   ├── BookingReminderService.cs
│   │           │   ├── SmtpEmailService.cs
│   │           │   ├── RabbitMqService.cs
│   │           │   ├── BookingQueueConsumerService.cs
│   │           │   ├── IEmailService.cs
│   │           │   └── IMessageQueueService.cs
│   │           ├── Data/                 # Database context
│   │           │   ├── ApplicationDbContext.cs
│   │           │   └── Seed.cs
│   │           ├── Migrations/           # EF Core migrations
│   │           ├── Properties/
│   │           ├── Program.cs            # Startup configuration
│   │           ├── appsettings.json      # Configuration
│   │           ├── docker-compose.yml
│   │           └── Dockerfile
│   │
│   └── frontend/
│       └── frontend/
│           ├── src/
│           │   ├── api/                 # API client functions
│           │   ├── components/          # React components
│           │   ├── contexts/            # React contexts
│           │   ├── pages/               # Page components
│           │   ├── lib/                 # Utility functions
│           │   ├── App.tsx
│           │   ├── main.tsx
│           │   ├── types.ts
│           │   └── styles.css
│           ├── public/                  # Static assets
│           │   ├── images/
│           │   └── sample-data/
│           ├── package.json
│           ├── vite.config.ts
│           ├── tailwind.config.js
│           ├── netlify.toml
│           ├── vercel.json
│           └── index.html
│
├── CleanQueues.cs                       # Utility for queue management
├── DLQ_MESSAGE_REQUEUE.cs               # Dead-letter queue handler
├── PRODUCER_REFERENCE.cs                # Message producer reference
└── Travelling.sln
```

---

## Database Schema

### Users Table (`users`)
```sql
┌─────────────┬──────────┬─────────────────┐
│ Column      │ Type     │ Constraints     │
├─────────────┼──────────┼─────────────────┤
│ user_id     │ INT      │ PRIMARY KEY     │
│ name        │ VARCHAR  │ MAX 100         │
│ email       │ VARCHAR  │ MAX 100, UNIQUE │
│ password    │ VARCHAR  │ MAX 255 (BCRYPT)│
│ role        │ VARCHAR  │ MAX 50, DEF'user'│
│ created_at  │ DATETIME │ DEFAULT UTC NOW │
└─────────────┴──────────┴─────────────────┘
```

**Roles:** `user` (default), `admin`

### Destinations Table (`destinations`)
```sql
┌────────────────────┬──────────┬──────────────────┐
│ Column             │ Type     │ Constraints      │
├────────────────────┼──────────┼──────────────────┤
│ destination_id     │ INT      │ PRIMARY KEY      │
│ name               │ VARCHAR  │ MAX 100, NOT NULL│
│ description        │ TEXT     │ NULLABLE         │
│ price              │ DECIMAL  │ 10,2             │
│ image_url          │ VARCHAR  │ NULLABLE         │
│ latitude           │ DECIMAL  │ 9,6, NULLABLE    │
│ longitude          │ DECIMAL  │ 9,6, NULLABLE    │
│ country            │ VARCHAR  │ MAX 100          │
│ city               │ VARCHAR  │ MAX 100          │
│ created_at         │ DATETIME │ DEFAULT UTC NOW  │
└────────────────────┴──────────┴──────────────────┘
```

### Bookings Table (`bookings`)
```sql
┌──────────────────────┬──────────┬────────────────────────┐
│ Column               │ Type     │ Constraints            │
├──────────────────────┼──────────┼────────────────────────┤
│ booking_id           │ INT      │ PRIMARY KEY            │
│ user_id              │ INT      │ FOREIGN KEY (users)    │
│ total_price          │ DECIMAL  │ 10,2                   │
│ guests               │ INT      │ NOT NULL               │
│ nights               │ INT      │ NOT NULL               │
│ booking_date         │ DATETIME │ NOT NULL               │
│ start_date           │ DATETIME │ NOT NULL               │
│ confirmed            │ BOOLEAN  │ DEFAULT FALSE          │
│ reminder_sent        │ BOOLEAN  │ DEFAULT FALSE          │
│ status               │ INT      │ (0:Active, 1:Cancelled)│
│ cancellation_status  │ INT      │ (0:None,1:Req,2:App,3:Rej)│
│ rating               │ INT      │ NULLABLE (0-5)         │
│ review               │ TEXT     │ NULLABLE               │
│ created_at           │ DATETIME │ DEFAULT UTC NOW        │
└──────────────────────┴──────────┴────────────────────────┘

**Status Values:**
- Active = 0
- Cancelled = 1
- Confirmed = 2
- Completed = 3

**Cancellation Status Values:**
- None = 0
- Requested = 1
- Approved = 2
- Rejected = 3
```

### BookingDestinations Table (Junction)
```sql
┌────────────────┬──────────┬──────────────────────┐
│ Column         │ Type     │ Constraints          │
├────────────────┼──────────┼──────────────────────┤
│ booking_id     │ INT      │ FOREIGN KEY (bookings)
│ destination_id │ INT      │ FOREIGN KEY (destinations)
└────────────────┴──────────┴──────────────────────┘
```

### TripCancellations Table
```sql
┌──────────────────────┬──────────┬─────────────────────────┐
│ Column               │ Type     │ Constraints             │
├──────────────────────┼──────────┼─────────────────────────┤
│ trip_cancellation_id │ INT      │ PRIMARY KEY             │
│ booking_id           │ INT      │ FOREIGN KEY (bookings)  │
│ user_id              │ INT      │ FOREIGN KEY (users)     │
│ reason               │ VARCHAR  │ MAX 1000, NULLABLE      │
│ requested_at         │ DATETIME │ NOT NULL                │
│ reviewed_at          │ DATETIME │ NULLABLE                │
│ status               │ INT      │ (0:Pending,1:App,2:Rej) │
│ admin_comment        │ VARCHAR  │ MAX 1000, NULLABLE      │
│ created_at           │ DATETIME │ DEFAULT UTC NOW         │
└──────────────────────┴──────────┴─────────────────────────┘

**Status Values:**
- Pending = 0
- Approved = 1
- Rejected = 2
```

### TravelPackages & TravelPackageDestinations Tables
Used for pre-configured travel packages with multiple destinations.

---

## API Endpoints

### Authentication Endpoints

**POST** `/auth/register`
- Register a new user
- **Request Body:**
  ```json
  {
    "name": "string",
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response:** `{ "userId": int }`
- **Auth:** None (public)

**POST** `/auth/login`
- Authenticate user and receive JWT token
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response:** 
  ```json
  {
    "role": "user|admin",
    "userId": int,
    "name": "string",
    "token": "jwt_token"
  }
  ```
- **Auth:** None (public)
- **Sets Cookie:** `AuthToken` (httpOnly, expires in 12 hours)

**POST** `/auth/logout`
- Clear authentication cookie
- **Auth:** Required (Authenticated user)

**GET** `/auth/me`
- Get current user profile
- **Response:**
  ```json
  {
    "userId": int,
    "name": "string",
    "email": "string",
    "role": "user|admin"
  }
  ```
- **Auth:** Required

### Destinations Endpoints

**GET** `/api/destinations` or `/destinations`
- Get all destinations
- **Query Params:** None
- **Response:** Array of destinations
- **Auth:** None

**GET** `/api/destinations/{id}` or `/destinations/{id}`
- Get specific destination by ID
- **Response:** Single destination object
- **Auth:** None

**POST** `/admin/destinations`
- Create new destination (Admin only)
- **Request Body:**
  ```json
  {
    "name": "string",
    "description": "string",
    "price": decimal,
    "imageUrl": "string",
    "latitude": decimal,
    "longitude": decimal,
    "country": "string",
    "city": "string"
  }
  ```
- **Response:** Created destination object
- **Auth:** Required (Admin role only)

**DELETE** `/admin/destinations/{id}`
- Delete destination (Admin only)
- **Auth:** Required (Admin role only)

### Bookings Endpoints

**POST** `/bookings`
- Create new booking
- **Request Body:**
  ```json
  {
    "userId": int,
    "destinationIds": [int],
    "startDate": "2024-01-15",
    "guests": int,
    "nights": int
  }
  ```
- **Response:**
  ```json
  {
    "bookingId": int,
    "message": "Booking confirmed successfully.",
    "total": decimal,
    "guests": int,
    "nights": int,
    "startDate": "datetime",
    "endDate": "datetime",
    "destinations": [string]
  }
  ```
- **Auth:** Required
- **Triggers:** Publishes `BookingConfirmation` message to RabbitMQ

**GET** `/bookings/{userId}`
- Get all bookings for a user
- **Response:** Array of booking objects with destinations
- **Auth:** Required (User can only access their own bookings)
- **Includes:** Destination details and cancellation status

### Trip Cancellation Endpoints

**POST** `/api/tripcancellations/request`
- Request trip cancellation (User)
- **Request Body:**
  ```json
  {
    "userId": int,
    "bookingId": int,
    "reason": "string (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "cancellationId": int,
    "message": "Cancellation request submitted successfully."
  }
  ```
- **Auth:** Required (User role)
- **Triggers:** Publishes cancellation request emails to queue

**GET** `/api/tripcancellations/admin/pending`
- Get pending cancellation requests (Admin only)
- **Response:** Array of pending trip cancellations
- **Auth:** Required (Admin role only)

**GET** `/api/tripcancellations/{userId}`
- Get cancellation history for user
- **Response:** Array of trip cancellations
- **Auth:** Required

**POST** `/api/tripcancellations/admin/decide`
- Approve/Reject cancellation request (Admin only)
- **Request Body:**
  ```json
  {
    "cancellationId": int,
    "approved": boolean,
    "adminComment": "string (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Cancellation decision processed."
  }
  ```
- **Auth:** Required (Admin role only)
- **Triggers:** Publishes decision notification emails

### Feedback Endpoints

**POST** `/api/feedback`
- Submit feedback/rating for completed booking
- **Request Body:**
  ```json
  {
    "bookingId": int,
    "rating": int (0-5),
    "review": "string (optional)"
  }
  ```
- **Response:** `{ "message": "Feedback submitted." }`
- **Auth:** Required

### Travel Packages Endpoints

**GET** `/api/packages`
- Get all travel packages
- **Response:** Array of travel packages with destinations
- **Auth:** None

**GET** `/api/packages/{id}`
- Get specific travel package
- **Response:** Package with included destinations
- **Auth:** None

---

## Authentication & Authorization

### JWT Implementation
- **Token Expiration:** 12 hours
- **Algorithm:** HMAC SHA-256
- **Token Location:** HTTP Cookie (AuthToken)
- **Token Claims:**
  - `sub` (Subject): User ID
  - `email`: User email
  - `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name`: User name
  - `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role`: User role

### Roles
1. **User** (default)
   - Create bookings
   - Request cancellations
   - View own bookings and cancellations
   - Submit feedback and reviews

2. **Admin**
   - Manage destinations
   - Approve/reject cancellation requests
   - View all users' bookings and cancellations
   - Access admin-only endpoints

### Password Security
- Passwords hashed using BCrypt.Net-Next
- Minimum security: Compare hashes during login
- No plain-text passwords stored or transmitted

---

## Email System

### Email Templates

#### 1. Booking Confirmation Email
- **Method:** `BuildBookingConfirmationBody()`
- **Triggered:** After booking creation
- **Content:**
  - Greeting with user name
  - ✅ Booking confirmed heading
  - Booking details card (dark themed)
    - Booking ID (with accent green highlight)
    - Trip dates
    - Destinations
    - Number of guests/nights
    - Total price
  - CTA and footer

#### 2. Cancellation Request Email (User)
- **Method:** `BuildCancellationRequestedUserBody()`
- **Triggered:** After cancellation request submission
- **Content:**
  - Acknowledgment message
  - Booking/cancellation details
  - User-provided reason (if any)
  - Timeline: "Review within 48 hours"

#### 3. Cancellation Request Email (Admin)
- **Method:** `BuildCancellationRequestedAdminBody()`
- **Triggered:** Admin notification queue
- **Content:**
  - Alert with cancellation ID
  - Full booking and traveler details
  - User's cancellation reason
  - Link/note to access admin dashboard

#### 4. Cancellation Decision Email (User)
- **Method:** `BuildCancellationDecisionUserBody()`
- **Triggered:** After admin decision
- **Content:**
  - Approval/rejection status (✔️ or 🛑)
  - Refund policy information (if approved)
  - Admin comments (if any)
  - Support contact info

#### 5. Cancellation Decision Email (Admin)
- **Method:** `BuildCancellationDecisionAdminBody()`
- **Triggered:** Admin decision notification
- **Content:**
  - Decision notification
  - Original request details
  - Admin's approval/rejection note

### Email Styling
- **Colors:**
  - Background: `#0b1412` (Dark Teal)
  - Header: `#07231f` (Darker Teal)
  - Accent: `#68d391` (Soft Green) - Used for highlights
  - Light Background: `#f8fafc` (Off-white)
  - Text: `#0b1412` or `#f8fafc`
  - Secondary Text: `#e2e8f0`, `#475569`

- **Typography:**
  - Font Stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
  - Responsive design
  - Email-client safe inline styles

- **Layout:**
  - Dark outer wrapper with gradient
  - Light content card with rounded borders
  - Shadow effects for depth
  - Mobile-responsive tables

### SMTP Configuration
- **Server:** smtp.gmail.com
- **Port:** 587
- **SSL/TLS:** Enabled
- **Authentication:** Required
- **Sender:** prabhathgalla@gmail.com (configured in appsettings.json)

---

## Message Queue (RabbitMQ)

### Architecture
RabbitMQ handles asynchronous email delivery through multiple consumer services. Messages are published when certain events occur and are consumed by background services.

### Queue Configuration

```
RabbitMQ Configuration (appsettings.json):
├── HostName: localhost
├── Port: 5672
├── UserName: guest
├── Password: guest
├── VirtualHost: /
├── BookingQueue: travel.bookings
├── EmailQueue: travel.admin
├── CancellationQueue: travel.cancellations
├── DeadLetterExchange: dlx.exchange
├── RetryAttempts: 3
└── RetryDelaySeconds: 5
```

### Message Types

#### 1. BookingMessage
**Queue:** `travel.bookings`
**Consumed by:** `BookingEmailConsumerService`
**Content:**
```json
{
  "messageId": "guid",
  "type": "BookingConfirmation",
  "bookingId": int,
  "userId": int,
  "userName": "string",
  "userEmail": "string",
  "destinations": ["array of destination names"],
  "totalPrice": decimal,
  "guests": int,
  "nights": int,
  "startDate": "datetime",
  "confirmed": boolean,
  "reminderSent": boolean,
  "cancellationStatus": int,
  "createdAt": "datetime",
  "timestamp": "datetime",
  "retryCount": int
}
```

#### 2. CancellationMessage
**Queue:** `travel.cancellations`
**Consumed by:** `CancellationEmailConsumerService`
**Content:**
```json
{
  "messageId": "guid",
  "type": "CancellationRequested|CancellationDecision",
  "cancellationId": int,
  "bookingId": int,
  "userId": int,
  "userName": "string",
  "userEmail": "string",
  "reason": "string (optional)",
  "requestedAt": "datetime",
  "status": int,
  "adminComment": "string (optional)",
  "approved": boolean (for decision),
  "timestamp": "datetime",
  "retryCount": int
}
```

#### 3. AdminNotificationMessage
**Queue:** `travel.admin`
**Consumed by:** `EmailConsumerService` / `EmailConsumerServiceV2`
**Content:**
```json
{
  "messageId": "guid",
  "type": "AdminNotification",
  "adminEmail": "string",
  "userName": "string",
  "subject": "string",
  "body": "string (HTML)",
  "timestamp": "datetime",
  "retryCount": int
}
```

### Consumer Services

#### BookingEmailConsumerService
- **Class:** `BookingEmailConsumerService : BackgroundService`
- **Purpose:** Send booking confirmation emails to users
- **Process:**
  1. Listens to `travel.bookings` queue
  2. Deserializes `BookingMessage`
  3. Fetches booking details from database (with destinations)
  4. Calls `EmailTemplateBuilder.BuildBookingConfirmationBody()`
  5. Sends email via SMTP
  6. Acknowledges message (ACK)

#### CancellationEmailConsumerService
- **Class:** `CancellationEmailConsumerService : BackgroundService`
- **Purpose:** Send cancellation-related emails
- **Process:**
  1. Listens to `travel.cancellations` queue
  2. Deserializes `CancellationMessage`
  3. Fetches booking details from database
  4. Routes based on message type:
     - **CancellationRequest:** Send to user confirming request
     - **CancellationDecision:** Send decision (approved/rejected)
  5. Calls appropriate template builder method
  6. Sends email via SMTP
  7. Acknowledges message

#### EmailConsumerService / EmailConsumerServiceV2
- **Class:** `EmailConsumerService`, `EmailConsumerServiceV2 : BackgroundService`
- **Purpose:** Generic admin notification sender
- **Process:**
  1. Listens to `travel.admin` queue
  2. Deserializes `AdminNotificationMessage`
  3. Sends email with provided subject/body
  4. Acknowledges message

#### BookingQueueConsumerService
- **Purpose:** Process booking-related queue operations
- **Note:** Implementation details specific to business logic

### Retry & Dead-Letter Queue (DLQ) Logic

**Failure Handling:**
1. If message processing fails, exception is caught
2. Current retry count is read from message headers
3. If `retries < maxRetries` (3):
   - Increment retry count
   - Re-publish message to queue
   - Log warning with retry attempt
4. If `retries >= maxRetries`:
   - Publish to Dead-Letter Queue (DLQ)
   - Log error
   - Acknowledge message (remove from main queue)

**DLQ Details:**
- **Exchange:** `dlx.exchange` (Direct exchange)
- **Queue Naming:** `{queue_name}.dlq`
- **Purpose:** Capture messages that permanently fail

**Utility Scripts:**
- `CleanQueues.cs`: Clear stuck messages from queues
- `DLQ_MESSAGE_REQUEUE.cs`: Requeue messages from DLQ back to main queue

### Message Publishing

Messages are published using `IMessageQueueService`:

```csharp
// Booking confirmation
await messageQueue.PublishBookingMessageAsync(bookingMessage);

// Cancellation-related
await messageQueue.PublishCancellationMessageAsync(cancellationMessage);

// Admin notifications
await messageQueue.PublishAdminNotificationAsync(adminMessage);
```

---

## Frontend Features

### Technology Stack
- **React 18.3.1** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Axios** for API requests
- **Framer Motion** for animations
- **Leaflet/React Leaflet** for interactive maps

### Key Pages & Components

#### Authentication
- Login page
- Registration page
- User profile/account management

#### Destinations
- Destination listing with filters
- Destination detail view with maps
- Price and availability information
- Image gallery

#### Bookings
- Multi-destination selection
- Date picker for trip dates
- Guest/night selection
- Booking confirmation page
- Booking history/management

#### Cancellations
- Cancellation request form
- Reason/feedback input
- Cancellation status tracking
- Admin dashboard for reviewing requests
- Approval/rejection interface with comments

#### Travel Packages
- Pre-configured package browsing
- Package details with multiple destinations
- Quick-book packages

### API Client
- Centralized API request methods in `src/api/`
- JWT token handling in requests
- Error handling and toast notifications
- Request interceptors for authentication

### State Management
- React Context for user authentication
- Local state for form management
- URL query parameters for filtering

---

## Setup & Installation

### Prerequisites
- **.NET 8.0 SDK**
- **Node.js 18+** and npm
- **PostgreSQL 14+**
- **RabbitMQ 3.12+** (with management plugin)
- **Docker & Docker Compose** (optional)

### Backend Setup

#### 1. Database Setup
```bash
# Using Docker Compose
docker-compose up -d

# Or using PostgreSQL directly
createdb TravelAppDB
```

#### 2. Install Dependencies
```bash
cd Travelling/app/backend/Travel.Api
dotnet restore
```

#### 3. Configure appsettings.json
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=TravelAppDB;Username=postgres;Password=YOUR_PASSWORD"
  },
  "JWT": {
    "Key": "YOUR_SECRET_KEY",
    "Issuer": "TravelApp",
    "Audience": "TravelAppUsers"
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "EnableSsl": true,
    "SenderEmail": "your-email@gmail.com",
    "SenderPassword": "app_password"
  },
  "RabbitMQ": {
    "HostName": "localhost",
    "Port": 5672,
    "UserName": "guest",
    "Password": "guest"
  }
}
```

#### 4. Run Migrations
```bash
dotnet ef database update
```

#### 5. Run Backend
```bash
dotnet run
# Backend runs on: http://localhost:5000
```

### Frontend Setup

#### 1. Install Dependencies
```bash
cd Travelling/app/frontend/frontend
npm install
```

#### 2. Configure Environment
Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:5000
```

#### 3. Run Development Server
```bash
npm run dev
# Frontend runs on: http://localhost:5173
```

#### 4. Build for Production
```bash
npm run build
```

### RabbitMQ Setup

#### Using Docker
```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3.12-management
```

#### Access Management Console
- **URL:** http://localhost:15672
- **Default User:** guest / guest

### Running with Docker Compose

```bash
cd Travelling/app/backend/Travel.Api
docker-compose up -d
```

This starts:
- PostgreSQL database
- RabbitMQ message broker
- Backend API

---

## Configuration

### appsettings.json Sections

#### Logging
```json
"Logging": {
  "LogLevel": {
    "Default": "Information",
    "Microsoft.AspNetCore": "Warning"
  }
}
```

#### Database Connection
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=TravelAppDB;..."
}
```

#### JWT Settings
```json
"JWT": {
  "Key": "Your secret key (min 32 chars)",
  "Issuer": "TravelApp",
  "Audience": "TravelAppUsers",
  "ExpireMinutes": 720
}
```

#### Email Settings
```json
"EmailSettings": {
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": 587,
  "EnableSsl": true,
  "SenderEmail": "your-email@gmail.com",
  "SenderPassword": "app-specific-password"
}
```

**Gmail Setup:**
1. Enable 2-factor authentication
2. Generate App Password (16 characters)
3. Use app password in configuration

#### RabbitMQ Settings
```json
"RabbitMQ": {
  "HostName": "localhost",
  "Port": 5672,
  "UserName": "guest",
  "Password": "guest",
  "VirtualHost": "/",
  "BookingQueue": "travel.bookings",
  "EmailQueue": "travel.admin",
  "CancellationQueue": "travel.cancellations",
  "DeadLetterExchange": "dlx.exchange",
  "RetryAttempts": 3,
  "RetryDelaySeconds": 5
}
```

### CORS Configuration

Frontend allowed origins:
- http://localhost:5173
- https://localhost:5173

Modify in `Program.cs` for production:
```csharp
.WithOrigins("https://yourdomain.com")
```

---

## Key Components

### Services Architecture

```
┌─────────────────────────────────────────┐
│        API Endpoints (Controllers)       │
├─────────────────────────────────────────┤
│   ↓
│ ┌──────────────────────────────────────┐
│ │    Business Logic (Services)         │
│ │  - EmailTemplateBuilder              │
│ │  - RabbitMqService                   │
│ │  - SmtpEmailService                  │
│ └──────────────────────────────────────┘
│   ↓
│ ┌──────────────────────────────────────┐
│ │    Background Services (Consumers)   │
│ │  - BookingEmailConsumerService       │
│ │  - CancellationEmailConsumerService  │
│ │  - BookingReminderService            │
│ └──────────────────────────────────────┘
│   ↓
│ ┌──────────────────────────────────────┐
│ │    Message Queue (RabbitMQ)          │
│ │  - travel.bookings                   │
│ │  - travel.cancellations              │
│ │  - travel.admin                      │
│ └──────────────────────────────────────┘
│   ↓
│ ┌──────────────────────────────────────┐
│ │    SMTP Server & Database            │
│ └──────────────────────────────────────┘
```

### Email Template Builder

**Location:** `Services/EmailTemplateBuilder.cs`

**Methods:**
1. `BuildBookingConfirmationBody()` - Booking confirmation email
2. `BuildCancellationRequestedUserBody()` - Cancellation request to user
3. `BuildCancellationRequestedAdminBody()` - Cancellation request to admin
4. `BuildCancellationDecisionUserBody()` - Cancellation decision to user
5. `BuildCancellationDecisionAdminBody()` - Cancellation decision to admin

**Features:**
- Dark-themed, responsive HTML templates
- Email-client safe inline CSS
- HTML-encoded user inputs for security
- Dynamic content injection
- Support for conditional sections

### Database Context

**Location:** `Data/ApplicationDbContext.cs`

**Entities:**
- Users
- Destinations
- Bookings
- BookingDestinations (junction)
- TripCancellations
- TravelPackages
- TravelPackageDestinations

**Features:**
- Entity relationships configured
- Automatic audit fields (created_at)
- Shadow properties for audit trails

---

## Common Workflows

### 1. User Creates Booking

```
1. User selects destinations, dates, guests
2. Frontend calls POST /bookings
3. Backend validates booking
4. Creates Booking entity in database
5. Creates BookingDestinations links
6. Publishes BookingMessage to RabbitMQ
7. Returns booking confirmation
8. BookingEmailConsumerService consumes message
9. Builds confirmation email template
10. Sends email via SMTP
11. Frontend shows success toast notification
```

### 2. User Requests Cancellation

```
1. User views booking and clicks "Cancel Trip"
2. Fills cancellation reason (optional)
3. Frontend calls POST /api/tripcancellations/request
4. Backend creates TripCancellation record
5. Updates Booking.CancellationStatus = Requested
6. Publishes CancellationMessage (type: CancellationRequest)
7. CancellationEmailConsumerService processes:
   - Sends confirmation to user
   - Sends alert to admin
8. Admin receives email with cancellation details
9. Admin logs in to dashboard
```

### 3. Admin Approves/Rejects Cancellation

```
1. Admin reviews pending cancellation in dashboard
2. Enters admin comment (optional)
3. Clicks Approve or Reject
4. Frontend calls POST /api/tripcancellations/admin/decide
5. Backend updates TripCancellation:
   - Sets Status (Approved/Rejected)
   - Sets AdminComment
   - Sets ReviewedAt timestamp
6. Updates Booking.CancellationStatus accordingly
7. Publishes CancellationMessage (type: CancellationDecision)
8. CancellationEmailConsumerService sends decision email to user
9. User receives email with status and admin comment
10. User sees updated status in bookings list
```

---

## Deployment

### Frontend Deployment (Netlify/Vercel)

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Environment Variables:**
- `VITE_API_BASE_URL`: Backend API URL

### Backend Deployment (Docker)

**Dockerfile:**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /src/bin/Release/net8.0/publish .
EXPOSE 5000
CMD ["dotnet", "Travel.Api.dll"]
```

**Environment Variables for Production:**
- `ConnectionStrings__DefaultConnection`
- `JWT__Key`
- `JWT__Issuer`
- `JWT__Audience`
- `EmailSettings__SmtpServer`
- `EmailSettings__SenderEmail`
- `EmailSettings__SenderPassword`
- `RabbitMQ__HostName`
- `RabbitMQ__Port`
- `RabbitMQ__UserName`
- `RabbitMQ__Password`

---

## Troubleshooting

### RabbitMQ Connection Issues
- Verify RabbitMQ is running: `http://localhost:15672`
- Check credentials in appsettings.json
- Ensure firewall allows port 5672

### Database Migration Errors
```bash
# Revert last migration
dotnet ef migrations remove

# Reapply migrations
dotnet ef database update
```

### Email Not Sending
- Verify SMTP credentials
- Check Gmail app password (2FA required)
- Review logs: `ApplicationDbContext` debug logging
- Test with `DLQ_MESSAGE_REQUEUE.cs`

### Frontend CORS Errors
- Verify backend CORS policy includes frontend URL
- Check request headers and methods
- Ensure credentials are included in requests

---

## Future Enhancements

- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Booking analytics dashboard
- [ ] User preferences and wishlists
- [ ] Dynamic pricing based on demand
- [ ] Integration with travel APIs (flights, hotels)
- [ ] Real-time booking availability updates
- [ ] Multi-language support

---

## Support & Contact

For issues, questions, or feature requests, contact:
- **Email:** support@suitesavvy.com
- **GitHub Issues:** [Project Repository]

---

**Last Updated:** November 2025
**Version:** 1.0.0
**Status:** Production Ready
