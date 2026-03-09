
export interface Room {
  roomId: number;
  ball: Ball;
  players: Player[];
  isStarted: boolean;
  winner: TeamType | null;
  score: {
    [TeamType.Blue]: number;
    [TeamType.Red]: number;
  };
  countdownTicks: number;
}

export interface Player {
  id: number;
  socketId: string;
  name: string;
  team: TeamType | null;
  isInactive: boolean;
  x: number;
  y: number;
  x_velocity: number;
  y_velocity: number;
}

export interface Ball {
  x: number;
  y: number;
  x_velocity: number;
  y_velocity: number;
}

export interface JoinMessage {
  username: string;
  roomId: number;
}

export interface TeamPickerMessage {
  playerId: number;
  team: TeamType;
}

export interface IdMessage {
  playerId: number | null;
  roomId: number | null;
}

export interface MovementMessage {
  playerId: number | null;
  x: number | null;
  y: number | null;
}

export interface ErrorMessage {
  errorType: ErrorType;
  message: string;
}

export interface GameConfigMessage {
  fieldWidth: number;
  fieldHeight: number;
  playerRadius: number;
  ballRadius: number;
  goalMinY: number;
  goalMaxY: number;
  winScore: number;
  countdown: number;
}

export enum ServerMessageType {
  TestMessage = 'serverTest',
  ConnectAck = 'connectAck',
  ReceiveId = 'receiveId',
  ReceiveRoom = 'receiveRoom',
  GameOver = 'gameOver',
  Error = 'error',
  ReconnectAck = 'reconnectAck',
  ReceiveConfig = 'receive-config'
}

export enum ClientMessageType {
  TestMessage = 'clientTest',
  CreateRoom = 'createRoom',
  JoinRoom = 'joinRoom',
  LeaveRoom = 'leaveRoom',
  GetId = 'getId',
  PickTeam = 'pickTeam',
  PickPosition = 'pickPosition',
  StartGame = 'startGame',
  RestartGame = 'restartGame',
  MovementMessage = 'movementMessage'
}

export enum TeamType {
  Red = 'red',
  Blue = 'blue',
}

export enum ErrorType {
  Other = 'other',
  RoomNotFound = 'room-not-found',
  RoomNoLongerExists = 'room-no-longer-exists',
  RoomAlreadyStarted = 'room-already-started',
  SettingUnavailable = 'setting-unavailable',
  NoUsername = 'no-username',
}
