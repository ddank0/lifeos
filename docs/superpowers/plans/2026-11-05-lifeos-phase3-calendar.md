# LIFEOS - Fase 3 (Módulo Calendário) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o Módulo de Calendário unificado (visões Mensal, Semanal e Diária com FullCalendar 6), exibindo compromissos com horário e tarefas com prazo diferenciados conceitual e visualmente, com filtros por área e tipo de atividade, suporte a eventos de dia inteiro, regras de recorrência (`RecurrenceRule`) e reagendamento imediato via Drag and Drop.

**Architecture:**
- **Backend (`LifeOs.Application` & `LifeOs.Api`):**
  - Evolução de `SaveEventRequest`, `EventDetailDto`, `SaveTaskRequest` e `TaskDetailDto` para suportar frequência de recorrência (`RecurrenceFrequency`: `None`, `Daily`, `Weekly`, `Monthly`).
  - Criação de `ICalendarService` e `CalendarService` em `LifeOs.Application/Calendar/Services/CalendarService.cs` que agrega eventos (`CalendarEvent`) e tarefas com prazo (`TaskItem`), expandindo ocorrências recorrentes dentro do intervalo `[From, To]` solicitado pelo calendário e suportando reagendamento unificado (`RescheduleEntryAsync`).
  - Criação de `CalendarController` (`/api/calendar`) enxuto delegando para `ICalendarService`.
- **Frontend (`Angular 19` + `@fullcalendar/angular`):**
  - Instalação de `@fullcalendar/angular`, `@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/timegrid` e `@fullcalendar/interaction` (`6.1.22`).
  - Criação de `CalendarApiService` (`core/api/calendar-api.service.ts`) e testes unitários em Vitest.
  - Implementação completa de `CalendarPageComponent` com FullCalendar estilizado segundo o Design System Bento Dark/Light, alternância entre visões Mensal (`dayGridMonth`), Semanal (`timeGridWeek`) e Diária (`timeGridDay`), filtros por área e por tipo (`all`, `event`, `task`), clique em data/horário para criar evento ou tarefa, modal de criação/edição/exclusão e reagendamento por Drag and Drop (`eventDrop` e `eventResize`).

---

### Task 1: Suporte a Recorrência e Serviço Unificado de Calendário no Backend (TDD)

**Files:**
- Create: `backend/src/LifeOs.Application/Calendar/DTOs/CalendarDtos.cs`
- Create: `backend/src/LifeOs.Application/Calendar/Services/CalendarService.cs`
- Create: `backend/src/LifeOs.Api/Controllers/CalendarController.cs`
- Modify: `backend/src/LifeOs.Application/Events/DTOs/EventDtos.cs`
- Modify: `backend/src/LifeOs.Application/Events/Services/EventService.cs`
- Modify: `backend/src/LifeOs.Application/Tasks/DTOs/TaskDtos.cs`
- Modify: `backend/src/LifeOs.Application/Tasks/Services/TaskService.cs`
- Modify: `backend/src/LifeOs.Application/DependencyInjection.cs`
- Create: `backend/tests/LifeOs.IntegrationTests/CalendarIntegrationTests.cs`

- [x] **Step 1: Escrever teste de integração em `CalendarIntegrationTests.cs` cobrindo eventos de dia inteiro, recorrência, tarefas com prazo no feed unificado e reagendamento (Drag and Drop)**
- [x] **Step 2: Implementar `CalendarDtos`, `CalendarService`, `CalendarController` e atualizar `EventService` e `TaskService` com suporte a `RecurrenceRule`**
- [x] **Step 3: Executar `dotnet test LifeOs.sln` e confirmar 100% dos testes passando sem warnings**

---

### Task 2: Serviço Frontend de Calendário e Integração com FullCalendar 6

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/app/core/api/calendar-api.service.ts`
- Create: `frontend/src/app/core/api/calendar-api.service.spec.ts`
- Modify: `frontend/src/styles.css`
- Modify: `frontend/src/app/features/calendar/calendar-page.component.ts`

- [x] **Step 1: Instalar `@fullcalendar/angular@6.1.22`, `@fullcalendar/core@6.1.22`, `@fullcalendar/daygrid@6.1.22`, `@fullcalendar/timegrid@6.1.22` e `@fullcalendar/interaction@6.1.22`**
- [x] **Step 2: Criar `CalendarApiService` e teste unitário `calendar-api.service.spec.ts`**
- [x] **Step 3: Estilizar o FullCalendar no Design System (`styles.css`) e implementar `CalendarPageComponent` com visões Mensal, Semanal e Diária, filtros por área e tipo, diferenciação visual entre Tarefas e Eventos, Drag-and-Drop e modal unificado de Evento/Tarefa**
- [x] **Step 4: Rodar `npm test` e `npm run build` para validar testes e bundle**
