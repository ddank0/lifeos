import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { AreaItem, EventDetailItem, TaskDetailItem } from '../../core/auth/auth.models';

@Component({
  selector: 'app-areas-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="center-col">
      <div class="section-header-row">
        <div>
          <h1 class="section-title">Minhas Áreas da Vida</h1>
          <p class="section-subtitle">
            Cada área possui sua própria organização, compartilhando a visão integrada do LIFEOS.
          </p>
        </div>
        <button type="button" class="big-plus-btn" (click)="openNewAreaModal()" title="Nova Área">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      <div class="area-grid">
        @for (area of areas(); track area.id) {
          <article
            class="area-card"
            [style.background]="area.color"
            (click)="inspectArea(area)"
          >
            <div>
              <div class="section-header-row">
                <span class="task-area-chip">
                  {{ area.isDefault ? 'Área Padrão' : 'Personalizada' }}
                </span>
                <div class="task-actions" (click)="$event.stopPropagation()">
                  <button
                    type="button"
                    class="area-icon-btn"
                    title="Editar área"
                    (click)="openEditAreaModal(area)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </button>
                  @if (!area.isDefault) {
                    <button
                      type="button"
                      class="area-icon-btn"
                      title="Excluir área"
                      (click)="deleteArea(area.id)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  }
                </div>
              </div>
              <h3 class="modal-title" style="margin-top:10px">{{ area.name }}</h3>
              <p style="font-size:13px;opacity:0.82;margin-top:6px">
                {{ area.description || 'Sem descrição adicional' }}
              </p>
            </div>

            <div class="section-header-row" style="margin-top:18px;font-weight:700;font-size:12.5px">
              <span>{{ area.pendingTasksCount }} pendentes · {{ area.completedTasksCount || 0 }} concluídas</span>
              <span class="circle-arrow-btn" style="width:36px;height:36px" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </div>
          </article>
        }
      </div>

      @if (selectedArea(); as activeArea) {
        <div class="module-card">
          <div class="section-header-row">
            <div class="task-left">
              <span
                style="width:14px;height:14px;border-radius:50%;display:inline-block"
                [style.background]="activeArea.color"
              ></span>
              <h2 class="modal-title">Visão da Área: {{ activeArea.name }}</h2>
            </div>
            <span class="section-subtitle">
              {{ areaTasks().length }} tarefas · {{ areaEvents().length }} eventos
            </span>
          </div>

          <div class="form-grid-2">
            <div class="left-col">
              <h4 class="form-label">Tarefas da Área</h4>
              @for (task of areaTasks(); track task.id) {
                <div class="kanban-item">
                  <div class="section-header-row">
                    <span [style.textDecoration]="task.isCompleted ? 'line-through' : 'none'">
                      {{ task.title }}
                    </span>
                    <span class="section-subtitle">{{ task.priority }} · {{ task.status }}</span>
                  </div>
                </div>
              }
            </div>
            <div class="left-col">
              <h4 class="form-label">Eventos da Área</h4>
              @for (ev of areaEvents(); track ev.id) {
                <div class="kanban-item">
                  <div class="section-header-row">
                    <span>{{ ev.title }}</span>
                    <strong class="event-time">{{ ev.timeLabel }}</strong>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </section>

    @if (isModalOpen()) {
      <div class="modal-backdrop" (click)="isModalOpen.set(false)">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <h3 class="modal-title">
            {{ editingAreaId() ? 'Editar Área' : 'Nova Área da Vida' }}
          </h3>

          <input
            type="text"
            class="form-input"
            [(ngModel)]="form.name"
            placeholder="Nome da área (ex: Finanças, Família)"
          />

          <input
            type="text"
            class="form-input"
            [(ngModel)]="form.description"
            placeholder="Descrição breve da área"
          />

          <div>
            <label class="form-label">Cor Identificadora (Paleta LIFEOS)</label>
            <div class="filter-bar">
              @for (color of paletteColors; track color) {
                <button
                  type="button"
                  style="width:34px;height:34px;border-radius:50%;cursor:pointer;border:2px solid transparent"
                  [style.background]="color"
                  [style.borderColor]="form.color === color ? '#ffffff' : 'transparent'"
                  (click)="form.color = color"
                ></button>
              }
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="area-pill" (click)="isModalOpen.set(false)">
              Cancelar
            </button>
            <button type="button" class="area-pill btn-coral" (click)="saveArea()">
              Salvar Área
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AreasPageComponent implements OnInit {
  private readonly api = inject(DashboardApiService);

  readonly areas = signal<AreaItem[]>([]);
  readonly selectedArea = signal<AreaItem | null>(null);
  readonly areaTasks = signal<TaskDetailItem[]>([]);
  readonly areaEvents = signal<EventDetailItem[]>([]);

  readonly isModalOpen = signal(false);
  readonly editingAreaId = signal<string | null>(null);

  readonly paletteColors = ['#a9ccf0', '#8bd3c7', '#c3b1e1', '#f3c68f', '#f2a6c2', '#e59882'];

  form = {
    name: '',
    description: '',
    color: '#8bd3c7',
    icon: 'folder'
  };

  ngOnInit(): void {
    this.reloadAreas();
  }

  reloadAreas(): void {
    this.api.getAreas().subscribe((list) => {
      this.areas.set(list);
      if (!this.selectedArea() && list.length > 0) {
        this.inspectArea(list[0]);
      }
    });
  }

  inspectArea(area: AreaItem): void {
    this.selectedArea.set(area);
    this.api.getTasks({ areaId: area.id }).subscribe((tasks) => this.areaTasks.set(tasks));
    this.api.getEvents({ areaId: area.id }).subscribe((events) => this.areaEvents.set(events));
  }

  openNewAreaModal(): void {
    this.editingAreaId.set(null);
    this.form = { name: '', description: '', color: '#8bd3c7', icon: 'folder' };
    this.isModalOpen.set(true);
  }

  openEditAreaModal(area: AreaItem): void {
    this.editingAreaId.set(area.id);
    this.form = {
      name: area.name,
      description: area.description ?? '',
      color: area.color,
      icon: area.icon
    };
    this.isModalOpen.set(true);
  }

  saveArea(): void {
    const name = this.form.name.trim();
    if (!name) {
      return;
    }

    const id = this.editingAreaId();
    const request$ = id ? this.api.updateArea(id, this.form) : this.api.createArea(this.form);
    request$.subscribe(() => {
      this.isModalOpen.set(false);
      this.reloadAreas();
    });
  }

  deleteArea(id: string): void {
    this.api.deleteArea(id).subscribe(() => this.reloadAreas());
  }
}
