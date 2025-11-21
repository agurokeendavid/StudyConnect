# StudyConnect

A comprehensive ASP.NET Core MVC web application designed to facilitate collaborative learning through study groups. StudyConnect enables students and learners to create, join, and manage study groups with real-time messaging, resource sharing, and meeting coordination capabilities.

## Features

### Core Functionality
- **Study Group Management**: Create, browse, and join study groups based on categories
- **Role-Based Access Control**: Admin, moderator, and member roles with different permissions
- **Real-Time Messaging**: Group chat and direct messaging using SignalR
- **Resource Sharing**: Upload and share study materials within groups
- **Meeting Coordination**: Schedule and manage study group meetings
- **Invitation System**: Generate time-limited invite links for private groups

### Additional Features
- **Subscription Management**: Multi-tier subscription plans for premium features
- **Announcements**: System-wide announcements for important updates
- **Audit Logging**: Track user activities and system events
- **Feedback System**: Collect and manage user feedback
- **Advertisement Management**: Display and manage ads
- **User Profile Management**: Comprehensive user profile customization

## Technology Stack

- **Framework**: .NET 9.0
- **Architecture**: ASP.NET Core MVC with Razor Pages
- **Database**: MySQL 8.0 (via Pomelo.EntityFrameworkCore.MySql)
- **ORM**: Entity Framework Core 9.0
- **Authentication**: ASP.NET Core Identity
- **Real-Time Communication**: SignalR
- **Frontend**: Razor Views with JavaScript

## Prerequisites

- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [MySQL 8.0+](https://dev.mysql.com/downloads/mysql/)
- A code editor (Visual Studio 2022, VS Code, or Rider)

## Getting Started

### Option 1: Using Visual Studio Code

#### Step 1: Clone the Repository

1. **Open VS Code**
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette
3. Type `Git: Clone` and select it
4. Paste the repository URL:
   ```
   https://github.com/agurokeendavid/StudyConnect.git
   ```
5. Choose a folder location on your computer
6. When prompted, click "Open" to open the cloned repository

**Or using the integrated terminal:**

1. Open VS Code
2. Press `` Ctrl+` `` (backtick) to open the integrated terminal
3. Navigate to your desired folder and run:
   ```bash
   git clone https://github.com/agurokeendavid/StudyConnect.git
   cd StudyConnect
   ```
4. Open the folder in VS Code: `File > Open Folder` and select the `StudyConnect` folder

#### Step 2: Install Required Extensions

Install the following VS Code extensions for the best development experience:
- **C# Dev Kit** (Microsoft) - For C# language support
- **C#** (Microsoft) - C# for Visual Studio Code
- **MySQL** (cweijan) - Optional, for database management within VS Code

To install:
1. Click the Extensions icon in the Activity Bar (or press `Ctrl+Shift+X`)
2. Search for each extension and click "Install"

#### Step 3: Configure Database Connection

1. In VS Code, navigate to `StudyConnect/appsettings.json`
2. Update or add the connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Port=3306;Database=studyconnect;User=root;Password=yourpassword;"
     },
     "Logging": {
       "LogLevel": {
         "Default": "Information",
         "Microsoft.AspNetCore": "Warning"
       }
     },
     "AllowedHosts": "*"
   }
   ```
3. Replace `yourpassword` with your MySQL root password
4. Save the file (`Ctrl+S`)

**Important:** For development, you can also create an `appsettings.Development.json` file to keep your local settings separate:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=studyconnect;User=root;Password=yourpassword;"
  }
}
```

#### Step 4: Restore NuGet Packages

Open the integrated terminal (`` Ctrl+` ``) and run:
```bash
cd StudyConnect
dotnet restore
```

#### Step 5: Install Entity Framework Core Tools (if not installed)

```bash
dotnet tool install --global dotnet-ef
```

Or update if already installed:
```bash
dotnet tool update --global dotnet-ef
```

#### Step 6: Update the Database

Run migrations to create the database schema:
```bash
dotnet ef database update
```

This will:
- Create the `studyconnect` database if it doesn't exist
- Apply all migrations
- Seed initial data (roles, admin user, categories, etc.)

#### Step 7: Build the Project

In the integrated terminal, run:
```bash
dotnet build
```

Verify there are no build errors. If successful, you should see:
```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

#### Step 8: Run the Application

Start the application:
```bash
dotnet run
```

Or use the watch mode for automatic reloading during development:
```bash
dotnet watch run
```

The application will start and display URLs in the terminal:
```
Now listening on: http://localhost:5000
Now listening on: https://localhost:5001
```

#### Step 9: Access the Application

1. Open your web browser
2. Navigate to `http://localhost:5000` or `https://localhost:5001`
3. The application should load successfully

#### Debugging in VS Code

1. Set breakpoints by clicking to the left of line numbers
2. Press `F5` or go to `Run > Start Debugging`
3. Select `.NET Core` or `.NET 5+` when prompted
4. The application will start in debug mode

### Option 2: Using Command Line

### 1. Clone the Repository

```bash
git clone https://github.com/agurokeendavid/StudyConnect.git
cd StudyConnect
```

### 2. Configure Database Connection

Create or update `StudyConnect/appsettings.json` with your MySQL connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=studyconnect;User=root;Password=yourpassword;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### 3. Restore, Build, and Update Database

```bash
cd StudyConnect
dotnet restore
dotnet build
dotnet ef database update
```

### 4. Run the Application

```bash
dotnet run
```

The application will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`

## Troubleshooting

### Common Issues

**Problem: `dotnet ef` command not found**
- Solution: Install EF Core tools globally:
  ```bash
  dotnet tool install --global dotnet-ef
  ```

**Problem: Database connection fails**
- Verify MySQL is running
- Check connection string credentials
- Ensure MySQL port is correct (default is 3306)
- Verify database user has necessary permissions

**Problem: Build errors**
- Run `dotnet clean` followed by `dotnet restore`
- Check that .NET 9.0 SDK is installed: `dotnet --version`

**Problem: Port already in use**
- Change the port in `Properties/launchSettings.json`
- Or kill the process using the port

**Problem: Cannot access HTTPS endpoint**
- Trust the development certificate:
  ```bash
  dotnet dev-certs https --trust
  ```
