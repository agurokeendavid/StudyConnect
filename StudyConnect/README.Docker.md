# StudyConnect Docker Setup

This document provides instructions for running StudyConnect using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed on your machine
- Docker Compose (included with Docker Desktop)

## Configuration

The setup includes:
- **MySQL 8.0** database running on port **3006**
- **ASP.NET Core 9.0** application running on port **5000** (HTTP) and **5001** (HTTPS)
- **Root user** with **empty password** for MySQL

## Quick Start

### 1. Build and Run with Docker Compose

From the `StudyConnect` project directory, run:

```bash
docker-compose up --build
```

This command will:
- Build the StudyConnect application Docker image
- Pull the MySQL 8.0 image
- Create and start both containers
- Apply database migrations automatically
- Seed initial data

### 2. Access the Application

Once the containers are running, you can access:
- **Web Application**: http://localhost:5000
- **MySQL Database**: localhost:3006

### 3. Stop the Containers

To stop the running containers:

```bash
docker-compose down
```

To stop and remove volumes (this will delete the database data):

```bash
docker-compose down -v
```

## Docker Commands Reference

### Build the application image only
```bash
docker-compose build
```

### Run in detached mode (background)
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
```

### View specific service logs
```bash
docker-compose logs -f web
docker-compose logs -f mysql
```

### Restart services
```bash
docker-compose restart
```

### Stop services
```bash
docker-compose stop
```

### Start existing services
```bash
docker-compose start
```

### Remove containers and networks
```bash
docker-compose down
```

### Rebuild and restart
```bash
docker-compose up --build --force-recreate
```

## Database Management

### Connect to MySQL Container

```bash
docker exec -it studyconnect-mysql mysql -u root
```

### Backup Database

```bash
docker exec studyconnect-mysql mysqldump -u root StudyConnectDb > backup.sql
```

### Restore Database

```bash
docker exec -i studyconnect-mysql mysql -u root StudyConnectDb < backup.sql
```

### View Database Logs

```bash
docker-compose logs mysql
```

## Troubleshooting

### Port Already in Use

If port 3006 or 5000 is already in use, you can modify the ports in `docker-compose.yml`:

```yaml
services:
  mysql:
    ports:
      - "3307:3306"  # Change 3006 to another port
  
  web:
    ports:
      - "5050:8080"  # Change 5000 to another port
```

### Database Connection Issues

1. Ensure MySQL container is healthy:
```bash
docker-compose ps
```

2. Check if migrations ran successfully:
```bash
docker-compose logs web | grep Migration
```

3. Manually connect to the database:
```bash
docker exec -it studyconnect-mysql mysql -u root -e "SHOW DATABASES;"
```

### Application Won't Start

1. Check application logs:
```bash
docker-compose logs web
```

2. Verify the connection string in the logs
3. Ensure MySQL is healthy before the app starts

### Rebuild After Code Changes

```bash
docker-compose down
docker-compose up --build
```

## Production Considerations

?? **Before deploying to production:**

1. **Set a MySQL root password** in `docker-compose.yml`:
```yaml
MYSQL_ROOT_PASSWORD: "YourSecurePassword"
```

2. **Update connection string** to include the password:
```yaml
ConnectionStrings__DefaultConnection: "Server=mysql;Port=3306;Database=StudyConnectDb;User Id=root;Password=YourSecurePassword;SslMode=None;"
```

3. **Change default admin credentials** in `appsettings.Development.json`

4. **Use environment-specific configuration files**

5. **Enable HTTPS** and configure certificates

6. **Use Docker secrets** for sensitive data

7. **Implement proper backup strategies**

## File Structure

```
StudyConnect/
??? Dockerfile              # Multi-stage Docker build
??? docker-compose.yml      # Container orchestration
??? .dockerignore          # Files to exclude from build
??? .env.example           # Environment variables template
??? README.Docker.md       # This file
```

## Environment Variables

You can customize the setup by creating a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Then modify the values as needed.

## Volume Persistence

The setup includes two persistent volumes:

1. **mysql_data**: Stores MySQL database files
2. **./wwwroot/uploads**: Stores uploaded files (study group resources)

These volumes persist even after containers are stopped.

## Network Configuration

All services run on a custom bridge network called `studyconnect-network`, allowing containers to communicate using service names (e.g., `mysql`, `web`).

## Health Checks

The MySQL service includes a health check to ensure it's ready before the web application starts. This prevents connection errors during startup.

## Support

For issues or questions, please refer to the main project documentation or create an issue in the repository.
