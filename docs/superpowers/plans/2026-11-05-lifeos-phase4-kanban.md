# LIFEOS - Fase 4 (Módulo Kanban Completo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o Quadro Kanban completo com 4 colunas (A fazer, Em andamento, Em espera, Concluído) utilizando Angular CDK Drag and Drop, ordenação persistente entre e dentro das colunas, etiquetas coloridas, indicador de tarefas atrasadas, filtros combinados (área, projeto, prioridade, atraso e busca textual) e sincronização em tempo real via SignalR.

**Architecture:**
- **Backend (`LifeOs.Application` & `LifeOs.Api`):**
  - Criação de `KanbanDtos.cs` (`KanbanBoardDto`, `KanbanColumnDto`, `KanbanCardDto`, `MoveKanbanCardRequest`, `KanbanQueryFilter`).
  - Criação de `IKanbanService` e `KanbanService` em `LifeOs.Application/Kanban/Services/KanbanService.cs` responsável por montar as 4 colunas do quadro com filtros combinados e persistir a movimentação e reordenação (`BoardPosition`, `Status`, `BoardColumnId`, `CompletedAt`) via Drag and Drop.
  - Criação de `KanbanController` (`/api/v1/kanban`) enxuto delegando para `IKanbanService`.
- **Frontend (`Angular 19` + `@angular/cdk/drag-drop`):**
  - Criação de `KanbanApiService` (`core/api/kanban-api.service.ts`) e testes unitários (`core/api/kanban-api.service.spec.ts`).
  - Implementação completa de `KanbanPageComponent` (`features/kanban/kanban-page.component.ts`) com `DragDropModule` (`cdkDropListGroup`, `cdkDropList`, `cdkDrag`), criação rápida por coluna, edição e exclusão de cartões, gestão de etiquetas coloridas e filtros avançados.

---

### Task 1: Serviço de Kanban e Persistência de Drag-and-Drop no Backend (TDD)

**Files:**
- Create: `backend/src/LifeOs.Application/Kanban/DTOs/KanbanDtos.cs`
- Create: `backend/src/LifeOs.Application/Kanban/Services/KanbanService.cs`
- Create: `backend/src/LifeOs.Api/Controllers/KanbanController.cs`
- Modify: `backend/src/LifeOs.Application/DependencyInjection.cs`
- Create: `backend/tests/LifeOs.Tests/Integration/Phase4KanbanIntegrationTests.cs`

- [x] **Step 1: Escrever teste de integração em `Phase4KanbanIntegrationTests.cs` validando listagem das 4 colunas, filtros (área, prioridade, busca e atrasadas) e movimentação/reordenação de cartões entre colunas**
- [x] **Step 2: Implementar `KanbanDtos`, `KanbanService` e `KanbanController` e registrar no container de DI**
- [x] **Step 3: Executar `dotnet test LifeOs.sln` e confirmar 100% de aprovação sem warnings**

---

### Task 2: Quadro Kanban Interativo com Angular CDK Drag-and-Drop no Frontend

**Files:**
- Modify: `frontend/src/app/core/auth/auth.models.ts`
- Create: `frontend/src/app/core/api/kanban-api.service.ts`
- Create: `frontend/src/app/core/api/kanban-api.service.spec.ts`
- Modify: `frontend/src/styles.css`
- Modify: `frontend/src/app/features/kanban/kanban-page.component.ts`

- [x] **Step 1: Criar `KanbanApiService` e teste unitário `kanban-api.service.spec.ts` em Vitest**
- [x] **Step 2: Adicionar estilos de Drag-and-Drop do CDK (`.cdk-drag-preview`, `.cdk-drag-placeholder`, `.kanban-card`, badges de prioridade e atraso) em `styles.css`**
- [x] **Step 3: Implementar `KanbanPageComponent` com 4 colunas conectadas via `cdkDropListGroup`, filtros por área/projeto/prioridade/atrasadas/busca e modal de criação/edição de cartão com etiquetas**
- [x] **Step 4: Executar `npm test && npm run build` para validar todos os testes e o build de produção**
