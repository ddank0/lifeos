import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { NotificationsSettingsApiService } from '../../core/api/notifications-settings-api.service';
import {
  NotificationCenterData,
  SettingsOverviewData,
  TaskDetailItem
} from '../../core/auth/auth.models';
import { SignalRService } from '../../core/realtime/signalr.service';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="center-col">
      <div class="section-header-row">
        <div>
          <h1 class="section-title">Produtividade, Lembretes e Configurações</h1>
          <p class="section-subtitle">
            Relatório consolidado por áreas da vida, central de notificações em tempo real e preferências
          </p>
        </div>
      </div>

      @if (overview(); as data) {
        <div class="area-grid">
          <div class="module-card">
            <span class="form-label">Taxa Geral de Conclusão</span>
            <strong style="font-size:38px;color:var(--accent-mint)">
              {{ data.productivity.overallCompletionRatePercent }}%
            </strong>
            <span class="section-subtitle">
              {{ data.productivity.completedTasksCount }} concluídas de {{ data.productivity.totalTasksCount }} tarefas
            </span>
          </div>

          <div class="module-card">
            <span class="form-label">Tarefas Pendentes e Atrasadas</span>
            <strong style="font-size:38px;color:var(--accent-coral)">
              {{ data.productivity.pendingTasksCount }}
            </strong>
            <span class="section-subtitle">
              {{ data.productivity.overdueTasksCount }} atrasadas exigindo atenção
            </span>
          </div>

          <div class="module-card">
            <span class="form-label">Projetos Ativos</span>
            <strong style="font-size:38px;color:var(--accent-sky)">
              {{ data.productivity.activeProjectsCount }}
            </strong>
            <span class="section-subtitle">Metas estruturadas em andamento</span>
          </div>

          <div class="module-card">
            <span class="form-label">Hábitos Ativos · Melhor Streak</span>
            <strong style="font-size:38px;color:var(--accent-purple);display:flex;align-items:center;gap:8px">
              <svg class="ui-icon" style="width:28px;height:28px;color:var(--accent-coral)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
              <span>{{ data.productivity.bestHabitStreak }}d</span>
            </strong>
            <span class="section-subtitle">{{ data.productivity.activeHabitsCount }} hábitos monitorados</span>
          </div>
        </div>

        <div class="calendar-workspace-grid">
          <div class="center-col">
            <div class="module-card">
              <h3 class="modal-title">Desempenho por Área da Vida</h3>
              @for (area of data.productivity.areaBreakdown; track area.areaId) {
                <div style="display:flex;flex-direction:column;gap:6px">
                  <div class="kanban-card-meta" style="font-size:13.5px">
                    <strong [style.color]="area.areaColor">{{ area.areaName }}</strong>
                    <span>
                      {{ area.completedTasksCount }} concluídas · {{ area.pendingTasksCount }} pendentes ·
                      {{ area.upcomingEventsCount }} eventos ({{ area.completionRatePercent }}%)
                    </span>
                  </div>
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      [style.width.%]="area.completionRatePercent"
                      [style.background]="area.areaColor"
                    ></div>
                  </div>
                </div>
              }
            </div>

            <div class="module-card">
              <div class="tasks-card-header">
                <h3 class="modal-title">Central de Notificações ({{ center()?.unreadCount ?? 0 }} não lidas)</h3>
                <button type="button" class="area-pill" (click)="markAllNotificationsRead()">
                  Marcar todas como lidas
                </button>
              </div>

              @if (center(); as notifCenter) {
                @for (item of notifCenter.notifications; track item.id) {
                  <div
                    class="calendar-entry-pill"
                    [style.border-left-color]="item.isRead ? 'var(--border-subtle)' : 'var(--accent-coral)'"
                    (click)="markNotificationRead(item.id)"
                  >
                    <div>
                      <strong style="font-size:14px">{{ item.title }}</strong>
                      <p style="font-size:12.5px;color:var(--text-secondary)">{{ item.message }}</p>
                    </div>
                    @if (!item.isRead) {
                      <span class="kanban-badge urgent">Nova</span>
                    }
                  </div>
                } @empty {
                  <p class="section-subtitle">Nenhuma notificação disparada até o momento.</p>
                }
              }
            </div>
          </div>

          <aside class="center-col">
            <div class="module-card">
              <h3 class="modal-title">Agendar Lembrete (Hangfire)</h3>
              <div>
                <label class="form-label">Tarefa Vinculada</label>
                <select [(ngModel)]="reminderTaskId" class="form-select">
                  @for (t of tasks(); track t.id) {
                    <option [value]="t.id">{{ t.title }}</option>
                  }
                </select>
              </div>

              <div class="form-grid-2">
                <div>
                  <label class="form-label">Data</label>
                  <input type="date" [(ngModel)]="reminderDate" class="form-input" />
                </div>
                <div>
                  <label class="form-label">Horário</label>
                  <input type="time" [(ngModel)]="reminderTime" class="form-input" />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="area-pill" (click)="triggerDueRemindersNow()">
                  Processar Agora
                </button>
                <button type="button" class="area-pill btn-mint" (click)="scheduleReminder()">
                  + Agendar Lembrete
                </button>
              </div>
            </div>

            <div class="module-card">
              <h3 class="modal-title">Perfil e Aparência</h3>
              <div>
                <label class="form-label">Nome de Exibição</label>
                <input type="text" [(ngModel)]="profileName" class="form-input" />
              </div>
              <div>
                <label class="form-label">Tema Padrão</label>
                <select [(ngModel)]="profileTheme" class="form-select">
                  <option value="dark">Escuro (Bento Dark - Padrão)</option>
                  <option value="light">Claro (Bento Light)</option>
                </select>
              </div>
              <div class="modal-actions">
                <button type="button" class="area-pill btn-coral" (click)="saveProfileSettings()">
                  Salvar Preferências
                </button>
              </div>
            </div>
          </aside>
        </div>
      }
    </section>
  `
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  private readonly settingsApi = inject(NotificationsSettingsApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly signalr = inject(SignalRService);
  private realtimeSub?: Subscription;

  readonly overview = signal<SettingsOverviewData | null>(null);
  readonly center = signal<NotificationCenterData | null>(null);
  readonly tasks = signal<TaskDetailItem[]>([]);

  profileName = '';
  profileTheme: 'dark' | 'light' = 'dark';

  reminderTaskId = '';
  reminderDate = new Date().toISOString().slice(0, 10);
  reminderTime = '09:00';

  ngOnInit(): void {
    this.loadAll();
    this.dashboardApi.getTasks().subscribe(list => {
      this.tasks.set(list);
      if (list.length > 0 && !this.reminderTaskId) {
        this.reminderTaskId = list[0].id;
      }
    });
    this.signalr.connect();
    this.realtimeSub = this.signalr.changes$.subscribe(() => this.loadAll());
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  loadAll(): void {
    this.settingsApi.getSettingsOverview().subscribe(res => {
      this.overview.set(res);
      this.profileName = res.fullName;
      this.profileTheme = res.themePreference;
    });

    this.settingsApi.getNotificationCenter().subscribe(res => this.center.set(res));
  }

  scheduleReminder(): void {
    if (!this.reminderTaskId) return;
    const remindAt = this.settingsApi.formatReminderIso(this.reminderDate, this.reminderTime);
    this.settingsApi
      .createReminder({
        taskId: this.reminderTaskId,
        remindAt
      })
      .subscribe(() => this.loadAll());
  }

  triggerDueRemindersNow(): void {
    this.settingsApi.processDueReminders().subscribe(() => this.loadAll());
  }

  markNotificationRead(id: string): void {
    this.settingsApi.markAsRead(id).subscribe(() => this.loadAll());
  }

  markAllNotificationsRead(): void {
    this.settingsApi.markAllAsRead().subscribe(() => this.loadAll());
  }

  saveProfileSettings(): void {
    if (!this.profileName.trim()) return;
    this.settingsApi
      .updateProfile({
        fullName: this.profileName.trim(),
        themePreference: this.profileTheme
      })
      .subscribe(res => {
        this.overview.set(res);
        this.authService.updateCurrentUserProfile(res.fullName, res.themePreference);
        if (this.themeService.currentTheme() !== res.themePreference) {
          this.themeService.toggleTheme();
        }
      });
  }
}
