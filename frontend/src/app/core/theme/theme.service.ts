import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'lifeos_theme';
  readonly currentTheme = signal<ThemeMode>('dark');

  constructor() {
    const saved = typeof localStorage !== 'undefined'
      ? (localStorage.getItem(this.storageKey) as ThemeMode | null)
      : null;
    this.setTheme(saved === 'light' ? 'light' : 'dark');
  }

  toggleTheme(): ThemeMode {
    const next: ThemeMode = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, mode);
    }
    if (typeof document !== 'undefined' && document.body) {
      if (mode === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    }
  }
}
