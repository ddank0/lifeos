import { Injectable, Optional } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KanbanBoardData, KanbanCardItem } from '../auth/auth.models';

export interface KanbanFilterOptions {
  areaId?: string;
  areaSlug?: string;
  projectId?: string;
  priority?: string;
  search?: string;
  overdueOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class KanbanApiService {
  private readonly baseUrl = `${environment.apiUrl}/kanban`;

  constructor(@Optional() private readonly http?: HttpClient) {}

  buildQueryParams(filters: KanbanFilterOptions = {}): HttpParams {
    let params = new HttpParams();

    if (filters.areaId && filters.areaId !== 'all') {
      params = params.set('areaId', filters.areaId);
    }

    if (filters.areaSlug && filters.areaSlug !== 'all') {
      params = params.set('areaSlug', filters.areaSlug);
    }

    if (filters.projectId && filters.projectId !== 'all') {
      params = params.set('projectId', filters.projectId);
    }

    if (filters.priority && filters.priority !== 'all') {
      params = params.set('priority', filters.priority);
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.overdueOnly) {
      params = params.set('overdueOnly', 'true');
    }

    return params;
  }

  getBoard(filters: KanbanFilterOptions = {}): Observable<KanbanBoardData> {
    const params = this.buildQueryParams(filters);
    return this.requireHttp().get<KanbanBoardData>(this.baseUrl, { params });
  }

  moveCard(
    taskId: string,
    targetStatus: string,
    targetPosition: number
  ): Observable<KanbanCardItem> {
    return this.requireHttp().patch<KanbanCardItem>(`${this.baseUrl}/cards/${taskId}/move`, {
      targetStatus,
      targetPosition
    });
  }

  private requireHttp(): HttpClient {
    if (!this.http) {
      throw new Error('HttpClient nao configurado');
    }
    return this.http;
  }
}
