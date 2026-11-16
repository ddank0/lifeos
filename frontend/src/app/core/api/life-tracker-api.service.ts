import { Injectable, Optional } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LifeMetricDetailItem, SaveLifeMetricPayload } from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class LifeTrackerApiService {
  private readonly baseUrl = `${environment.apiUrl}/life-tracker`;

  constructor(@Optional() private readonly http?: HttpClient) {}

  buildParams(areaSlug = 'all'): HttpParams {
    let params = new HttpParams();
    if (areaSlug && areaSlug !== 'all') {
      params = params.set('areaSlug', areaSlug);
    }
    return params;
  }

  getMetrics(areaSlug = 'all'): Observable<LifeMetricDetailItem[]> {
    const params = this.buildParams(areaSlug);
    return this.requireHttp().get<LifeMetricDetailItem[]>(this.baseUrl, { params });
  }

  createMetric(payload: SaveLifeMetricPayload): Observable<LifeMetricDetailItem> {
    return this.requireHttp().post<LifeMetricDetailItem>(this.baseUrl, payload);
  }

  updateMetric(id: string, payload: SaveLifeMetricPayload): Observable<LifeMetricDetailItem> {
    return this.requireHttp().put<LifeMetricDetailItem>(`${this.baseUrl}/${id}`, payload);
  }

  adjustValue(id: string, delta: number, date?: string): Observable<LifeMetricDetailItem> {
    return this.requireHttp().post<LifeMetricDetailItem>(`${this.baseUrl}/${id}/adjust`, { delta, date });
  }

  setValue(id: string, value: number, date?: string, notes?: string): Observable<LifeMetricDetailItem> {
    return this.requireHttp().post<LifeMetricDetailItem>(`${this.baseUrl}/${id}/set`, { value, date, notes });
  }

  deleteMetric(id: string): Observable<void> {
    return this.requireHttp().delete<void>(`${this.baseUrl}/${id}`);
  }

  private requireHttp(): HttpClient {
    if (!this.http) {
      throw new Error('HttpClient nao configurado');
    }
    return this.http;
  }
}
