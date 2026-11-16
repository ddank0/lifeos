import { Injectable, Optional, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, UserProfile } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'lifeos_access_token';
  private readonly userKey = 'lifeos_user_profile';
  readonly apiBaseUrl = environment.apiUrl;

  readonly currentUser = signal<UserProfile | null>(this.loadStoredUser());
  readonly accessToken = signal<string | null>(this.loadStoredToken());
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));

  constructor(@Optional() private readonly http?: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    if (!this.http) {
      throw new Error('HttpClient nao disponivel');
    }
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  register(fullName: string, email: string, password: string): Observable<AuthResponse> {
    if (!this.http) {
      throw new Error('HttpClient nao disponivel');
    }
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/register`, { fullName, email, password })
      .pipe(tap((res) => this.persistSession(res)));
  }

  persistSession(res: AuthResponse): void {
    this.accessToken.set(res.accessToken);
    this.currentUser.set(res.user);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.tokenKey, res.accessToken);
      localStorage.setItem(this.userKey, JSON.stringify(res.user));
    }
  }

  updateCurrentUserProfile(fullName: string, themePreference?: 'dark' | 'light'): void {
    const current = this.currentUser();
    if (current) {
      const updated: UserProfile = {
        ...current,
        fullName,
        ...(themePreference ? { themePreference } : {})
      };
      this.currentUser.set(updated);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.userKey, JSON.stringify(updated));
      }
    }
  }

  logout(): void {
    this.accessToken.set(null);
    this.currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
  }

  private loadStoredToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.tokenKey);
  }

  private loadStoredUser(): UserProfile | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  }
}
