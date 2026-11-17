import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="section-header-row">
          <div>
            <h1 class="modal-title">Entrar no LIFEOS</h1>
            <p class="section-subtitle">Sistema Inteligente de Organização Pessoal</p>
          </div>
          <div class="brand-logo">L<span class="dot"></span></div>
        </div>

        @if (errorMsg()) {
          <div class="auth-error">{{ errorMsg() }}</div>
        }

        <div class="left-col">
          <input
            type="email"
            class="form-input"
            [(ngModel)]="email"
            placeholder="E-mail"
            (keyup.enter)="submit()"
          />
          <input
            type="password"
            class="form-input"
            [(ngModel)]="password"
            placeholder="Senha"
            (keyup.enter)="submit()"
          />
        </div>

        <button
          type="button"
          class="area-pill btn-coral"
          style="width:100%;padding:12px 20px;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:8px"
          [disabled]="isLoading() || isDemoLoading()"
          (click)="submit()"
        >
          @if (isLoading()) {
            <svg class="ui-icon" style="animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span>Acessando Workspace...</span>
          } @else {
            <span>Acessar Workspace</span>
            <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          }
        </button>

        <div style="display:flex;align-items:center;gap:12px;margin:8px 0;opacity:0.6">
          <div style="flex:1;height:1px;background:var(--border-subtle)"></div>
          <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em">ou teste agora</span>
          <div style="flex:1;height:1px;background:var(--border-subtle)"></div>
        </div>

        <button
          type="button"
          class="area-pill btn-mint"
          style="width:100%;padding:11px 20px;font-size:14px;display:inline-flex;align-items:center;justify-content:center;gap:8px"
          [disabled]="isLoading() || isDemoLoading()"
          (click)="loginAsDemo()"
        >
          @if (isDemoLoading()) {
            <svg class="ui-icon" style="animation:spin 1s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span>Entrando como Demo...</span>
          } @else {
            <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <span>Entrar na Conta Demo</span>
          }
        </button>

        <p class="section-subtitle" style="text-align:center">
          Ainda não possui conta?
          <a routerLink="/register" style="color:var(--accent-sky);text-decoration:none;font-weight:600">
            Criar conta
          </a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  readonly isLoading = signal(false);
  readonly isDemoLoading = signal(false);
  readonly errorMsg = signal('');

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  loginAsDemo(): void {
    this.errorMsg.set('');
    this.isDemoLoading.set(true);
    this.email = 'demo@lifeos.dev';
    this.password = 'LifeOs@2026';

    this.authService.login('demo@lifeos.dev', 'LifeOs@2026').subscribe({
      next: () => {
        this.isDemoLoading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isDemoLoading.set(false);
        this.errorMsg.set('Não foi possível autenticar na conta de demonstração no momento.');
      }
    });
  }

  submit(): void {
    if (!this.email.trim() || !this.password) {
      this.errorMsg.set('Informe seu e-mail e senha.');
      return;
    }

    this.errorMsg.set('');
    this.isLoading.set(true);

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMsg.set('Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    });
  }
}
