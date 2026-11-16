import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { DashboardApiService } from '../core/api/dashboard-api.service';
import { WorkspaceModulesApiService } from '../core/api/workspace-modules-api.service';
import { AreaItem } from '../core/auth/auth.models';
import { SignalRService } from '../core/realtime/signalr.service';
import { TopbarComponent } from './topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, TopbarComponent],
  template: `
    <div class="app-shell">
      <app-topbar (openQuickCapture)="openModal()" />
      <router-outlet />
    </div>

    @if (isQuickModalOpen()) {
      <div class="modal-backdrop" (click)="isQuickModalOpen.set(false)">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="section-header-row">
            <h3 class="modal-title">Captura Rápida · Caixa de Entrada</h3>
            <span class="section-subtitle">Atalho: Ctrl + K</span>
          </div>

          <input
            type="text"
            class="form-input"
            [(ngModel)]="quickTitle"
            placeholder="Digite uma anotação, tarefa, evento ou lembrete..."
            (keyup.enter)="saveQuickCapture()"
          />

          <div class="filter-bar">
            <button
              type="button"
              class="area-pill"
              [class.active]="quickType() === 'Note'"
              (click)="quickType.set('Note')"
            >
              Anotação (Inbox)
            </button>
            <button
              type="button"
              class="area-pill"
              [class.active]="quickType() === 'Task'"
              (click)="quickType.set('Task')"
            >
              Tarefa (Hoje)
            </button>
            <button
              type="button"
              class="area-pill"
              [class.active]="quickType() === 'Event'"
              (click)="quickType.set('Event')"
            >
              Possível Evento
            </button>
            <button
              type="button"
              class="area-pill"
              [class.active]="quickType() === 'Reminder'"
              (click)="quickType.set('Reminder')"
            >
              Lembrete
            </button>
          </div>

          <div class="form-grid-3">
            <div>
              <label class="form-label">Área (Opcional)</label>
              <select [(ngModel)]="quickAreaId" class="form-select">
                <option value="">Padrão</option>
                @for (area of areas(); track area.id) {
                  <option [value]="area.id">{{ area.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Prioridade</label>
              <select [(ngModel)]="quickPriority" class="form-select">
                <option value="Low">Baixa</option>
                <option value="Medium">Média</option>
                <option value="High">Alta</option>
                <option value="Urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label class="form-label">Data (Opcional)</label>
              <input type="date" [(ngModel)]="quickTargetDate" class="form-input" />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="area-pill" (click)="isQuickModalOpen.set(false)">
              Cancelar
            </button>
            <button
              type="button"
              class="area-pill btn-coral"
              (click)="saveQuickCapture()"
            >
              Registrar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AppShellComponent implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly workspaceApi = inject(WorkspaceModulesApiService);
  private readonly signalR = inject(SignalRService);

  readonly isQuickModalOpen = signal(false);
  readonly quickType = signal<'Note' | 'Task' | 'Event' | 'Reminder'>('Note');
  readonly areas = signal<AreaItem[]>([]);

  quickTitle = '';
  quickAreaId = '';
  quickPriority = 'Medium';
  quickTargetDate = '';

  constructor() {
    this.signalR.connect();
  }

  ngOnInit(): void {
    this.api.getAreas().subscribe({
      next: list => this.areas.set(list),
      error: () => {}
    });
  }

  openModal(): void {
    this.isQuickModalOpen.set(true);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.isQuickModalOpen.update(open => !open);
    }
  }

  saveQuickCapture(): void {
    const title = this.quickTitle.trim();
    if (!title) {
      return;
    }

    if (this.quickType() === 'Task' && !this.quickTargetDate) {
      this.api
        .quickCapture({
          title,
          recordType: 'Task',
          areaId: this.quickAreaId || undefined
        })
        .subscribe(() => this.resetAfterSave());
      return;
    }

    this.workspaceApi
      .createInboxNote({
        content: title,
        areaId: this.quickAreaId || null,
        noteType: this.quickType(),
        priority: this.quickPriority,
        targetDate: this.quickTargetDate || null
      })
      .subscribe(() => this.resetAfterSave());
  }

  private resetAfterSave(): void {
    this.quickTitle = '';
    this.quickTargetDate = '';
    this.isQuickModalOpen.set(false);
    this.signalR.changes$.next();
  }
}
