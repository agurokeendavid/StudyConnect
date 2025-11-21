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

### 1. Clone the Repository

```bash
git clone https://github.com/agurokeendavid/StudyConnect.git
cd StudyConnect
```

### 2. Configure Database Connection

Create or update `appsettings.json` with your MySQL connection string:

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

### 3. Apply Database Migrations

The application automatically runs migrations on startup. Alternatively, you can run them manually:

```bash
cd StudyConnect
dotnet ef database update
```

### 4. Run the Application

```bash
dotnet run
```

The application will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`

## Project Structure

```
StudyConnect/
??? Controllers/          # MVC Controllers
??? Models/              # Domain models and entities
??? ViewModels/          # View-specific models
??? Views/               # Razor views (if present)
??? Data/                # Database context and seed data
??? Repositories/        # Data access layer
??? Services/            # Business logic services
??? Hubs/                # SignalR hubs for real-time features
??? Middleware/          # Custom middleware components
??? Filters/             # Action filters
??? Requests/            # Request DTOs
??? Helpers/             # Utility classes
??? Constants/           # Application constants
??? Migrations/          # EF Core migrations
??? wwwroot/             # Static files and uploads
```

## Key Components

### Models
- **ApplicationUser**: Extended Identity user with custom properties
- **StudyGroup**: Main study group entity with privacy settings
- **StudyGroupMember**: Member relationships with role management
- **StudyGroupResource**: File attachments and resources
- **StudyGroupMeeting**: Meeting scheduling and management
- **Subscription**: Subscription plans and features
- **AuditLog**: System activity tracking

### Controllers
- **AuthController**: User authentication and registration
- **StudyGroupsController**: Study group CRUD operations
- **MessagesController**: Group messaging
- **MeetingsController**: Meeting management
- **SubscriptionsController**: Subscription handling
- **DashboardController**: User dashboard
- **ReportsController**: Administrative reporting

### Services
- **IAuditService**: Audit logging functionality
- **ISubscriptionService**: Subscription management

### Hubs
- **StudyGroupHub**: Real-time group messaging
- **DirectMessageHub**: Private messaging between users

## Database Schema

The application uses the following main tables:
- `AspNetUsers` - User accounts (Identity)
- `StudyGroups` - Study groups
- `StudyGroupMembers` - Group memberships
- `StudyGroupResources` - Shared resources
- `StudyGroupMessages` - Group messages
- `StudyGroupMeetings` - Scheduled meetings
- `Subscriptions` - Available plans
- `UserSubscriptions` - User subscription status
- `AuditLogs` - Activity logs
- `Feedbacks` - User feedback
- `Announcements` - System announcements
- `DirectMessages` - Private messages

## Configuration

### Identity Settings
Default password requirements:
- Minimum length: 8 characters
- Non-alphanumeric characters: Not required
- Unique email: Required

### Authentication Paths
- Login: `/Auth`
- Access Denied: `/Error`

## Development

### Running Migrations

Create a new migration:
```bash
dotnet ef migrations add MigrationName
```

Update database:
```bash
dotnet ef database update
```

Revert migration:
```bash
dotnet ef database update PreviousMigrationName
```

### Seeding Data

The application automatically seeds initial data on startup through the `SeedData` class, including:
- Default roles (Admin, User, etc.)
- Initial admin user
- Default study group categories
- Subscription plans

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is part of a thesis work. Please contact the repository owner for licensing information.

## Author

**David Agurokeenda**
- GitHub: [@agurokeendavid](https://github.com/agurokeendavid)

## Support

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/agurokeendavid/StudyConnect/issues).

---

**Note**: This application is designed for educational purposes as part of a thesis project. Ensure proper security measures are in place before deploying to production.
