export interface JoinRoomPayload {
  room_id: string;
  player_name: string;
  player_id?: string;
}

export interface FindMatchPayload {
  player_id: string;
  player_name: string;
  rating?: number;
  picture?: string | null;
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

export interface ResignPayload {
  room_id: string;
  color?: 'white' | 'black';
}

export type ClientMessage =
  | { type: 'join_room'; payload: JoinRoomPayload }
  | { type: 'make_move'; payload: MakeMovePayload }
  | { type: 'find_match'; payload: FindMatchPayload }
  | { type: 'cancel_find_match' }
  | { type: 'chat'; payload: ChatPayload }
  | { type: 'resign'; payload: ResignPayload }
  | { type: 'ping' };

export interface RoomJoinedPayload {
  room_id: string;
  color: 'white' | 'black';
  opponent?: string | null;
  opponent_id?: string | null;
  opponent_rating?: number;
  opponent_picture?: string | null;
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

export interface PlayerRatingChangePayload {
  userId: string;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  ratingDeviationBefore: number;
  ratingDeviationAfter: number;
}

export interface PlayerResignedPayload {
  color: 'white' | 'black';
  winner: 'white' | 'black';
}

export interface GameOverPayload {
  room_id: string;
  winner: 'white' | 'black' | 'draw';
  reason: 'checkmate' | 'bare_king' | 'resignation' | 'stalemate' | 'abandoned';
  isRated: boolean;
  whiteRating?: PlayerRatingChangePayload;
  blackRating?: PlayerRatingChangePayload;
}

export type ServerMessage =
  | { type: 'room_joined'; payload: RoomJoinedPayload }
  | { type: 'move_made'; payload: MoveMadePayload }
  | { type: 'chat_broadcast'; payload: ChatBroadcastPayload }
  | { type: 'player_resigned'; payload: PlayerResignedPayload }
  | { type: 'game_over'; payload: GameOverPayload }
  | { type: 'invalid_move'; payload: { reason: string } }
  | { type: 'pong' }
  | { type: 'error'; payload: { message: string } };
