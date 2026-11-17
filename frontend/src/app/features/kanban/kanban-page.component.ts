import { CdkDragDrop, CdkDragMove, CdkDragStart, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { KanbanApiService } from '../../core/api/kanban-api.service';
import {
  AreaItem,
  KanbanBoardData,
  KanbanCardItem,
  KanbanColumnItem,
  LabelItem,
  SaveTaskPayload
} from '../../core/auth/auth.models';
import { SignalRService } from '../../core/realtime/signalr.service';

@Component({
  selector: 'app-kanban-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <section class="center-col">
      <div class="section-header-row">
        <div>
          <h1 class="section-title">Quadro Kanban</h1>
          <p class="section-subtitle">
            Arraste cartões entre colunas para atualizar status e prioridade em tempo real
          </p>
        </div>
        <button type="button" class="area-pill btn-coral" (click)="openCreateModal('Todo')">
          + Novo Cartão
        </button>
      </div>

      <div class="calendar-toolbar-card">
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

        <div class="filter-bar">
          @if (board(); as b) {
            @if (b.projects.length > 0) {
              <select
                class="filter-select"
                [ngModel]="selectedProjectId()"
                (ngModelChange)="selectProject($event)"
              >
                <option value="all">Projeto: Todos</option>
                @for (proj of b.projects; track proj.id) {
                  <option [value]="proj.id">{{ proj.name }}</option>
                }
              </select>
            }
          }

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

          <button
            type="button"
            class="area-pill"
            [class.active]="overdueOnly()"
            (click)="toggleOverdueOnly()"
          >
            <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Atrasadas ({{ board()?.overdueCount ?? 0 }})</span>
          </button>

          <input
            type="text"
            class="filter-select"
            placeholder="Pesquisar tarefas..."
            [ngModel]="searchTerm()"
            (ngModelChange)="onSearchChange($event)"
          />
        </div>
      </div>

      @if (board(); as data) {
        <div class="kanban-board-wrapper">
          <div
            #kanbanGrid
            class="kanban-grid"
            [class.is-dragging]="isDragging()"
            cdkDropListGroup
          >
            @for (col of data.columns; track col.status) {
              <div class="kanban-column">
                <div class="kanban-column-header">
                  <div style="display:flex;align-items:center;gap:8px">
                    <h3 class="modal-title">{{ col.title }}</h3>
                    <span class="tasks-counter">({{ col.cards.length }})</span>
                  </div>
                  <button
                    type="button"
                    class="kanban-col-add-btn"
                    title="Adicionar cartão nesta coluna"
                    (click)="openCreateModal(col.status)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>

                <div
                  class="kanban-drop-zone"
                  cdkDropList
                  [cdkDropListData]="col.cards"
                  (cdkDropListDropped)="onCardDrop($event, col)"
                >
                  @for (card of col.cards; track card.id) {
                    <article
                      class="kanban-card"
                      cdkDrag
                      [cdkDragStartDelay]="{ touch: 280, mouse: 0 }"
                      (cdkDragStarted)="onCardDragStarted($event)"
                      (cdkDragEnded)="onCardDragEnded()"
                      (cdkDragReleased)="onCardDragEnded()"
                      [class.overdue]="card.isOverdue"
                      [style.border-left-color]="card.areaColor"
                      (click)="openEditModal(card)"
                    >
                    <div class="kanban-card-meta">
                      <span style="font-size:11.5px;font-weight:700" [style.color]="card.areaColor">
                        {{ card.areaName }}
                      </span>

                      <div style="display:flex;align-items:center;gap:6px">
                        @if (card.isOverdue) {
                          <span class="kanban-badge urgent inline-icon-text">
                            <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <span>Atrasada</span>
                          </span>
                        }
                        <span class="kanban-badge" [ngClass]="card.priority.toLowerCase()">
                          {{ translatePriority(card.priority) }}
                        </span>
                      </div>
                    </div>

                    <strong
                      style="font-size:14.5px;line-height:1.35"
                      [style.text-decoration]="card.isCompleted ? 'line-through' : 'none'"
                    >
                      {{ card.title }}
                    </strong>

                    @if (card.description) {
                      <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.4">
                        {{ card.description }}
                      </p>
                    }

                    @if (card.labels.length > 0) {
                      <div style="display:flex;flex-wrap:wrap;gap:6px">
                        @for (label of card.labels; track label.id) {
                          <span class="kanban-label-chip" [style.background]="label.color">
                            {{ label.name }}
                          </span>
                        }
                      </div>
                    }

                    <div class="kanban-card-meta" style="margin-top:4px;font-size:11.5px;color:var(--text-secondary)">
                      <span>
                        @if (card.dueDate) {
                          <span class="inline-icon-text">
                            <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            <span>{{ formatDueDate(card.dueDate, card.dueTime) }}</span>
                          </span>
                        } @else {
                          Sem prazo
                        }
                      </span>

                      @if (card.projectName) {
                        <span class="inline-icon-text">
                          <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                          </svg>
                          <span>{{ card.projectName }}</span>
                        </span>
                      }
                    </div>
                  </article>
                } @empty {
                  <p class="section-subtitle" style="text-align:center;padding:32px 12px">
                    Arraste um cartão para cá ou clique em +
                  </p>
                }
              </div>
            </div>
          }
          </div>

          @if (isDragging() && scrollDirection() > 0) {
            <div class="kanban-scroll-indicator right" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          }
          @if (isDragging() && scrollDirection() < 0) {
            <div class="kanban-scroll-indicator left" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>
          }
        </div>
      }
    </section>

    @if (modalOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <h3 class="modal-title">
            {{ editingCardId() ? 'Editar Cartão Kanban' : 'Novo Cartão Kanban' }}
          </h3>

          <input
            type="text"
            [(ngModel)]="formTitle"
            placeholder="Título da tarefa..."
            class="form-input"
          />

          <textarea
            [(ngModel)]="formDescription"
            rows="3"
            placeholder="Descrição detalhada (opcional)..."
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
              <label class="form-label">Coluna (Status)</label>
              <select [(ngModel)]="formStatus" class="form-select">
                <option value="Todo">A fazer</option>
                <option value="InProgress">Em andamento</option>
                <option value="OnHold">Em espera</option>
                <option value="Done">Concluído</option>
              </select>
            </div>
          </div>

          <div class="form-grid-3">
            <div>
              <label class="form-label">Prioridade</label>
              <select [(ngModel)]="formPriority" class="form-select">
                <option value="Low">Baixa</option>
                <option value="Medium">Média</option>
                <option value="High">Alta</option>
                <option value="Urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label class="form-label">Prazo (Data)</label>
              <input type="date" [(ngModel)]="formDueDate" class="form-input" />
            </div>
            <div>
              <label class="form-label">Horário</label>
              <input type="time" [(ngModel)]="formDueTime" class="form-input" />
            </div>
          </div>

          <div>
            <label class="form-label">Etiquetas</label>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">
              @for (label of labels(); track label.id) {
                <button
                  type="button"
                  class="area-pill"
                  style="padding:4px 12px;font-size:12px"
                  [class.active]="selectedLabelIds().includes(label.id)"
                  (click)="toggleLabelSelection(label.id)"
                >
                  <span
                    style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px"
                    [style.background]="label.color"
                  ></span>
                  {{ label.name }}
                </button>
              }
            </div>
            <div style="display:flex;gap:8px">
              <input
                type="text"
                [(ngModel)]="newLabelName"
                placeholder="Nova etiqueta..."
                class="form-input"
                style="padding:8px 12px;font-size:12.5px"
              />
              <button
                type="button"
                class="area-pill"
                style="padding:6px 14px;font-size:12.5px;white-space:nowrap"
                (click)="createNewLabel()"
              >
                <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Etiqueta</span>
              </button>
            </div>
          </div>

          <div class="modal-actions">
            @if (editingCardId()) {
              <button
                type="button"
                class="area-pill"
                style="margin-right:auto;border-color:var(--accent-coral);color:var(--accent-coral)"
                (click)="deleteCurrentCard()"
              >
                Excluir
              </button>
            }
            <button type="button" class="area-pill" (click)="closeModal()">Cancelar</button>
            <button type="button" class="area-pill active btn-coral" (click)="saveCard()">
              Salvar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class KanbanPageComponent implements OnInit, OnDestroy {
  @ViewChild('kanbanGrid') kanbanGridRef?: ElementRef<HTMLElement>;
  private readonly kanbanApi = inject(KanbanApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly signalr = inject(SignalRService);
  private readonly ngZone = inject(NgZone);
  private realtimeSub?: Subscription;

  readonly board = signal<KanbanBoardData | null>(null);
  readonly areas = signal<AreaItem[]>([]);
  readonly labels = signal<LabelItem[]>([]);

  readonly selectedAreaSlug = signal<string>('all');
  readonly selectedProjectId = signal<string>('all');
  readonly selectedPriority = signal<string>('all');
  readonly overdueOnly = signal<boolean>(false);
  readonly searchTerm = signal<string>('');

  readonly modalOpen = signal<boolean>(false);
  readonly editingCardId = signal<string | null>(null);
  readonly selectedLabelIds = signal<string[]>([]);

  readonly isDragging = signal<boolean>(false);
  readonly scrollDirection = signal<number>(0);
  private scrollRafId: number | null = null;
  private currentScrollDirection = 0; // -1: left, +1: right, 0: none
  private currentScrollSpeed = 0; // px per frame
  private currentVerticalDirection = 0; // -1: up, +1: down, 0: none
  private currentVerticalSpeed = 0; // px per frame
  private activeMoveListener?: (e: MouseEvent | TouchEvent) => void;

  formTitle = '';
  formDescription = '';
  formAreaId = '';
  formStatus = 'Todo';
  formPriority = 'Medium';
  formDueDate = new Date().toISOString().slice(0, 10);
  formDueTime = '';
  newLabelName = '';

  ngOnInit(): void {
    this.dashboardApi.getAreas().subscribe(list => {
      this.areas.set(list);
      if (list.length > 0 && !this.formAreaId) {
        this.formAreaId = list[0].id;
      }
    });

    this.dashboardApi.getLabels().subscribe(list => this.labels.set(list));

    this.loadBoard();
    this.signalr.connect();
    this.realtimeSub = this.signalr.changes$.subscribe(() => this.loadBoard());
  }

  ngOnDestroy(): void {
    this.stopAutoScrollLoop();
    this.realtimeSub?.unsubscribe();
  }

  loadBoard(): void {
    this.kanbanApi
      .getBoard({
        areaSlug: this.selectedAreaSlug(),
        projectId: this.selectedProjectId(),
        priority: this.selectedPriority(),
        overdueOnly: this.overdueOnly(),
        search: this.searchTerm()
      })
      .subscribe(res => this.board.set(res));
  }

  selectArea(slug: string): void {
    this.selectedAreaSlug.set(slug);
    this.loadBoard();
  }

  selectProject(projectId: string): void {
    this.selectedProjectId.set(projectId);
    this.loadBoard();
  }

  selectPriority(priority: string): void {
    this.selectedPriority.set(priority);
    this.loadBoard();
  }

  toggleOverdueOnly(): void {
    this.overdueOnly.set(!this.overdueOnly());
    this.loadBoard();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.loadBoard();
  }

  onCardDragStarted(event: CdkDragStart): void {
    // Haptic feedback (vibração) em dispositivos móveis compatíveis
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(45);
      } catch {
        // Ignorado caso o dispositivo restrinja vibração sem gesto direto
      }
    }

    this.isDragging.set(true);
    this.currentScrollDirection = 0;
    this.currentScrollSpeed = 0;
    this.currentVerticalDirection = 0;
    this.currentVerticalSpeed = 0;
    this.scrollDirection.set(0);

    // Track pointer movement outside Angular zone for max 120fps performance without change detection lag
    this.ngZone.runOutsideAngular(() => {
      const onMove = (e: MouseEvent | TouchEvent) => {
        if (!this.isDragging()) return;
        const clientX = 'touches' in e && e.touches.length > 0
          ? e.touches[0].clientX
          : (e as MouseEvent).clientX;
        const clientY = 'touches' in e && e.touches.length > 0
          ? e.touches[0].clientY
          : (e as MouseEvent).clientY;

        this.computeScrollVectors(clientX, clientY);
      };

      this.activeMoveListener = onMove;
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('touchmove', onMove, { passive: true });
    });

    this.startAutoScrollLoop();
  }

  private computeScrollVectors(pointerX: number, pointerY: number): void {
    const grid = this.kanbanGridRef?.nativeElement;
    if (grid && grid.scrollWidth > grid.clientWidth) {
      const rect = grid.getBoundingClientRect();
      const edgeZone = Math.min(85, window.innerWidth * 0.24);

      const leftBoundary = Math.max(rect.left, 0) + edgeZone;
      const rightBoundary = Math.min(rect.right, window.innerWidth) - edgeZone;

      if (pointerX > rightBoundary) {
        const distance = pointerX - rightBoundary;
        const intensity = Math.min(1, Math.max(0.15, distance / edgeZone));
        this.currentScrollDirection = 1;
        this.currentScrollSpeed = Math.round(intensity * 14) + 4;
        if (this.scrollDirection() !== 1) {
          this.ngZone.run(() => this.scrollDirection.set(1));
        }
      } else if (pointerX < leftBoundary) {
        const distance = leftBoundary - pointerX;
        const intensity = Math.min(1, Math.max(0.15, distance / edgeZone));
        this.currentScrollDirection = -1;
        this.currentScrollSpeed = Math.round(intensity * 14) + 4;
        if (this.scrollDirection() !== -1) {
          this.ngZone.run(() => this.scrollDirection.set(-1));
        }
      } else {
        this.currentScrollDirection = 0;
        this.currentScrollSpeed = 0;
        if (this.scrollDirection() !== 0) {
          this.ngZone.run(() => this.scrollDirection.set(0));
        }
      }
    }

    // Vertical auto-scrolling when near top or bottom of viewport
    const topEdgeZone = 90;
    const bottomEdgeZone = 90;
    const bottomBoundary = window.innerHeight - bottomEdgeZone;

    if (pointerY > bottomBoundary) {
      const distance = pointerY - bottomBoundary;
      const intensity = Math.min(1, Math.max(0.15, distance / bottomEdgeZone));
      this.currentVerticalDirection = 1;
      this.currentVerticalSpeed = Math.round(intensity * 14) + 3;
    } else if (pointerY < topEdgeZone) {
      const distance = topEdgeZone - pointerY;
      const intensity = Math.min(1, Math.max(0.15, distance / topEdgeZone));
      this.currentVerticalDirection = -1;
      this.currentVerticalSpeed = Math.round(intensity * 14) + 3;
    } else {
      this.currentVerticalDirection = 0;
      this.currentVerticalSpeed = 0;
    }
  }

  onCardDragEnded(): void {
    this.isDragging.set(false);
    this.scrollDirection.set(0);
    this.stopAutoScrollLoop();
    if (this.activeMoveListener) {
      window.removeEventListener('mousemove', this.activeMoveListener);
      window.removeEventListener('touchmove', this.activeMoveListener);
      this.activeMoveListener = undefined;
    }
  }

  private startAutoScrollLoop(): void {
    if (this.scrollRafId !== null) return;

    this.ngZone.runOutsideAngular(() => {
      const step = () => {
        if (!this.isDragging()) {
          this.scrollRafId = null;
          return;
        }

        // Horizontal grid scroll
        if (this.currentScrollDirection !== 0 && this.kanbanGridRef?.nativeElement) {
          const grid = this.kanbanGridRef.nativeElement;
          const delta = this.currentScrollDirection * this.currentScrollSpeed;
          const maxScrollLeft = grid.scrollWidth - grid.clientWidth;
          const nextScrollLeft = grid.scrollLeft + delta;

          if (delta > 0 && grid.scrollLeft < maxScrollLeft) {
            grid.scrollLeft = Math.min(maxScrollLeft, nextScrollLeft);
          } else if (delta < 0 && grid.scrollLeft > 0) {
            grid.scrollLeft = Math.max(0, nextScrollLeft);
          }
        }

        // Vertical window scroll
        if (this.currentVerticalDirection !== 0) {
          window.scrollBy({
            top: this.currentVerticalDirection * this.currentVerticalSpeed,
            behavior: 'auto'
          });
        }

        this.scrollRafId = requestAnimationFrame(step);
      };

      this.scrollRafId = requestAnimationFrame(step);
    });
  }

  private stopAutoScrollLoop(): void {
    if (this.scrollRafId !== null) {
      cancelAnimationFrame(this.scrollRafId);
      this.scrollRafId = null;
    }
    this.currentScrollDirection = 0;
    this.currentScrollSpeed = 0;
    this.currentVerticalDirection = 0;
    this.currentVerticalSpeed = 0;
  }

  onCardDrop(event: CdkDragDrop<KanbanCardItem[]>, targetColumn: KanbanColumnItem): void {
    this.onCardDragEnded();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch {
        // Ignorado caso o dispositivo restrinja
      }
    }
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    const movedCard = event.container.data[event.currentIndex];
    if (!movedCard) return;

    movedCard.status = targetColumn.status;
    movedCard.isCompleted = targetColumn.status === 'Done';

    this.kanbanApi
      .moveCard(movedCard.id, targetColumn.status, event.currentIndex)
      .subscribe({
        next: () => this.loadBoard(),
        error: () => this.loadBoard()
      });
  }

  openCreateModal(defaultStatus: string): void {
    this.editingCardId.set(null);
    this.formTitle = '';
    this.formDescription = '';
    this.formAreaId = this.areas()[0]?.id ?? '';
    this.formStatus = defaultStatus;
    this.formPriority = 'Medium';
    this.formDueDate = new Date().toISOString().slice(0, 10);
    this.formDueTime = '';
    this.selectedLabelIds.set([]);
    this.modalOpen.set(true);
  }

  openEditModal(card: KanbanCardItem): void {
    this.editingCardId.set(card.id);
    this.formTitle = card.title;
    this.formDescription = card.description ?? '';
    this.formAreaId = card.areaId;
    this.formStatus = card.status;
    this.formPriority = card.priority;
    this.formDueDate = card.dueDate ?? new Date().toISOString().slice(0, 10);
    this.formDueTime = card.dueTime ?? '';
    this.selectedLabelIds.set(card.labels.map(l => l.id));
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  toggleLabelSelection(labelId: string): void {
    const current = this.selectedLabelIds();
    if (current.includes(labelId)) {
      this.selectedLabelIds.set(current.filter(id => id !== labelId));
    } else {
      this.selectedLabelIds.set([...current, labelId]);
    }
  }

  createNewLabel(): void {
    const name = this.newLabelName.trim();
    if (!name) return;

    const palette = ['#8bd3c7', '#e59882', '#a9ccf0', '#c3b1e1', '#f3c68f', '#f2a6c2'];
    const color = palette[this.labels().length % palette.length];

    this.dashboardApi.createLabel(name, color).subscribe(created => {
      this.labels.set([...this.labels(), created]);
      this.selectedLabelIds.set([...this.selectedLabelIds(), created.id]);
      this.newLabelName = '';
    });
  }

  saveCard(): void {
    const title = this.formTitle.trim();
    if (!title) return;

    const payload: SaveTaskPayload = {
      title,
      description: this.formDescription.trim() || null,
      areaId: this.formAreaId,
      priority: this.formPriority,
      status: this.formStatus,
      startDate: this.formDueDate || null,
      dueDate: this.formDueDate || null,
      dueTime: this.formDueTime || null,
      labelIds: this.selectedLabelIds()
    };

    const cardId = this.editingCardId();
    const req$ = cardId
      ? this.dashboardApi.updateTask(cardId, payload)
      : this.dashboardApi.createTask(payload);

    req$.subscribe(() => {
      this.closeModal();
      this.loadBoard();
    });
  }

  deleteCurrentCard(): void {
    const cardId = this.editingCardId();
    if (!cardId) return;

    this.dashboardApi.deleteTask(cardId).subscribe(() => {
      this.closeModal();
      this.loadBoard();
    });
  }

  translatePriority(priority: string): string {
    if (priority === 'Urgent') return 'Urgente';
    if (priority === 'High') return 'Alta';
    if (priority === 'Medium') return 'Média';
    return 'Baixa';
  }

  formatDueDate(dueDate: string, dueTime?: string | null): string {
    const dateLabel = `${dueDate.slice(8, 10)}/${dueDate.slice(5, 7)}`;
    return dueTime ? `${dateLabel} às ${dueTime}` : dateLabel;
  }
}
