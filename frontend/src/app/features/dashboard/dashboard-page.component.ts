import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import {
  AreaItem,
  DashboardEventItem,
  DashboardSummary,
  DashboardTaskItem
} from '../../core/auth/auth.models';
import { SignalRService } from '../../core/realtime/signalr.service';

export interface CalendarWeekDay {
  dayLabel: string;
  dayNumber: number;
  dateIso: string;
  isToday: boolean;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    @if (summary(); as data) {
      <main class="bento-grid">
        <section class="left-col">
          <article class="diary-card" routerLink="/inbox">
            <div class="diary-cover">
              <span class="diary-cover-badge">Caixa de Entrada · Rápida</span>
            </div>
            <div class="diary-footer">
              <div>
                <h3>Caixa de Entrada</h3>
                <p>{{ data.unprocessedNotesCount }} notas registradas</p>
              </div>
              <div class="circle-arrow-btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          </article>

          <article class="requests-card" routerLink="/kanban">
            <div>
              <h3>{{ data.overdueTasksCount }} Atrasadas</h3>
              <p>Confirmar ou reagendar tarefas</p>
            </div>
            <div class="circle-arrow-btn" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </article>

          <article class="habit-card">
            <div class="habit-percent">{{ data.weeklyHabitSuccessRate }}%</div>
            <div class="habit-subtitle">Taxa de sucesso dos hábitos</div>
            <div class="habit-bars">
              @for (bar of data.dailyHabitBars; track bar.dayLabel) {
                <div class="habit-col">
                  <span class="habit-col-val">{{ bar.percentage }}%</span>
                  <div class="habit-bar-track">
                    <div
                      class="habit-bar-fill"
                      [class.today]="bar.isToday"
                      [style.height.%]="bar.percentage"
                    ></div>
                  </div>
                  <span class="habit-col-day">{{ bar.dayLabel }}</span>
                </div>
              }
            </div>
          </article>
        </section>

        <section class="center-col">
          <div class="section-header-row">
            <h1 class="section-title">Minhas Tarefas</h1>
            <button
              type="button"
              class="big-plus-btn"
              (click)="openTaskModal()"
              title="Nova Tarefa"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <div class="area-pills">
            <button
              type="button"
              class="area-pill"
              [class.active]="selectedAreaSlug() === 'all'"
              (click)="selectArea('all')"
            >
              Todas ({{ data.totalActiveTasksCount }})
            </button>
            @for (area of areas(); track area.id) {
              <button
                type="button"
                class="area-pill"
                [class.active]="selectedAreaSlug() === area.slug"
                (click)="selectArea(area.slug)"
              >
                {{ area.name }}
              </button>
            }
          </div>

          <div class="filter-bar">
            <select
              class="filter-select"
              [ngModel]="selectedPriority()"
              (ngModelChange)="selectPriority($event)"
            >
              <option value="all">Prioridade: Todas</option>
              <option value="Urgent">Urgente</option>
              <option value="High">Alta</option>
              <option value="Medium">Média</option>
              <option value="Low">Baixa</option>
            </select>

            <select
              class="filter-select"
              [ngModel]="selectedStatus()"
              (ngModelChange)="selectStatus($event)"
            >
              <option value="all">Status: Todos</option>
              <option value="Todo">A fazer</option>
              <option value="InProgress">Em andamento</option>
              <option value="OnHold">Em espera</option>
              <option value="Done">Concluído</option>
            </select>
          </div>

          <div class="today-tasks-card">
            <div class="tasks-card-header">
              <h3>Hoje</h3>
              <div class="tasks-counter">
                <button
                  type="button"
                  class="icon-action-btn"
                  (click)="openTaskModal('today')"
                  title="Nova tarefa para hoje"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <span>{{ completedTodayCount(data) }}/{{ data.todayTasks.length }}</span>
              </div>
            </div>

            <div class="tasks-scroll-list custom-scrollbar">
              @for (task of data.todayTasks; track task.id) {
                <div
                  class="task-row"
                  [class.done]="task.isCompleted"
                  (click)="toggleTask(task.id)"
                >
                  <div class="task-left">
                    <span class="check-circle">
                      @if (task.isCompleted) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      }
                    </span>
                    <span class="task-title">{{ task.title }}</span>
                  </div>
                  <div class="task-actions">
                    <span class="task-area-chip">{{ task.areaName }}</span>
                    <button
                      type="button"
                      class="icon-action-btn"
                      title="Editar tarefa"
                      (click)="$event.stopPropagation(); editTask(task)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="icon-action-btn"
                      title="Excluir tarefa"
                      (click)="$event.stopPropagation(); removeTask(task.id)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="tomorrow-tasks-card">
            <div class="tasks-card-header">
              <h3>Amanhã</h3>
              <div class="tasks-counter">
                <button
                  type="button"
                  class="icon-action-btn"
                  (click)="openTaskModal('tomorrow')"
                  title="Nova tarefa para amanhã"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <span>{{ completedTomorrowCount(data) }}/{{ data.tomorrowTasks.length }}</span>
              </div>
            </div>

            <div class="tasks-scroll-list custom-scrollbar">
              @for (task of data.tomorrowTasks; track task.id) {
                <div
                  class="task-row"
                  [class.done]="task.isCompleted"
                  (click)="toggleTask(task.id)"
                >
                  <div class="task-left">
                    <span class="check-circle">
                      @if (task.isCompleted) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      }
                    </span>
                    <span class="task-title">{{ task.title }}</span>
                  </div>
                  <div class="task-actions">
                    <span class="task-area-chip">{{ task.areaName }}</span>
                    <button
                      type="button"
                      class="icon-action-btn"
                      title="Editar tarefa"
                      (click)="$event.stopPropagation(); editTask(task)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="icon-action-btn"
                      title="Excluir tarefa"
                      (click)="$event.stopPropagation(); removeTask(task.id)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>

        <aside class="calendar-panel">
          <div class="calendar-header">
            <a routerLink="/calendar" class="calendar-header-link" title="Abrir Calendário Dedicado">
              <h3>Calendário</h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs link-arrow" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
            <button
              type="button"
              class="big-plus-btn sm"
              (click)="openEventModal()"
              title="Novo Evento"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          <div class="week-strip">
            @for (day of calendarDays(); track day.dateIso) {
              <div
                class="day-tab"
                [class.active]="selectedCalendarDate() === day.dateIso"
                (click)="selectCalendarDay(day.dateIso)"
                (keydown.enter)="selectCalendarDay(day.dateIso)"
                (keydown.space)="selectCalendarDay(day.dateIso)"
                role="button"
                tabindex="0"
                [attr.aria-pressed]="selectedCalendarDate() === day.dateIso"
                [title]="day.isToday ? 'Hoje (' + day.dateIso + ')' : day.dateIso"
              >
                <span class="dow">{{ day.dayLabel }}</span>
                <span class="dom">{{ day.dayNumber }}</span>
              </div>
            }
          </div>

          <div class="calendar-events-scroll custom-scrollbar">
            @if (hasEventsForSelectedDay(data)) {
              @for (period of ['Manhã', 'Tarde', 'Noite']; track period) {
                @if (eventsByPeriod(data, period).length > 0) {
                  <div class="period-label">{{ period }}</div>
                  @for (ev of eventsByPeriod(data, period); track ev.id) {
                    <div class="event-card" [class.featured]="ev.isHighlighted" [class.is-done]="ev.isCompleted">
                      <div class="event-time-col">
                        <span class="event-time">{{ ev.timeLabel }}</span>
                        <span class="event-area-tag">{{ ev.areaName }}</span>
                      </div>
                      <div class="event-body-col">
                        <div class="event-title-row">
                          <div
                            class="task-left event-toggle-area"
                            (click)="toggleEventCompleted(ev)"
                            role="button"
                            tabindex="0"
                            (keydown.enter)="toggleEventCompleted(ev)"
                            (keydown.space)="toggleEventCompleted(ev)"
                            [title]="ev.isCompleted ? 'Desmarcar evento' : 'Marcar evento como concluído'"
                          >
                            <span class="check-circle" [class.checked]="ev.isCompleted">
                              @if (ev.isCompleted) {
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              }
                            </span>
                            <span class="event-title-text" [class.done-text]="ev.isCompleted">{{ ev.title }}</span>
                          </div>
                          <button
                            type="button"
                            class="icon-action-btn"
                            [title]="ev.entryType === 'task' ? 'Excluir tarefa' : 'Excluir evento'"
                            (click)="removeEvent(ev)"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        @if (ev.subItems.length > 0) {
                          <ul class="event-sublist">
                            @for (sub of ev.subItems; track sub) {
                              <li>{{ sub }}</li>
                            }
                          </ul>
                        }
                      </div>
                    </div>
                  }
                }
              }
            } @else {
              <div class="calendar-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="empty-calendar-icon" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p class="empty-calendar-text">Nenhum compromisso agendado para este dia.</p>
                <button
                  type="button"
                  class="area-pill btn-mint sm"
                  (click)="openEventModal()"
                  title="Novo compromisso para este dia"
                >
                  + Agendar Evento
                </button>
              </div>
            }
          </div>
        </aside>
      </main>
    }

    @if (isTaskModalOpen()) {
      <div class="modal-backdrop" (click)="isTaskModalOpen.set(false)">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <h3 class="modal-title">
            {{ editingTaskId() ? 'Editar Tarefa' : 'Nova Tarefa' }}
          </h3>

          <input
            type="text"
            class="form-input"
            [(ngModel)]="taskForm.title"
            placeholder="Título da tarefa"
          />

          <textarea
            class="form-input"
            [(ngModel)]="taskForm.description"
            rows="2"
            placeholder="Descrição opcional..."
          ></textarea>

          <div class="form-grid-2">
            <div>
              <label class="form-label">Área da Vida</label>
              <select class="form-select" [(ngModel)]="taskForm.areaId">
                @for (area of areas(); track area.id) {
                  <option [value]="area.id">{{ area.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Prioridade</label>
              <select class="form-select" [(ngModel)]="taskForm.priority">
                <option value="Low">Baixa</option>
                <option value="Medium">Média</option>
                <option value="High">Alta</option>
                <option value="Urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div class="form-grid-3">
            <div>
              <label class="form-label">Status</label>
              <select class="form-select" [(ngModel)]="taskForm.status">
                <option value="Todo">A fazer</option>
                <option value="InProgress">Em andamento</option>
                <option value="OnHold">Em espera</option>
                <option value="Done">Concluído</option>
              </select>
            </div>
            <div>
              <label class="form-label">Prazo</label>
              <input type="date" class="form-input" [(ngModel)]="taskForm.dueDate" />
            </div>
            <div>
              <label class="form-label">Horário</label>
              <input type="time" class="form-input" [(ngModel)]="taskForm.dueTime" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="area-pill" (click)="isTaskModalOpen.set(false)">
              Cancelar
            </button>
            <button type="button" class="area-pill btn-coral" (click)="saveTaskForm()">
              Salvar Tarefa
            </button>
          </div>
        </div>
      </div>
    }

    @if (isEventModalOpen()) {
      <div class="modal-backdrop" (click)="isEventModalOpen.set(false)">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Novo Compromisso / Evento</h3>

          <input
            type="text"
            class="form-input"
            [(ngModel)]="eventForm.title"
            placeholder="Título do compromisso (ex: Reunião de arquitetura)"
          />

          <div class="form-grid-3">
            <div>
              <label class="form-label">Área</label>
              <select class="form-select" [(ngModel)]="eventForm.areaId">
                @for (area of areas(); track area.id) {
                  <option [value]="area.id">{{ area.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Data</label>
              <input type="date" class="form-input" [(ngModel)]="eventForm.date" />
            </div>
            <div>
              <label class="form-label">Horário (HH:mm)</label>
              <input type="time" class="form-input" [(ngModel)]="eventForm.time" />
            </div>
          </div>

          <input
            type="text"
            class="form-input"
            [(ngModel)]="eventForm.subItemsText"
            placeholder="Subitens separados por vírgula (ex: Revisar pauta, Alinhar entrega)"
          />

          <label class="task-left section-subtitle">
            <input type="checkbox" [(ngModel)]="eventForm.isHighlighted" />
            <span>Destacar este compromisso em Coral no calendário</span>
          </label>

          <div class="modal-actions">
            <button type="button" class="area-pill" (click)="isEventModalOpen.set(false)">
              Cancelar
            </button>
            <button type="button" class="area-pill btn-mint" (click)="saveEventForm()">
              Salvar Evento
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly signalR = inject(SignalRService);

  readonly areas = signal<AreaItem[]>([]);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly selectedAreaSlug = signal<string>('all');
  readonly selectedPriority = signal<string>('all');
  readonly selectedStatus = signal<string>('all');

  readonly isTaskModalOpen = signal(false);
  readonly editingTaskId = signal<string | null>(null);
  readonly isEventModalOpen = signal(false);

  readonly selectedCalendarDate = signal<string>(this.formatDateIso(new Date()));
  readonly calendarDays = signal<CalendarWeekDay[]>(this.buildCurrentWeekDays());

  taskForm = {
    title: '',
    description: '',
    areaId: '',
    priority: 'Medium',
    status: 'Todo',
    dueDate: '',
    dueTime: ''
  };

  eventForm = {
    title: '',
    areaId: '',
    date: this.formatDateIso(new Date()),
    time: '14:00',
    subItemsText: '',
    isHighlighted: false
  };

  ngOnInit(): void {
    this.loadData();
    this.signalR.changes$.subscribe(() => this.loadData());
  }

  loadData(): void {
    this.api.getAreas().subscribe((list) => {
      this.areas.set(list);
      if (!this.taskForm.areaId && list.length > 0) {
        this.taskForm.areaId = list[0].id;
        this.eventForm.areaId = list[0].id;
      }
    });

    this.api
      .getSummary({
        areaSlug: this.selectedAreaSlug(),
        priority: this.selectedPriority(),
        status: this.selectedStatus()
      })
      .subscribe((res) => this.summary.set(res));
  }

  selectArea(slug: string): void {
    this.selectedAreaSlug.set(slug);
    this.loadData();
  }

  selectPriority(prio: string): void {
    this.selectedPriority.set(prio);
    this.loadData();
  }

  selectStatus(status: string): void {
    this.selectedStatus.set(status);
    this.loadData();
  }

  toggleTask(taskId: string): void {
    const cur = this.summary();
    if (cur) {
      const updatedToday = cur.todayTasks.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      );
      const updatedTomorrow = cur.tomorrowTasks.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      );
      this.summary.set({
        ...cur,
        todayTasks: updatedToday,
        tomorrowTasks: updatedTomorrow
      });
    }
    this.api.toggleTask(taskId).subscribe(() => this.loadData());
  }

  openTaskModal(target: 'today' | 'tomorrow' = 'today'): void {
    this.editingTaskId.set(null);
    const targetDate = new Date();
    if (target === 'tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    this.taskForm = {
      title: '',
      description: '',
      areaId: this.areas()[0]?.id ?? '',
      priority: 'Medium',
      status: 'Todo',
      dueDate: targetDate.toISOString().slice(0, 10),
      dueTime: ''
    };
    this.isTaskModalOpen.set(true);
  }

  editTask(task: DashboardTaskItem): void {
    this.editingTaskId.set(task.id);
    this.taskForm = {
      title: task.title,
      description: '',
      areaId: task.areaId,
      priority: task.priority || 'Medium',
      status: task.status || 'Todo',
      dueDate: task.dueDate ?? new Date().toISOString().slice(0, 10),
      dueTime: ''
    };
    this.isTaskModalOpen.set(true);
  }

  saveTaskForm(): void {
    const title = this.taskForm.title.trim();
    if (!title || !this.taskForm.areaId) {
      return;
    }

    const payload = {
      title,
      description: this.taskForm.description.trim() || null,
      areaId: this.taskForm.areaId,
      priority: this.taskForm.priority,
      status: this.taskForm.status,
      dueDate: this.taskForm.dueDate || null,
      dueTime: this.taskForm.dueTime || null
    };

    const id = this.editingTaskId();
    const request$ = id ? this.api.updateTask(id, payload) : this.api.createTask(payload);
    request$.subscribe(() => {
      this.isTaskModalOpen.set(false);
      this.loadData();
    });
  }

  removeTask(taskId: string): void {
    this.api.deleteTask(taskId).subscribe(() => this.loadData());
  }

  formatDateIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  buildCurrentWeekDays(baseDate: Date = new Date()): CalendarWeekDay[] {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const todayIso = this.formatDateIso(new Date());

    const sunday = new Date(baseDate);
    sunday.setHours(0, 0, 0, 0);
    sunday.setDate(baseDate.getDate() - baseDate.getDay());

    const days: CalendarWeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateIso = this.formatDateIso(d);
      days.push({
        dayLabel: labels[i],
        dayNumber: d.getDate(),
        dateIso,
        isToday: dateIso === todayIso
      });
    }
    return days;
  }

  selectCalendarDay(dateIso: string): void {
    this.selectedCalendarDate.set(dateIso);
  }

  hasEventsForSelectedDay(data: DashboardSummary): boolean {
    const selectedDate = this.selectedCalendarDate();
    const todayIso = this.formatDateIso(new Date());
    return data.todayEvents.some((e) => {
      if (e.date) {
        return e.date === selectedDate;
      }
      return selectedDate === todayIso;
    });
  }

  openEventModal(): void {
    this.eventForm = {
      title: '',
      areaId: this.areas()[0]?.id ?? '',
      date: this.selectedCalendarDate() || this.formatDateIso(new Date()),
      time: '14:00',
      subItemsText: '',
      isHighlighted: false
    };
    this.isEventModalOpen.set(true);
  }

  saveEventForm(): void {
    const title = this.eventForm.title.trim();
    if (!title || !this.eventForm.areaId) {
      return;
    }

    const eventDate =
      this.eventForm.date || this.selectedCalendarDate() || this.formatDateIso(new Date());
    const startAt = `${eventDate}T${this.eventForm.time || '14:00'}:00Z`;
    const subItems = this.eventForm.subItemsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.api
      .createEvent({
        title,
        areaId: this.eventForm.areaId,
        startAt,
        endAt: startAt,
        isAllDay: false,
        isHighlighted: this.eventForm.isHighlighted,
        subItems
      })
      .subscribe(() => {
        this.isEventModalOpen.set(false);
        this.loadData();
      });
  }

  removeEvent(ev: DashboardEventItem): void {
    const request$ =
      ev.entryType === 'task'
        ? (this.api.deleteTask(ev.id) as Observable<unknown>)
        : (this.api.deleteEvent(ev.id) as Observable<unknown>);
    request$.subscribe(() => this.loadData());
  }

  toggleEventCompleted(ev: DashboardEventItem): void {
    const cur = this.summary();
    if (cur) {
      const updatedEvents = cur.todayEvents.map((e) =>
        e.id === ev.id ? { ...e, isCompleted: !e.isCompleted } : e
      );
      const updatedToday = cur.todayTasks.map((t) =>
        t.id === ev.id ? { ...t, isCompleted: !t.isCompleted } : t
      );
      const updatedTomorrow = cur.tomorrowTasks.map((t) =>
        t.id === ev.id ? { ...t, isCompleted: !t.isCompleted } : t
      );
      this.summary.set({
        ...cur,
        todayEvents: updatedEvents,
        todayTasks: updatedToday,
        tomorrowTasks: updatedTomorrow
      });
    }
    const request$ =
      ev.entryType === 'task'
        ? (this.api.toggleTask(ev.id) as Observable<unknown>)
        : (this.api.toggleEvent(ev.id) as Observable<unknown>);
    request$.subscribe(() => this.loadData());
  }

  completedTodayCount(data: DashboardSummary): number {
    return data.todayTasks.filter((t) => t.isCompleted).length;
  }

  completedTomorrowCount(data: DashboardSummary): number {
    return data.tomorrowTasks.filter((t) => t.isCompleted).length;
  }

  eventsByPeriod(data: DashboardSummary, period: string): DashboardEventItem[] {
    const selectedDate = this.selectedCalendarDate();
    const todayIso = this.formatDateIso(new Date());
    return data.todayEvents.filter((e) => {
      if (e.period !== period) {
        return false;
      }
      if (e.date) {
        return e.date === selectedDate;
      }
      return selectedDate === todayIso;
    });
  }
}
