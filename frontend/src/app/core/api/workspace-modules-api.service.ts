import { Injectable, Optional } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConvertQuickNotePayload,
  HabitDetailItem,
  ProjectDetailItem,
  QuickNoteItem,
  SaveHabitPayload,
  SaveProjectPayload,
  SaveQuickNotePayload
} from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceModulesApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(@Optional() private readonly http?: HttpClient) {}

  buildInboxParams(includeProcessed = false, areaSlug = 'all'): HttpParams {
    let params = new HttpParams().set('includeProcessed', String(includeProcessed));
    if (areaSlug && areaSlug !== 'all') {
      params = params.set('areaSlug', areaSlug);
    }
    return params;
  }

  getInboxNotes(includeProcessed = false, areaSlug = 'all'): Observable<QuickNoteItem[]> {
    const params = this.buildInboxParams(includeProcessed, areaSlug);
    return this.requireHttp().get<QuickNoteItem[]>(`${this.baseUrl}/inbox`, { params });
  }

  createInboxNote(payload: SaveQuickNotePayload): Observable<QuickNoteItem> {
    return this.requireHttp().post<QuickNoteItem>(`${this.baseUrl}/inbox`, payload);
  }

  convertInboxNote(id: string, payload: ConvertQuickNotePayload): Observable<QuickNoteItem> {
    return this.requireHttp().post<QuickNoteItem>(`${this.baseUrl}/inbox/${id}/convert`, payload);
  }

  deleteInboxNote(id: string): Observable<void> {
    return this.requireHttp().delete<void>(`${this.baseUrl}/inbox/${id}`);
  }

  getProjects(areaSlug = 'all', status = 'all'): Observable<ProjectDetailItem[]> {
    let params = new HttpParams();
    if (areaSlug && areaSlug !== 'all') {
      params = params.set('areaSlug', areaSlug);
    }
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    return this.requireHttp().get<ProjectDetailItem[]>(`${this.baseUrl}/projects`, { params });
  }

  createProject(payload: SaveProjectPayload): Observable<ProjectDetailItem> {
    return this.requireHttp().post<ProjectDetailItem>(`${this.baseUrl}/projects`, payload);
  }

  updateProject(id: string, payload: SaveProjectPayload): Observable<ProjectDetailItem> {
    return this.requireHttp().put<ProjectDetailItem>(`${this.baseUrl}/projects/${id}`, payload);
  }

  deleteProject(id: string): Observable<void> {
    return this.requireHttp().delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  getHabits(areaSlug = 'all'): Observable<HabitDetailItem[]> {
    let params = new HttpParams();
    if (areaSlug && areaSlug !== 'all') {
      params = params.set('areaSlug', areaSlug);
    }
    return this.requireHttp().get<HabitDetailItem[]>(`${this.baseUrl}/habits`, { params });
  }

  createHabit(payload: SaveHabitPayload): Observable<HabitDetailItem> {
    return this.requireHttp().post<HabitDetailItem>(`${this.baseUrl}/habits`, payload);
  }

  updateHabit(id: string, payload: SaveHabitPayload): Observable<HabitDetailItem> {
    return this.requireHttp().put<HabitDetailItem>(`${this.baseUrl}/habits/${id}`, payload);
  }

  toggleHabitCompletion(id: string, date?: string): Observable<HabitDetailItem> {
    return this.requireHttp().post<HabitDetailItem>(`${this.baseUrl}/habits/${id}/toggle`, { date });
  }

  deleteHabit(id: string): Observable<void> {
    return this.requireHttp().delete<void>(`${this.baseUrl}/habits/${id}`);
  }

  private requireHttp(): HttpClient {
    if (!this.http) {
      throw new Error('HttpClient nao configurado');
    }
    return this.http;
  }
}
