// Shared profile options used in both filters and profile editing
// These must be kept in sync to ensure filtering works correctly

export const INTEREST_OPTIONS = [
  { id: "conversacion", label: "Conversación", emoji: "💬" },
  { id: "encuentro", label: "Encuentro", emoji: "🤝" },
  { id: "conexion_casual", label: "Conexión casual", emoji: "🔥" },
  { id: "amistad", label: "Amistad", emoji: "😊" },
] as const;

export const AVAILABILITY_OPTIONS = [
  { id: "disponible_ahora", label: "Disponible ahora" },
  { id: "abierto_conexion", label: "Abierto a conexión" },
  { id: "solo_explorando", label: "Solo explorando" },
] as const;

export const PRESENCE_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "now", label: "Ahora" },
  { id: "today", label: "Hoy" },
] as const;

export type InterestId = typeof INTEREST_OPTIONS[number]["id"];
export type AvailabilityId = typeof AVAILABILITY_OPTIONS[number]["id"];
export type PresenceId = typeof PRESENCE_OPTIONS[number]["id"];
