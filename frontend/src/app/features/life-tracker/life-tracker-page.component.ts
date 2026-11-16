import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { LifeTrackerApiService } from '../../core/api/life-tracker-api.service';
import { AreaItem, LifeMetricDetailItem } from '../../core/auth/auth.models';
import { SignalRService } from '../../core/realtime/signalr.service';

@Component({
  selector: 'app-life-tracker-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="center-col">
      <div class="section-header-row">
        <div>
          <h1 class="section-title">Life Tracker · Quantified Self</h1>
          <p class="section-subtitle">
            Monitore indicadores quantitativos, metas diárias e progresso com ajustes em 1 clique
          </p>
        </div>
        <button type="button" class="area-pill btn-mint" (click)="openCreateModal()">
          + Nova Métrica
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
              <span
                style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px"
                [style.background]="area.color"
              ></span>
              {{ area.name }}
            </button>
          }
        </div>
      </div>

      <div class="kpi-grid">
        @for (metric of metrics(); track metric.id) {
          <article
            class="card"
            [style.border-left]="'6px solid ' + metric.areaColor"
          >
            <div class="card-header">
              <div>
                <span style="font-size:11.5px;font-weight:700;text-transform:uppercase" [style.color]="metric.areaColor">
                  {{ metric.areaName }}
                </span>
                <h3 class="card-title" style="margin-top:2px">{{ metric.name }}</h3>
              </div>
              <span class="kanban-badge" [class.urgent]="!metric.isTargetReached" [class.low]="metric.isTargetReached">
                @if (metric.isTargetReached) {
                  <span class="inline-icon-text">
                    <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>Meta Batida</span>
                  </span>
                } @else {
                  <span>{{ metric.progressPercent }}%</span>
                }
              </span>
            </div>

            @if (metric.description) {
              <p class="section-subtitle" style="margin-top:-6px">{{ metric.description }}</p>
            }

            <div>
              <div style="font-size:42px;font-weight:800;line-height:1;display:flex;align-items:baseline;gap:8px">
                <span>{{ metric.todayValue }}<span style="font-size:20px;font-weight:600">{{ metric.unit }}</span></span>
                <span style="font-size:17px;color:var(--text-secondary);font-weight:500">
                  / {{ metric.dailyTarget }}{{ metric.unit }}
                </span>
              </div>

              <div class="progress-track" style="margin-top:12px;height:10px">
                <div
                  class="progress-fill"
                  [style.width.%]="metric.progressPercent"
                  [style.background]="metric.areaColor"
                ></div>
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-pill-dark);padding:10px 14px;border-radius:14px">
              <span style="font-size:12.5px;color:var(--text-secondary)">
                Média 7 dias: <strong style="color:var(--text-primary)">{{ metric.sevenDayAverage }}{{ metric.unit }}/dia</strong>
              </span>

              <div style="display:flex;align-items:center;gap:6px">
                <button
                  type="button"
                  class="step-btn"
                  title="Diminuir valor"
                  (click)="adjustValue(metric, -metric.stepIncrement)"
                >
                  -{{ metric.stepIncrement }}
                </button>
                <button
                  type="button"
                  class="step-btn"
                  style="background:var(--accent-mint);color:#18181b"
                  title="Aumentar valor"
                  (click)="adjustValue(metric, metric.stepIncrement)"
                >
                  +{{ metric.stepIncrement }}
                </button>
              </div>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:auto">
              <button type="button" class="area-pill" style="padding:4px 12px;font-size:12px" (click)="openEditModal(metric)">
                Editar
              </button>
              <button
                type="button"
                class="area-pill"
                style="padding:4px 12px;font-size:12px;border-color:var(--accent-coral);color:var(--accent-coral)"
                (click)="deleteMetric(metric.id)"
              >
                Excluir
              </button>
            </div>
          </article>
        } @empty {
          <div class="module-card" style="grid-column: 1 / -1;text-align:center;padding:48px 24px">
            <h3 class="modal-title">Nenhum indicador cadastrado</h3>
            <p class="section-subtitle" style="margin-top:6px">
              Crie indicadores quantitativos como Horas de Estudo, Litros de Água, Minutos de Treino, Páginas Lidas ou Gastos para acompanhar seu dia a dia.
            </p>
            <div style="margin-top:18px">
              <button type="button" class="area-pill btn-mint" (click)="openCreateModal()">
                + Criar Primeira Métrica
              </button>
            </div>
          </div>
        }
      </div>
    </section>

    @if (modalOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <h3 class="modal-title">
            {{ editingMetricId() ? 'Editar Métrica' : 'Nova Métrica Quantitativa' }}
          </h3>

          <input
            type="text"
            [(ngModel)]="formName"
            placeholder="Ex: Horas de Estudo, Água Ingerida, Treino, Páginas Lidas..."
            class="form-input"
          />

          <textarea
            [(ngModel)]="formDescription"
            rows="2"
            placeholder="Descrição ou objetivo da métrica (opcional)..."
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
              <label class="form-label">Unidade de Medida</label>
              <input
                type="text"
                [(ngModel)]="formUnit"
                placeholder="Ex: h, L, min, pág, R$, km..."
                class="form-input"
              />
            </div>
          </div>

          <div class="form-grid-2">
            <div>
              <label class="form-label">Meta Diária</label>
              <input
                type="number"
                step="any"
                [(ngModel)]="formDailyTarget"
                placeholder="Ex: 4.0"
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Passo de Incremento (+/-)</label>
              <input
                type="number"
                step="any"
                [(ngModel)]="formStepIncrement"
                placeholder="Ex: 0.5"
                class="form-input"
              />
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="area-pill" (click)="closeModal()">Cancelar</button>
            <button type="button" class="area-pill active btn-mint" (click)="saveMetric()">
              Salvar Métrica
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class LifeTrackerPageComponent implements OnInit, OnDestroy {
  private readonly trackerApi = inject(LifeTrackerApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly signalr = inject(SignalRService);
  private realtimeSub?: Subscription;

  readonly areas = signal<AreaItem[]>([]);
  readonly metrics = signal<LifeMetricDetailItem[]>([]);
  readonly selectedAreaSlug = signal<string>('all');

  readonly modalOpen = signal<boolean>(false);
  readonly editingMetricId = signal<string | null>(null);

  formName = '';
  formDescription = '';
  formAreaId = '';
  formUnit = 'h';
  formDailyTarget = 4;
  formStepIncrement = 0.5;

  ngOnInit(): void {
    this.dashboardApi.getAreas().subscribe(list => {
      this.areas.set(list);
      if (list.length > 0 && !this.formAreaId) {
        this.formAreaId = list[0].id;
      }
    });

    this.loadMetrics();
    this.signalr.connect();
    this.realtimeSub = this.signalr.changes$.subscribe(() => this.loadMetrics());
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  loadMetrics(): void {
    this.trackerApi
      .getMetrics(this.selectedAreaSlug())
      .subscribe(list => this.metrics.set(list));
  }

  selectArea(slug: string): void {
    this.selectedAreaSlug.set(slug);
    this.loadMetrics();
  }

  adjustValue(metric: LifeMetricDetailItem, delta: number): void {
    this.trackerApi.adjustValue(metric.id, delta).subscribe(() => this.loadMetrics());
  }

  openCreateModal(): void {
    this.editingMetricId.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formAreaId = this.areas()[0]?.id ?? '';
    this.formUnit = 'h';
    this.formDailyTarget = 4;
    this.formStepIncrement = 0.5;
    this.modalOpen.set(true);
  }

  openEditModal(metric: LifeMetricDetailItem): void {
    this.editingMetricId.set(metric.id);
    this.formName = metric.name;
    this.formDescription = metric.description ?? '';
    this.formAreaId = metric.areaId;
    this.formUnit = metric.unit;
    this.formDailyTarget = metric.dailyTarget;
    this.formStepIncrement = metric.stepIncrement;
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  saveMetric(): void {
    const name = this.formName.trim();
    const unit = this.formUnit.trim();
    if (!name || !unit || this.formDailyTarget <= 0) return;

    const payload = {
      name,
      description: this.formDescription.trim() || null,
      areaId: this.formAreaId,
      unit,
      dailyTarget: Number(this.formDailyTarget),
      stepIncrement: Number(this.formStepIncrement) || 1
    };

    const id = this.editingMetricId();
    const req$ = id
      ? this.trackerApi.updateMetric(id, payload)
      : this.trackerApi.createMetric(payload);

    req$.subscribe(() => {
      this.closeModal();
      this.loadMetrics();
    });
  }

  deleteMetric(id: string): void {
    this.trackerApi.deleteMetric(id).subscribe(() => this.loadMetrics());
  }
}
