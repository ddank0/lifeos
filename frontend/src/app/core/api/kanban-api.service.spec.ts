import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { KanbanApiService } from './kanban-api.service';

describe('KanbanApiService', () => {
  it('deve montar os parametros de filtro do quadro Kanban corretamente', () => {
    const service = new KanbanApiService();

    const params = service.buildQueryParams({
      areaSlug: 'trabalho',
      priority: 'Urgent',
      search: '  relatorio  ',
      overdueOnly: true
    });

    expect(params.get('areaSlug')).toBe('trabalho');
    expect(params.get('priority')).toBe('Urgent');
    expect(params.get('search')).toBe('relatorio');
    expect(params.get('overdueOnly')).toBe('true');
  });

  it('deve omitir filtros com valor all ou vazios', () => {
    const service = new KanbanApiService();

    const params = service.buildQueryParams({
      areaSlug: 'all',
      priority: 'all',
      projectId: 'all',
      search: '   ',
      overdueOnly: false
    });

    expect(params.has('areaSlug')).toBe(false);
    expect(params.has('priority')).toBe(false);
    expect(params.has('projectId')).toBe(false);
    expect(params.has('search')).toBe(false);
    expect(params.has('overdueOnly')).toBe(false);
  });
});
