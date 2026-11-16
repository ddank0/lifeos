import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection?: signalR.HubConnection;
  readonly changes$ = new Subject<void>();

  connect(): void {
    if (this.hubConnection) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('TaskUpdated', () => this.changes$.next());
    this.hubConnection.on('DashboardChanged', () => this.changes$.next());

    this.hubConnection.start().catch(() => {
      // Reconexao automatica gerenciada pelo SignalR
    });
  }
}
