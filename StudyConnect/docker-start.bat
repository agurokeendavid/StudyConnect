@echo off
REM StudyConnect Docker Quick Start Script for Windows

echo =========================================
echo   StudyConnect Docker Setup
echo =========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker is running
echo.

REM Navigate to the script directory
cd /d "%~dp0"

echo Building and starting containers...
echo.

REM Build and start containers
docker-compose up --build -d

REM Wait for containers to be healthy
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if containers are running
docker-compose ps | findstr /C:"Up" >nul
if %errorlevel% equ 0 (
    echo.
    echo =========================================
    echo   StudyConnect is now running!
    echo =========================================
    echo.
    echo Web Application: http://localhost:5000
    echo MySQL Database: localhost:3006
    echo.
    echo View logs:
    echo    docker-compose logs -f
    echo.
    echo Stop containers:
    echo    docker-compose down
    echo.
    echo =========================================
) else (
    echo.
    echo Error: Containers failed to start. Check logs with:
    echo    docker-compose logs
)

echo.
pause
