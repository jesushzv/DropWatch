export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatMoney(cents?: number | null) {
  return typeof cents === "number" ? money.format(cents / 100) : "—";
}

export function dateLabel(value: Date | string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function dateTime(value: Date | string) {
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
