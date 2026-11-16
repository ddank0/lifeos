import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { LifeTrackerApiService } from './life-tracker-api.service';

describe('LifeTrackerApiService', () => {
  it('deve montar os parametros de areaSlug corretamente', () => {
    const service = new LifeTrackerApiService();

    const params = service.buildParams('estudo');
    expect(params.get('areaSlug')).toBe('estudo');

    const allParams = service.buildParams('all');
    expect(allParams.has('areaSlug')).toBe(false);
  });
});
