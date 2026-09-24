import { apiUrl } from './api';
import type { Market } from '@/types/market';

type ReadyMessage = { type: 'stream.ready'; sequence: number };
type UpdateMessage = { type: 'market.update'; market: Market };
type StreamMessage = ReadyMessage | UpdateMessage;

export type StreamStatus = 'connecting' | 'open' | 'reconnecting';

type MarketListener = (market: Market) => void;
type StatusListener = (status: StreamStatus) => void;

const streamUrl = `${apiUrl.replace(/^http/, 'ws')}/v1/stream`;

let socket: WebSocket | null = null;
let status: StreamStatus = 'connecting';
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const marketListeners = new Set<MarketListener>();
const statusListeners = new Set<StatusListener>();

function setStatus(next: StreamStatus) {
  status = next;
  statusListeners.forEach((listen) => listen(status));
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  const delay = Math.min(1000 * 2 ** reconnectAttempt, 15_000);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectAttempt += 1;
    connect();
  }, delay);
}

function connect() {
  if (socket) return;
  setStatus(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');
  const ws = new WebSocket(streamUrl);
  socket = ws;

  ws.onmessage = (event) => {
    let message: StreamMessage;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message.type === 'stream.ready') {
      reconnectAttempt = 0;
      setStatus('open');
    } else if (message.type === 'market.update') {
      marketListeners.forEach((listen) => listen(message.market));
    }
  };

  ws.onclose = () => {
    socket = null;
    setStatus('reconnecting');
    scheduleReconnect();
  };
}

export function subscribeToMarketUpdates(listener: MarketListener) {
  marketListeners.add(listener);
  connect();
  return () => {
    marketListeners.delete(listener);
  };
}

export function subscribeToStreamStatus(listener: StatusListener) {
  statusListeners.add(listener);
  listener(status);
  connect();
  return () => {
    statusListeners.delete(listener);
  };
}
