import { describe, expect, it, beforeEach } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('deve iniciar no tema escuro por padrao e alternar para claro', () => {
    const service = new ThemeService();
    expect(service.currentTheme()).toBe('dark');

    const next = service.toggleTheme();
    expect(next).toBe('light');
    expect(service.currentTheme()).toBe('light');

    const back = service.toggleTheme();
    expect(back).toBe('dark');
  });
});
