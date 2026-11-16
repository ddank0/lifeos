import { Injectable, Optional } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CalendarEntryItem, RescheduleCalendarEntryPayload } from '../auth/auth.models';

export interface CalendarQueryOptions {
  from: string;
  to: string;
  areaId?: string;
  areaSlug?: string;
  entryType?: 'all' | 'event' | 'task';
}

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly baseUrl = `${environment.apiUrl}/calendar`;

  constructor(@Optional() private readonly http?: HttpClient) {}

  buildQueryParams(options: CalendarQueryOptions): HttpParams {
    let params = new HttpParams()
      .set('from', options.from)
      .set('to', options.to);

    if (options.areaId && options.areaId !== 'all') {
      params = params.set('areaId', options.areaId);
    }

    if (options.areaSlug && options.areaSlug !== 'all') {
      params = params.set('areaSlug', options.areaSlug);
    }

    if (options.entryType && options.entryType !== 'all') {
      params = params.set('entryType', options.entryType);
    }

    return params;
  }

  getEntries(options: CalendarQueryOptions): Observable<CalendarEntryItem[]> {
    const params = this.buildQueryParams(options);
    return this.requireHttp().get<CalendarEntryItem[]>(this.baseUrl, { params });
  }

  rescheduleEntry(payload: RescheduleCalendarEntryPayload): Observable<{ updated: boolean }> {
    return this.requireHttp().patch<{ updated: boolean }>(`${this.baseUrl}/reschedule`, payload);
  }

  private requireHttp(): HttpClient {
    if (!this.http) {
      throw new Error('HttpClient nao configurado');
    }
    return this.http;
  }
}
