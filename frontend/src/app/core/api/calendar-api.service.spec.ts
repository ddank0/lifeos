import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { CalendarApiService } from './calendar-api.service';

describe('CalendarApiService', () => {
  it('deve montar os parametros de consulta do calendario com intervalo, area e tipo de entrada', () => {
    const service = new CalendarApiService();

    const params = service.buildQueryParams({
      from: '2026-11-01T00:00:00.000Z',
      to: '2026-11-30T23:59:59.000Z',
      areaSlug: 'estudo',
      entryType: 'task'
    });

    expect(params.get('from')).toBe('2026-11-01T00:00:00.000Z');
    expect(params.get('to')).toBe('2026-11-30T23:59:59.000Z');
    expect(params.get('areaSlug')).toBe('estudo');
    expect(params.get('entryType')).toBe('task');
  });

  it('deve omitir areaSlug e entryType quando o filtro for all', () => {
    const service = new CalendarApiService();

    const params = service.buildQueryParams({
      from: '2026-11-01T00:00:00.000Z',
      to: '2026-11-30T23:59:59.000Z',
      areaSlug: 'all',
      entryType: 'all'
    });

    expect(params.has('areaSlug')).toBe(false);
    expect(params.has('entryType')).toBe(false);
  });
});
