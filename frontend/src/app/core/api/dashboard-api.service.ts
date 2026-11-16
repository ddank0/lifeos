import { Injectable, Optional, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AreaItem,
  DashboardEventItem,
  DashboardSummary,
  DashboardTaskItem,
  EventDetailItem,
  LabelItem,
  SaveAreaPayload,
  SaveEventPayload,
  SaveTaskPayload,
  TaskDetailItem
} from '../auth/auth.models';

export interface DashboardFilterOptions {
  areaSlug?: string;
  priority?: string;
  status?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly baseUrl = environment.apiUrl;
  readonly searchTerm = signal<string>('');

  constructor(@Optional() private readonly http?: HttpClient) {}

  setSearchTerm(term: string): void {
    this.searchTerm.set(term.trim());
  }

  buildSummaryParams(filters: DashboardFilterOptions = {}): HttpParams {
    let params = new HttpParams();
    if (filters.areaSlug && filters.areaSlug !== 'all') {
      params = params.set('areaSlug', filters.areaSlug);
    }
    if (filters.priority && filters.priority !== 'all') {
      params = params.set('priority', filters.priority);
    }
    if (filters.status && filters.status !== 'all') {
      params = params.set('status', filters.status);
    }
    const search = filters.search ?? this.searchTerm();
    if (search) {
      params = params.set('search', search);
    }
    return params;
  }

  getAreas(): Observable<AreaItem[]> {
    return this.requireHttp().get<AreaItem[]>(`${this.baseUrl}/areas`);
  }

  createArea(payload: SaveAreaPayload): Observable<AreaItem> {
    return this.requireHttp().post<AreaItem>(`${this.baseUrl}/areas`, payload);
  }

  updateArea(id: string, payload: SaveAreaPayload): Observable<AreaItem> {
    return this.requireHttp().put<AreaItem>(`${this.baseUrl}/areas/${id}`, payload);
  }

  deleteArea(id: string): Observable<void> {
    return this.requireHttp().delete<void>(`${this.baseUrl}/areas/${id}`);
  }

  getLabels(): Observable<LabelItem[]> {
    return this.requireHttp().get<LabelItem[]>(`${this.baseUrl}/labels`);
  }

  createLabel(name: string, color: string): Observable<LabelItem> {
    return this.requireHttp().post<LabelItem>(`${this.baseUrl}/labels`, { name, color });
  }

  getSummary(filters: string | DashboardFilterOptions = 'all'): Observable<DashboardSummary> {
    const normalized: DashboardFilterOptions =
      typeof filters === 'string' ? { areaSlug: filters } : filters;
    const params = this.buildSummaryParams(normalized);
    return this.requireHttp().get<DashboardSummary>(`${this.baseUrl}/dashboard/summary`, { params });
  }

  getTasks(filters: {
    areaId?: string;
    areaSlug?: string;
    priority?: string;
    status?: string;
    search?: string;
    overdueOnly?: boolean;
  } = {}): Observable<TaskDetailItem[]> {
    let params = new HttpParams();
    if (filters.areaId) params = params.set('areaId', filters.areaId);
    if (filters.areaSlug && filters.areaSlug !== 'all') params = params.set('areaSlug', filters.areaSlug);
    if (filters.priority && filters.priority !== 'all') params = params.set('priority', filters.priority);
    if (filters.status && filters.status !== 'all') params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.overdueOnly) params = params.set('overdueOnly', 'true');
    return this.requireHttp().get<TaskDetailItem[]>(`${this.baseUrl}/tasks`, { params });
  }

  getTaskById(id: string): Observable<TaskDetailItem> {
    return this.requireHttp().get<TaskDetailItem>(`${this.baseUrl}/tasks/${id}`);
  }

  createTask(payload: SaveTaskPayload): Observable<TaskDetailItem> {
    return this.requireHttp().post<TaskDetailItem>(`${this.baseUrl}/tasks`, payload);
  }

  updateTask(id: string, payload: SaveTaskPayload): Observable<TaskDetailItem> {
    return this.requireHttp().put<TaskDetailItem>(`${this.baseUrl}/tasks/${id}`, payload);
  }

  deleteTask(id: string): Observable<void> {
    return this.requireHttp().delete<void>(`${this.baseUrl}/tasks/${id}`);
  }

  toggleTask(taskId: string): Observable<DashboardTaskItem> {
    return this.requireHttp().patch<DashboardTaskItem>(
      `${this.baseUrl}/dashboard/tasks/${taskId}/toggle`,
      {}
    );
  }

  toggleEvent(eventId: string): Observable<DashboardEventItem> {
    return this.requireHttp().patch<DashboardEventItem>(
      `${this.baseUrl}/dashboard/events/${eventId}/toggle`,
      {}
    );
  }

  getEvents(filters: { areaId?: string; areaSlug?: string } = {}): Observable<EventDetailItem[]> {
    let params = new HttpParams();
    if (filters.areaId) params = params.set('areaId', filters.areaId);
    if (filters.areaSlug && filters.areaSlug !== 'all') params = params.set('areaSlug', filters.areaSlug);
    return this.requireHttp().get<EventDetailItem[]>(`${this.baseUrl}/events`, { params });
  }

  createEvent(payload: SaveEventPayload): Observable<EventDetailItem> {
    return this.requireHttp().post<EventDetailItem>(`${this.baseUrl}/events`, payload);
  }

  updateEvent(id: string, payload: SaveEventPayload): Observable<EventDetailItem> {
    return this.requireHttp().put<EventDetailItem>(`${this.baseUrl}/events/${id}`, payload);
  }

  deleteEvent(id: string): Observable<void> {
    return this.requireHttp().delete<void>(`${this.baseUrl}/events/${id}`);
  }

  quickCapture(payload: { title: string; recordType: string; areaId?: string }): Observable<unknown> {
    return this.requireHttp().post(`${this.baseUrl}/dashboard/quick-capture`, payload);
  }

  private requireHttp(): HttpClient {
    if (!this.http) {
      throw new Error('HttpClient nao configurado');
    }
    return this.http;
  }
}
