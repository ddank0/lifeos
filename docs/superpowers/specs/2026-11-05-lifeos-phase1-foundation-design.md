# LIFEOS - Especificação Técnica e Design da Fase 1 (Fundação)

**Data:** 2026-11-05  
**Status:** Aprovado  
**Escopo:** Arquitetura Geral do LIFEOS e Especificação Detalhada da Fase 1 (Fundação)

---

## 1. Visão Geral e Princípios Arquiteturais

O **LIFEOS** é um sistema inteligente de organização pessoal (*Personal Life Management System*) que centraliza tarefas, compromissos, eventos, hábitos, projetos e capturas rápidas divididos por áreas da vida, preservando uma visão geral integrada.

### Diretrizes Globais
- **Idioma:** Todo o código-fonte, nomes de classes, tabelas, propriedades, rotas de API e variáveis devem ser escritos em **inglês**. Comentários, documentação técnica e textos de interface (UI) devem ser escritos em **português (pt-BR)**.
- **Estilo de escrita:** Utilizar exclusivamente hífen simples (`-`). Nunca utilizar travessão ou meia-risca.
- **Isolamento Multiusuário:** Todas as entidades de domínio pertencem a um usuário (`UserId`) e são filtradas automaticamente no ORM via *Global Query Filters* no Entity Framework Core, garantindo que um usuário jamais acesse ou modifique registros de outro usuário.
- **Execução Real:** Nenhum módulo principal pode depender de mocks estáticos em memória; todas as ações persistem no banco PostgreSQL via API REST e notificam clientes ativos via SignalR.

---

## 2. Stack Tecnológica Oficial

| Camada | Tecnologia | Versão / Detalhes |
|---|---|---|
| **Frontend** | Angular + TypeScript | Angular 19 (Standalone Components, Signals, RxJS, Angular CDK) |
| **Estilização & Ícones** | Tailwind CSS + Lucide Angular | Tokens customizados baseados na referência visual `img3.jpg` |
| **Backend** | C# + ASP.NET Core | .NET 8 LTS (Web API, Minimal/Controllers REST, FluentValidation) |
| **ORM** | Entity Framework Core | `Npgsql.EntityFrameworkCore.PostgreSQL` 8.x |
| **Banco de Dados** | PostgreSQL | PostgreSQL 16 (`postgres:16-alpine`) |
| **Autenticação** | ASP.NET Core Identity + JWT | Bearer Token (`JwtBearer`), Refresh/Access Token e Claims por usuário |
| **Jobs em Background** | Hangfire | `Hangfire.AspNetCore` + `Hangfire.PostgreSql` (lembretes e recorrências) |
| **Tempo Real** | SignalR | `LifeOsHub` autenticado via JWT para sincronização em tempo real |
| **Testes Backend** | xUnit | xUnit + FluentAssertions + `Microsoft.AspNetCore.Mvc.Testing` |
| **Testes Frontend** | Jasmine / Karma ou Vitest | Testes unitários de serviços, guards e componentes Angular |
| **Infraestrutura** | Docker + Docker Compose | Ambiente reproduzível com containers isolados e variáveis `.env` |

---

## 3. Design System e Identidade Visual (Baseado em `img3.jpg` - Opção A)

A interface segue fielmente a estética Bento Grid de 3 colunas e a paleta pastel sobre fundo escuro pontilhado da imagem de referência `img3.jpg`.

### 3.1 Tokens de Cores
- **Tema Escuro (Padrão):**
  - `--bg-canvas`: `#141416` com malha radial de pontos (`#2a2a2e`, `1.5px`, espaçamento `24px x 24px`)
  - `--bg-surface`: `#202023` (cards principais, topbar e painel de calendário)
  - `--bg-pill`: `#2c2d31` (linhas de tarefas em cards escuros, inputs de busca e cards de eventos secundários)
  - `--text-primary`: `#f4f4f6`
  - `--text-secondary`: `#9a9aa2`
  - `--text-on-accent`: `#18181b` (texto escuro de alto contraste sobre cards coloridos)
- **Tema Claro (Alternável):**
  - `--bg-canvas`: `#f1f0ec` com malha radial (`#d6d4ce`)
  - `--bg-surface`: `#ffffff`
  - `--bg-pill`: `#f3f2ee`
  - `--text-primary`: `#18181b`
  - `--text-secondary`: `#52525b`
- **Destaques e Cores das Áreas Padrão:**
  - **Destaque Hoje / Principal (Coral/Salmão):** `#e59882` (pílulas internas translúcidas `rgba(255, 255, 255, 0.28)`)
  - **Trabalho (Azul Pastel):** `#a9ccf0`
  - **Estudo (Verde-Menta):** `#8bd3c7`
  - **Rotina (Roxo Lavanda):** `#c3b1e1`
  - **Doméstico (Laranja Âmbar):** `#f3c68f`
  - **Social (Rosa Suave):** `#f2a6c2`

### 3.2 Estrutura de Navegação (Opção A Aprovada)
- **Topbar Flutuante (`border-radius: 18px`):**
  - **Esquerda:** Links de navegação com ícones Lucide (`Visão Geral`, `Calendário`, `Kanban`, `Projetos`, `Hábitos`, `+ Captura Rápida`).
  - **Centro:** Logotipo minimalista `L•` (`L` em negrito com ponto superior coral `#e59882`).
  - **Direita:** Campo de busca em formato pílula (`Buscar tarefas, eventos, áreas...`), botão de alternância de tema (Escuro/Claro), central de notificações e avatar do usuário com menu de saída/configurações.
- **Filtro de Áreas em Pílulas Horizontais:**
  - Exibido no topo da coluna central (`Todas (N)`, `Trabalho`, `Estudo`, `Rotina`, `Doméstico`, `Social` + botão de gerir áreas), mantendo as 3 colunas amplas:
    1. **Coluna Esquerda (`300px`):** Card de Caixa de Entrada / Notas Rápidas (verde-menta `#8bd3c7`), Card de Tarefas Atrasadas / Prioridades (azul `#a9ccf0`) e Card de Consistência de Hábitos (`80%` com gráfico de 7 barras verticais hachuradas).
    2. **Coluna Central (`1fr`):** Cabeçalho `Minhas Tarefas` + botão circular branco `+`, pílulas de áreas, Card `Hoje` (coral `#e59882`) e Card `Amanhã` / `Próximas` (escuro `#202023`).
    3. **Coluna Direita (`370px`):** Painel `Calendário` com seletor semanal (`Dom` a `Sáb` com indicador azul no dia ativo) e linha do tempo dividida em `Manhã`, `Tarde` e `Noite`.

---

## 4. Arquitetura em Camadas e Estrutura de Diretórios

```text
lifeos/
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docker/
│   ├── backend/
│   │   └── Dockerfile
│   └── frontend/
│       └── Dockerfile
├── backend/
│   ├── LifeOs.sln
│   ├── src/
│   │   ├── LifeOs.Domain/
│   │   │   ├── Common/
│   │   │   │   ├── BaseEntity.cs
│   │   │   │   └── IUserOwnedEntity.cs
│   │   │   ├── Entities/
│   │   │   │   ├── ApplicationUser.cs
│   │   │   │   ├── Area.cs
│   │   │   │   ├── Project.cs
│   │   │   │   ├── TaskItem.cs
│   │   │   │   ├── CalendarEvent.cs
│   │   │   │   ├── Board.cs
│   │   │   │   ├── BoardColumn.cs
│   │   │   │   ├── Label.cs
│   │   │   │   ├── TaskLabel.cs
│   │   │   │   ├── QuickNote.cs
│   │   │   │   ├── Habit.cs
│   │   │   │   ├── HabitCompletion.cs
│   │   │   │   ├── RecurrenceRule.cs
│   │   │   │   ├── Reminder.cs
│   │   │   │   └── Notification.cs
│   │   │   └── Enums/
│   │   │       ├── TaskItemStatus.cs
│   │   │       ├── TaskPriority.cs
│   │   │       ├── QuickNoteType.cs
│   │   │       └── RecurrenceFrequency.cs
│   │   ├── LifeOs.Application/
│   │   │   ├── Common/
│   │   │   │   └── Interfaces/
│   │   │   │       ├── ICurrentUserService.cs
│   │   │   │       ├── IJwtTokenGenerator.cs
│   │   │   │       └── ILifeOsDbContext.cs
│   │   │   ├── Auth/
│   │   │   │   ├── DTOs/
│   │   │   │   ├── Services/
│   │   │   │   └── Validators/
│   │   │   ├── Areas/
│   │   │   │   ├── DTOs/
│   │   │   │   └── Services/
│   │   │   └── Dashboard/
│   │   │       ├── DTOs/
│   │   │       └── Services/
│   │   ├── LifeOs.Infrastructure/
│   │   │   ├── Persistence/
│   │   │   │   ├── LifeOsDbContext.cs
│   │   │   │   ├── Configurations/
│   │   │   │   ├── Migrations/
│   │   │   │   └── Seeders/
│   │   │   ├── Identity/
│   │   │   │   ├── CurrentUserService.cs
│   │   │   │   └── JwtTokenGenerator.cs
│   │   │   └── DependencyInjection.cs
│   │   └── LifeOs.Api/
│   │       ├── Controllers/
│   │       │   ├── AuthController.cs
│   │       │   ├── AreasController.cs
│   │       │   └── DashboardController.cs
│   │       ├── Hubs/
│   │       │   └── LifeOsHub.cs
│   │       ├── Middleware/
│   │       │   └── ExceptionHandlingMiddleware.cs
│   │       └── Program.cs
│   └── tests/
│       └── LifeOs.Tests/
│           ├── Unit/
│           └── Integration/
└── frontend/
    ├── package.json
    ├── angular.json
    ├── tailwind.config.js
    └── src/
        ├── styles.css
        └── app/
            ├── app.component.ts
            ├── app.config.ts
            ├── app.routes.ts
            ├── core/
            │   ├── auth/
            │   │   ├── auth.models.ts
            │   │   ├── auth.service.ts
            │   │   ├── auth.guard.ts
            │   │   └── auth.interceptor.ts
            │   ├── theme/
            │   │   └── theme.service.ts
            │   └── realtime/
            │       └── signalr.service.ts
            ├── layout/
            │   ├── app-shell.component.ts
            │   └── topbar.component.ts
            └── features/
                ├── auth/
                │   ├── login.component.ts
                │   └── register.component.ts
                ├── dashboard/
                │   └── dashboard-page.component.ts
                ├── calendar/
                │   └── calendar-page.component.ts
                ├── kanban/
                │   └── kanban-page.component.ts
                ├── inbox/
                │   └── inbox-page.component.ts
                ├── areas/
                │   └── areas-page.component.ts
                ├── projects/
                │   └── projects-page.component.ts
                └── habits/
                    └── habits-page.component.ts
```

---

## 5. Modelagem Completa do Banco de Dados (15 Entidades)

Todas as 15 entidades solicitadas são mapeadas no `LifeOsDbContext` já na fundação para garantir integridade referencial, chaves estrangeiras, índices compostos e evolução incremental sem quebras de schema:

1. **`users` (`ApplicationUser` : `IdentityUser<Guid>`):**
   - `Id` (PK, `Guid`), `FullName` (`varchar(120)`, obrigatório), `Email`, `PasswordHash`, `ThemePreference` (`varchar(16)`, default `'dark'`), `CreatedAt`, `UpdatedAt`.
2. **`areas` (`Area`):**
   - `Id` (PK, `Guid`), `UserId` (FK -> `users.Id`, indexado), `Name` (`varchar(80)`), `Slug` (`varchar(80)`), `Description` (`varchar(500)` nullable), `Color` (`varchar(16)` hex), `Icon` (`varchar(50)`), `SortOrder` (`int`), `IsDefault` (`bool`), `CreatedAt`, `UpdatedAt`, `DeletedAt` (soft delete).
3. **`projects` (`Project`):**
   - `Id` (PK, `Guid`), `UserId` (FK), `AreaId` (FK -> `areas.Id`), `Name` (`varchar(150)`), `Description` (`text`), `StartDate` (`date` nullable), `DueDate` (`date` nullable), `Status` (`varchar(30)`), `Priority` (`TaskPriority`), `CreatedAt`, `UpdatedAt`, `DeletedAt`.
4. **`boards` (`Board`):**
   - `Id` (PK, `Guid`), `UserId` (FK), `AreaId` (FK nullable), `ProjectId` (FK nullable), `Name` (`varchar(120)`), `IsDefault` (`bool`), `CreatedAt`, `UpdatedAt`.
5. **`board_columns` (`BoardColumn`):**
   - `Id` (PK, `Guid`), `BoardId` (FK -> `boards.Id`), `Name` (`varchar(80)`), `StatusMapping` (`TaskItemStatus`), `Position` (`int`), `CreatedAt`, `UpdatedAt`.
6. **`recurrence_rules` (`RecurrenceRule`):**
   - `Id` (PK, `Guid`), `UserId` (FK), `Frequency` (`RecurrenceFrequency`: Daily, Weekly, Monthly, CustomDays), `Interval` (`int`, default 1), `DaysOfWeekMask` (`varchar(32)` nullable, ex: `'MON,WED,FRI'`), `StartsOn` (`date`), `EndsOn` (`date` nullable), `CreatedAt`, `UpdatedAt`.
7. **`tasks` (`TaskItem`):**
   - `Id` (PK, `Guid`), `UserId` (FK), `AreaId` (FK -> `areas.Id`), `ProjectId` (FK nullable -> `projects.Id`), `BoardColumnId` (FK nullable -> `board_columns.Id`), `RecurrenceRuleId` (FK nullable -> `recurrence_rules.Id`), `Title` (`varchar(200)`), `Description` (`text` nullable), `Priority` (`TaskPriority`: Low, Medium, High, Urgent), `Status` (`TaskItemStatus`: Todo, InProgress, OnHold, Done, Cancelled), `StartDate` (`date` nullable), `DueDate` (`date` nullable), `DueTime` (`time` nullable), `BoardPosition` (`int`), `CompletedAt` (`timestamptz` nullable), `CreatedAt`, `UpdatedAt`, `DeletedAt`.
   - Índices: `(UserId, Status, DueDate)`, `(UserId, AreaId)`.
8. **`events` (`CalendarEvent`):**
   - `Id` (PK, `Guid`), `UserId` (FK), `AreaId` (FK -> `areas.Id`), `RecurrenceRuleId` (FK nullable -> `recurrence_rules.Id`), `Title` (`varchar(200)`), `Description` (`text` nullable), `Location` (`varchar(200)` nullable), `StartAt` (`timestamptz`), `EndAt` (`timestamptz`), `IsAllDay` (`bool`), `CreatedAt`, `UpdatedAt`, `DeletedAt`.
   - Índices: `(UserId, StartAt, EndAt)`.
9. **`labels` (`Label`):**
   - `Id` (PK, `Guid`), `UserId` (FK), `Name` (`varchar(60)`), `Color` (`varchar(16)`), `CreatedAt`, `UpdatedAt`.
10. **`task_labels` (`TaskLabel`):**
    - PK composta `(TaskId, LabelId)` com FKs para `tasks.Id` e `labels.Id`.
11. **`quick_notes` (`QuickNote`):**
    - `Id` (PK, `Guid`), `UserId` (FK), `AreaId` (FK nullable -> `areas.Id`), `Content` (`text`), `NoteType` (`QuickNoteType`: Task, Event, Reminder, Note), `Priority` (`TaskPriority` nullable), `TargetDate` (`date` nullable), `IsProcessed` (`bool`, default `false`), `ProcessedEntityId` (`Guid` nullable), `CreatedAt`, `UpdatedAt`.
12. **`habits` (`Habit`):**
    - `Id` (PK, `Guid`), `UserId` (FK), `AreaId` (FK -> `areas.Id`), `Name` (`varchar(120)`), `Description` (`varchar(500)` nullable), `Frequency` (`RecurrenceFrequency`), `DaysOfWeekMask` (`varchar(32)` nullable), `TargetPerWeek` (`int`, default 7), `CurrentStreak` (`int`, default 0), `BestStreak` (`int`, default 0), `IsActive` (`bool`, default `true`), `CreatedAt`, `UpdatedAt`.
13. **`habit_completions` (`HabitCompletion`):**
    - `Id` (PK, `Guid`), `HabitId` (FK -> `habits.Id`), `UserId` (FK), `CompletedOn` (`date`), `Notes` (`varchar(300)` nullable), `CreatedAt`.
    - Constraint única: `(HabitId, CompletedOn)`.
14. **`reminders` (`Reminder`):**
    - `Id` (PK, `Guid`), `UserId` (FK), `TaskId` (FK nullable -> `tasks.Id`), `EventId` (FK nullable -> `events.Id`), `RemindAt` (`timestamptz`), `IsSent` (`bool`, default `false`), `HangfireJobId` (`varchar(80)` nullable), `CreatedAt`.
15. **`notifications` (`Notification`):**
    - `Id` (PK, `Guid`), `UserId` (FK), `Title` (`varchar(160)`), `Message` (`varchar(500)`), `NotificationType` (`varchar(40)`), `ReferenceId` (`Guid` nullable), `IsRead` (`bool`, default `false`), `ReadAt` (`timestamptz` nullable), `CreatedAt`.

---

## 6. Contratos da API na Fase 1 (Fundação)

### 6.1 Autenticação (`/api/v1/auth`)
- **`POST /api/v1/auth/register`**
  - Request: `{ "fullName": "Gabriel Miranda", "email": "gabriel@lifeos.dev", "password": "Password123!" }`
  - Efeito colateral de domínio (transacional): Cria o usuário, gera automaticamente as **5 Áreas padrão** (`Trabalho`, `Estudo`, `Rotina`, `Doméstico`, `Social`) com as cores do Design System e o **Quadro Kanban padrão** com as 4 colunas (`A fazer`, `Em andamento`, `Em espera`, `Concluído`).
  - Response `201 Created`: `{ "accessToken": "...", "expiresAt": "...", "user": { "id": "...", "fullName": "...", "email": "...", "themePreference": "dark" } }`
- **`POST /api/v1/auth/login`**
  - Request: `{ "email": "gabriel@lifeos.dev", "password": "Password123!" }`
  - Response `200 OK`: `{ "accessToken": "...", "expiresAt": "...", "user": { ... } }`
- **`GET /api/v1/auth/me`** (Autenticado via Bearer JWT)
  - Response `200 OK`: `{ "id": "...", "fullName": "...", "email": "...", "themePreference": "dark" }`
- **`PATCH /api/v1/auth/theme`** (Autenticado)
  - Request: `{ "themePreference": "light" | "dark" }`
  - Response `200 OK`: `{ "themePreference": "light" }`

### 6.2 Áreas e Resumo Inicial do Dashboard (`/api/v1/areas` e `/api/v1/dashboard/summary`)
- **`GET /api/v1/areas`**: Retorna as áreas do usuário logado ordenadas por `SortOrder`, com contagem real de tarefas pendentes por área.
- **`GET /api/v1/dashboard/summary`**: Retorna os contadores reais calculados no PostgreSQL (`pendingTasksCount`, `completedTodayCount`, `overdueTasksCount`, `inProgressCount`, `unprocessedNotesCount`, `weeklyHabitSuccessRate`, `dailyHabitBars`, `todayTasks`, `tomorrowTasks`, `todayEvents`) para alimentar o Bento Grid de 3 colunas sem dados estáticos.

---

## 7. Estratégia de Testes e Critérios de Aceite da Fase 1

1. **Testes Automatizados Backend (xUnit):**
   - Registro de novo usuário cria automaticamente as 5 áreas padrão e 1 quadro Kanban com 4 colunas.
   - Login retorna token JWT válido e rejeita credenciais inválidas com `401 Unauthorized`.
   - Isolamento multiusuário: Usuário A não enxerga áreas nem dados do Usuário B (`GET /api/v1/areas` e `GET /api/v1/dashboard/summary`).
   - Cálculo de resumo do Dashboard retorna métricas reais do banco.
2. **Testes Automatizados Frontend (Angular):**
   - `ThemeService` alterna classe `light-theme` e persiste preferência.
   - `AuthService` e `authGuard` bloqueiam acesso não autenticado e anexam o header `Authorization: Bearer <token>`.
   - `TopbarComponent` e `DashboardPageComponent` renderizam a estrutura Bento Grid da Opção A (`img3.jpg`).
3. **Infraestrutura Docker Compose:**
   - `docker compose up -d` sobe `postgres`, `backend` e `frontend` saudáveis e comunicando entre si.
