/** Shared between the status API, server components and the client poller. */
export type ServerSnapshot = {
  online: boolean;
  stale: boolean;
  motd: string;
  version: string;
  host: string;
  port: number;
  bedrockPort: number;
  playersOnline: number;
  maxPlayers: number;
  javaPlayers: number;
  bedrockPlayers: number;
  uptimeSeconds: number;
  tps: string | null;
  lastHeartbeatAt: string | null;
  lastUpdated: string;
};

export function formatUptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
