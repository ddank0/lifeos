# LIFEOS - Fase 5 (Caixa de Entrada, Projetos e Hábitos) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os módulos de **Captura Rápida / Caixa de Entrada** (triagem, organização e conversão em Tarefa ou Evento), **Projetos** (agrupamento de tarefas com cálculo automático de progresso percentual) e **Hábitos & Rotinas** (registro diário de conclusão, cálculo de consistência semanal e streaks atual e recorde).

**Architecture:**
- **Backend (`LifeOs.Application` & `LifeOs.Api`):**
  - **Inbox (`LifeOs.Application/Inbox`):** `IInboxService` / `InboxService` e `InboxController` (`/api/v1/inbox`) com listagem de itens não processados/processados, criação com campos opcionais (`AreaId`, `NoteType`, `Priority`, `TargetDate`), conversão em Tarefa ou Evento (`ConvertAsync` marcando `IsProcessed = true` e `ProcessedEntityId`) e exclusão/arquivamento.
  - **Projects (`LifeOs.Application/Projects`):** `IProjectService` / `ProjectService` e `ProjectsController` (`/api/v1/projects`) com CRUD completo, associação a áreas e cálculo em tempo real do progresso percentual (`CompletedTasksCount / TotalTasksCount * 100`) e listagem das tarefas vinculadas.
  - **Habits (`LifeOs.Application/Habits`):** `IHabitService` / `HabitService` e `HabitsController` (`/api/v1/habits`) com CRUD de hábitos, registro/remoção de conclusão por data (`ToggleCompletionAsync`), recálculo automático de `CurrentStreak` e `BestStreak` e cálculo da taxa de consistência dos últimos 7 dias integrado também ao `DashboardService`.
- **Frontend (`Angular 19`):**
  - Criação de `WorkspaceModulesApiService` (`core/api/workspace-modules-api.service.ts`) e testes unitários (`workspace-modules-api.service.spec.ts`).
  - Evolução do modal global de Captura Rápida (`AppShellComponent`) suportando os 4 tipos (`Task`, `Event`, `Reminder`, `Note`), área opcional, data e prioridade.
  - Implementação completa de `InboxPageComponent`, `ProjectsPageComponent` e `HabitsPageComponent`.

---

### Task 1: Serviços Backend de Inbox, Projetos e Hábitos (TDD)

**Files:**
- Create: `backend/src/LifeOs.Application/Inbox/DTOs/InboxDtos.cs`
- Create: `backend/src/LifeOs.Application/Inbox/Services/InboxService.cs`
- Create: `backend/src/LifeOs.Api/Controllers/InboxController.cs`
- Create: `backend/src/LifeOs.Application/Projects/DTOs/ProjectDtos.cs`
- Create: `backend/src/LifeOs.Application/Projects/Services/ProjectService.cs`
- Create: `backend/src/LifeOs.Api/Controllers/ProjectsController.cs`
- Create: `backend/src/LifeOs.Application/Habits/DTOs/HabitDtos.cs`
- Create: `backend/src/LifeOs.Application/Habits/Services/HabitService.cs`
- Create: `backend/src/LifeOs.Api/Controllers/HabitsController.cs`
- Modify: `backend/src/LifeOs.Application/Dashboard/Services/DashboardService.cs`
- Modify: `backend/src/LifeOs.Application/DependencyInjection.cs`
- Create: `backend/tests/LifeOs.Tests/Integration/Phase5InboxProjectsHabitsIntegrationTests.cs`

- [x] **Step 1: Escrever teste de integração em `Phase5InboxProjectsHabitsIntegrationTests.cs` validando triagem/conversão na Caixa de Entrada, cálculo de progresso de Projetos com base nas tarefas concluídas e cálculo de Streaks/Consistência de Hábitos**
- [x] **Step 2: Implementar os DTOs, Services e Controllers de Inbox, Projects e Habits e integrar o cálculo real de hábitos no `DashboardService`**
- [x] **Step 3: Executar `dotnet test LifeOs.sln` e confirmar 100% dos testes aprovados sem warnings**

---

### Task 2: Páginas de Caixa de Entrada, Projetos, Hábitos e Captura Rápida Global no Angular 19

**Files:**
- Modify: `frontend/src/app/core/auth/auth.models.ts`
- Create: `frontend/src/app/core/api/workspace-modules-api.service.ts`
- Create: `frontend/src/app/core/api/workspace-modules-api.service.spec.ts`
- Modify: `frontend/src/app/layout/app-shell.component.ts`
- Modify: `frontend/src/app/features/inbox/inbox-page.component.ts`
- Modify: `frontend/src/app/features/projects/projects-page.component.ts`
- Modify: `frontend/src/app/features/habits/habits-page.component.ts`
- Modify: `frontend/src/styles.css`

- [x] **Step 1: Criar `WorkspaceModulesApiService` e teste unitário `workspace-modules-api.service.spec.ts`**
- [x] **Step 2: Implementar `InboxPageComponent` (triagem e conversão em Tarefa ou Evento), `ProjectsPageComponent` (barras de progresso e vínculo de tarefas), `HabitsPageComponent` (check-in nos últimos 7 dias, streaks e consistência) e aprimorar `AppShellComponent`**
- [x] **Step 3: Executar `npm test && npm run build` para validar todos os testes e o bundle de produção**
