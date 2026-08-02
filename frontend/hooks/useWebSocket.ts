"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useWebSocket = (matchId: number, onUpdate: (match: any) => void) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to the NestJS API server port (default 3001)
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001", {
      transports: ["websocket"], // Forces WebSocket connection instantly for maximum performance
    });

    socketInstance.on("connect", () => {
      console.log(`[WS] Connected to live scores server. Listening for MatchID: ${matchId}`);
    });

    socketInstance.on("match:update", (updatedMatch) => {
      if (updatedMatch && updatedMatch.id === matchId) {
        console.log(`[WS] Received real-time live score update for MatchID: ${matchId}`, updatedMatch);
        onUpdate(updatedMatch);
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
  }, [matchId, onUpdate]);

  return socket;
};
