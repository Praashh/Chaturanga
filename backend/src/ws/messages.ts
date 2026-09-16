export interface JoinRoomPayload {
  room_id: string;
  player_name: string;
}

export interface MakeMovePayload {
  room_id: string;
  from_col: number;
  from_row: number;
  to_col: number;
  to_row: number;
  promotion?: string | null;
}

export interface ChatPayload {
  room_id: string;
  text: string;
}

export type ClientMessage =
  | { type: 'join_room'; payload: JoinRoomPayload }
  | { type: 'make_move'; payload: MakeMovePayload }
  | { type: 'chat'; payload: ChatPayload }
  | { type: 'ping' };

export interface RoomJoinedPayload {
  room_id: string;
  color: 'white' | 'black';
  opponent?: string | null;
}

export interface MoveMadePayload {
  from_col: number;
  from_row: number;
  to_col: number;
  to_row: number;
  next_turn: string;
}

export interface ChatBroadcastPayload {
  sender: string;
  text: string;
}

export type ServerMessage =
  | { type: 'room_joined'; payload: RoomJoinedPayload }
  | { type: 'move_made'; payload: MoveMadePayload }
  | { type: 'chat_broadcast'; payload: ChatBroadcastPayload }
  | { type: 'invalid_move'; payload: { reason: string } }
  | { type: 'pong' }
  | { type: 'error'; payload: { message: string } };
