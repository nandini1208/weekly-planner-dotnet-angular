**WeeklyPlannerApp**
```bash
A professional full-stack application designed for agile teams to manage backlogs, plan weekly tasks, and track real-time progress. Built with a modern Angular frontend and a robust .NET 8 backend.
```

**Live Demo**

Experience the application live on Azure:
- Live Deployment: [https://weeklyplanner-ui-7d2a1b5e.azurewebsites.net](https://weeklyplanner-ui-7d2a1b5e.azurewebsites.net)

Note: The application allows you to manage teams, setup plans, and track weekly progress in a streamlined interface.

**Key Features**
```bash
Team Management: Add/remove members, assign roles (Team Lead), and manage your roster.
Backlog Management: Centralized repository for all tasks, ready to be pulled into weekly plans.
Weekly Planning: Structured 2-step process (Setup -> Review & Freeze) to commit to weekly goals.
Progress Tracking:
Member View: Individual progress updates on assigned tasks.
Team Dashboard: High-level overview of total completion percentages and status.
Data Portability: Full Export/Import functionality for JSON-based data persistence.
Reset & Seed: Quickly clear data or populate the app with demo content for testing.
Responsive UI: Modern design with interactive elements and real-time state updates using RxJS.
Screenshots
(Placeholders - Add your screenshots here)
```

**Tech Stack**
```bash
Frontend: 

Framework: Angular (v21)
State Management: Reactive RxJS (BehaviorSubjects)
Styling: Vanilla CSS / Responsive Layouts
HTTP Client: Angular HttpClient

Backend : 

Framework: ASP.NET Core Web API (.NET 8.0)
ORM: Entity Framework Core
API Documentation: Swagger / OpenAPI
Architecture: Service-Oriented (Controller -> Service -> Data Context)
Infrastructure
Database: SQL Server
Hosting: Microsoft Azure (Web Apps)
CI/CD: GitHub Actions
Testing: xUnit / .NET Tests, Jasmine/Karma for UI
```

**System Architecture**
```bash
Angular SPA: Acts as the client layer, managing UI state and interacting with the REST API.
ASP.NET Core API: Handles business logic, task assignments, and progress calculations.
EF Core & SQL Server: Provides persistent storage for teams, backlog items, plans, and progress logs.
Data Flow:
UI -> API: User actions (e.g., adding a task) trigger HTTP calls.
API -> UI: Real-time state updates via BehaviorSubjects ensure the UI stay in sync without refreshing.
```

**Project Folder Structure**
```bash
WeeklyPlannerApp/
├── .github/workflows/          # CI/CD pipeline (Build & Deploy to Azure)
├── WeeklyPlanner.API/          # Backend - ASP.NET Core Web API
│   ├── Controllers/            # API Endpoints (Team, Plan, Backlog, etc.)
│   ├── Data/                   # EF Core AppDbContext
│   ├── Migrations/             # Database Schema History
│   ├── Models/                 # Domain Entities (WeeklyPlan, TeamMember)
│   ├── Services/               # Business Logic Implementation
│   └── Program.cs              # API Bootstrapping & DI Container
├── WeeklyPlanner.UI/           # Frontend - Angular Application
│   ├── src/app/
│   │   ├── components/         # Modular UI Components
│   │   ├── services/           # ApiService (State & HTTP Calls)
│   │   └── models/             # TypeScript Interfaces
│   └── angular.json            # Build configuration
└── WeeklyPlanner.Tests/        # xUnit Test Suite for API Logic
```

**Installation & Setup**
```bash
Prerequisites
.NET 8 SDK
Node.js (v20+)
SQL Server
1. Backend Setup
bash
cd WeeklyPlanner.API
dotnet restore
# Update connection string in appsettings.json if needed
dotnet ef database update
dotnet run
2. Frontend Setup
bash
cd WeeklyPlanner.UI
npm install
npm start
```

**Environment Variables**
```bash
Backend (appsettings.json)
ConnectionStrings:DefaultConnection: SQL Server connection string.
AllowedOrigins: List of permitted CORS origins (e.g., http://localhost:4200).

Frontend
The baseUrl is dynamically assigned in api.service.ts based on the environment (localhost vs. Azure production URL).
```

**API Endpoints Overview**
```bash
Category	Endpoint	Method	Description
Team	/api/Team	GET/POST	Manage team members
/api/Team/{id}	PUT/DELETE	Update or remove members
Backlog	/api/Backlog	GET/POST	Manage task backlog
Plan	/api/Plan	POST	Create a new weekly plan
/api/Plan/{id}/freeze	POST	Lock plan for the week
Progress	/api/Progress/update	POST	Log task completion
System	/api/Seed	POST	Populate demo data
```

**Testing**
```
Backend Tests
Run the xUnit tests to verify business logic:

bash
dotnet test
Frontend Tests
Run unit tests with Karma/Jasmine:

bash
cd WeeklyPlanner.UI
npm test
```

**CI/CD & Deployment**
```bash
The project uses GitHub Actions (main.yml) for automated pipeline:

Build Phase: Compiles the .NET API and Angular UI.
Test Phase: Executes unit tests for both projects.
Publish Phase: Generates build artifacts.
Deploy Phase: Automatically pushes to Azure Web Apps when changes are merged into main.
```



