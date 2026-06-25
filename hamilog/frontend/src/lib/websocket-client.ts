// =============================================================================
// Hamilog WebSocket Client — GPS streaming & live event updates
// =============================================================================

export type WSMessageHandler = (data: unknown) => void;
export type WSErrorHandler = (error: Event | Error) => void;

export class GPSWebSocket {
  private url: string;
  private ws: WebSocket | null = null;
  private onMessageCb: WSMessageHandler;
  private onErrorCb: WSErrorHandler;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000; // 1 second
  private maxDelay = 30000; // 30 seconds
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private _isConnected = false;

  constructor(url: string, onMessage: WSMessageHandler, onError: WSErrorHandler) {
    this.url = url;
    this.onMessageCb = onMessage;
    this.onErrorCb = onError;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.intentionalClose = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
        console.log('[WS] Connected to', this.url);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessageCb(data);
        } catch {
          // If not JSON, pass raw data
          this.onMessageCb(event.data);
        }
      };

      this.ws.onerror = (event: Event) => {
        console.warn('[WS] Connection error (server may be unavailable)');
        this.onErrorCb(event);
      };

      this.ws.onclose = () => {
        this._isConnected = false;
        console.log('[WS] Disconnected');

        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      this.onErrorCb(err instanceof Error ? err : new Error(String(err)));
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    this._isConnected = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    console.log('[WS] Intentionally disconnected');
  }

  send(data: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send — not connected');
      return;
    }

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(payload);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      this.onErrorCb(new Error('Max reconnection attempts reached'));
      return;
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxDelay,
    );

    console.log(
      `[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}
