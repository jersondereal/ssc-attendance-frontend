import { io, type Socket } from "socket.io-client";
import config from "./config";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = config.API_BASE_URL.replace(/\/api\/?$/, "");
    socket = io(url);
  }
  return socket;
}
