import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { DashboardApiService } from './dashboard-api.service';

describe('DashboardApiService', () => {
  it('deve montar os parametros de filtro de area, prioridade, status e busca corretamente', () => {
    const service = new DashboardApiService();
    service.setSearchTerm('  arquitetura  ');
    expect(service.searchTerm()).toBe('arquitetura');

    const params = service.buildSummaryParams({
      areaSlug: 'trabalho',
      priority: 'Urgent',
      status: 'InProgress'
    });

    expect(params.get('areaSlug')).toBe('trabalho');
    expect(params.get('priority')).toBe('Urgent');
    expect(params.get('status')).toBe('InProgress');
    expect(params.get('search')).toBe('arquitetura');
  });
});
