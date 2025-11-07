---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary
SuiteSavvy is a comprehensive travel booking system built with a modern full-stack architecture. It allows users to browse and book travel packages, create custom itineraries, request trip cancellations, and receive automated email notifications. The system features a reactive email notification system using RabbitMQ for asynchronous processing.

## Repository Structure
- **Travelling/**: Main solution directory containing the application code
  - **app/**: Application components
    - **backend/**: .NET API backend
    - **frontend/**: React frontend application
  - **Travelling.sln**: Visual Studio solution file
  - **CleanQueues.cs, DLQ_MESSAGE_REQUEUE.cs, PRODUCER_REFERENCE.cs**: Utility scripts for queue management
- **clean_queues.py**: Python script for cleaning RabbitMQ queues
- **PROJECT_DOCUMENTATION.md**: Comprehensive project documentation
- **package.json**: Root package configuration (incomplete)

### Main Repository Components
- **Travel.Api Backend**: ASP.NET Core API handling business logic, database operations, and message queuing
- **Travel Booking Widget Frontend**: React application for user interface and booking management
- **Queue Management Utilities**: Scripts for maintaining RabbitMQ message queues

## Projects

### Travel.Api (Backend)
**Configuration File**: Travelling/app/backend/Travel.Api/Travel.Api/Travel.Api.csproj

#### Language & Runtime
**Language**: C#
**Version**: .NET 8.0
**Build System**: MSBuild
**Package Manager**: NuGet

#### Dependencies
**Main Dependencies**:
- Microsoft.EntityFrameworkCore (8.0.8)
- Microsoft.EntityFrameworkCore.Sqlite (8.0.8)
- Npgsql.EntityFrameworkCore.PostgreSQL (8.0.4)
- RabbitMQ.Client (6.5.0)
- MimeKit (4.14.0)
- MailKit (4.14.1)
- Swashbuckle.AspNetCore (6.6.2)
- Serilog.AspNetCore (8.0.1)
- Microsoft.AspNetCore.Authentication.JwtBearer (8.0.8)
- BCrypt.Net-Next (4.0.3)
- System.IdentityModel.Tokens.Jwt (8.0.1)
- Microsoft.AspNetCore.Mvc.NewtonsoftJson (8.0.8)
**Development Dependencies**:
- Microsoft.EntityFrameworkCore.Design (8.0.8)
- Microsoft.EntityFrameworkCore.Tools (8.0.8)

#### Build & Installation
```bash
cd Travelling/app/backend/Travel.Api/Travel.Api
dotnet restore
dotnet build
```

#### Docker
**Dockerfile**: Travelling/app/backend/Travel.Api/Travel.Api/Dockerfile
**Image**: .NET 9.0 ASP.NET runtime
**Configuration**: Multi-stage build with .NET 9.0 SDK for compilation

#### Testing
**Framework**: xUnit (inferred from Travel.Api.Tests project)
**Test Location**: Travelling/app/backend/Travel.Api.Tests/
**Configuration**: Entity Framework migrations for test database
**Run Command**:
```bash
dotnet test
```

### Travel Booking Widget (Frontend)
**Configuration File**: Travelling/app/frontend/frontend/package.json

#### Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: Node.js 18+
**Build System**: Vite
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- react (18.3.1)
- react-dom (18.3.1)
- axios (1.7.7)
- framer-motion (11.18.2)
- leaflet (1.9.4)
- react-leaflet (4.3.3)
- lucide-react (0.544.0)
- react-hot-toast (2.6.0)
**Development Dependencies**:
- @types/react (18.3.4)
- @types/react-dom (18.3.0)
- @vitejs/plugin-react (4.3.1)
- vite (7.1.12)
- tailwindcss (3.4.18)
- postcss (8.5.6)
- autoprefixer (10.4.21)
- prettier (3.3.3)

#### Build & Installation
```bash
cd Travelling/app/frontend/frontend
npm install
npm run build
```

#### Docker
**Dockerfile**: Not present
**Image**: N/A
**Configuration**: Deployable to Netlify or Vercel

#### Testing
**Framework**: Not specified
**Test Location**: Not found
**Configuration**: No test configuration files identified
**Run Command**: Not available