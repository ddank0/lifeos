import { Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NotificationCenterData,
  ReminderItem,
  SettingsOverviewData
} from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class NotificationsSettingsApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(@Optional() private readonly http?: HttpClient) {}

  formatReminderIso(date: string, time: string): string {
    const cleanTime = time && time.length >= 5 ? time.slice(0, 5) : '09:00';
    return `${date}T${cleanTime}:00.000Z`;
  }

  getNotificationCenter(): Observable<NotificationCenterData> {
    return this.requireHttp().get<NotificationCenterData>(`${this.baseUrl}/notifications`);
  }

  createReminder(payload: {
    taskId?: string | null;
    eventId?: string | null;
    remindAt: string;
  }): Observable<ReminderItem> {
    return this.requireHttp().post<ReminderItem>(
      `${this.baseUrl}/notifications/reminders`,
      payload
    );
  }

  processDueReminders(): Observable<{ processedCount: number }> {
    return this.requireHttp().post<{ processedCount: number }>(
      `${this.baseUrl}/notifications/process-due`,
      {}
    );
  }

  markAsRead(id: string): Observable<{ read: boolean }> {
    return this.requireHttp().patch<{ read: boolean }>(
      `${this.baseUrl}/notifications/${id}/read`,
      {}
    );
  }

  markAllAsRead(): Observable<{ markedCount: number }> {
    return this.requireHttp().post<{ markedCount: number }>(
      `${this.baseUrl}/notifications/read-all`,
      {}
    );
  }

  getSettingsOverview(): Observable<SettingsOverviewData> {
    return this.requireHttp().get<SettingsOverviewData>(`${this.baseUrl}/settings/overview`);
  }

  updateProfile(payload: {
    fullName: string;
    themePreference: 'dark' | 'light';
  }): Observable<SettingsOverviewData> {
    return this.requireHttp().put<SettingsOverviewData>(
      `${this.baseUrl}/settings/profile`,
      payload
    );
  }

  private requireHttp(): HttpClient {
    if (!this.http) {
      throw new Error('HttpClient nao configurado');
    }
    return this.http;
  }
}
