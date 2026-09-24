export interface ChatMessage {
  emisorId: string;
  destinatarioId: string;
  contenido: string;
  timestamp?: number;
}
