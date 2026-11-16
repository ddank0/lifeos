import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { NotificationsSettingsApiService } from './notifications-settings-api.service';

describe('NotificationsSettingsApiService', () => {
  it('deve formatar data e horario do lembrete para padrao ISO UTC', () => {
    const service = new NotificationsSettingsApiService();
    const iso = service.formatReminderIso('2026-11-15', '14:30');
    expect(iso).toBe('2026-11-15T14:30:00.000Z');
  });
});
