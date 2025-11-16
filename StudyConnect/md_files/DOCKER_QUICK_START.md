# 🚀 StudyConnect Docker Quick Start Guide

## ✅ Your Setup is Ready!

Your .NET 9 MVC project is **already containerized** with:
- ✅ **Docker** configuration complete
- ✅ **MySQL 8.0** database with **empty/null password**
- ✅ **Multi-stage Dockerfile** for optimized builds
- ✅ **Docker Compose** for easy orchestration
- ✅ **Automatic migrations** on startup
- ✅ **Data persistence** with volumes

---

## 📋 Prerequisites

1. **Docker Desktop** must be installed and running on your Windows PC
   - Download from: https://www.docker.com/products/docker-desktop

2. Verify Docker is running:
   ```powershell
   docker --version
   docker-compose --version
   ```

---

## 🎯 Quick Start (Windows PowerShell)

### Option 1: Use the Quick Start Script (Easiest)

Simply double-click `docker-start.bat` or run:

```powershell
.\docker-start.bat
```

### Option 2: Manual Commands

Navigate to the project directory and run:

```powershell
cd "e:\Users\agurokeendavid\Documents\Thesis\2025\studyconnect\StudyConnect\StudyConnect"
docker-compose up --build -d
```

---

## 🌐 Access Your Application

Once containers are running:

- **Web Application**: http://localhost:5000
- **MySQL Database**: localhost:3006
  - **Host**: localhost
  - **Port**: 3006
  - **Database**: StudyConnectDb
  - **User**: root
  - **Password**: (empty/null)

---

## 📊 Useful Commands

### View Running Containers
```powershell
docker-compose ps
```

### View Application Logs
```powershell
# All logs
docker-compose logs -f

# Web app only
docker-compose logs -f web

# MySQL only
docker-compose logs -f mysql
```

### Stop Containers
```powershell
docker-compose down
```

### Stop and Remove All Data (Fresh Start)
```powershell
docker-compose down -v
```

### Restart After Code Changes
```powershell
docker-compose down
docker-compose up --build -d
```

---

## 🗄️ Database Connection Details

### Inside Docker Container (for connection string):
- **Server**: mysql
- **Port**: 3306
- **Database**: StudyConnectDb
- **User**: root
- **Password**: (empty)
- **Connection String**: `Server=mysql;Port=3306;Database=StudyConnectDb;User Id=root;Password=;SslMode=None;`

### From Your Local Machine (MySQL Workbench, etc.):
- **Host**: localhost
- **Port**: 3006
- **Database**: StudyConnectDb
- **User**: root
- **Password**: (empty)

---

## 🔧 Troubleshooting

### Problem: "Port already in use"
**Solution**: Stop any services using ports 5000, 5001, or 3006, or change ports in `docker-compose.yml`

### Problem: "Docker is not running"
**Solution**: Start Docker Desktop from Windows Start Menu

### Problem: "Cannot connect to database"
**Solution**: 
```powershell
# Check if MySQL is healthy
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Restart containers
docker-compose restart
```

### Problem: Database not initialized
**Solution**: 
```powershell
# Remove volumes and restart fresh
docker-compose down -v
docker-compose up --build -d
```

---

## 🎓 Default Login Credentials

After first run, use these credentials (configured in `appsettings.Development.json`):

**Admin Account:**
- Email: admin@schoolapp.local
- Password: Admin#12345

**Registrar Account:**
- Email: registrar@schoolapp.local
- Password: Registrar#12345

---

## 📦 What Happens on Startup?

1. Docker builds your .NET 9 MVC application
2. MySQL container starts with empty password
3. Database "StudyConnectDb" is automatically created
4. Entity Framework migrations run automatically
5. Seed data is populated (admin users, etc.)
6. Application is accessible at http://localhost:5000

---

## 🔐 Production Note

⚠️ **Important**: The current setup uses an **empty MySQL password** for local development. 

For production deployment:
1. Set a strong MySQL password in `docker-compose.yml`
2. Update connection strings accordingly
3. Use environment variables for sensitive data
4. Enable HTTPS with proper certificates

---

## 📁 Project Structure

```
StudyConnect/
├── Dockerfile                    # Multi-stage build configuration
├── docker-compose.yml           # Container orchestration
├── .dockerignore                # Files excluded from Docker build
├── docker-start.bat             # Windows quick start script
├── docker-start.sh              # Linux/Mac quick start script
├── README.Docker.md             # Detailed documentation
└── DOCKER_QUICK_START.md        # This file
```

---

## ✨ Next Steps

1. Start Docker Desktop
2. Run `docker-start.bat` or `docker-compose up --build -d`
3. Wait ~30 seconds for everything to initialize
4. Open http://localhost:5000 in your browser
5. Login with admin credentials
6. Start developing! 🎉

---

## 📞 Need Help?

Check the detailed documentation in `README.Docker.md` or review container logs with:
```powershell
docker-compose logs -f
```

**Happy Coding! 🚀**
