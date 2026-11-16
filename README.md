# LIFEOS - Sistema Inteligente de Organização Pessoal

Aplicação web Full Stack de gerenciamento da vida pessoal (*Personal Life Management System*) que centraliza tarefas, compromissos, quadros Kanban, captura rápida (*Inbox*), áreas da vida, projetos, hábitos recorrentes e indicadores de produtividade em um ambiente unificado.

**Princípio Central:** *Cada área possui sua própria organização, mas todas compartilham uma visão geral integrada da vida do usuário.*

---

## 1. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | Angular 19 (Standalone Components, Signals, RxJS, Angular CDK Drag-and-Drop, FullCalendar 6) + TypeScript |
| **Estilização** | Tailwind CSS + Design System Bento Dark/Light customizado (`styles.css`) |
| **Backend** | C# 12 + ASP.NET Core 8 (`LifeOs.Domain`, `LifeOs.Application`, `LifeOs.Infrastructure`, `LifeOs.Api`) |
| **ORM & Banco** | Entity Framework Core 8 + PostgreSQL 16 (`Npgsql`) |
| **Autenticação** | ASP.NET Core Identity + JWT Bearer |
| **Jobs em Background** | Hangfire (`Hangfire.PostgreSql`) |
| **Tempo Real** | SignalR (`/hubs/lifeos`) |
| **Testes Automatizados** | xUnit + FluentAssertions + `WebApplicationFactory` (Backend) e Vitest (Frontend) |
| **Infraestrutura** | Docker + Docker Compose |

---

## 2. Arquitetura em Camadas (Clean Architecture)

```text
lifeos/
├── backend/
│   ├── src/
│   │   ├── LifeOs.Domain/           # 15 Entidades de domínio (1 por arquivo), Enums e contratos base
│   │   ├── LifeOs.Application/      # Casos de uso (Services), DTOs, filtros e interfaces
│   │   ├── LifeOs.Infrastructure/   # LifeOsDbContext (EF Core 8), JWT, Identity e Onboarding Seeder
│   │   └── LifeOs.Api/              # Thin Controllers REST, SignalR Hub (LifeOsHub) e Hangfire
│   └── tests/
│       └── LifeOs.Tests/            # Testes unitários de isolamento Multi-Tenant e testes de integração HTTP
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── core/                # Auth, JWT Interceptor, ThemeService, SignalRService e API Services
│       │   ├── layout/              # AppShell (Ctrl+K Captura Rápida) e Topbar flutuante
│       │   └── features/            # Dashboard, Calendar, Kanban, Inbox, Areas, Projects, Habits, Settings
│       └── styles.css               # Design System Bento Grid (Dark padrão + Light mode)
└── docker-compose.yml               # Orquestração PostgreSQL 16 + Backend .NET 8 + Frontend Angular 19
```

### Isolamento Multi-Tenant e Integridade
- Todas as entidades de usuário implementam `IUserOwnedEntity` e possuem **Global Query Filters** automáticos no `LifeOsDbContext` vinculados ao `ICurrentUserService.UserId`.
- Entidades principais (`Area`, `Project`, `TaskItem`, `CalendarEvent`) implementam `ISoftDeletable` (`DeletedAt`), preservando histórico referencial.
- No registro de um novo usuário (`POST /api/v1/auth/register`), o `UserOnboardingService` provisiona automaticamente as **5 áreas padrão** (*Trabalho*, *Estudo*, *Rotina*, *Doméstico* e *Social*), o quadro Kanban padrão com **4 colunas** (*A fazer*, *Em andamento*, *Em espera*, *Concluído*) e atividades iniciais.

---

## 3. Módulos e Endpoints REST (`/api/v1`)

| Módulo | Endpoints Principais | Descrição |
|---|---|---|
| **Auth** | `POST /api/v1/auth/register`<br>`POST /api/v1/auth/login`<br>`GET /api/v1/auth/me` | Registro com provisionamento automático, login JWT e perfil autenticado |
| **Dashboard** | `GET /api/v1/dashboard/summary`<br>`PATCH /api/v1/dashboard/tasks/{id}/toggle`<br>`POST /api/v1/dashboard/quick-capture` | Indicadores consolidados, tarefas de hoje/amanhã, agenda do dia e consistência semanal |
| **Áreas da Vida** | `GET /api/v1/areas`<br>`POST /api/v1/areas`<br>`PUT /api/v1/areas/{id}`<br>`DELETE /api/v1/areas/{id}` | Setorização com cores e ícones personalizados e contadores em tempo real |
| **Tarefas & Etiquetas** | `GET /api/v1/tasks`<br>`POST /api/v1/tasks`<br>`PUT /api/v1/tasks/{id}`<br>`DELETE /api/v1/tasks/{id}`<br>`GET /api/v1/labels` / `POST /api/v1/labels` | CRUD completo de tarefas com prioridade, status, prazo, recorrência e etiquetas coloridas |
| **Eventos** | `GET /api/v1/events`<br>`POST /api/v1/events`<br>`PUT /api/v1/events/{id}`<br>`DELETE /api/v1/events/{id}` | Compromissos com horário de início/fim, dia inteiro, local, subitens e recorrência |
| **Calendário Unificado** | `GET /api/v1/calendar`<br>`PATCH /api/v1/calendar/reschedule` | Feed unificado de Eventos + Tarefas com prazo, expansão de recorrência e Drag-and-Drop |
| **Kanban** | `GET /api/v1/kanban`<br>`PATCH /api/v1/kanban/cards/{taskId}/move` | Quadro de 4 colunas com filtros combinados, detecção de atrasos e persistência de posição |
| **Caixa de Entrada** | `GET /api/v1/inbox`<br>`POST /api/v1/inbox`<br>`POST /api/v1/inbox/{id}/convert`<br>`DELETE /api/v1/inbox/{id}` | Captura rápida sem atrito e conversão de 1 clique em Tarefa ou Evento |
| **Projetos** | `GET /api/v1/projects`<br>`POST /api/v1/projects`<br>`PUT /api/v1/projects/{id}`<br>`DELETE /api/v1/projects/{id}` | Agrupamento de tarefas com cálculo automático de progresso (`ProgressPercent`) |
| **Hábitos e Rotinas** | `GET /api/v1/habits`<br>`POST /api/v1/habits`<br>`POST /api/v1/habits/{id}/toggle`<br>`DELETE /api/v1/habits/{id}` | Acompanhamento diário dos últimos 7 dias, cálculo de `CurrentStreak`, `BestStreak` e consistência |
| **Notificações & Config.** | `GET /api/v1/notifications`<br>`POST /api/v1/notifications/reminders`<br>`GET /api/v1/settings/overview`<br>`PUT /api/v1/settings/profile` | Agendamento de lembretes (Hangfire), central de notificações e relatório de produtividade por área |

---

## 4. Como Executar o Projeto

### 4.1. Subir Banco de Dados e Backend via Docker Compose
```bash
unset COMPOSE_FILE
docker compose -f docker-compose.yml up -d postgres backend
```
- **API Backend & Swagger:** `http://localhost:5080/swagger`
- **Healthcheck:** `http://localhost:5080/health`
- **Credenciais de Demonstração (provisionadas automaticamente):**
  - **E-mail:** `gabriel@lifeos.dev`
  - **Senha:** `LifeOs@2026`

### 4.2. Executar o Frontend Angular 19
```bash
cd frontend
npm install
npm start
```
- **Aplicação Web:** `http://localhost:4200`

---

## 5. Como Executar os Testes Automatizados

### Backend (.NET 8 - xUnit + FluentAssertions)
```bash
unset COMPOSE_FILE
docker compose -f docker-compose.yml run --rm --no-deps backend dotnet test LifeOs.sln
```

### Frontend (Angular 19 - Vitest + Build de Produção)
```bash
cd frontend
npm test
npm run build
```
