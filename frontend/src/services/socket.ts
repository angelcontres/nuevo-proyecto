export interface ChatMessage {
  emisorId: string;
  destinatarioId: string;
  contenido: string;
  timestamp?: number;
}

export class ChatSocketClient {
  private socket: WebSocket | null = null;
  private onMessageCallback: ((msg: ChatMessage) => void) | null = null;

  connect(userId: string, onMessage: (msg: ChatMessage) => void) {
    this.onMessageCallback = onMessage;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    this.socket = new WebSocket(`${protocol}//${host}/chat/${userId}`);

    this.socket.onopen = () => {
      console.log('Conexión WebSocket establecida');
    };

    this.socket.onmessage = (event) => {
      try {
        const message: ChatMessage = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      } catch (err) {
        console.error('Error parseando mensaje WebSocket:', err);
      }
    };

    this.socket.onclose = () => {
      console.log('Conexión WebSocket cerrada');
    };
  }

  sendMessage(destinatarioId: string, contenido: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const payload: ChatMessage = {
        emisorId: '',
        destinatarioId,
        contenido
      };
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('Socket no conectado');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const chatSocket = new ChatSocketClient();
