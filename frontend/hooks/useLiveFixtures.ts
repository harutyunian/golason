'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWsBaseUrl, getApiBaseUrl } from '@/utils/api';

export interface Team {
  id: number;
  name: string;
  logo?: string | null;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo?: string | null;
}

export interface LiveMatch {
  id: number;
  status: string;
  elapsedTime?: number | null;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number | null;
  awayScore?: number | null;
  homeScoreHT?: number | null;
  awayScoreHT?: number | null;
  date: string;
  league: League;
}

export const useLiveFixtures = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. SSR Guard: Ensure browser-only WebSocket execution
    if (typeof window === 'undefined') return;

    // 2. Initial state hydration via HTTP REST GET /fixtures/live (pulls straight from Redis)
    const hydrateInitialState = async () => {
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/football/fixtures/live`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setLiveMatches(data);
          }
        }
      } catch (err) {
        console.warn('[useLiveFixtures] Failed initial HTTP REST state hydration:', err);
      }
    };

    hydrateInitialState();

    // 3. Connect Socket client
    const wsUrl = getWsBaseUrl();
    const socket = io(wsUrl, {
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[WS Live] Connected to Golason LiveScore Gateway: ${socket.id}`);
      setIsConnected(true);
    });

    // 4. Initial cache push from backend handles the 'live:fixtures' event on first connect
    socket.on('live:fixtures', (cachedFixtures: LiveMatch[]) => {
      if (Array.isArray(cachedFixtures)) {
        setLiveMatches(cachedFixtures);
      }
    });

    // 5. Subscribe to real-time micro-updates for active goals, elapsed times, and status changes
    socket.on('match:update', (updatedMatch: LiveMatch) => {
      console.log('[WS Live] Received live match micro-update:', updatedMatch);
      setLiveMatches((prevList) => {
        const matchExists = prevList.some((m) => m.id === updatedMatch.id);
        if (!matchExists) {
          // If a new live match is synchronized, append it to the feed list
          return [...prevList, updatedMatch];
        }
        // Update the existing match item in place
        return prevList.map((match) => (match.id === updatedMatch.id ? updatedMatch : match));
      });
    });

    socket.on('disconnect', () => {
      console.log('[WS Live] Disconnected from LiveScore Gateway.');
      setIsConnected(false);
    });

    return () => {
      console.log('[WS Live] Component unmounted. Dismantling WebSocket connection.');
      socket.disconnect();
    };
  }, []);

  return { liveMatches, isConnected };
};
