# 🚀 Docker Commands Cheat Sheet - StudyConnect

## Quick Commands (Copy & Paste)

### 🏁 Start Everything
```powershell
cd "e:\Users\agurokeendavid\Documents\Thesis\2025\studyconnect\StudyConnect\StudyConnect"
docker-compose up --build -d
```

### 🛑 Stop Everything
```powershell
docker-compose down
```

### 🔄 Restart Everything
```powershell
docker-compose restart
```

### 📊 View Status
```powershell
docker-compose ps
```

### 📝 View All Logs
```powershell
docker-compose logs -f
```

### 🌐 View Web App Logs Only
```powershell
docker-compose logs -f web
```

### 🗄️ View Database Logs Only
```powershell
docker-compose logs -f mysql
```

### 🧹 Clean Start (Delete All Data)
```powershell
docker-compose down -v
docker-compose up --build -d
```

### 🔨 Rebuild After Code Changes
```powershell
docker-compose down
docker-compose up --build -d
```

### 📦 MySQL Shell Access
```powershell
docker exec -it studyconnect-mysql mysql -u root
```

### 💾 Backup Database
```powershell
docker exec studyconnect-mysql mysqldump -u root StudyConnectDb > backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').sql
```

### 📥 Restore Database
```powershell
Get-Content backup.sql | docker exec -i studyconnect-mysql mysql -u root StudyConnectDb
```

### 🔍 Check Docker Version
```powershell
docker --version
docker-compose --version
```

### 🧪 Test MySQL Connection
```powershell
docker exec -it studyconnect-mysql mysql -u root -e "SHOW DATABASES;"
```

### 🌐 Open App in Browser
```powershell
Start-Process http://localhost:5000
```

### 🗑️ Remove All Containers & Images (Nuclear Option)
```powershell
docker-compose down -v --rmi all
```

### 📈 View Resource Usage
```powershell
docker stats
```

### 🔧 Shell Access to Web Container
```powershell
docker exec -it studyconnect-web /bin/bash
```

---

## 📍 Quick Access URLs

- **Web Application**: http://localhost:5000
- **MySQL Connection**: localhost:3006

---

## 🎯 Default Login

- **Email**: admin@schoolapp.local
- **Password**: Admin#12345

---

## 🆘 Emergency Commands

### Force Stop All
```powershell
docker-compose kill
docker-compose down
```

### Remove Orphaned Containers
```powershell
docker-compose down --remove-orphans
```

### View All Docker Images
```powershell
docker images
```

### Remove Unused Images
```powershell
docker image prune -a
```

### Remove Unused Volumes
```powershell
docker volume prune
```

---

**Keep this file handy for quick reference! 📌**
