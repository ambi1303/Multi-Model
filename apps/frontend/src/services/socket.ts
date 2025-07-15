import { useAppStore } from '../store/useAppStore';

const VITE_WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

let socket: WebSocket | null = null;

const connect = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket is already connected.');
    return;
  }

  socket = new WebSocket(`${VITE_WS_BASE_URL}/ws/analytics`);

  socket.onopen = () => {
    console.log('WebSocket connection established.');
    useAppStore.getState().setSocketConnected(true);
  };

  socket.onmessage = (event) => {
    console.log('WebSocket message received:', event.data);
    try {
      const data = JSON.parse(event.data);
      // Assuming the broadcasted data is the overview analytics
      useAppStore.getState().setOverviewData(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed.');
    useAppStore.getState().setSocketConnected(false);
    // Optional: implement reconnection logic here
    setTimeout(connect, 5000); // Try to reconnect every 5 seconds
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    socket?.close();
  };
};

const disconnect = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const socketService = {
  connect,
  disconnect,
}; 