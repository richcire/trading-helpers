import type { MarketType } from "../../types";

export interface TradingSession {
  id: string;
  label: string;
  shortLabel: string;
  startUtc: number; // fractional hours (e.g. 14.5 = 14:30)
  endUtc: number;
  color: string;
  row: 0 | 1;
}

export interface SessionSegment {
  sessionId: string;
  label: string;
  shortLabel: string;
  color: string;
  row: 0 | 1;
  leftPct: number;
  widthPct: number;
  active: boolean;
  isPrimary: boolean;
}

// --- DST helpers ---

/** US DST: second Sunday of March → first Sunday of November */
function isUsDst(date: Date): boolean {
  const year = date.getUTCFullYear();
  const mar1 = new Date(Date.UTC(year, 2, 1));
  const marStart = new Date(
    Date.UTC(year, 2, 8 + ((7 - mar1.getUTCDay()) % 7), 7),
  );
  const nov1 = new Date(Date.UTC(year, 10, 1));
  const novEnd = new Date(
    Date.UTC(year, 10, 1 + ((7 - nov1.getUTCDay()) % 7), 6),
  );
  return date >= marStart && date < novEnd;
}

/** UK DST (BST): last Sunday of March → last Sunday of October */
function isUkDst(date: Date): boolean {
  const year = date.getUTCFullYear();
  const mar31 = new Date(Date.UTC(year, 2, 31));
  const marStart = new Date(
    Date.UTC(year, 2, 31 - mar31.getUTCDay(), 1),
  );
  const oct31 = new Date(Date.UTC(year, 9, 31));
  const octEnd = new Date(
    Date.UTC(year, 9, 31 - oct31.getUTCDay(), 1),
  );
  return date >= marStart && date < octEnd;
}

export function getDstStatus(date: Date): { us: boolean; uk: boolean; key: string | null } {
  const us = isUsDst(date);
  const uk = isUkDst(date);
  if (us && uk) return { us, uk, key: "timeline.dst.both" };
  if (us) return { us, uk, key: "timeline.dst.us" };
  if (uk) return { us, uk, key: "timeline.dst.uk" };
  return { us, uk, key: null };
}

export interface OverlapInfo {
  label: string;
  time: string;
}

// --- Session data ---

function getStockSessions(date: Date): TradingSession[] {
  const usDst = isUsDst(date);
  const ukDst = isUkDst(date);

  return [
    {
      id: "tokyo",
      label: "Tokyo",
      shortLabel: "TKY",
      startUtc: 0,
      endUtc: 6,
      color: "#ff6b7a",
      row: 0,
    },
    {
      id: "london",
      label: "London",
      shortLabel: "LDN",
      startUtc: ukDst ? 7 : 8,
      endUtc: ukDst ? 15.5 : 16.5,
      color: "#78aaf8",
      row: 0,
    },
    {
      id: "newyork",
      label: "New York",
      shortLabel: "NY",
      startUtc: usDst ? 13.5 : 14.5,
      endUtc: usDst ? 20 : 21,
      color: "#3ed598",
      row: 1,
    },
  ];
}

function getFxSessions(date: Date): TradingSession[] {
  const usDst = isUsDst(date);
  const ukDst = isUkDst(date);

  return [
    {
      id: "sydney",
      label: "Sydney",
      shortLabel: "SYD",
      startUtc: 21,
      endUtc: 6,
      color: "#f6c760",
      row: 0,
    },
    {
      id: "tokyo",
      label: "Tokyo",
      shortLabel: "TKY",
      startUtc: 0,
      endUtc: 9,
      color: "#ff6b7a",
      row: 1,
    },
    {
      id: "london",
      label: "London",
      shortLabel: "LDN",
      startUtc: ukDst ? 7 : 8,
      endUtc: ukDst ? 16 : 17,
      color: "#78aaf8",
      row: 0,
    },
    {
      id: "newyork",
      label: "New York",
      shortLabel: "NY",
      startUtc: usDst ? 12 : 13,
      endUtc: usDst ? 21 : 22,
      color: "#3ed598",
      row: 1,
    },
  ];
}

export function getSessions(date: Date, marketType: MarketType): TradingSession[] {
  return marketType === "fx" ? getFxSessions(date) : getStockSessions(date);
}

// --- Overlap calculation ---

function formatHourFrac(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function computeOverlap(
  a: TradingSession,
  b: TradingSession,
): OverlapInfo | null {
  // Expand wrap-around sessions into [start, end] ranges where end can be > 24
  const ranges = (s: TradingSession) =>
    s.endUtc > s.startUtc
      ? [[s.startUtc, s.endUtc]]
      : [
          [s.startUtc, 24],
          [0, s.endUtc],
        ];

  const aRanges = ranges(a);
  const bRanges = ranges(b);

  for (const [aStart, aEnd] of aRanges) {
    for (const [bStart, bEnd] of bRanges) {
      const start = Math.max(aStart, bStart);
      const end = Math.min(aEnd, bEnd);
      if (start < end) {
        return {
          label: `${a.label} / ${b.label}`,
          time: `${formatHourFrac(start % 24)} – ${formatHourFrac(end % 24)} UTC`,
        };
      }
    }
  }
  return null;
}

export function getOverlaps(date: Date, marketType: MarketType): OverlapInfo[] {
  const sessions = getSessions(date, marketType);

  if (marketType === "stock") {
    const ldn = sessions.find((s) => s.id === "london")!;
    const ny = sessions.find((s) => s.id === "newyork")!;
    const overlap = computeOverlap(ldn, ny);
    return overlap ? [overlap] : [];
  }

  // FX: compute all pairwise overlaps in display order
  const pairs: [string, string][] = [
    ["tokyo", "sydney"],
    ["london", "tokyo"],
    ["london", "newyork"],
    ["newyork", "sydney"],
  ];

  const overlaps: OverlapInfo[] = [];
  for (const [idA, idB] of pairs) {
    const a = sessions.find((s) => s.id === idA);
    const b = sessions.find((s) => s.id === idB);
    if (a && b) {
      const o = computeOverlap(a, b);
      if (o) overlaps.push(o);
    }
  }
  return overlaps;
}

export function formatSessionTime(startUtc: number, endUtc: number): string {
  return `${formatHourFrac(startUtc)} – ${formatHourFrac(endUtc)} UTC`;
}

export function isTimeInSession(
  hourFrac: number,
  startUtc: number,
  endUtc: number,
): boolean {
  if (endUtc > startUtc) {
    return hourFrac >= startUtc && hourFrac < endUtc;
  }
  return hourFrac >= startUtc || hourFrac < endUtc;
}

export interface SessionEvent {
  type: "closes" | "opens";
  label: string;
  shortLabel: string;
  color: string;
  remainingMin: number;
}

export function formatRemaining(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function hoursUntil(from: number, to: number): number {
  return to > from ? to - from : 24 - from + to;
}

export interface SessionEvents {
  closing: SessionEvent[];
  opening: SessionEvent | null;
}

export function getSessionEvents(
  sessions: TradingSession[],
  currentHourFrac: number,
): SessionEvents {
  const closing: SessionEvent[] = [];
  let opening: SessionEvent | null = null;

  for (const s of sessions) {
    const active = isTimeInSession(currentHourFrac, s.startUtc, s.endUtc);
    if (active) {
      closing.push({
        type: "closes",
        label: s.label,
        shortLabel: s.shortLabel,
        color: s.color,
        remainingMin: hoursUntil(currentHourFrac, s.endUtc) * 60,
      });
    } else {
      const remaining = hoursUntil(currentHourFrac, s.startUtc) * 60;
      if (!opening || remaining < opening.remainingMin) {
        opening = {
          type: "opens",
          label: s.label,
          shortLabel: s.shortLabel,
          color: s.color,
          remainingMin: remaining,
        };
      }
    }
  }

  closing.sort((a, b) => a.remainingMin - b.remainingMin);

  return { closing, opening };
}

export function computeSegments(
  sessions: TradingSession[],
  currentHourFrac: number,
): SessionSegment[] {
  const segments: SessionSegment[] = [];

  for (const s of sessions) {
    const active = isTimeInSession(currentHourFrac, s.startUtc, s.endUtc);

    if (s.endUtc > s.startUtc) {
      segments.push({
        sessionId: s.id,
        label: s.label,
        shortLabel: s.shortLabel,
        color: s.color,
        row: s.row,
        leftPct: (s.startUtc / 24) * 100,
        widthPct: ((s.endUtc - s.startUtc) / 24) * 100,
        active,
        isPrimary: true,
      });
    } else {
      const widthA = ((24 - s.startUtc) / 24) * 100;
      const widthB = (s.endUtc / 24) * 100;

      segments.push({
        sessionId: s.id,
        label: s.label,
        shortLabel: s.shortLabel,
        color: s.color,
        row: s.row,
        leftPct: (s.startUtc / 24) * 100,
        widthPct: widthA,
        active,
        isPrimary: widthA >= widthB,
      });

      segments.push({
        sessionId: s.id,
        label: s.label,
        shortLabel: s.shortLabel,
        color: s.color,
        row: s.row,
        leftPct: 0,
        widthPct: widthB,
        active,
        isPrimary: widthB > widthA,
      });
    }
  }

  return segments;
}
