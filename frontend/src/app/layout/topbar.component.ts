import { Component, ElementRef, EventEmitter, HostListener, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme/theme.service';
import { DashboardApiService } from '../core/api/dashboard-api.service';
import { SignalRService } from '../core/realtime/signalr.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <!-- Desktop Navigation Links (hidden on mobile <= 768px) -->
      <nav class="nav-links desktop-nav">
        <a
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="nav-item"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Home</span>
        </a>

        <div class="modules-menu-wrapper" [class.open]="isModulesMenuOpen()">
          <button
            type="button"
            class="nav-item modules-trigger-btn"
            [class.active]="isModulesActive()"
            (click)="toggleModulesMenu($event)"
            title="Acessar Módulos e Visões"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="6" y1="20" x2="6" y2="15"/>
            </svg>
            <span>Módulos</span>
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          @if (isModulesMenuOpen()) {
            <div class="modules-dropdown-menu">
              <a
                routerLink="/calendar"
                routerLinkActive="active"
                class="modules-dropdown-item"
                (click)="closeAllMenus()"
              >
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Calendário</span>
              </a>
              <a
                routerLink="/kanban"
                routerLinkActive="active"
                class="modules-dropdown-item"
                (click)="closeAllMenus()"
              >
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect width="6" height="14" x="3" y="5" rx="1"/>
                  <rect width="6" height="10" x="15" y="5" rx="1"/>
                </svg>
                <span>Quadro Kanban</span>
              </a>
              <a
                routerLink="/inbox"
                routerLinkActive="active"
                class="modules-dropdown-item"
                (click)="closeAllMenus()"
              >
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                </svg>
                <span>Caixa de Entrada</span>
              </a>
              <a
                routerLink="/areas"
                routerLinkActive="active"
                class="modules-dropdown-item"
                (click)="closeAllMenus()"
              >
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Áreas da Vida</span>
              </a>
              <a
                routerLink="/projects"
                routerLinkActive="active"
                class="modules-dropdown-item"
                (click)="closeAllMenus()"
              >
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                </svg>
                <span>Projetos</span>
              </a>
              <a
                routerLink="/habits"
                routerLinkActive="active"
                class="modules-dropdown-item"
                (click)="closeAllMenus()"
              >
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span>Hábitos & Rotinas</span>
              </a>
              <a
                routerLink="/life-tracker"
                routerLinkActive="active"
                class="modules-dropdown-item"
                (click)="closeAllMenus()"
              >
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                <span>Life Tracker</span>
              </a>
              <div class="dropdown-divider"></div>
              <a
                routerLink="/settings"
                routerLinkActive="active"
                class="modules-dropdown-item"
                (click)="closeAllMenus()"
              >
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>Configurações</span>
              </a>
            </div>
          }
        </div>

        <button
          type="button"
          class="nav-item quick-add-btn"
          (click)="openQuickCapture.emit()"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Add</span>
        </button>
      </nav>

      <a routerLink="/dashboard" class="brand-logo" title="LIFEOS">
        L<span class="dot"></span>
      </a>

      <div class="topbar-right">
        <div class="search-box">
          <input
            type="text"
            [ngModel]="dashboardApi.searchTerm()"
            (ngModelChange)="onSearchChange($event)"
            placeholder="Search..."
          />
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>

        <button
          type="button"
          class="theme-btn"
          (click)="themeService.toggleTheme()"
          title="Alternar tema Claro/Escuro"
        >
          @if (themeService.currentTheme() === 'dark') {
            <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2"/>
              <path d="M12 20v2"/>
              <path d="m4.93 4.93 1.41 1.41"/>
              <path d="m17.66 17.66 1.41 1.41"/>
              <path d="M2 12h2"/>
              <path d="M20 12h2"/>
              <path d="m6.34 17.66-1.41 1.41"/>
              <path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          } @else {
            <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
            </svg>
          }
        </button>

        <div class="user-menu-wrapper" [class.open]="isUserMenuOpen()">
          <div
            class="user-pill"
            (click)="toggleUserMenu($event)"
            role="button"
            tabindex="0"
            title="Menu do Perfil"
          >
            <div class="user-avatar">{{ initials() }}</div>
            <span style="font-size:12.5px;font-weight:600">{{ authService.currentUser()?.fullName || 'Demo Account' }}</span>
            @if (authService.currentUser()?.isDemo || authService.currentUser()?.email === 'demo@lifeos.dev') {
              <span class="demo-badge">Demo</span>
            }
            <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>

          @if (isUserMenuOpen()) {
            <div class="user-dropdown-menu">
              <div class="user-dropdown-header">
                <div class="user-avatar-lg">{{ initials() }}</div>
                <div class="user-dropdown-info">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="user-dropdown-name">{{ authService.currentUser()?.fullName || 'Demo Account' }}</span>
                    @if (authService.currentUser()?.isDemo || authService.currentUser()?.email === 'demo@lifeos.dev') {
                      <span class="demo-badge">Demo</span>
                    }
                  </div>
                  <span class="user-dropdown-email">{{ authService.currentUser()?.email || 'demo@lifeos.dev' }}</span>
                </div>
              </div>

              <a routerLink="/settings" class="user-dropdown-item" (click)="closeAllMenus()">
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span>Configurações & Perfil</span>
              </a>

              <a routerLink="/life-tracker" class="user-dropdown-item" (click)="closeAllMenus()">
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                <span>Life Tracker</span>
              </a>

              <button type="button" class="user-dropdown-item logout-item" (click)="logout()">
                <svg class="module-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" x2="9" y1="12" y2="12"/>
                </svg>
                <span>Sair da conta</span>
              </button>
            </div>
          }
        </div>
      </div>
    </header>

    <!-- Mobile Bottom Navigation Bar (Visible only on mobile <= 768px) -->
    <nav class="mobile-bottom-bar" aria-label="Navegação Mobile">
      <a
        routerLink="/dashboard"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: true }"
        class="mobile-bottom-item"
        (click)="closeAllMenus()"
      >
        <svg class="mobile-bottom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span class="mobile-bottom-label">Início</span>
      </a>

      <a
        routerLink="/calendar"
        routerLinkActive="active"
        class="mobile-bottom-item"
        (click)="closeAllMenus()"
      >
        <svg class="mobile-bottom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span class="mobile-bottom-label">Agenda</span>
      </a>

      <button
        type="button"
        class="mobile-bottom-item mobile-bottom-action-btn"
        (click)="onQuickCaptureClick()"
        title="Captura Rápida"
      >
        <div class="mobile-action-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span class="mobile-bottom-label">Criar</span>
      </button>

      <a
        routerLink="/kanban"
        routerLinkActive="active"
        class="mobile-bottom-item"
        (click)="closeAllMenus()"
      >
        <svg class="mobile-bottom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="6" height="14" x="3" y="5" rx="1"/>
          <rect width="6" height="10" x="15" y="5" rx="1"/>
        </svg>
        <span class="mobile-bottom-label">Kanban</span>
      </a>

      <button
        type="button"
        class="mobile-bottom-item"
        [class.active]="isModulesActive() || isMobileSheetOpen()"
        (click)="toggleMobileSheet($event)"
      >
        <svg class="mobile-bottom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect width="7" height="7" x="3" y="3" rx="1.5"/>
          <rect width="7" height="7" x="14" y="3" rx="1.5"/>
          <rect width="7" height="7" x="14" y="14" rx="1.5"/>
          <rect width="7" height="7" x="3" y="14" rx="1.5"/>
        </svg>
        <span class="mobile-bottom-label">Módulos</span>
      </button>
    </nav>

    <!-- Mobile Modules Bottom Sheet Modal (Drawer) -->
    @if (isMobileSheetOpen()) {
      <div class="mobile-sheet-backdrop" (click)="closeMobileSheet()">
        <div class="mobile-sheet-panel" (click)="$event.stopPropagation()">
          <div class="mobile-sheet-handle-bar">
            <div class="mobile-sheet-handle"></div>
          </div>

          <div class="mobile-sheet-header">
            <div>
              <h3 class="mobile-sheet-title">Módulos & Visões</h3>
              <p class="mobile-sheet-subtitle">Todas as ferramentas do LifeOS em um só lugar</p>
            </div>
            <button
              type="button"
              class="mobile-sheet-close-btn"
              (click)="closeMobileSheet()"
              title="Fechar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="mobile-sheet-grid">
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              class="mobile-module-tile"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-coral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Home</span>
                <span class="module-tile-sub">Visão geral do dia</span>
              </div>
            </a>

            <a
              routerLink="/calendar"
              routerLinkActive="active"
              class="mobile-module-tile"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-sky">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Calendário</span>
                <span class="module-tile-sub">Agenda & eventos</span>
              </div>
            </a>

            <a
              routerLink="/kanban"
              routerLinkActive="active"
              class="mobile-module-tile"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-mint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="6" height="14" x="3" y="5" rx="1"/>
                  <rect width="6" height="10" x="15" y="5" rx="1"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Kanban</span>
                <span class="module-tile-sub">Quadro de tarefas</span>
              </div>
            </a>

            <a
              routerLink="/inbox"
              routerLinkActive="active"
              class="mobile-module-tile"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Inbox</span>
                <span class="module-tile-sub">Caixa de entrada</span>
              </div>
            </a>

            <a
              routerLink="/areas"
              routerLinkActive="active"
              class="mobile-module-tile"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Áreas da Vida</span>
                <span class="module-tile-sub">Dimensões & foco</span>
              </div>
            </a>

            <a
              routerLink="/projects"
              routerLinkActive="active"
              class="mobile-module-tile"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-coral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Projetos</span>
                <span class="module-tile-sub">Metas e entregas</span>
              </div>
            </a>

            <a
              routerLink="/habits"
              routerLinkActive="active"
              class="mobile-module-tile"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-mint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Hábitos</span>
                <span class="module-tile-sub">Metas & rotinas</span>
              </div>
            </a>

            <a
              routerLink="/life-tracker"
              routerLinkActive="active"
              class="mobile-module-tile"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-pink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Life Tracker</span>
                <span class="module-tile-sub">Saúde & bem-estar</span>
              </div>
            </a>

            <a
              routerLink="/settings"
              routerLinkActive="active"
              class="mobile-module-tile full-width"
              (click)="closeMobileSheet()"
            >
              <div class="module-tile-badge badge-neutral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <div class="module-tile-text">
                <span class="module-tile-title">Configurações & Perfil</span>
                <span class="module-tile-sub">Ajustes da conta, aparência e preferências</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    }
  `
})
export class TopbarComponent {
  @Output() readonly openQuickCapture = new EventEmitter<void>();
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly dashboardApi = inject(DashboardApiService);
  private readonly signalR = inject(SignalRService);
  private readonly router = inject(Router);

  readonly isUserMenuOpen = signal(false);
  readonly isModulesMenuOpen = signal(false);
  readonly isMobileSheetOpen = signal(false);

  toggleUserMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isModulesMenuOpen.set(false);
    this.isMobileSheetOpen.set(false);
    this.isUserMenuOpen.update(v => !v);
  }

  toggleModulesMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isUserMenuOpen.set(false);
    this.isMobileSheetOpen.set(false);
    this.isModulesMenuOpen.update(v => !v);
  }

  toggleMobileSheet(event?: MouseEvent): void {
    event?.stopPropagation();
    this.isUserMenuOpen.set(false);
    this.isModulesMenuOpen.set(false);
    this.isMobileSheetOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  closeModulesMenu(): void {
    this.isModulesMenuOpen.set(false);
  }

  closeMobileSheet(): void {
    this.isMobileSheetOpen.set(false);
  }

  closeAllMenus(): void {
    this.isUserMenuOpen.set(false);
    this.isModulesMenuOpen.set(false);
    this.isMobileSheetOpen.set(false);
  }

  onQuickCaptureClick(): void {
    this.closeAllMenus();
    this.openQuickCapture.emit();
  }

  isModulesActive(): boolean {
    const url = this.router.url;
    return (
      url.includes('/calendar') ||
      url.includes('/kanban') ||
      url.includes('/inbox') ||
      url.includes('/areas') ||
      url.includes('/projects') ||
      url.includes('/habits') ||
      url.includes('/life-tracker') ||
      url.includes('/settings')
    );
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && !target.closest('.user-menu-wrapper')) {
      this.closeUserMenu();
    }
    if (target && !target.closest('.modules-menu-wrapper')) {
      this.closeModulesMenu();
    }
  }

  onSearchChange(value: string): void {
    this.dashboardApi.setSearchTerm(value);
    this.signalR.changes$.next();
  }

  initials(): string {
    const name = this.authService.currentUser()?.fullName || 'Demo Account';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  logout(): void {
    this.closeAllMenus();
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
