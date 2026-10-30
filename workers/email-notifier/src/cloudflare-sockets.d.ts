declare module 'cloudflare:sockets' {
  export interface Socket {
    opened: Promise<unknown>;
    readable: ReadableStream<Uint8Array>;
    writable: WritableStream<Uint8Array>;
    close(): Promise<void>;
  }

  export function connect(
    address: { hostname: string; port: number },
    options: { secureTransport: 'on' },
  ): Socket;
}
