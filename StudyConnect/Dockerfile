# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["StudyConnect.csproj", "./"]
RUN dotnet restore "StudyConnect.csproj"

# Copy everything else and build
COPY . .
RUN dotnet build "StudyConnect.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "StudyConnect.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Create directory for uploads
RUN mkdir -p /app/wwwroot/uploads/study-groups

EXPOSE 8080
EXPOSE 8081

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "StudyConnect.dll"]
