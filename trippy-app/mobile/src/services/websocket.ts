import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';

export class WebSocketService {
  private socket: Socket | null = null;
  private tripId: string | null = null;
  private userId: string | null = null;

  connect(tripId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.tripId = tripId;
      this.userId = userId;

      this.socket = io(API_CONFIG.WS_API_URL, {
        query: { tripId, userId },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: string): void {
    if (this.socket && this.tripId && this.userId) {
      this.socket.emit('sendMessage', {
        tripId: this.tripId,
        userId: this.userId,
        message
      });
    }
  }

  onMessage(callback: (data: { message: string; timestamp: number }) => void): void {
    if (this.socket) {
      this.socket.on('sam_response', callback);
    }
  }

  onItineraryUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('itinerary_update', callback);
    }
  }

  onGroupMessage(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('group_message', callback);
    }
  }

  offMessage(): void {
    if (this.socket) {
      this.socket.off('sam_response');
    }
  }

  offItineraryUpdate(): void {
    if (this.socket) {
      this.socket.off('itinerary_update');
    }
  }

  offGroupMessage(): void {
    if (this.socket) {
      this.socket.off('group_message');
    }
  }
}

export const wsService = new WebSocketService();
