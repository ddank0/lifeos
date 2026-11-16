import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Subscription } from 'rxjs';
import { CalendarApiService } from '../../core/api/calendar-api.service';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import {
  AreaItem,
  CalendarEntryItem,
  SaveEventPayload,
  SaveTaskPayload
} from '../../core/auth/auth.models';
import { SignalRService } from '../../core/realtime/signalr.service';

type CalendarViewMode = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
type EntryTypeFilter = 'all' | 'event' | 'task';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  template: `
    <div class="center-col">
      <div class="section-header-row">
        <div>
          <h1 class="section-title">Calendário Integrado</h1>
          <p class="section-subtitle">
            Compromissos com horário e tarefas com prazo unificados por área da vida
          </p>
        </div>

        <div class="calendar-nav-group">
          <button
            type="button"
            class="area-pill btn-mint"
            (click)="openCreateModal('event')"
          >
            + Novo Evento
          </button>
          <button
            type="button"
            class="area-pill btn-coral"
            (click)="openCreateModal('task')"
          >
            + Tarefa com Prazo
          </button>
        </div>
      </div>

      <div class="calendar-toolbar-card">
        <div class="calendar-nav-group">
          <button type="button" class="area-pill" (click)="navigateCalendar('prev')" title="Período anterior">
            <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Anterior</span>
          </button>
          <button type="button" class="area-pill active" (click)="navigateCalendar('today')">Hoje</button>
          <button type="button" class="area-pill" (click)="navigateCalendar('next')" title="Próximo período">
            <span>Próximo</span>
            <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <h2 class="calendar-period-title">{{ currentPeriodTitle() }}</h2>
        </div>

        <div class="calendar-view-switcher">
          <button
            type="button"
            class="area-pill"
            [class.active]="activeView() === 'dayGridMonth'"
            (click)="changeView('dayGridMonth')"
          >
            Mensal
          </button>
          <button
            type="button"
            class="area-pill"
            [class.active]="activeView() === 'timeGridWeek'"
            (click)="changeView('timeGridWeek')"
          >
            Semanal
          </button>
          <button
            type="button"
            class="area-pill"
            [class.active]="activeView() === 'timeGridDay'"
            (click)="changeView('timeGridDay')"
          >
            Diária
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="area-pills">
          <button
            type="button"
            class="area-pill"
            [class.active]="selectedAreaSlug() === 'all'"
            (click)="selectArea('all')"
          >
            Todas as áreas
          </button>
          @for (area of areas(); track area.id) {
            <button
              type="button"
              class="area-pill"
              [class.active]="selectedAreaSlug() === area.slug"
              (click)="selectArea(area.slug)"
            >
              <span
                style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px"
                [style.background]="area.color"
              ></span>
              {{ area.name }}
            </button>
          }
        </div>

        <div class="calendar-nav-group" style="margin-left:auto">
          <button
            type="button"
            class="area-pill"
            [class.active]="selectedEntryType() === 'all'"
            (click)="selectEntryType('all')"
          >
            Todos ({{ totalEntriesCount() }})
          </button>
          <button
            type="button"
            class="area-pill"
            [class.active]="selectedEntryType() === 'event'"
            (click)="selectEntryType('event')"
          >
            Eventos ({{ eventsCount() }})
          </button>
          <button
            type="button"
            class="area-pill"
            [class.active]="selectedEntryType() === 'task'"
            (click)="selectEntryType('task')"
          >
            Tarefas ({{ tasksCount() }})
          </button>
        </div>
      </div>

      <div class="calendar-workspace-grid">
        <div class="calendar-board-card">
          <full-calendar #calendarRef [options]="calendarOptions"></full-calendar>
        </div>

        <aside class="calendar-sidebar-card">
          <div class="tasks-card-header">
            <h3>No Período</h3>
            <span class="tasks-counter">{{ entries().length }} itens</span>
          </div>

          <div class="calendar-legend">
            <span class="calendar-type-badge event inline-icon-text">
              <span class="status-dot"></span>
              <span>Evento (Horário)</span>
            </span>
            <span class="calendar-type-badge task inline-icon-text">
              <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Tarefa (Prazo)</span>
            </span>
          </div>

          <div class="calendar-sidebar-scroll custom-scrollbar">
            @for (item of upcomingEntries(); track item.compositeId) {
              <div
                class="calendar-entry-pill"
                [style.border-left-color]="item.areaColor"
                (click)="openEditFromEntry(item)"
              >
                <div style="display:flex;flex-direction:column;gap:4px">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="calendar-type-badge" [ngClass]="item.entryType">
                      {{ item.entryType === 'event' ? 'Evento' : 'Tarefa' }}
                    </span>
                    <span style="font-size:11.5px;color:var(--text-secondary)">
                      {{ formatEntryDate(item.startAt, item.isAllDay) }}
                    </span>
                    @if (item.isRecurring) {
                      <span class="inline-icon-text" style="font-size:11px;color:var(--accent-mint)">
                        <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                          <path d="M3 3v5h5"/>
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                          <path d="M16 21h5v-5"/>
                        </svg>
                        <span>{{ translateFrequency(item.recurrenceFrequency) }}</span>
                      </span>
                    }
                  </div>
                  <strong
                    style="font-size:13.5px"
                    [style.text-decoration]="item.isCompleted ? 'line-through' : 'none'"
                  >
                    {{ item.title }}
                  </strong>
                  <span style="font-size:11.5px;color:var(--text-secondary)">
                    {{ item.areaName }}
                    @if (item.location) {
                      · {{ item.location }}
                    }
                  </span>
                </div>
              </div>
            } @empty {
              <p class="section-subtitle">
                Nenhuma atividade encontrada para os filtros selecionados neste período. Clique em uma data no calendário para agendar.
              </p>
            }
          </div>
        </aside>
      </div>
    </div>

    @if (modalOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="tasks-card-header">
            <h3 class="modal-title">
              {{ editingSourceId() ? 'Editar Registro no Calendário' : 'Novo Registro no Calendário' }}
            </h3>
            @if (!editingSourceId()) {
              <div class="calendar-nav-group">
                <button
                  type="button"
                  class="area-pill"
                  [class.active]="modalMode() === 'event'"
                  (click)="modalMode.set('event')"
                >
                  Evento
                </button>
                <button
                  type="button"
                  class="area-pill"
                  [class.active]="modalMode() === 'task'"
                  (click)="modalMode.set('task')"
                >
                  Tarefa
                </button>
              </div>
            }
          </div>

          <input
            type="text"
            [(ngModel)]="formTitle"
            placeholder="Título do compromisso ou tarefa..."
            class="form-input"
          />

          <textarea
            [(ngModel)]="formDescription"
            rows="2"
            placeholder="Descrição ou pauta (opcional)..."
            class="form-input"
          ></textarea>

          <div class="form-grid-2">
            <div>
              <label class="form-label">Área da Vida</label>
              <select [(ngModel)]="formAreaId" class="form-select">
                @for (area of areas(); track area.id) {
                  <option [value]="area.id">{{ area.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Recorrência</label>
              <select [(ngModel)]="formRecurrenceFrequency" class="form-select">
                <option value="None">Não se repete</option>
                <option value="Daily">Diariamente</option>
                <option value="Weekly">Semanalmente</option>
                <option value="Monthly">Mensalmente</option>
              </select>
            </div>
          </div>

          @if (modalMode() === 'event') {
            <div class="form-grid-3">
              <div>
                <label class="form-label">Data</label>
                <input type="date" [(ngModel)]="formDate" class="form-input" />
              </div>
              <div>
                <label class="form-label">Início</label>
                <input
                  type="time"
                  [(ngModel)]="formStartTime"
                  [disabled]="formIsAllDay"
                  class="form-input"
                />
              </div>
              <div>
                <label class="form-label">Fim</label>
                <input
                  type="time"
                  [(ngModel)]="formEndTime"
                  [disabled]="formIsAllDay"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-grid-2">
              <div>
                <label class="form-label">Local ou Link</label>
                <input
                  type="text"
                  [(ngModel)]="formLocation"
                  placeholder="Ex: Google Meet, Consultório..."
                  class="form-input"
                />
              </div>
              <div style="display:flex;align-items:center;gap:16px;padding-top:18px">
                <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
                  <input type="checkbox" [(ngModel)]="formIsAllDay" />
                  Dia inteiro
                </label>
                <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
                  <input type="checkbox" [(ngModel)]="formIsHighlighted" />
                  Destacar
                </label>
              </div>
            </div>
          } @else {
            <div class="form-grid-3">
              <div>
                <label class="form-label">Prazo (Data)</label>
                <input type="date" [(ngModel)]="formDate" class="form-input" />
              </div>
              <div>
                <label class="form-label">Horário limite</label>
                <input type="time" [(ngModel)]="formStartTime" class="form-input" />
              </div>
              <div>
                <label class="form-label">Prioridade</label>
                <select [(ngModel)]="formPriority" class="form-select">
                  <option value="Low">Baixa</option>
                  <option value="Medium">Média</option>
                  <option value="High">Alta</option>
                  <option value="Urgent">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label class="form-label">Status da Tarefa</label>
              <select [(ngModel)]="formStatus" class="form-select">
                <option value="Todo">A fazer</option>
                <option value="InProgress">Em andamento</option>
                <option value="OnHold">Em espera</option>
                <option value="Done">Concluído</option>
              </select>
            </div>
          }

          <div class="modal-actions">
            @if (editingSourceId()) {
              <button
                type="button"
                class="area-pill"
                style="margin-right:auto;border-color:var(--accent-coral);color:var(--accent-coral)"
                (click)="deleteCurrentEntry()"
              >
                Excluir
              </button>
            }
            <button type="button" class="area-pill" (click)="closeModal()">Cancelar</button>
            <button type="button" class="area-pill active btn-coral" (click)="saveModalEntry()">
              Salvar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class CalendarPageComponent implements OnInit, OnDestroy {
  @ViewChild('calendarRef') calendarComponent?: FullCalendarComponent;

  private readonly calendarApi = inject(CalendarApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly signalr = inject(SignalRService);
  private realtimeSub?: Subscription;

  readonly areas = signal<AreaItem[]>([]);
  readonly allEntries = signal<CalendarEntryItem[]>([]);
  readonly entries = signal<CalendarEntryItem[]>([]);
  readonly activeView = signal<CalendarViewMode>('dayGridMonth');
  readonly currentPeriodTitle = signal<string>('');
  readonly selectedAreaSlug = signal<string>('all');
  readonly selectedEntryType = signal<EntryTypeFilter>('all');

  private currentRangeFrom = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();
  private currentRangeTo = new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0).toISOString();

  readonly totalEntriesCount = computed(() => this.allEntries().length);
  readonly eventsCount = computed(() => this.allEntries().filter(e => e.entryType === 'event').length);
  readonly tasksCount = computed(() => this.allEntries().filter(e => e.entryType === 'task').length);
  readonly upcomingEntries = computed(() => this.entries());

  readonly modalOpen = signal(false);
  readonly modalMode = signal<'event' | 'task'>('event');
  readonly editingSourceId = signal<string | null>(null);

  formTitle = '';
  formDescription = '';
  formAreaId = '';
  formDate = new Date().toISOString().slice(0, 10);
  formStartTime = '09:00';
  formEndTime = '10:00';
  formLocation = '';
  formIsAllDay = false;
  formIsHighlighted = false;
  formPriority = 'Medium';
  formStatus = 'Todo';
  formRecurrenceFrequency = 'None';

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: false,
    locale: 'pt-br',
    timeZone: 'UTC',
    firstDay: 1,
    editable: true,
    droppable: true,
    eventResizableFromStart: true,
    dayMaxEvents: 3,
    height: 'auto',
    slotMinTime: '06:00:00',
    slotMaxTime: '23:00:00',
    allDayText: 'Dia inteiro',
    events: [],
    datesSet: (arg: DatesSetArg) => this.handleDatesSet(arg),
    dateClick: (arg: DateClickArg) => this.handleDateClick(arg),
    eventClick: (arg: EventClickArg) => this.handleEventClick(arg),
    eventDrop: (arg: EventDropArg) => this.handleEventDrop(arg),
    eventResize: (arg: EventResizeDoneArg) => this.handleEventResize(arg)
  };

  ngOnInit(): void {
    this.dashboardApi.getAreas().subscribe(list => {
      this.areas.set(list);
      if (list.length > 0 && !this.formAreaId) {
        this.formAreaId = list[0].id;
      }
    });

    this.loadCalendarEntries();
    this.signalr.connect();
    this.realtimeSub = this.signalr.changes$.subscribe(() => this.loadCalendarEntries());
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  navigateCalendar(action: 'prev' | 'next' | 'today'): void {
    const api = this.calendarComponent?.getApi();
    if (!api) return;

    if (action === 'prev') api.prev();
    else if (action === 'next') api.next();
    else api.today();
  }

  changeView(view: CalendarViewMode): void {
    this.activeView.set(view);
    const api = this.calendarComponent?.getApi();
    api?.changeView(view);
  }

  selectArea(slug: string): void {
    this.selectedAreaSlug.set(slug);
    this.loadCalendarEntries();
  }

  selectEntryType(type: EntryTypeFilter): void {
    this.selectedEntryType.set(type);
    this.applyEntriesFilter();
  }

  loadCalendarEntries(): void {
    this.calendarApi
      .getEntries({
        from: this.currentRangeFrom,
        to: this.currentRangeTo,
        areaSlug: this.selectedAreaSlug(),
        entryType: 'all'
      })
      .subscribe(items => {
        this.allEntries.set(items);
        this.applyEntriesFilter();
      });
  }

  private applyEntriesFilter(): void {
    const type = this.selectedEntryType();
    const all = this.allEntries();
    const filtered = type === 'all' ? all : all.filter(item => item.entryType === type);
    this.entries.set(filtered);
    this.calendarOptions = {
      ...this.calendarOptions,
      events: filtered.map(item => this.mapToFullCalendarEvent(item))
    };
  }

  openCreateModal(mode: 'event' | 'task', prefillDate?: string, prefillTime?: string): void {
    this.editingSourceId.set(null);
    this.modalMode.set(mode);
    this.formTitle = '';
    this.formDescription = '';
    this.formAreaId = this.areas()[0]?.id ?? '';
    this.formDate = prefillDate ?? new Date().toISOString().slice(0, 10);
    this.formStartTime = prefillTime ?? '09:00';
    this.formEndTime = '10:00';
    this.formLocation = '';
    this.formIsAllDay = false;
    this.formIsHighlighted = false;
    this.formPriority = 'Medium';
    this.formStatus = 'Todo';
    this.formRecurrenceFrequency = 'None';
    this.modalOpen.set(true);
  }

  openEditFromEntry(entry: CalendarEntryItem): void {
    this.editingSourceId.set(entry.sourceId);
    this.modalMode.set(entry.entryType);
    this.formTitle = entry.title;
    this.formDescription = entry.description ?? '';
    this.formAreaId = entry.areaId;
    this.formDate = entry.startAt.slice(0, 10);
    this.formStartTime = entry.startAt.slice(11, 16) || '09:00';
    this.formEndTime = entry.endAt.slice(11, 16) || '10:00';
    this.formLocation = entry.location ?? '';
    this.formIsAllDay = entry.isAllDay;
    this.formIsHighlighted = false;
    this.formPriority = entry.priority ?? 'Medium';
    this.formStatus = entry.status ?? (entry.isCompleted ? 'Done' : 'Todo');
    this.formRecurrenceFrequency = entry.recurrenceFrequency || 'None';
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  saveModalEntry(): void {
    const title = this.formTitle.trim();
    if (!title) return;

    const sourceId = this.editingSourceId();
    if (this.modalMode() === 'event') {
      const startIso = this.formIsAllDay
        ? `${this.formDate}T00:00:00.000Z`
        : `${this.formDate}T${this.formStartTime}:00.000Z`;
      const endIso = this.formIsAllDay
        ? `${this.formDate}T23:59:00.000Z`
        : `${this.formDate}T${this.formEndTime}:00.000Z`;

      const payload: SaveEventPayload = {
        title,
        description: this.formDescription.trim() || null,
        areaId: this.formAreaId,
        location: this.formLocation.trim() || null,
        startAt: startIso,
        endAt: endIso,
        isAllDay: this.formIsAllDay,
        isHighlighted: this.formIsHighlighted,
        subItems: [],
        recurrenceFrequency: this.formRecurrenceFrequency
      };

      const req$ = sourceId
        ? this.dashboardApi.updateEvent(sourceId, payload)
        : this.dashboardApi.createEvent(payload);

      req$.subscribe(() => {
        this.closeModal();
        this.loadCalendarEntries();
      });
      return;
    }

    const taskPayload: SaveTaskPayload = {
      title,
      description: this.formDescription.trim() || null,
      areaId: this.formAreaId,
      priority: this.formPriority,
      status: this.formStatus,
      startDate: this.formDate,
      dueDate: this.formDate,
      dueTime: this.formStartTime || null,
      recurrenceFrequency: this.formRecurrenceFrequency
    };

    const taskReq$ = sourceId
      ? this.dashboardApi.updateTask(sourceId, taskPayload)
      : this.dashboardApi.createTask(taskPayload);

    taskReq$.subscribe(() => {
      this.closeModal();
      this.loadCalendarEntries();
    });
  }

  deleteCurrentEntry(): void {
    const sourceId = this.editingSourceId();
    if (!sourceId) return;

    const req$ =
      this.modalMode() === 'event'
        ? this.dashboardApi.deleteEvent(sourceId)
        : this.dashboardApi.deleteTask(sourceId);

    req$.subscribe(() => {
      this.closeModal();
      this.loadCalendarEntries();
    });
  }

  formatEntryDate(iso: string, isAllDay: boolean): string {
    const datePart = iso.slice(8, 10) + '/' + iso.slice(5, 7);
    if (isAllDay) return `${datePart} · Dia inteiro`;
    return `${datePart} às ${iso.slice(11, 16)}`;
  }

  translateFrequency(freq: string): string {
    if (freq === 'Daily') return 'Diário';
    if (freq === 'Weekly') return 'Semanal';
    if (freq === 'Monthly') return 'Mensal';
    return '';
  }

  private handleDatesSet(arg: DatesSetArg): void {
    this.currentPeriodTitle.set(arg.view.title);
    this.currentRangeFrom = arg.start.toISOString();
    this.currentRangeTo = arg.end.toISOString();
    this.loadCalendarEntries();
  }

  private handleDateClick(arg: DateClickArg): void {
    const dateStr = arg.dateStr.slice(0, 10);
    const timeStr = arg.dateStr.length > 10 ? arg.dateStr.slice(11, 16) : '09:00';
    const defaultMode = this.selectedEntryType() === 'task' ? 'task' : 'event';
    this.openCreateModal(defaultMode, dateStr, timeStr);
  }

  private handleEventClick(arg: EventClickArg): void {
    const entry = arg.event.extendedProps['entry'] as CalendarEntryItem | undefined;
    if (entry) {
      this.openEditFromEntry(entry);
    }
  }

  private handleEventDrop(arg: EventDropArg): void {
    const entry = arg.event.extendedProps['entry'] as CalendarEntryItem | undefined;
    if (!entry || !arg.event.start) return;

    this.calendarApi
      .rescheduleEntry({
        sourceId: entry.sourceId,
        entryType: entry.entryType,
        startAt: arg.event.start.toISOString(),
        endAt: arg.event.end ? arg.event.end.toISOString() : null,
        isAllDay: arg.event.allDay
      })
      .subscribe({
        next: () => this.loadCalendarEntries(),
        error: () => arg.revert()
      });
  }

  private handleEventResize(arg: EventResizeDoneArg): void {
    const entry = arg.event.extendedProps['entry'] as CalendarEntryItem | undefined;
    if (!entry || !arg.event.start) return;

    this.calendarApi
      .rescheduleEntry({
        sourceId: entry.sourceId,
        entryType: entry.entryType,
        startAt: arg.event.start.toISOString(),
        endAt: arg.event.end ? arg.event.end.toISOString() : null,
        isAllDay: arg.event.allDay
      })
      .subscribe({
        next: () => this.loadCalendarEntries(),
        error: () => arg.revert()
      });
  }

  private mapToFullCalendarEvent(item: CalendarEntryItem): EventInput {
    const isTask = item.entryType === 'task';
    const prefix = isTask ? (item.isCompleted ? '[Concluída] ' : '') : '';
    const recurringSuffix = item.isRecurring ? ' (Recorrente)' : '';

    return {
      id: item.compositeId,
      title: `${prefix}${item.title}${recurringSuffix}`,
      start: item.startAt,
      end: item.endAt,
      allDay: item.isAllDay,
      backgroundColor: isTask ? 'rgba(32, 32, 35, 0.92)' : item.areaColor,
      borderColor: item.areaColor,
      textColor: isTask ? '#f4f4f6' : '#18181b',
      extendedProps: {
        entry: item
      }
    };
  }
}
