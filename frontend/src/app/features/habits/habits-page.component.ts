import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { WorkspaceModulesApiService } from '../../core/api/workspace-modules-api.service';
import { AreaItem, HabitDetailItem } from '../../core/auth/auth.models';
import { SignalRService } from '../../core/realtime/signalr.service';

@Component({
  selector: 'app-habits-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="center-col">
      <div class="section-header-row">
        <div>
          <h1 class="section-title">Hábitos e Rotinas</h1>
          <p class="section-subtitle">
            Construa consistência diária e acompanhe suas sequências de dias concluídos (Streaks)
          </p>
        </div>
        <button type="button" class="area-pill btn-mint" (click)="openCreateModal()">
          + Novo Hábito
        </button>
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
      </div>

      <div class="habit-grid">
        @for (habit of habits(); track habit.id) {
          <article class="habit-row-card">
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:12px;font-weight:700" [style.color]="habit.areaColor">
                  {{ habit.areaName }}
                </span>
                <span class="kanban-badge low">Meta: {{ habit.targetPerWeek }}x / sem</span>
              </div>
              <strong style="font-size:17px">{{ habit.name }}</strong>
              @if (habit.description) {
                <span class="section-subtitle">{{ habit.description }}</span>
              }
            </div>

            <div class="habit-week-dots">
              @for (day of habit.lastSevenDays; track day.date) {
                <button
                  type="button"
                  class="habit-day-btn"
                  [class.done]="day.isCompleted"
                  [class.today]="day.isToday"
                  (click)="toggleDay(habit.id, day.date)"
                >
                  <span style="font-size:10px">{{ day.dayLabel }}</span>
                  <span style="height:14px;display:flex;align-items:center;justify-content:center">
                    @if (day.isCompleted) {
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    } @else {
                      <span style="font-size:14px;line-height:1">·</span>
                    }
                  </span>
                </button>
              }
            </div>

            <div style="display:flex;align-items:center;gap:18px">
              <div style="text-align:right">
                <div style="font-size:20px;font-weight:800;color:var(--accent-mint);display:flex;align-items:center;justify-content:flex-end;gap:5px">
                  <svg class="ui-icon" style="color:var(--accent-coral)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                  </svg>
                  <span>{{ habit.currentStreak }} dias</span>
                </div>
                <div style="font-size:11.5px;color:var(--text-secondary)">
                  Recorde: {{ habit.bestStreak }}d · {{ habit.consistencyRatePercent }}% sem.
                </div>
              </div>
              <button type="button" class="area-pill" (click)="openEditModal(habit)">Editar</button>
            </div>
          </article>
        } @empty {
          <div class="module-card" style="text-align:center;padding:42px">
            <h3 class="modal-title">Nenhum hábito ativo</h3>
            <p class="section-subtitle">
              Cadastre hábitos recorrentes (como Leitura, Academia ou Estudos) para medir sua consistência.
            </p>
          </div>
        }
      </div>
    </section>

    @if (modalOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <h3 class="modal-title">
            {{ editingHabitId() ? 'Editar Hábito' : 'Novo Hábito' }}
          </h3>

          <input
            type="text"
            [(ngModel)]="formName"
            placeholder="Ex: Academia, Leitura Técnica, Planejamento Semanal..."
            class="form-input"
          />

          <textarea
            [(ngModel)]="formDescription"
            rows="2"
            placeholder="Motivação ou gatilho do hábito (opcional)..."
            class="form-input"
          ></textarea>

          <div class="form-grid-3">
            <div>
              <label class="form-label">Área da Vida</label>
              <select [(ngModel)]="formAreaId" class="form-select">
                @for (area of areas(); track area.id) {
                  <option [value]="area.id">{{ area.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Frequência</label>
              <select [(ngModel)]="formFrequency" class="form-select">
                <option value="Daily">Diário</option>
                <option value="Weekly">Semanal</option>
              </select>
            </div>
            <div>
              <label class="form-label">Meta (Dias / Semana)</label>
              <input
                type="number"
                min="1"
                max="7"
                [(ngModel)]="formTargetPerWeek"
                class="form-input"
              />
            </div>
          </div>

          <div class="modal-actions">
            @if (editingHabitId()) {
              <button
                type="button"
                class="area-pill"
                style="margin-right:auto;border-color:var(--accent-coral);color:var(--accent-coral)"
                (click)="deleteCurrentHabit()"
              >
                Desativar
              </button>
            }
            <button type="button" class="area-pill" (click)="closeModal()">Cancelar</button>
            <button type="button" class="area-pill active btn-mint" (click)="saveHabit()">
              Salvar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class HabitsPageComponent implements OnInit, OnDestroy {
  private readonly workspaceApi = inject(WorkspaceModulesApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly signalr = inject(SignalRService);
  private realtimeSub?: Subscription;

  readonly areas = signal<AreaItem[]>([]);
  readonly habits = signal<HabitDetailItem[]>([]);
  readonly selectedAreaSlug = signal<string>('all');

  readonly modalOpen = signal<boolean>(false);
  readonly editingHabitId = signal<string | null>(null);

  formName = '';
  formDescription = '';
  formAreaId = '';
  formFrequency = 'Daily';
  formTargetPerWeek = 7;

  ngOnInit(): void {
    this.dashboardApi.getAreas().subscribe(list => {
      this.areas.set(list);
      if (list.length > 0 && !this.formAreaId) {
        this.formAreaId = list[0].id;
      }
    });
    this.loadHabits();
    this.signalr.connect();
    this.realtimeSub = this.signalr.changes$.subscribe(() => this.loadHabits());
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  loadHabits(): void {
    this.workspaceApi
      .getHabits(this.selectedAreaSlug())
      .subscribe(list => this.habits.set(list));
  }

  selectArea(slug: string): void {
    this.selectedAreaSlug.set(slug);
    this.loadHabits();
  }

  toggleDay(habitId: string, date: string): void {
    this.workspaceApi.toggleHabitCompletion(habitId, date).subscribe(() => this.loadHabits());
  }

  openCreateModal(): void {
    this.editingHabitId.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formAreaId = this.areas()[0]?.id ?? '';
    this.formFrequency = 'Daily';
    this.formTargetPerWeek = 7;
    this.modalOpen.set(true);
  }

  openEditModal(habit: HabitDetailItem): void {
    this.editingHabitId.set(habit.id);
    this.formName = habit.name;
    this.formDescription = habit.description ?? '';
    this.formAreaId = habit.areaId;
    this.formFrequency = habit.frequency;
    this.formTargetPerWeek = habit.targetPerWeek;
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  saveHabit(): void {
    const name = this.formName.trim();
    if (!name) return;

    const payload = {
      name,
      description: this.formDescription.trim() || null,
      areaId: this.formAreaId,
      frequency: this.formFrequency,
      targetPerWeek: Number(this.formTargetPerWeek) || 7
    };

    const id = this.editingHabitId();
    const req$ = id
      ? this.workspaceApi.updateHabit(id, payload)
      : this.workspaceApi.createHabit(payload);

    req$.subscribe(() => {
      this.closeModal();
      this.loadHabits();
    });
  }

  deleteCurrentHabit(): void {
    const id = this.editingHabitId();
    if (!id) return;

    this.workspaceApi.deleteHabit(id).subscribe(() => {
      this.closeModal();
      this.loadHabits();
    });
  }
}
