import { format } from "date-fns";

export function toDate(isoString: string | undefined | null): Date | undefined {
  if (!isoString) return undefined;
  const d = new Date(isoString + "T12:00:00");
  return isNaN(d.getTime()) ? undefined : d;
}

export function fromDate(date: Date | undefined): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}
