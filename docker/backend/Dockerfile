FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dev
WORKDIR /app
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
ENV PATH="$PATH:/root/.dotnet/tools"
EXPOSE 8080
CMD ["dotnet", "run", "--project", "src/LifeOs.Api/LifeOs.Api.csproj", "--urls", "http://0.0.0.0:8080"]

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/LifeOs.sln ./
COPY backend/src/LifeOs.Domain/LifeOs.Domain.csproj src/LifeOs.Domain/
COPY backend/src/LifeOs.Application/LifeOs.Application.csproj src/LifeOs.Application/
COPY backend/src/LifeOs.Infrastructure/LifeOs.Infrastructure.csproj src/LifeOs.Infrastructure/
COPY backend/src/LifeOs.Api/LifeOs.Api.csproj src/LifeOs.Api/
COPY backend/tests/LifeOs.Tests/LifeOs.Tests.csproj tests/LifeOs.Tests/
RUN dotnet restore LifeOs.sln

COPY backend/ ./
RUN dotnet publish src/LifeOs.Api/LifeOs.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS production
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "LifeOs.Api.dll"]
