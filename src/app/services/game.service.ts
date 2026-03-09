
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { WebsocketService } from './websocket.service';
import * as models from '../models/robosoccer.models';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private roomState: Subject<models.Room> = new Subject<models.Room>();
  public roomState$: Observable<models.Room> = this.roomState.asObservable();

  private configState: Subject<models.GameConfigMessage> = new Subject<models.GameConfigMessage>();
  public configState$: Observable<models.GameConfigMessage> = this.configState.asObservable();

  private errorState: Subject<models.ErrorMessage> = new Subject<models.ErrorMessage>();
  public errorState$: Observable<models.ErrorMessage> = this.errorState.asObservable();
  
  private gameOverState: Subject<models.TeamType | null> = new Subject<models.TeamType | null>();
  public gameOverState$: Observable<models.TeamType | null> = this.gameOverState.asObservable();

  private idState: Subject<models.IdMessage> = new Subject<models.IdMessage>();
  public idState$: Observable<models.IdMessage> = this.idState.asObservable();

  constructor(private websocketService: WebsocketService) {
    this.websocketService.listen(models.ServerMessageType.ReceiveRoom).subscribe((room) => {
      this.roomState.next(room);
    });

    this.websocketService.listen(models.ServerMessageType.ReceiveConfig).subscribe((config) => {
      this.configState.next(config);
    });

    this.websocketService.listen(models.ServerMessageType.Error).subscribe((error) => {
      this.errorState.next(error);
    });

    this.websocketService.listen(models.ServerMessageType.GameOver).subscribe((winner) => {
      this.gameOverState.next(winner);
    });

    this.websocketService.listen(models.ServerMessageType.ReceiveId).subscribe((ids) => {
      this.idState.next(ids);
    });
  }

  // Client to Server Message Handlers

  public createRoom(username: string): void {
    console.log('Creating room with username:', username);
    this.websocketService.send(models.ClientMessageType.CreateRoom, username);
  }

  public joinRoom(username: string, roomId: number): void {
    const payload: models.JoinMessage = { username, roomId };
    this.websocketService.send(models.ClientMessageType.JoinRoom, payload);
  }

  public leaveRoom(): void {
    this.websocketService.send(models.ClientMessageType.LeaveRoom, null);
  }

  public getId(): void {
    this.websocketService.send(models.ClientMessageType.GetId, null);
  }

  public pickTeam(playerId: number, team: models.TeamType): void {
    const payload: models.TeamPickerMessage = { playerId, team };
    this.websocketService.send(models.ClientMessageType.PickTeam, payload);
  }

  public startGame(): void {
    this.websocketService.send(models.ClientMessageType.StartGame, null);
  }

  public restartGame(): void {
    this.websocketService.send(models.ClientMessageType.RestartGame, null);
  }

  public sendMovement(playerId: number, x: number, y: number): void {
    const payload: models.MovementMessage = { playerId, x, y };
    this.websocketService.send(models.ClientMessageType.MovementMessage, payload);
  }
}
