# Weekly Planner App

A modern, full-stack application for managing team work cycles, backlog items, and weekly planning.

## 🚀 Features

-   **Team Management**: Add members, appoint team leads, and manage active/inactive status.
-   **Backlog Management**: Track work items and prioritize tasks for future weeks.
-   **Weekly Planning**: Create weekly cycles, commit hours, and freeze plans for execution.
-   **Real-time Feedback**: Toast notifications for user actions and state updates.
-   **UI Themes**: Support for Light and Dark modes.

## 🛠 Tech Stack

-   **Frontend**: Angular 21, Vanilla CSS, RxJS.
-   **Backend**: .NET 8 Web API, Entity Framework Core.
-   **Database**: Azure SQL / LocalDB.
-   **CI/CD**: GitHub Actions.
-   **Hosting**: Azure App Service (Linux).

## 💻 Local Development

### Prerequisites
-   Node.js (v20+)
-   .NET 8 SDK
-   SQL Server (LocalDB or similar)

### Running the API
1.  Navigate to `WeeklyPlanner.API`.
2.  Update `appsettings.Development.json` with your local connection string.
3.  Run `dotnet run`.
4.  The API will be available at `http://localhost:5119`.

### Running the UI
1.  Navigate to `WeeklyPlanner.UI`.
2.  Run `npm install`.
3.  Run `npm start`.
4.  The UI will be available at `http://localhost:4200`.

## 🌐 Deployment (CI/CD)

The project is configured for automatic deployment via **GitHub Actions**.

### Workflow
Every push to the `main` branch triggers:
1.  **.NET Build & Test**: Builds the API and runs unit tests.
2.  **Angular Build**: Compiles the UI for production.
3.  **Azure Deploy**: Deploys the artifacts to:
    -   **API**: `weeklyplanner-api-3b6d2a4c.azurewebsites.net`
    -   **UI**: `weeklyplanner-ui-7d2a1b5e.azurewebsites.net`

### Required GitHub Secrets
-   `AZURE_CREDENTIALS`: Service Principal JSON for Azure login.
-   `AZURE_SQL_CONNECTION_STRING`: Connection string for the production database.

## 📄 License
MIT
