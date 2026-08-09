"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getWsBaseUrl } from "@/utils/api";

export const useWebSocket = (matchId: number, onUpdate: (match: any) => void) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Stable Callback Pattern: Store the callback in a mutable ref
  // This allows the WebSocket listener to always execute the latest callback
  // without needing "onUpdate" in the useEffect dependency array, preventing infinite loops.
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    // Connect to the NestJS API server port (default 3001)
    const socketInstance = io(getWsBaseUrl(), {
      transports: ["websocket"], // Forces WebSocket connection instantly for maximum performance
    });

    socketInstance.on("connect", () => {
      console.log(`[WS] Connected to live scores server. Listening for MatchID: ${matchId}`);
    });

    socketInstance.on("match:update", (updatedMatch) => {
      if (updatedMatch && updatedMatch.id === matchId) {
        console.log(`[WS] Received real-time live score update for MatchID: ${matchId}`, updatedMatch);
        onUpdateRef.current(updatedMatch);
      }
    });

    socketInstance.on("disconnect", () => {
      console.log("[WS] Disconnected from live scores server.");
    });

    setSocket(socketInstance);

    // Disconnect socket cleanly on unmount to prevent resource leaks
    return () => {
      socketInstance.disconnect();
    };
  }, [matchId]); // Removed onUpdate from dependencies; loop is 100% neutralized!

  return socket;
};
