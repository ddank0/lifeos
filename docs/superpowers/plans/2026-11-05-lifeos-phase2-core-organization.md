# LIFEOS - Fase 2 (Núcleo de Organização) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o Núcleo de Organização do LIFEOS (CRUD completo de Áreas, Tarefas, Eventos e Etiquetas no Backend .NET 8 + PostgreSQL, filtros combinados, notificações SignalR em tempo real e interfaces completas de gestão no Frontend Angular 19).

**Architecture:** Extensão da API REST em `.NET 8` com DTOs dedicados e endpoints RESTful para `AreasController`, `TasksController`, `EventsController` e `LabelsController`, mantendo isolamento multiusuário via EF Core Global Query Filters e soft delete. No Angular 19, adição de modais/painéis de criação e edição detalhada de tarefas, eventos e áreas com atualização reativa via SignalR.

**Tech Stack:** Angular 19, TypeScript, Tailwind CSS, C# 12, ASP.NET Core 8, EF Core 8, PostgreSQL 16, SignalR, xUnit, FluentAssertions, Vitest.

**Spec:** `/home/gabriel/dev/lifeos/docs/superpowers/specs/2026-11-05-lifeos-phase1-foundation-design.md`

---

### Task 1: DTOs e Endpoints de CRUD Completo para Áreas, Etiquetas, Tarefas e Eventos (.NET 8)

**Files:**
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Application/Tasks/DTOs/TaskDtos.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Application/Events/DTOs/EventDtos.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Application/Areas/DTOs/AreaRequests.cs`
- Modify: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Controllers/AreasController.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Controllers/TasksController.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Controllers/EventsController.cs`
- Create: `/home/gabriel/dev/lifeos/backend/src/LifeOs.Api/Controllers/LabelsController.cs`
- Test: `/home/gabriel/dev/lifeos/backend/tests/LifeOs.Tests/Integration/Phase2CoreOrganizationIntegrationTests.cs`

- [ ] **Step 1: Escrever o teste de integração falho (`Phase2CoreOrganizationIntegrationTests.cs`)**
- [ ] **Step 2: Rodar o teste para confirmar que falha**
- [ ] **Step 3: Implementar os DTOs e Controllers (`AreasController`, `TasksController`, `EventsController`, `LabelsController`)**
- [ ] **Step 4: Rodar toda a suíte xUnit e verificar 100% de aprovação**

---

### Task 2: Frontend Angular 19 - Gestão Completa de Áreas, Tarefas, Eventos e Filtros

**Files:**
- Modify: `/home/gabriel/dev/lifeos/frontend/src/app/core/auth/auth.models.ts`
- Modify: `/home/gabriel/dev/lifeos/frontend/src/app/core/api/dashboard-api.service.ts`
- Modify: `/home/gabriel/dev/lifeos/frontend/src/app/layout/topbar.component.ts`
- Modify: `/home/gabriel/dev/lifeos/frontend/src/app/features/dashboard/dashboard-page.component.ts`
- Modify: `/home/gabriel/dev/lifeos/frontend/src/app/features/areas/areas-page.component.ts`
- Create: `/home/gabriel/dev/lifeos/frontend/src/app/core/api/dashboard-api.service.spec.ts`

- [ ] **Step 1: Escrever teste unitário do serviço de organização e filtros**
- [ ] **Step 2: Atualizar serviços e componentes com modais de criação/edição/exclusão de Áreas, Tarefas e Eventos + filtros por prioridade, status e busca textual**
- [ ] **Step 3: Executar testes unitários Vitest, build Angular e validar endpoints em execução no container Docker**
