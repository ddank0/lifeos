import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="section-header-row">
          <div>
            <h1 class="modal-title">Criar Conta</h1>
            <p class="section-subtitle">Provisionamento automático das 5 áreas da vida</p>
          </div>
          <div class="brand-logo">L<span class="dot"></span></div>
        </div>

        @if (errorMsg()) {
          <div class="auth-error">{{ errorMsg() }}</div>
        }

        <div class="left-col">
          <input
            type="text"
            class="form-input"
            [(ngModel)]="fullName"
            placeholder="Nome completo"
          />
          <input
            type="email"
            class="form-input"
            [(ngModel)]="email"
            placeholder="E-mail"
          />
          <input
            type="password"
            class="form-input"
            [(ngModel)]="password"
            placeholder="Senha (mínimo 6 caracteres)"
          />
        </div>

        <button
          type="button"
          class="area-pill btn-mint"
          style="width:100%;padding:12px 20px;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:8px"
          (click)="submit()"
        >
          <span>Criar meu LIFEOS</span>
          <svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>

        <p class="section-subtitle" style="text-align:center">
          Já possui conta?
          <a routerLink="/login" style="color:var(--accent-sky);text-decoration:none;font-weight:600">
            Entrar
          </a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  readonly errorMsg = signal('');

  submit(): void {
    this.errorMsg.set('');
    this.authService.register(this.fullName, this.email, this.password).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: () => this.errorMsg.set('Não foi possível criar a conta. Verifique os dados.')
    });
  }
}
