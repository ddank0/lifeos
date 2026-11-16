import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('deve persistir e limpar a sessao JWT corretamente', () => {
    const service = new AuthService();
    service.logout();
    expect(service.isAuthenticated()).toBe(false);

    service.persistSession({
      accessToken: 'jwt-token-test',
      expiresAt: '2026-11-12T00:00:00Z',
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        fullName: 'Gabriel Miranda',
        email: 'gabriel@lifeos.dev',
        themePreference: 'dark'
      }
    });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.fullName).toBe('Gabriel Miranda');

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });
});
