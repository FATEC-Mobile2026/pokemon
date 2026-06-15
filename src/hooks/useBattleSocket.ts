import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

function buildWsBase() {
  const raw = process.env.EXPO_PUBLIC_WS_URL ?? '';
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  return `${secure ? raw.replace(/^ws:/, 'wss:') : raw}/ws/battle`;
}
const WS_BASE = buildWsBase();
const BACKOFF_MS = [1000, 3000, 9000];

export type BattleSocketEvent = { type: string; payload: string } & Record<string, any>;

function parseWsMessage(text: string): BattleSocketEvent | null {
  const colonIdx = text.indexOf(':');
  if (colonIdx === -1) {
    console.log('[WS] mensagem sem payload:', text);
    return null;
  }
  const type = text.substring(0, colonIdx);
  const payload = text.substring(colonIdx + 1);
  let extra: Record<string, any> = {};
  try {
    const parsed = JSON.parse(payload);
    if (parsed && typeof parsed === 'object') extra = parsed;
  } catch {}
  return { type, payload, ...extra };
}

export function useBattleSocket(username: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<BattleSocketEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const shouldConnect = useRef(false);
  const usernameRef = useRef(username);
  usernameRef.current = username;

  // Pending timer refs so we can clear them on unmount
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearRetry = useCallback(() => {
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    const uname = usernameRef.current;
    if (!uname || !shouldConnect.current || !mounted.current) return;

    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    const ws = new WebSocket(`${WS_BASE}?username=${encodeURIComponent(uname)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mounted.current) return;
      console.log('[WS] conectado como:', uname);
      setIsConnected(true);
      retryCount.current = 0;
    };

    ws.onmessage = ({ data }) => {
      if (!mounted.current) return;
      try {
        const event = parseWsMessage(data as string);
        if (!event) return;
        console.log('[WS] evento recebido:', event.type, event.payload?.substring(0, 120));
        // Each message in its own macrotask so React 18 automatic batching
        // cannot merge multiple rapid WS events into a single render.
        const t = setTimeout(() => {
          if (mounted.current) setLastEvent(event);
        }, 0);
        pendingTimers.current.push(t);
      } catch {}
    };

    ws.onclose = (event) => {
      if (!mounted.current) return;
      console.log('[WS] fechado, código:', event.code);
      setIsConnected(false);
      if (!shouldConnect.current) return;
      const attempt = retryCount.current;
      if (attempt < BACKOFF_MS.length) {
        retryCount.current++;
        retryTimer.current = setTimeout(connect, BACKOFF_MS[attempt]);
      }
    };

    ws.onerror = (event) => {
      console.log('[WS] erro:', event);
      ws.close();
    };
  }, [clearRetry]);

  const disconnect = useCallback(() => {
    shouldConnect.current = false;
    clearRetry();
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, [clearRetry]);

  const send = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('[WS] tentativa de envio sem conexão:', message);
    }
  }, []);

  useEffect(() => {
    if (!username) {
      disconnect();
      return;
    }
    shouldConnect.current = true;
    retryCount.current = 0;
    clearRetry();
    connect();
  }, [username, connect, disconnect, clearRetry]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && usernameRef.current && shouldConnect.current) {
        retryCount.current = 0;
        clearRetry();
        connect();
      }
    });
    return () => sub.remove();
  }, [connect, clearRetry]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      shouldConnect.current = false;
      clearRetry();
      wsRef.current?.close();
      pendingTimers.current.forEach(clearTimeout);
      pendingTimers.current = [];
    };
  }, [clearRetry]);

  return { isConnected, lastEvent, send, connect, disconnect };
}
