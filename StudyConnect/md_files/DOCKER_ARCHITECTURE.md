# 🏗️ StudyConnect Docker Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          YOUR WINDOWS PC                                  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Docker Desktop                                │    │
│  │                                                                   │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │         studyconnect-network (Bridge)                   │    │    │
│  │  │                                                          │    │    │
│  │  │  ┌──────────────────────┐    ┌──────────────────────┐  │    │    │
│  │  │  │  studyconnect-mysql  │    │  studyconnect-web    │  │    │    │
│  │  │  │                      │    │                      │  │    │    │
│  │  │  │  MySQL 8.0          │◄───┤  ASP.NET Core 9.0    │  │    │    │
│  │  │  │                      │    │  MVC Application     │  │    │    │
│  │  │  │  Port: 3306         │    │                      │  │    │    │
│  │  │  │  (internal)          │    │  Port: 8080 (HTTP)   │  │    │    │
│  │  │  │                      │    │  Port: 8081 (HTTPS)  │  │    │    │
│  │  │  │  Database:           │    │                      │  │    │    │
│  │  │  │  StudyConnectDb      │    │  Auto Migrations ✓   │  │    │    │
│  │  │  │                      │    │  Auto Seeding ✓      │  │    │    │
│  │  │  │  User: root          │    │                      │  │    │    │
│  │  │  │  Password: (empty)   │    │                      │  │    │    │
│  │  │  │                      │    │                      │  │    │    │
│  │  │  └──────────┬───────────┘    └──────────┬───────────┘  │    │    │
│  │  │             │                           │              │    │    │
│  │  │             │  Port Mapping             │              │    │    │
│  │  │             │  3006 → 3306              │  5000 → 8080 │    │    │
│  │  │             │                           │  5001 → 8081 │    │    │
│  │  └─────────────┼───────────────────────────┼──────────────┘    │    │
│  │                │                           │                   │    │
│  └────────────────┼───────────────────────────┼───────────────────┘    │
│                   │                           │                        │
│  ┌────────────────▼───────────────────────────▼──────────────────┐     │
│  │               Windows Host (localhost)                        │     │
│  │                                                                │     │
│  │  • MySQL accessible at: localhost:3006                        │     │
│  │  • Web App accessible at: http://localhost:5000               │     │
│  │                                                                │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │     │
│  │  │   Browser    │  │MySQL Workbench│  │   VS Code    │        │     │
│  │  │ :5000        │  │   :3006       │  │              │        │     │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │     │
│  └────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Container Details

### MySQL Container (studyconnect-mysql)
```yaml
Image: mysql:8.0
Internal Port: 3306
External Port: 3006
Database: StudyConnectDb
User: root
Password: (empty)
Volume: mysql_data (persistent)
Health Check: mysqladmin ping every 10s
```

### Web Container (studyconnect-web)
```yaml
Image: Built from Dockerfile
Base: mcr.microsoft.com/dotnet/aspnet:9.0
Internal Ports: 8080 (HTTP), 8081 (HTTPS)
External Ports: 5000 (HTTP), 5001 (HTTPS)
Environment: Development
Volume: ./wwwroot/uploads (persistent)
Depends On: MySQL (waits for health check)
```

---

## 🔄 Startup Flow

```
1. User runs: docker-compose up --build -d
                     ↓
2. Docker Compose reads: docker-compose.yml
                     ↓
3. MySQL Container Starts
                     ↓
4. MySQL initializes database: StudyConnectDb
                     ↓
5. Health Check: mysqladmin ping (every 10s)
                     ↓
6. MySQL Status: Healthy ✓
                     ↓
7. Web Container Starts (waits for MySQL health)
                     ↓
8. Dockerfile builds .NET app (3 stages)
                     ↓
9. Application reads connection string
   Server=mysql;Port=3306;Database=StudyConnectDb;
   User Id=root;Password=;SslMode=None;
                     ↓
10. Entity Framework runs migrations
                     ↓
11. Seed data populated (admin users, etc.)
                     ↓
12. Application listening on port 8080
                     ↓
13. Ready! Access at http://localhost:5000
```

---

## 🗄️ Data Persistence

### MySQL Data Volume
```
Volume Name: mysql_data
Location: Docker managed volume
Purpose: Persists database files
Survives: Container restarts
Lost When: docker-compose down -v
```

### Uploads Volume
```
Volume Name: ./wwwroot/uploads (bind mount)
Location: Host filesystem
Purpose: Persists uploaded files
Survives: All operations
Lost When: Manual deletion
```

---

## 🌐 Network Configuration

```
Network Name: studyconnect-network
Driver: bridge
Containers Connected: 2 (mysql, web)

Container-to-Container Communication:
  web → mysql (using hostname "mysql")
  
Host-to-Container Communication:
  localhost:5000 → web:8080
  localhost:3006 → mysql:3306
```

---

## 🔌 Connection Strings

### From Web Container to MySQL
```
Server=mysql
Port=3306
Database=StudyConnectDb
User Id=root
Password=
SslMode=None
```

### From Windows Host to MySQL
```
Server=localhost
Port=3006
Database=StudyConnectDb
User Id=root
Password=
SslMode=None
```

---

## 📊 Resource Allocation

### Default Limits (can be customized)
```yaml
MySQL Container:
  - Memory: Docker Desktop settings
  - CPU: Shared with host
  - Disk: Volume size (grows as needed)

Web Container:
  - Memory: Docker Desktop settings
  - CPU: Shared with host
  - Disk: Image size + logs
```

---

## 🔒 Security Considerations

### Current Setup (Development)
- ✅ Containers isolated in bridge network
- ✅ Only specific ports exposed
- ⚠️ Empty MySQL password (dev only!)
- ⚠️ Default credentials in appsettings
- ⚠️ Detailed error logging enabled

### Production Recommendations
- 🔐 Set strong MySQL password
- 🔐 Use environment variables
- 🔐 Enable HTTPS with certificates
- 🔐 Disable detailed error logging
- 🔐 Use Docker secrets
- 🔐 Change default admin credentials
- 🔐 Use reverse proxy (nginx)
- 🔐 Implement rate limiting

---

## 📁 File Structure

```
StudyConnect/
├── Dockerfile                      ← Multi-stage build definition
├── docker-compose.yml              ← Container orchestration
├── .dockerignore                   ← Files excluded from build
├── docker-start.bat                ← Windows quick start
├── docker-start.sh                 ← Linux/Mac quick start
├── DOCKER_QUICK_START.md           ← Quick start guide
├── DOCKER_SETUP_SUMMARY.md         ← Setup summary
├── DOCKER_COMMANDS_CHEATSHEET.md   ← Command reference
├── DOCKER_ARCHITECTURE.md          ← This file
├── README.Docker.md                ← Detailed documentation
├── DOCKER_SETUP_COMPLETE.md        ← Setup completion notes
└── wwwroot/
    └── uploads/                    ← Mounted volume
```

---

## 🎯 Benefits of This Setup

✅ **Consistent Environment**: Same setup on all machines
✅ **Easy Setup**: One command to start everything
✅ **Isolated Services**: Containers don't interfere with host
✅ **Data Persistence**: Database survives container restarts
✅ **Health Checks**: Web waits for database to be ready
✅ **Auto Migrations**: Database schema updated automatically
✅ **Auto Seeding**: Test data populated on startup
✅ **Port Mapping**: Access services from host machine
✅ **Volume Mounting**: File uploads persist
✅ **Network Isolation**: Secure container communication

---

## 🔄 Development Workflow

```
1. Make code changes in VS Code
              ↓
2. Save files
              ↓
3. Rebuild and restart:
   docker-compose down
   docker-compose up --build -d
              ↓
4. Test at http://localhost:5000
              ↓
5. Check logs if needed:
   docker-compose logs -f
              ↓
6. Repeat as needed
```

---

**Understanding this architecture will help you troubleshoot and extend your setup! 🎓**
