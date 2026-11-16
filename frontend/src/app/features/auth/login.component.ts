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
          [disabled]="isLoading()"
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

        <div style="display:flex;justify-content:center;margin-top:6px">
          <button
            type="button"
            class="area-pill"
            style="font-size:11.5px;padding:4px 12px;opacity:0.75"
            (click)="fillDemoCredentials()"
          >
            Preencher demo: gabriel&#64;lifeos.dev
          </button>
        </div>

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

  email = 'gabriel@lifeos.dev';
  password = 'LifeOs@2026';
  readonly isLoading = signal(false);
  readonly errorMsg = signal('');

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  fillDemoCredentials(): void {
    this.email = 'gabriel@lifeos.dev';
    this.password = 'LifeOs@2026';
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
