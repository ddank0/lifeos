import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { WorkspaceModulesApiService } from '../../core/api/workspace-modules-api.service';
import { AreaItem, QuickNoteItem } from '../../core/auth/auth.models';
import { SignalRService } from '../../core/realtime/signalr.service';

@Component({
  selector: 'app-inbox-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="center-col">
      <div class="section-header-row">
        <div>
          <h1 class="section-title">Caixa de Entrada · Captura Rápida</h1>
          <p class="section-subtitle">
            Registre ideias sem atrito e converta em tarefas ou compromissos quando estiver pronto
          </p>
        </div>
      </div>

      <div class="module-card">
        <div class="form-grid-3">
          <div style="grid-column: span 2">
            <label class="form-label">O que você quer registrar agora?</label>
            <input
              type="text"
              [(ngModel)]="quickContent"
              (keyup.enter)="addQuickNote()"
              placeholder="Digite uma anotação, lembrete, ideia ou tarefa futura..."
              class="form-input"
            />
          </div>
          <div>
            <label class="form-label">Tipo de Registro</label>
            <select [(ngModel)]="quickNoteType" class="form-select">
              <option value="Note">Anotação</option>
              <option value="Task">Ideia de Tarefa</option>
              <option value="Event">Possível Evento</option>
              <option value="Reminder">Lembrete</option>
            </select>
          </div>
        </div>

        <div class="form-grid-3">
          <div>
            <label class="form-label">Área (Opcional)</label>
            <select [(ngModel)]="quickAreaId" class="form-select">
              <option value="">Sem área específica</option>
              @for (area of areas(); track area.id) {
                <option [value]="area.id">{{ area.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label">Prioridade Sugerida</label>
            <select [(ngModel)]="quickPriority" class="form-select">
              <option value="Low">Baixa</option>
              <option value="Medium">Média</option>
              <option value="High">Alta</option>
              <option value="Urgent">Urgente</option>
            </select>
          </div>
          <div>
            <label class="form-label">Data Sugerida (Opcional)</label>
            <input type="date" [(ngModel)]="quickTargetDate" class="form-input" />
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="area-pill btn-mint" (click)="addQuickNote()">
            + Guardar na Caixa de Entrada
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
              {{ area.name }}
            </button>
          }
        </div>

        <button
          type="button"
          class="area-pill"
          style="margin-left:auto"
          [class.active]="showProcessed()"
          (click)="toggleShowProcessed()"
        >
          {{ showProcessed() ? 'Ocultar Processados' : 'Mostrar Histórico Processado' }}
        </button>
      </div>

      <div class="inbox-card-list">
        @for (note of notes(); track note.id) {
          <article class="inbox-item-card" [style.border-left-color]="note.areaColor">
            <div style="display:flex;flex-direction:column;gap:6px;max-width:650px">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span class="kanban-badge medium">{{ translateNoteType(note.noteType) }}</span>
                <span style="font-size:12px;font-weight:700" [style.color]="note.areaColor">
                  {{ note.areaName }}
                </span>
                @if (note.priority) {
                  <span class="kanban-badge" [ngClass]="note.priority.toLowerCase()">
                    {{ note.priority }}
                  </span>
                }
                @if (note.targetDate) {
                  <span class="inline-icon-text" style="font-size:12px;color:var(--text-secondary)">
                    <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{{ note.targetDate }}</span>
                  </span>
                }
                @if (note.isProcessed) {
                  <span class="kanban-badge low inline-icon-text">
                    <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Processado</span>
                  </span>
                }
              </div>

              <strong
                style="font-size:16px"
                [style.text-decoration]="note.isProcessed ? 'line-through' : 'none'"
              >
                {{ note.content }}
              </strong>
            </div>

            <div class="calendar-nav-group">
              @if (!note.isProcessed) {
                <button
                  type="button"
                  class="area-pill btn-coral"
                  (click)="convertNote(note, 'Task')"
                >
                  Converter em Tarefa
                </button>
                <button
                  type="button"
                  class="area-pill btn-mint"
                  (click)="convertNote(note, 'Event')"
                >
                  Converter em Evento
                </button>
              }
              <button type="button" class="area-pill" (click)="deleteNote(note.id)">
                Arquivar / Excluir
              </button>
            </div>
          </article>
        } @empty {
          <div class="module-card" style="text-align:center;padding:42px">
            <h3 class="modal-title">Caixa de Entrada Limpa (Inbox Zero)</h3>
            <p class="section-subtitle">
              Todos os seus itens capturados já foram organizados e convertidos em ações ou compromissos.
            </p>
          </div>
        }
      </div>
    </section>
  `
})
export class InboxPageComponent implements OnInit, OnDestroy {
  private readonly workspaceApi = inject(WorkspaceModulesApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly signalr = inject(SignalRService);
  private realtimeSub?: Subscription;

  readonly areas = signal<AreaItem[]>([]);
  readonly notes = signal<QuickNoteItem[]>([]);
  readonly selectedAreaSlug = signal<string>('all');
  readonly showProcessed = signal<boolean>(false);

  quickContent = '';
  quickNoteType = 'Note';
  quickAreaId = '';
  quickPriority = 'Medium';
  quickTargetDate = '';

  ngOnInit(): void {
    this.dashboardApi.getAreas().subscribe(list => this.areas.set(list));
    this.loadNotes();
    this.signalr.connect();
    this.realtimeSub = this.signalr.changes$.subscribe(() => this.loadNotes());
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  loadNotes(): void {
    this.workspaceApi
      .getInboxNotes(this.showProcessed(), this.selectedAreaSlug())
      .subscribe(list => this.notes.set(list));
  }

  selectArea(slug: string): void {
    this.selectedAreaSlug.set(slug);
    this.loadNotes();
  }

  toggleShowProcessed(): void {
    this.showProcessed.set(!this.showProcessed());
    this.loadNotes();
  }

  addQuickNote(): void {
    const content = this.quickContent.trim();
    if (!content) return;

    this.workspaceApi
      .createInboxNote({
        content,
        areaId: this.quickAreaId || null,
        noteType: this.quickNoteType,
        priority: this.quickPriority,
        targetDate: this.quickTargetDate || null
      })
      .subscribe(() => {
        this.quickContent = '';
        this.quickTargetDate = '';
        this.loadNotes();
      });
  }

  convertNote(note: QuickNoteItem, targetType: 'Task' | 'Event'): void {
    this.workspaceApi
      .convertInboxNote(note.id, {
        targetType,
        areaId: note.areaId ?? this.areas()[0]?.id ?? null,
        priority: note.priority ?? 'Medium',
        targetDate: note.targetDate ?? new Date().toISOString().slice(0, 10),
        targetTime: targetType === 'Event' ? '10:00' : null
      })
      .subscribe(() => this.loadNotes());
  }

  deleteNote(id: string): void {
    this.workspaceApi.deleteInboxNote(id).subscribe(() => this.loadNotes());
  }

  translateNoteType(type: string): string {
    if (type === 'Task') return 'Ideia de Tarefa';
    if (type === 'Event') return 'Possível Evento';
    if (type === 'Reminder') return 'Lembrete';
    return 'Anotação';
  }
}
