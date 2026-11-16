import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { WorkspaceModulesApiService } from '../../core/api/workspace-modules-api.service';
import { AreaItem, ProjectDetailItem } from '../../core/auth/auth.models';
import { SignalRService } from '../../core/realtime/signalr.service';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="center-col">
      <div class="section-header-row">
        <div>
          <h1 class="section-title">Projetos</h1>
          <p class="section-subtitle">
            Agrupe tarefas relacionadas e acompanhe o progresso calculado automaticamente
          </p>
        </div>
        <button type="button" class="area-pill btn-coral" (click)="openCreateModal()">
          + Novo Projeto
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

      <div class="project-grid">
        @for (project of projects(); track project.id) {
          <article class="project-card">
            <div class="kanban-card-meta">
              <span style="font-size:12px;font-weight:700" [style.color]="project.areaColor">
                {{ project.areaName }} · {{ translateStatus(project.status) }}
              </span>
              <span class="kanban-badge" [ngClass]="project.priority.toLowerCase()">
                {{ project.priority }}
              </span>
            </div>

            <div>
              <h3 class="modal-title">{{ project.name }}</h3>
              @if (project.description) {
                <p class="section-subtitle">{{ project.description }}</p>
              }
            </div>

            <div>
              <div class="kanban-card-meta" style="margin-bottom:6px;font-size:12.5px">
                <span>Progresso ({{ project.completedTasksCount }}/{{ project.totalTasksCount }} tarefas)</span>
                <strong>{{ project.progressPercent }}%</strong>
              </div>
              <div class="progress-track">
                <div
                  class="progress-fill"
                  [style.width.%]="project.progressPercent"
                  [style.background]="project.areaColor"
                ></div>
              </div>
            </div>

            @if (project.tasks.length > 0) {
              <div style="display:flex;flex-direction:column;gap:8px">
                @for (task of project.tasks; track task.id) {
                  <div
                    class="task-row"
                    style="background:var(--bg-pill-dark);color:var(--text-primary);padding:8px 14px"
                    [class.done]="task.isCompleted"
                    (click)="toggleProjectTask(task.id)"
                  >
                    <div class="task-left">
                      <span class="check-circle">
                        @if (task.isCompleted) {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="ui-icon-xs">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        }
                      </span>
                      <span class="task-title" style="font-size:13px">{{ task.title }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            <div style="display:flex;gap:8px;margin-top:auto">
              <input
                type="text"
                class="form-input"
                style="padding:8px 12px;font-size:12.5px"
                placeholder="Adicionar tarefa ao projeto..."
                [(ngModel)]="newTaskTitles[project.id]"
                (keyup.enter)="addTaskToProject(project)"
              />
              <button
                type="button"
                class="area-pill btn-mint"
                style="padding:6px 14px;font-size:12.5px"
                (click)="addTaskToProject(project)"
                title="Adicionar tarefa ao projeto"
              >
                <svg class="ui-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>Add</span>
              </button>
              <button
                type="button"
                class="area-pill"
                style="padding:6px 14px;font-size:12.5px"
                (click)="openEditModal(project)"
              >
                Editar
              </button>
            </div>
          </article>
        } @empty {
          <div class="module-card" style="grid-column: 1 / -1;text-align:center;padding:42px">
            <h3 class="modal-title">Nenhum projeto cadastrado</h3>
            <p class="section-subtitle">
              Crie um projeto para organizar metas maiores com prazos e tarefas vinculadas.
            </p>
          </div>
        }
      </div>
    </section>

    @if (modalOpen()) {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <h3 class="modal-title">
            {{ editingProjectId() ? 'Editar Projeto' : 'Novo Projeto' }}
          </h3>

          <input
            type="text"
            [(ngModel)]="formName"
            placeholder="Nome do projeto..."
            class="form-input"
          />

          <textarea
            [(ngModel)]="formDescription"
            rows="3"
            placeholder="Objetivo e escopo do projeto..."
            class="form-input"
          ></textarea>

          <div class="form-grid-3">
            <div>
              <label class="form-label">Área</label>
              <select [(ngModel)]="formAreaId" class="form-select">
                @for (area of areas(); track area.id) {
                  <option [value]="area.id">{{ area.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Status</label>
              <select [(ngModel)]="formStatus" class="form-select">
                <option value="Planning">Planejamento</option>
                <option value="Active">Ativo</option>
                <option value="OnHold">Em espera</option>
                <option value="Completed">Concluído</option>
              </select>
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

          <div class="form-grid-2">
            <div>
              <label class="form-label">Data de Início</label>
              <input type="date" [(ngModel)]="formStartDate" class="form-input" />
            </div>
            <div>
              <label class="form-label">Prazo Final</label>
              <input type="date" [(ngModel)]="formDueDate" class="form-input" />
            </div>
          </div>

          <div class="modal-actions">
            @if (editingProjectId()) {
              <button
                type="button"
                class="area-pill"
                style="margin-right:auto;border-color:var(--accent-coral);color:var(--accent-coral)"
                (click)="deleteCurrentProject()"
              >
                Excluir
              </button>
            }
            <button type="button" class="area-pill" (click)="closeModal()">Cancelar</button>
            <button type="button" class="area-pill active btn-coral" (click)="saveProject()">
              Salvar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ProjectsPageComponent implements OnInit, OnDestroy {
  private readonly workspaceApi = inject(WorkspaceModulesApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly signalr = inject(SignalRService);
  private realtimeSub?: Subscription;

  readonly areas = signal<AreaItem[]>([]);
  readonly projects = signal<ProjectDetailItem[]>([]);
  readonly selectedAreaSlug = signal<string>('all');

  readonly modalOpen = signal<boolean>(false);
  readonly editingProjectId = signal<string | null>(null);

  newTaskTitles: Record<string, string> = {};

  formName = '';
  formDescription = '';
  formAreaId = '';
  formStatus = 'Active';
  formPriority = 'High';
  formStartDate = new Date().toISOString().slice(0, 10);
  formDueDate = '';

  ngOnInit(): void {
    this.dashboardApi.getAreas().subscribe(list => {
      this.areas.set(list);
      if (list.length > 0 && !this.formAreaId) {
        this.formAreaId = list[0].id;
      }
    });
    this.loadProjects();
    this.signalr.connect();
    this.realtimeSub = this.signalr.changes$.subscribe(() => this.loadProjects());
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  loadProjects(): void {
    this.workspaceApi
      .getProjects(this.selectedAreaSlug())
      .subscribe(list => this.projects.set(list));
  }

  selectArea(slug: string): void {
    this.selectedAreaSlug.set(slug);
    this.loadProjects();
  }

  openCreateModal(): void {
    this.editingProjectId.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formAreaId = this.areas()[0]?.id ?? '';
    this.formStatus = 'Active';
    this.formPriority = 'High';
    this.formStartDate = new Date().toISOString().slice(0, 10);
    this.formDueDate = '';
    this.modalOpen.set(true);
  }

  openEditModal(project: ProjectDetailItem): void {
    this.editingProjectId.set(project.id);
    this.formName = project.name;
    this.formDescription = project.description ?? '';
    this.formAreaId = project.areaId;
    this.formStatus = project.status;
    this.formPriority = project.priority;
    this.formStartDate = project.startDate ?? '';
    this.formDueDate = project.dueDate ?? '';
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  saveProject(): void {
    const name = this.formName.trim();
    if (!name) return;

    const payload = {
      name,
      description: this.formDescription.trim() || null,
      areaId: this.formAreaId,
      startDate: this.formStartDate || null,
      dueDate: this.formDueDate || null,
      status: this.formStatus,
      priority: this.formPriority
    };

    const id = this.editingProjectId();
    const req$ = id
      ? this.workspaceApi.updateProject(id, payload)
      : this.workspaceApi.createProject(payload);

    req$.subscribe(() => {
      this.closeModal();
      this.loadProjects();
    });
  }

  deleteCurrentProject(): void {
    const id = this.editingProjectId();
    if (!id) return;

    this.workspaceApi.deleteProject(id).subscribe(() => {
      this.closeModal();
      this.loadProjects();
    });
  }

  addTaskToProject(project: ProjectDetailItem): void {
    const title = (this.newTaskTitles[project.id] ?? '').trim();
    if (!title) return;

    this.dashboardApi
      .createTask({
        title,
        areaId: project.areaId,
        projectId: project.id,
        priority: project.priority,
        status: 'Todo',
        dueDate: project.dueDate ?? new Date().toISOString().slice(0, 10)
      })
      .subscribe(() => {
        this.newTaskTitles[project.id] = '';
        this.loadProjects();
      });
  }

  toggleProjectTask(taskId: string): void {
    this.dashboardApi.toggleTask(taskId).subscribe(() => this.loadProjects());
  }

  translateStatus(status: string): string {
    if (status === 'Planning') return 'Planejamento';
    if (status === 'Active') return 'Em andamento';
    if (status === 'OnHold') return 'Pausado';
    if (status === 'Completed') return 'Concluído';
    return status;
  }
}
