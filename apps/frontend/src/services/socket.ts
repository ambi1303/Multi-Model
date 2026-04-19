import { useAppStore } from '../store/useAppStore';

const VITE_WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:9000';

let socket: WebSocket | null = null;
let retryCount = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let intentionalDisconnect = false;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 30000;

const getRetryDelay = () =>
  Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);

const connect = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }

  if (retryCount >= MAX_RETRIES) {
    console.warn(`WebSocket: max retries (${MAX_RETRIES}) reached, giving up.`);
    return;
  }

  intentionalDisconnect = false;

  try {
    socket = new WebSocket(`${VITE_WS_BASE_URL}/ws/analytics`);
  } catch {
    return;
  }

  socket.onopen = () => {
    retryCount = 0;
    useAppStore.getState().setSocketConnected(true);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      useAppStore.getState().setOverviewData(data);
    } catch {
      // ignore malformed messages
    }
  };

  socket.onclose = () => {
    useAppStore.getState().setSocketConnected(false);
    socket = null;

    if (!intentionalDisconnect && retryCount < MAX_RETRIES) {
      const delay = getRetryDelay();
      retryCount++;
      retryTimer = setTimeout(connect, delay);
    }
  };

  socket.onerror = () => {
    socket?.close();
  };
};

const disconnect = () => {
  intentionalDisconnect = true;
  retryCount = MAX_RETRIES;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const socketService = {
  connect,
  disconnect,
}; 