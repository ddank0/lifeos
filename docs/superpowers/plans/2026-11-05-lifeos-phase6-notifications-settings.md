# LIFEOS - Fase 6 (Lembretes, Notificações, Jobs Hangfire e Configurações/Produtividade) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema de Lembretes agendados e Notificações em tempo real (com job recorrente no Hangfire), o Relatório de Produtividade por Área e o módulo de Configurações do Usuário.

**Architecture:**
- **Backend (`LifeOs.Application` & `LifeOs.Api`):**
  - `INotificationService` / `NotificationService` e `NotificationsController` (`/api/v1/notifications`) para agendar lembretes (`Reminder`), processar lembretes vencidos gerando notificações (`Notification`) e disparando alertas via SignalR (`ProcessDueRemindersAsync`), além de marcar notificações como lidas.
  - `ISettingsService` / `SettingsService` e `SettingsController` (`/api/v1/settings`) para atualizar preferências do perfil (`FullName`, `ThemePreference`) e calcular o relatório consolidado de produtividade por área (`ProductivityReportDto`).
  - Registro do job recorrente `process-due-reminders` no Hangfire em `Program.cs`.
- **Frontend (`Angular 19`):**
  - Criação de `NotificationsSettingsApiService` (`core/api/notifications-settings-api.service.ts`) e testes unitários (`notifications-settings-api.service.spec.ts`).
  - Criação de `SettingsPageComponent` (`features/settings/settings-page.component.ts`) integrando Central de Notificações, Agendador de Lembretes, Relatório de Produtividade por Área e Preferências do Perfil.
  - Atualização de `TopbarComponent` e `app.routes.ts` com acesso rápido a Caixa de Entrada, Notificações e Configurações.

---

### Task 1: Serviços Backend de Notificações, Lembretes, Produtividade e Configurações (TDD)

**Files:**
- Create: `backend/src/LifeOs.Application/Notifications/DTOs/NotificationDtos.cs`
- Create: `backend/src/LifeOs.Application/Notifications/Services/NotificationService.cs`
- Create: `backend/src/LifeOs.Api/Controllers/NotificationsController.cs`
- Create: `backend/src/LifeOs.Application/Settings/DTOs/SettingsDtos.cs`
- Create: `backend/src/LifeOs.Application/Settings/Services/SettingsService.cs`
- Create: `backend/src/LifeOs.Api/Controllers/SettingsController.cs`
- Modify: `backend/src/LifeOs.Application/DependencyInjection.cs`
- Modify: `backend/src/LifeOs.Api/Program.cs`
- Create: `backend/tests/LifeOs.Tests/Integration/Phase6NotificationsAndSettingsIntegrationTests.cs`

- [x] **Step 1: Escrever teste de integração em `Phase6NotificationsAndSettingsIntegrationTests.cs` validando agendamento e processamento de lembretes, leitura de notificações, atualização de perfil/tema e relatório de produtividade**
- [x] **Step 2: Implementar DTOs, Services, Controllers e registrar o job recorrente no Hangfire**
- [x] **Step 3: Executar `dotnet test LifeOs.sln` e confirmar 100% dos testes aprovados sem warnings**

---

### Task 2: Módulo Frontend de Configurações, Notificações e Relatório de Produtividade

**Files:**
- Modify: `frontend/src/app/core/auth/auth.models.ts`
- Create: `frontend/src/app/core/api/notifications-settings-api.service.ts`
- Create: `frontend/src/app/core/api/notifications-settings-api.service.spec.ts`
- Create: `frontend/src/app/features/settings/settings-page.component.ts`
- Modify: `frontend/src/app/app.routes.ts`
- Modify: `frontend/src/app/layout/topbar.component.ts`

- [x] **Step 1: Criar `NotificationsSettingsApiService` e teste unitário `notifications-settings-api.service.spec.ts`**
- [x] **Step 2: Implementar `SettingsPageComponent` e atualizar `app.routes.ts` e `topbar.component.ts`**
- [x] **Step 3: Executar `npm test && npm run build` para validar todos os testes e o build de produção**
