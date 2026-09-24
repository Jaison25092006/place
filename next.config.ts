import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep these as real Node modules instead of bundling them. The Neon adapter
  // creates its own Pool from @neondatabase/serverless, so it has to see the
  // same module instance that src/lib/neon-ws.ts sets webSocketConstructor on —
  // a bundled second copy would silently have no WebSocket and time out.
  serverExternalPackages: [
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
    "ws",
  ],
};

export default nextConfig;
