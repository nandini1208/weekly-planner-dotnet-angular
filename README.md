# 📋 Weekly Planner App - Premium Work Tracking

A sophisticated, full-stack work cycle management system designed for agile teams. This application enables teams to manage their backlog, plan weekly sprints with precise hour allocation, and track progress through a modern, responsive interface.

---

## ✨ Recent UI/UX Overhaul (Session Highlights)

The application has recently undergone a comprehensive transformation to match high-fidelity reference designs and improve functional stability:

### 📥 Intelligent Data Portability
- **Redesigned Load Modal**: Features a visible, inline file chooser with instant JSON header validation.
- **Strict Guardrails**: Rejects non-app backups immediately with clear inline error messaging.
- **Success Flow**: Automated post-import refresh with a 1-second success toast for a seamless experience.

### 📋 Full-Page Backlog Picker
- **Overhauled UX**: Replaced side drawers with a dedicated full-page selection interface.
- **Budget Tracking**: Real-time visibility of category budgets (Client Focused, Tech Debt, R&D) while picking tasks.
- **Smart Commit Modal**: Redesigned "How many hours" modal that shows detailed budget remaining in the specific category.

### 🌱 Exact Seed Data Replication
- **Database Reset**: One-click seeding now performs a full database purge before populating.
- **Team Replication**: Automatically seeds the 4 core members (Alice Chen as Lead, Bob Martinez, Carol Singh, Dave Kim) and 10 prioritized backlog items.

---

## 🚀 Core Features

### 👥 Team Management
- **Role-Based Access**: Specialized views for Team Leads vs. Team Members.
- **Lead Designation**: Simple "Make Lead" functionality and automatic lead assignment for the first member.
- **Switch User**: Instant user switching for testing and role verification.

### 📅 Weekly Planning Cycles
- **Smart Setup**: Auto-calculates the next Tuesday planning date and pre-selects all team members.
- **Category Splitting**: Define specific % goals for Client, Tech Debt, and R&D hours.
- **Review & Freeze**: Lead can lock the plan once all members have committed their hours.

### 📝 Work Planning & Tracking
- **Interactive Backlog**: Searchable, filtered list of tasks with priority indicators.
- **Hour Commitment**: Members can precisely allocate hours to backlog items.
- **Progress Reporting**: Real-time status updates and completion tracking.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Angular 21 (Standalone Components), Vanilla CSS, RxJS |
| **Backend** | .NET 8 Web API, C# |
| **Database** | Entity Framework Core (SQL Server / Azure SQL) |
| **Testing** | xUnit (Backend), Vitest (Frontend) |
| **CI/CD** | GitHub Actions |
| **Cloud** | Azure App Service (Full Automated Pipeline) |

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **.NET SDK**: v8.0 or higher
- **SQL Server**: LocalDB or Azure SQL

### 🔧 Local Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/nandini1208/weekly-planner-dotnet-angular.git
   cd weekly-planner-dotnet-angular
   ```

2. **Run the API (Backend)**
   ```bash
   cd WeeklyPlanner.API
   # Update appsettings.Development.json connection string
   dotnet run
   # API available at http://localhost:5119
   ```

3. **Run the UI (Frontend)**
   ```bash
   cd WeeklyPlanner.UI
   npm install
   npm start
   # UI available at http://localhost:4200
   ```

---

## 🧪 Testing & Verification

The project includes a robust suite of **44+ tests** ensuring the reliability of core logic:
- **Export/Import Logic**: Verified remapping of foreign keys and ID stripping for SQL compatibility.
- **Controller Logic**: Full coverage for `ProgressController`, `BacklogController`, and `MemberController`.

To run backend tests:
```bash
cd WeeklyPlanner.Tests
dotnet test
```

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
