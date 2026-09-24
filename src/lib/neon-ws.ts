import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

/**
 * Neon's driver speaks Postgres over a WebSocket on port 443.
 *
 * That is what makes this project work on networks where outbound TCP 5432 is
 * blocked, and it is also the right transport for serverless runtimes, which
 * cannot hold a long-lived TCP pool open.
 */
if (!neonConfig.webSocketConstructor) {
  neonConfig.webSocketConstructor = ws;
}
