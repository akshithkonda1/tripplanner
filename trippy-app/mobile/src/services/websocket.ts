import {API_CONFIG} from '../config/api';

// The backend is a raw AWS API Gateway WebSocket API (see
// trippy-app/infrastructure/lib/backend-stack.ts), not a Socket.IO server, so
// this talks plain WebSocket JSON frames rather than the socket.io protocol.
// $connect reads tripId/userId from the query string (connectionHandler.ts),
// and every message frame is routed to the '$default' route (chatHandler.ts).

type MessageListener = (data: any) => void;

export class WebSocketService {
  private socket: WebSocket | null = null;
  private tripId: string | null = null;
  private userId: string | null = null;
  private messageListeners: MessageListener[] = [];
  private itineraryListeners: MessageListener[] = [];
  private groupMessageListeners: MessageListener[] = [];
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private shouldReconnect = false;

  connect(tripId: string, userId: string): Promise<void> {
    this.tripId = tripId;
    this.userId = userId;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;

    return this.openSocket();
  }

  private openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${API_CONFIG.WS_API_URL}?tripId=${encodeURIComponent(
        this.tripId!,
      )}&userId=${encodeURIComponent(this.userId!)}`;

      const socket = new WebSocket(url);
      this.socket = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      };

      socket.onerror = error => {
        console.error('WebSocket connection error:', error);
        reject(error);
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      socket.onmessage = event => {
        this.handleIncoming(event.data);
      };
    });
  }

  private attemptReconnect(): void {
    if (!this.shouldReconnect || !this.tripId || !this.userId) {
      return;
    }
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket: giving up after max reconnect attempts');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = 1000 * this.reconnectAttempts;
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.openSocket().catch(() => {
          // onclose will trigger the next retry
        });
      }
    }, delay);
  }

  private handleIncoming(raw: string): void {
    let data: any;
    try {
      data = JSON.parse(raw);
    } catch (error) {
      console.error('WebSocket: failed to parse message', raw, error);
      return;
    }

    switch (data.type) {
      case 'sam_response':
        this.messageListeners.forEach(cb => cb(data));
        break;
      case 'itinerary_update':
        this.itineraryListeners.forEach(cb => cb(data));
        break;
      case 'group_message':
        this.groupMessageListeners.forEach(cb => cb(data));
        break;
      default:
        // Unrecognized message types are still surfaced to chat listeners
        // so the UI doesn't silently drop them.
        this.messageListeners.forEach(cb => cb(data));
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.messageListeners = [];
    this.itineraryListeners = [];
    this.groupMessageListeners = [];
  }

  sendMessage(message: string): void {
    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN &&
      this.tripId &&
      this.userId
    ) {
      this.socket.send(
        JSON.stringify({
          action: 'sendMessage',
          tripId: this.tripId,
          userId: this.userId,
          message,
          timestamp: Date.now(),
        }),
      );
    } else {
      console.warn('WebSocket: cannot send message, socket not open');
    }
  }

  onMessage(callback: MessageListener): void {
    this.messageListeners.push(callback);
  }

  onItineraryUpdate(callback: MessageListener): void {
    this.itineraryListeners.push(callback);
  }

  onGroupMessage(callback: MessageListener): void {
    this.groupMessageListeners.push(callback);
  }
}

export const wsService = new WebSocketService();
