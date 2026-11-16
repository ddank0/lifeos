import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { WorkspaceModulesApiService } from './workspace-modules-api.service';

describe('WorkspaceModulesApiService', () => {
  it('deve montar os parametros da Caixa de Entrada com includeProcessed e areaSlug', () => {
    const service = new WorkspaceModulesApiService();

    const params = service.buildInboxParams(true, 'estudo');
    expect(params.get('includeProcessed')).toBe('true');
    expect(params.get('areaSlug')).toBe('estudo');
  });

  it('deve omitir areaSlug quando for all', () => {
    const service = new WorkspaceModulesApiService();

    const params = service.buildInboxParams(false, 'all');
    expect(params.get('includeProcessed')).toBe('false');
    expect(params.has('areaSlug')).toBe(false);
  });
});
