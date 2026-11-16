# LIFEOS - Fase 1 (Fundação) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a fundação completa do LIFEOS (Docker Compose, Backend .NET 8 com EF Core + PostgreSQL + Identity/JWT + Hangfire + SignalR + xUnit e Frontend Angular 19 com Tailwind CSS + Lucide + Design System fiel à `img3.jpg` na Opção A).

**Architecture:** Arquitetura Full Stack separada e containerizada. O backend C# (.NET 8) segue divisão em 4 projetos (`LifeOs.Domain`, `LifeOs.Application`, `LifeOs.Infrastructure`, `LifeOs.Api`) com *Global Query Filters* no EF Core para isolamento multiusuário, provisionamento automático das 5 áreas padrão no registro e SignalR para tempo real. O frontend Angular 19 utiliza Standalone Components, Signals, Tailwind CSS e implementa o layout Bento Grid de 3 colunas com Topbar flutuante (`img3.jpg`).

**Tech Stack:** Angular 19, TypeScript, Tailwind CSS, Lucide Icons, SignalR Client, C# 12, ASP.NET Core 8, Entity Framework Core 8 (`Npgsql`), ASP.NET Core Identity + JWT Bearer, Hangfire (`Hangfire.PostgreSql`), xUnit, FluentAssertions, PostgreSQL 16, Docker & Docker Compose.

**Spec:** `/home/gabriel/dev/lifeos/docs/superpowers/specs/2026-11-05-lifeos-phase1-foundation-design.md`

## Global Constraints

- Código e identificadores estritamente em **inglês**; comentários, mensagens de commit e textos de interface/documentação em **português (pt-BR)**.
- Usar sempre hífen simples `-`. Nunca usar travessão nem meia-risca.
- Commitar apenas quando explicitamente pedido pelo usuário, sempre com autor `Gabriel Miranda <isporck0@gmail.com>` e sem linhas de co-autoria de IA.
- Como o `.NET 8 SDK` não está instalado diretamente no host WSL, todos os comandos `dotnet` (build, ef, test) devem ser executados via container Docker (`docker compose run --rm backend ...` ou `docker compose exec backend ...`).
- Nenhuma funcionalidade principal deve usar mocks estáticos: o Dashboard e as Áreas já na Fase 1 consultam o PostgreSQL via API REST.

---

### Task 1: Infraestrutura Docker Compose e Scaffolding da Solution .NET 8

**Files:**
- Create: `/home/gabriel/dev/lifeos/.gitignore`
- Create: `/home/gabriel/dev/lifeos/.env.example`
- Create: `/home/gabriel/dev/lifeos/.env`
- Create: `/home/gabriel/dev/lifeos/docker-compose.yml`
- Create: `/home/gabriel/dev/lifeos/docker/backend/Dockerfile`
- Create: `/home/gabriel/dev/lifeos/docker/frontend/Dockerfile`
- Create: `/home/gabriel/dev/lifeos/backend/LifeOs.sln`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/LifeOs.Domain.csproj`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Application/LifeOs.Application.csproj`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Infrastructure/LifeOs.Infrastructure.csproj`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/LifeOs.Api.csproj`
- Create: `/home/gabriel/dev/lifeos/backend/tests/LifeOs.Tests/LifeOs.Tests.csproj`

**Interfaces:**
- Consumes: Docker Engine e Docker Compose no host.
- Produces: Solution `LifeOs.sln` compilável no container `.NET 8 SDK` e banco `postgres:16-alpine` acessível na rede Docker.

- [ ] **Step 1: Criar `.gitignore`, `.env.example`, `.env` e `docker-compose.yml`**

Criar `/home/gabriel/dev/lifeos/.gitignore`:
```gitignore
node_modules/
dist/
.angular/
bin/
obj/
.env
.superpowers/
*.user
*.suo
coverage/
```

Criar `/home/gabriel/dev/lifeos/.env.example` e copiar para `/home/gabriel/dev/lifeos/.env`:
```dotenv
POSTGRES_DB=lifeos_db
POSTGRES_USER=lifeos_user
POSTGRES_PASSWORD=lifeos_secret_pwd_2026
POSTGRES_PORT=5433
JWT_SECRET=LifeOsSuperSecretJwtSigningKey2026WithAtLeast32Bytes!
JWT_ISSUER=LifeOs.Api
JWT_AUDIENCE=LifeOs.Client
BACKEND_PORT=5080
FRONTEND_PORT=4200
```

Criar `/home/gabriel/dev/lifeos/docker/backend/Dockerfile`:
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dev
WORKDIR /app
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
EXPOSE 8080
CMD ["dotnet", "watch", "--project", "src/LifeOs.Api/LifeOs.Api.csproj", "run", "--urls", "http://0.0.0.0:8080"]
```

Criar `/home/gabriel/dev/lifeos/docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: lifeos-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-lifeos_db}
      POSTGRES_USER: ${POSTGRES_USER:-lifeos_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-lifeos_secret_pwd_2026}
    ports:
      - "${POSTGRES_PORT:-5433}:5432"
    volumes:
      - lifeos_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-lifeos_user} -d ${POSTGRES_DB:-lifeos_db}"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
    container_name: lifeos-backend
    restart: unless-stopped
    working_dir: /app
    volumes:
      - ./backend:/app
      - lifeos_nuget:/root/.nuget/packages
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: "Host=postgres;Port=5432;Database=${POSTGRES_DB:-lifeos_db};Username=${POSTGRES_USER:-lifeos_user};Password=${POSTGRES_PASSWORD:-lifeos_secret_pwd_2026}"
      Jwt__Secret: ${JWT_SECRET:-LifeOsSuperSecretJwtSigningKey2026WithAtLeast32Bytes!}
      Jwt__Issuer: ${JWT_ISSUER:-LifeOs.Api}
      Jwt__Audience: ${JWT_AUDIENCE:-LifeOs.Client}
    ports:
      - "${BACKEND_PORT:-5080}:8080"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  lifeos_pgdata:
  lifeos_nuget:
```

- [ ] **Step 2: Criar a estrutura da Solution `LifeOs.sln` e projetos `.csproj`**

Executar via container `mcr.microsoft.com/dotnet/sdk:8.0` a criação de `LifeOs.Domain`, `LifeOs.Application`, `LifeOs.Infrastructure`, `LifeOs.Api` e `LifeOs.Tests`, referenciando os pacotes NuGet:
- `LifeOs.Domain`: `Microsoft.Extensions.Identity.Stores` (`8.0.*`)
- `LifeOs.Application`: `FluentValidation.DependencyInjectionExtensions` (`11.*`), `Microsoft.EntityFrameworkCore` (`8.0.*`)
- `LifeOs.Infrastructure`: `Npgsql.EntityFrameworkCore.PostgreSQL` (`8.0.*`), `Microsoft.AspNetCore.Identity.EntityFrameworkCore` (`8.0.*`), `Microsoft.AspNetCore.Authentication.JwtBearer` (`8.0.*`), `Hangfire.AspNetCore` (`1.8.*`), `Hangfire.PostgreSql` (`1.20.*`)
- `LifeOs.Api`: `Microsoft.EntityFrameworkCore.Design` (`8.0.*`), `Swashbuckle.AspNetCore` (`6.*`)
- `LifeOs.Tests`: `xunit`, `FluentAssertions`, `Microsoft.AspNetCore.Mvc.Testing` (`8.0.*`), `Microsoft.EntityFrameworkCore.InMemory` (`8.0.*`)

- [ ] **Step 3: Compilar a Solution no container e validar `dotnet test` inicial**

Run: `docker compose run --rm backend dotnet test LifeOs.sln`
Expected: PASS com 0 falhas.

---

### Task 2: Modelagem das 15 Entidades de Domínio, Enums e `LifeOsDbContext`

**Files:**
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Common/BaseEntity.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Common/IUserOwnedEntity.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Enums/DomainEnums.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/ApplicationUser.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/Area.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/Project.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/Board.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/BoardColumn.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/RecurrenceRule.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/TaskItem.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/CalendarEvent.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/Label.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/TaskLabel.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/QuickNote.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/Habit.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/HabitCompletion.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/Reminder.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Domain/Entities/Notification.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Infrastructure/Persistence/LifeOsDbContext.cs`
- Test: `/home/gabriel/dev/lifeos/backend/tests/LifeOs.Tests/Unit/Persistence/MultiTenantIsolationTests.cs`

**Interfaces:**
- Consumes: `IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>`, `ICurrentUserService`.
- Produces: `LifeOsDbContext` com `DbSet` das 15 entidades, relacionamentos, índices, constraints e *Global Query Filter* por `UserId`.

- [ ] **Step 1: Escrever o teste falho de isolamento multiusuário (`MultiTenantIsolationTests.cs`)**

```csharp
using FluentAssertions;
using LifeOs.Application.Common.Interfaces;
using LifeOs.Domain.Entities;
using LifeOs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LifeOs.Tests.Unit.Persistence;

public class MultiTenantIsolationTests
{
    private sealed class FakeCurrentUserService(Guid? userId) : ICurrentUserService
    {
        public Guid? UserId => userId;
    }

    [Fact]
    public async Task QueryFilter_ShouldReturnOnlyCurrentUsersAreasAndTasks()
    {
        var userA = Guid.NewGuid();
        var userB = Guid.NewGuid();
        var dbName = Guid.NewGuid().ToString();

        var options = new DbContextOptionsBuilder<LifeOsDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        await using (var seedCtx = new LifeOsDbContext(options, new FakeCurrentUserService(null)))
        {
            seedCtx.Areas.AddRange(
                new Area { Id = Guid.NewGuid(), UserId = userA, Name = "Trabalho", Slug = "trabalho", Color = "#a9ccf0", Icon = "briefcase" },
                new Area { Id = Guid.NewGuid(), UserId = userB, Name = "Estudo", Slug = "estudo", Color = "#8bd3c7", Icon = "book-open" }
            );
            await seedCtx.SaveChangesAsync();
        }

        await using var userACtx = new LifeOsDbContext(options, new FakeCurrentUserService(userA));
        var visibleAreas = await userACtx.Areas.ToListAsync();

        visibleAreas.Should().HaveCount(1);
        visibleAreas[0].Name.Should().Be("Trabalho");
    }
}
```

- [ ] **Step 2: Rodar o teste para verificar que falha**

Run: `docker compose run --rm backend dotnet test --filter MultiTenantIsolationTests`
Expected: FAIL (classes `Area`, `ICurrentUserService` e `LifeOsDbContext` ainda não existem).

- [ ] **Step 3: Implementar as 15 entidades, Enums, `ICurrentUserService` e `LifeOsDbContext` + Migration inicial**

Implementar todas as 15 entidades no projeto `LifeOs.Domain`, `ICurrentUserService` em `LifeOs.Application` e `LifeOsDbContext` em `LifeOs.Infrastructure` com os *Global Query Filters* (`e.UserId == _currentUserService.UserId && e.DeletedAt == null`) e gerar a migration `InitialCreate` para PostgreSQL.

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `docker compose run --rm backend dotnet test --filter MultiTenantIsolationTests`
Expected: PASS (1 passed).

---

### Task 3: Autenticação (Identity + JWT), Provisionamento Automático de Áreas/Kanban e Endpoints de Dashboard/Áreas

**Files:**
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Application/Auth/DTOs/AuthDtos.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Application/Areas/DTOs/AreaDto.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Application/Dashboard/DTOs/DashboardSummaryDto.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Infrastructure/Identity/JwtTokenGenerator.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Infrastructure/Identity/CurrentUserService.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Infrastructure/Persistence/Seeders/UserOnboardingService.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Controllers/AuthController.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Controllers/AreasController.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Controllers/DashboardController.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Hubs/LifeOsHub.cs`
- Modify: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Program.cs`
- Test: `/home/gabriel/dev/lifeos/backend/tests/LifeOs.Tests/Integration/AuthAndOnboardingIntegrationTests.cs`

**Interfaces:**
- Consumes: `LifeOsDbContext`, `UserManager<ApplicationUser>`, `IJwtTokenGenerator`.
- Produces:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`
  - `PATCH /api/v1/auth/theme`
  - `GET /api/v1/areas`
  - `GET /api/v1/dashboard/summary`
  - `PATCH /api/v1/dashboard/tasks/{id}/toggle` (permite marcar/desmarcar tarefas reais já no Dashboard da Fase 1)
  - Hub SignalR `/hubs/lifeos`

- [ ] **Step 1: Escrever o teste de integração falho (`AuthAndOnboardingIntegrationTests.cs`)**

Testar usando `WebApplicationFactory<Program>`:
1. `POST /api/v1/auth/register` cria o usuário, retorna JWT e provisiona automaticamente as **5 áreas padrão** (`Trabalho`, `Estudo`, `Rotina`, `Doméstico`, `Social`), o quadro Kanban padrão com 4 colunas e tarefas/eventos iniciais da agenda do usuário para que o Dashboard já exiba dados reais vindos do banco.
2. `GET /api/v1/areas` com o token JWT retorna as 5 áreas com as cores da especificação (`#a9ccf0`, `#8bd3c7`, `#c3b1e1`, `#f3c68f`, `#f2a6c2`).
3. `GET /api/v1/dashboard/summary` retorna os indicadores reais calculados no banco.
4. `GET /api/v1/auth/me` sem token retorna `401 Unauthorized`.

- [ ] **Step 2: Rodar o teste para confirmar que falha**

Run: `docker compose run --rm backend dotnet test --filter AuthAndOnboardingIntegrationTests`
Expected: FAIL.

- [ ] **Step 3: Implementar `UserOnboardingService`, `JwtTokenGenerator`, Controllers (`Auth`, `Areas`, `Dashboard`), `LifeOsHub`, Hangfire e `Program.cs`**

Configurar `Program.cs` com:
- `AddDbContext<LifeOsDbContext>` (PostgreSQL em execução normal, InMemory nos testes de integração quando configurado),
- `AddIdentityCore<ApplicationUser>` + `AddJwtBearer`,
- `AddSignalR()`,
- `AddHangfire()` (quando PostgreSQL estiver ativo),
- CORS liberado para `http://localhost:4200`,
- Aplicação automática de migrations e seed de conta de demonstração (`demo@lifeos.dev` / `LifeOs@2026`) no startup para facilitar a inspeção imediata no navegador.

- [ ] **Step 4: Rodar toda a suíte xUnit e confirmar 100% de aprovação**

Run: `docker compose run --rm backend dotnet test`
Expected: PASS em todos os testes unitários e de integração.

---

### Task 4: Frontend Angular 19 + Tailwind CSS + Design System (`img3.jpg` Opção A) + Integração Real com Backend

**Files:**
- Create: `/home/gabriel/dev/lifeos/frontend/` (Projeto Angular 19 Standalone + Tailwind CSS + `lucide-angular` + `@microsoft/signalr`)
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/core/auth/auth.service.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/core/auth/auth.interceptor.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/core/auth/auth.guard.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/core/theme/theme.service.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/core/api/dashboard-api.service.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/layout/topbar.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/layout/app-shell.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/auth/login.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/auth/register.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/dashboard/dashboard-page.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/calendar/calendar-page.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/kanban/kanban-page.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/inbox/inbox-page.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/areas/areas-page.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/projects/projects-page.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/features/habits/habits-page.component.ts`
- Test: `/home/gabriel/dev/lifeos/frontend/src/app/core/theme/theme.service.spec.ts`
- Test: `/home/gabriel/dev/lifeos/frontend/src/app/core/auth/auth.service.spec.ts`

**Interfaces:**
- Consumes: Endpoints `/api/v1/auth/*`, `/api/v1/areas`, `/api/v1/dashboard/*` em `http://localhost:5080`.
- Produces: Aplicação Angular 19 servida em `http://localhost:4200` com o visual idêntico ao protótipo aprovado (`img3.jpg` - Opção A), login/registro funcionais e Dashboard conectado ao PostgreSQL.

- [ ] **Step 1: Inicializar projeto Angular 19, instalar dependências e escrever testes unitários de `ThemeService` e `AuthService`**

Criar os testes unitários verificando alternância de tema (`dark`/`light`) e fluxo de autenticação JWT.

- [ ] **Step 2: Implementar os serviços Core (`AuthService`, `ThemeService`, `DashboardApiService`, `authInterceptor`, `authGuard`)**

Implementar comunicação HTTP tipada com a API `.NET 8`, persistência do JWT no `localStorage` e auto-login opcional com a conta demo ou tela de Login/Cadastro estilizada no padrão `img3.jpg`.

- [ ] **Step 3: Implementar `TopbarComponent` (Opção A) e `DashboardPageComponent` fiel à `img3.jpg`**

Garantir que o `DashboardPageComponent` busque dados reais de `GET /api/v1/dashboard/summary` e `GET /api/v1/areas`, permita filtrar tarefas por pílula de área, permita alternar conclusão de tarefa (`PATCH /api/v1/dashboard/tasks/{id}/toggle`) atualizando o PostgreSQL em tempo real, e apresente a navegação para as demais rotas da Fase 2 a 6.

- [ ] **Step 4: Executar testes unitários do Frontend e build de verificação**

Run: `cd /home/gabriel/dev/lifeos/frontend && npm test -- --watch=false && npm run build`
Expected: Todos os testes passando e build de produção concluído sem erros.

- [ ] **Step 5: Subir ambiente completo via Docker Compose e validar integração ponta a ponta**

Run: `docker compose up -d` e validar respostas reais de `http://localhost:5080/api/v1/auth/login`, `http://localhost:5080/api/v1/dashboard/summary` e `http://localhost:4200`.
