export const ticketCategories = [
  { value: "general", label: "General question" },
  { value: "account", label: "Account & login" },
  { value: "link", label: "Minecraft linking" },
  { value: "purchase", label: "Store & purchases" },
  { value: "reward", label: "Rewards & spin" },
  { value: "report", label: "Report a player" },
  { value: "appeal", label: "Appeal a punishment" },
  { value: "bug", label: "Bug report" },
] as const;

export type TicketCategory = (typeof ticketCategories)[number]["value"];
