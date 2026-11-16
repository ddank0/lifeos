# LIFEOS - Módulo Life Tracker (Quantified Self) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o novo módulo **Life Tracker (Opção 2 - Quantified Self)** no LIFEOS, permitindo criar indicadores quantitativos customizáveis por área da vida com metas diárias, passos de incremento rápido com 1 clique (`+`/`-`), cálculo de progresso percentual, histórico e média dos últimos 7 dias e persistência no PostgreSQL.

**Architecture:**
- **Backend (`LifeOs.Domain`, `LifeOs.Application`, `LifeOs.Infrastructure`, `LifeOs.Api`):**
  - Novas entidades: `LifeMetric` e `LifeMetricEntry` em `LifeOs.Domain/Entities/`.
  - Mapeamento no `LifeOsDbContext` com Global Query Filter multi-tenant.
  - `ILifeTrackerService` e `LifeTrackerService` em `LifeOs.Application/LifeTracker/Services/` com DTOs e regras para incremento/decremento atômico de registros por data.
  - `LifeTrackerController` (`/api/v1/life-tracker`) delegando para o serviço de aplicação e disparando notificações em tempo real.
- **Frontend (`Angular 19`):**
  - `LifeTrackerApiService` (`core/api/life-tracker-api.service.ts`) com testes Vitest.
  - `LifeTrackerPageComponent` (`features/life-tracker/life-tracker-page.component.ts`) com o grid de cards Bento coloridos da Opção 2, filtros por área, botões de incremento rápido com 1 clique e modal de criação/edição de métricas.
  - Atualização de `topbar.component.ts` e `app.routes.ts` com a rota `/life-tracker`.

---

### Task 1: Modelagem e Serviços Backend do Life Tracker (TDD)

**Files:**
- Create: `backend/src/LifeOs.Domain/Entities/LifeMetric.cs`
- Create: `backend/src/LifeOs.Domain/Entities/LifeMetricEntry.cs`
- Modify: `backend/src/LifeOs.Application/Common/Interfaces/ApplicationInterfaces.cs`
- Modify: `backend/src/LifeOs.Infrastructure/Persistence/LifeOsDbContext.cs`
- Create: `backend/src/LifeOs.Application/LifeTracker/DTOs/LifeTrackerDtos.cs`
- Create: `backend/src/LifeOs.Application/LifeTracker/Services/LifeTrackerService.cs`
- Create: `backend/src/LifeOs.Api/Controllers/LifeTrackerController.cs`
- Modify: `backend/src/LifeOs.Application/DependencyInjection.cs`
- Create: `backend/tests/LifeOs.Tests/Integration/LifeTrackerIntegrationTests.cs`

- [x] **Step 1: Criar entidades `LifeMetric` e `LifeMetricEntry` e mapear em `LifeOsDbContext` com DbSets e Query Filters**
- [x] **Step 2: Escrever teste de integração em `LifeTrackerIntegrationTests.cs` validando criação de métrica, incremento rápido de valor no dia, cálculo de progresso e média dos últimos 7 dias**
- [x] **Step 3: Implementar `LifeTrackerDtos`, `LifeTrackerService` e `LifeTrackerController` e registrar em `DependencyInjection.cs`**
- [x] **Step 4: Executar `dotnet test LifeOs.sln` e verificar 100% de aprovação sem warnings**

---

### Task 2: Interface Frontend do Life Tracker (Opção 2 - Quantified Self)

**Files:**
- Modify: `frontend/src/app/core/auth/auth.models.ts`
- Create: `frontend/src/app/core/api/life-tracker-api.service.ts`
- Create: `frontend/src/app/core/api/life-tracker-api.service.spec.ts`
- Create: `frontend/src/app/features/life-tracker/life-tracker-page.component.ts`
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/layout/topbar.component.ts`

- [x] **Step 1: Adicionar modelos de dados em `auth.models.ts` e implementar `LifeTrackerApiService` com testes unitários em Vitest**
- [x] **Step 2: Desenvolver `LifeTrackerPageComponent` com o layout de cards Bento da Opção 2, ajuste rápido (+/-), filtro de áreas e modal de criação de métrica**
- [x] **Step 3: Adicionar a rota `/life-tracker` e o link na Topbar**
- [x] **Step 4: Executar `npm test && npm run build` para garantir conformidade e build de produção limpo**
