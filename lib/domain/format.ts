export function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
}

export function formatDateTime(iso: string, timezone = "America/Toronto") {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(iso));
}

export function hoursBetween(laterIso: string, earlierIso: string) {
  return Math.max(0, (new Date(laterIso).getTime() - new Date(earlierIso).getTime()) / 3_600_000);
}

export function ageLabel(hours: number) {
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  const remaining = Math.floor(hours % 24);
  return remaining ? `${days}d ${remaining}h` : `${days}d`;
}
