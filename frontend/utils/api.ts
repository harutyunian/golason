export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Check if the browser is running locally, and fall back to the local NestJS server port 3001
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:3001`;
    }
  }

  // Production or server-side fallback
  return "https://golason.com";
};

export const getWsBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:3001`;
    }
  }

  return "https://golason.com";
};
