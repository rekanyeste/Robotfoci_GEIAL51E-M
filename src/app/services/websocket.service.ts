
import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;

  constructor(private zone: NgZone) {
    this.socket = io(environment.serverUrl);
  }

  public connect(): void {
    this.socket.connect();
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public send(eventName: string, data: any): void {
    this.socket.emit(eventName, data);
  }

  public listen(eventName: string): Observable<any> {
    return new Observable((observer) => {
      this.socket.on(eventName, (data) => {
        this.zone.run(() => {
          observer.next(data);
        });
      });
    });
  }
}
