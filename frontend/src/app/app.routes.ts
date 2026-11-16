import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { AreasPageComponent } from './features/areas/areas-page.component';
import { KanbanPageComponent } from './features/kanban/kanban-page.component';
import { CalendarPageComponent } from './features/calendar/calendar-page.component';
import { InboxPageComponent } from './features/inbox/inbox-page.component';
import { ProjectsPageComponent } from './features/projects/projects-page.component';
import { HabitsPageComponent } from './features/habits/habits-page.component';
import { LifeTrackerPageComponent } from './features/life-tracker/life-tracker-page.component';
import { SettingsPageComponent } from './features/settings/settings-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'areas', component: AreasPageComponent },
      { path: 'kanban', component: KanbanPageComponent },
      { path: 'calendar', component: CalendarPageComponent },
      { path: 'inbox', component: InboxPageComponent },
      { path: 'projects', component: ProjectsPageComponent },
      { path: 'habits', component: HabitsPageComponent },
      { path: 'life-tracker', component: LifeTrackerPageComponent },
      { path: 'settings', component: SettingsPageComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
