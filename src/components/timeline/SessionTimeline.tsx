import { useEffect, useRef, useState } from "react";
import { useInitialLoad } from "../../App";
import { useI18n } from "../../i18n/useI18n";
import { useSettingsStore } from "../../store/useSettingsStore";
import type { MarketType } from "../../types";
import {
  type TradingSession,
  type SessionSegment,
  type OverlapInfo,
  formatSessionTime,
  formatRemaining,
} from "./sessions";
import { useSessionTimeline } from "./useSessionTimeline";

const HOUR_MARKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const HOUR_MARKS_MOBILE = [0, 3, 6, 9, 12, 15, 18, 21];

function HourMarkers() {
  return (
    <div className="relative h-4 mb-0.5">
      {HOUR_MARKS.map((h) => {
        const left = (h / 24) * 100;
        const isMobileVisible = HOUR_MARKS_MOBILE.includes(h);
        return (
          <div
            key={h}
            className={`absolute top-0 flex flex-col items-center ${isMobileVisible ? "" : "hidden sm:flex"}`}
            style={{ left: `${left}%` }}
          >
            <div className="h-1.5 w-px bg-[color:var(--color-border-subtle)]" />
            <span className="text-data text-[9px] sm:text-[10px] text-[color:var(--color-text-muted)] translate-x-[-50%]">
              {String(h).padStart(2, "0")}
            </span>
          </div>
        );
      })}
      {/* End mark (24 = 00) */}
      <div className="absolute top-0 right-0 flex flex-col items-center">
        <div className="h-1.5 w-px bg-[color:var(--color-border-subtle)]" />
      </div>
    </div>
  );
}

function SessionBar({ segment }: { segment: SessionSegment }) {
  const showLabel = segment.widthPct >= 8;
  const opacity = segment.active ? 0.3 : 0.15;

  return (
    <div
      className="absolute top-0 bottom-0 rounded-md border-l-2 flex items-center overflow-hidden transition-colors duration-200"
      style={{
        left: `${segment.leftPct}%`,
        width: `${segment.widthPct}%`,
        borderColor: segment.color,
        backgroundColor: `color-mix(in srgb, ${segment.color} ${opacity * 100}%, transparent)`,
      }}
      title={`${segment.label}`}
    >
      {showLabel && segment.isPrimary && (
        <span
          className="truncate px-1.5 text-[10px] sm:text-xs font-medium leading-none"
          style={{ color: segment.active ? "#fff" : segment.color }}
        >
          <span className="sm:hidden">{segment.shortLabel}</span>
          <span className="hidden sm:inline">{segment.label}</span>
        </span>
      )}
    </div>
  );
}

function CurrentTimeLine({ pct }: { pct: number }) {
  return (
    <div
      className="absolute top-0 bottom-0 z-10 pointer-events-none"
      style={{ left: `${pct}%` }}
    >
      {/* Glow line */}
      <div
        className="absolute inset-y-0 w-px -translate-x-1/2"
        style={{
          backgroundColor: "var(--color-accent)",
          boxShadow: "0 0 6px var(--color-accent), 0 0 2px var(--color-accent)",
          animation: "timeline-pulse 2s ease-in-out infinite",
        }}
      />
      {/* Top dot */}
      <div
        className="absolute -top-1 w-2 h-2 rounded-full -translate-x-1/2"
        style={{
          backgroundColor: "var(--color-accent)",
          boxShadow: "0 0 4px var(--color-accent)",
          animation: "timeline-pulse 2s ease-in-out infinite",
        }}
      />
    </div>
  );
}

function MarketTypeToggle({ value }: { value: MarketType }) {
  const setSettings = useSettingsStore((s) => s.setSettings);
  const options: { label: string; val: MarketType }[] = [
    { label: "FX", val: "fx" },
    { label: "Stock", val: "stock" },
  ];

  return (
    <div className="ml-2 inline-flex items-center rounded-full border border-[color:var(--color-border-subtle)] bg-black/10 p-0.5">
      {options.map((opt) => {
        const active = opt.val === value;
        return (
          <button
            key={opt.val}
            type="button"
            onClick={() => setSettings({ marketType: opt.val })}
            className={`cursor-pointer rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold leading-none transition-colors duration-150 ${
              active
                ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function SessionInfoPopover({
  sessions,
  overlaps,
  marketType,
}: {
  sessions: TradingSession[];
  overlaps: OverlapInfo[];
  marketType: MarketType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const title =
    marketType === "fx" ? "FX Sessions (UTC)" : "Stock Market Sessions (UTC)";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold leading-none border border-[color:var(--color-border-subtle)] text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-strong)] transition-colors"
        aria-label="Session info"
      >
        ?
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-56 sm:w-64 rounded-[var(--radius-control)] panel-elevated border border-[color:var(--color-border-subtle)] p-3 shadow-[var(--shadow-modal)]">
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.04em] text-[color:var(--color-text-secondary)] mb-2">
            {title}
          </p>
          <div className="space-y-1.5">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-[11px] sm:text-xs text-[color:var(--color-text-primary)] font-medium min-w-[60px]">
                  {s.label}
                </span>
                <span className="text-data text-[10px] sm:text-[11px] text-[color:var(--color-text-muted)]">
                  {formatSessionTime(s.startUtc, s.endUtc)}
                </span>
              </div>
            ))}
          </div>
          {overlaps.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-[color:var(--color-border-subtle)]">
              <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.04em] text-[color:var(--color-text-muted)] mb-1.5">
                Overlap Sessions
              </p>
              <div className="space-y-1">
                {overlaps.map((o) => (
                  <div key={o.label} className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] text-[color:var(--color-text-secondary)]">
                      {o.label}
                    </span>
                    <span className="text-data text-[9px] sm:text-[10px] text-[color:var(--color-text-muted)]">
                      {o.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SessionTimeline() {
  const { t } = useI18n();
  const isInitialLoad = useInitialLoad();
  const { marketType, sessions, overlaps, segments, currentTimePct, utcTimeString, sessionEvents, dstKey } =
    useSessionTimeline();

  const row0 = segments.filter((s) => s.row === 0);
  const row1 = segments.filter((s) => s.row === 1);

  return (
    <section className={`${isInitialLoad ? "animate-card-in" : ""} mb-4 rounded-[var(--radius-panel)] panel-surface px-4 py-3 sm:px-5 sm:py-4 relative z-20 overflow-visible`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center text-[10px] sm:text-xs font-semibold tracking-[0.08em] uppercase text-[color:var(--color-text-muted)]">
          Market Sessions
          <MarketTypeToggle value={marketType} />
          <SessionInfoPopover sessions={sessions} overlaps={overlaps} marketType={marketType} />
        </span>
        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1.5">
            {dstKey && (
              <span className="rounded-full bg-red-500/15 text-red-400 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold leading-none">
                ☀️ {t(dstKey)}
              </span>
            )}
            <span className="text-data text-[11px] sm:text-xs text-[color:var(--color-accent)]">
              UTC {utcTimeString}
            </span>
          </span>
          {(sessionEvents.closing.length > 0 || sessionEvents.opening) && (
            <span className="text-[9px] sm:text-[10px] text-[color:var(--color-text-muted)]">
              {sessionEvents.closing.map((ev, i) => (
                <span key={ev.label}>
                  {i > 0 && <span className="mx-1 opacity-40">·</span>}
                  <span className="sm:hidden" style={{ color: ev.color }}>{ev.shortLabel}</span>
                  <span className="hidden sm:inline" style={{ color: ev.color }}>{ev.label}</span>
                  {" "}closes {formatRemaining(ev.remainingMin)}
                </span>
              ))}
              {sessionEvents.closing.length > 0 && sessionEvents.opening && (
                <span className="mx-1 opacity-40">·</span>
              )}
              {sessionEvents.opening && (
                <>
                  <span className="sm:hidden" style={{ color: sessionEvents.opening.color }}>{sessionEvents.opening.shortLabel}</span>
                  <span className="hidden sm:inline" style={{ color: sessionEvents.opening.color }}>{sessionEvents.opening.label}</span>
                  {" "}opens {formatRemaining(sessionEvents.opening.remainingMin)}
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <HourMarkers />

        {/* Session rows */}
        <div className="relative">
          {/* Row 0 */}
          <div className="relative h-6 sm:h-7">
            {row0.map((seg, i) => (
              <SessionBar key={`${seg.sessionId}-${i}`} segment={seg} />
            ))}
          </div>

          {/* Row 1 */}
          <div className="relative h-6 sm:h-7 mt-1">
            {row1.map((seg, i) => (
              <SessionBar key={`${seg.sessionId}-${i}`} segment={seg} />
            ))}
          </div>

          {/* Current time vertical line spanning both rows */}
          <CurrentTimeLine pct={currentTimePct} />
        </div>

        {/* Legend - active sessions */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {segments
            .filter((s) => s.isPrimary)
            .map((seg) => (
              <div
                key={seg.sessionId}
                className="flex items-center gap-1"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: seg.color,
                    opacity: seg.active ? 1 : 0.4,
                  }}
                />
                <span
                  className="text-[9px] sm:text-[10px]"
                  style={{
                    color: seg.active
                      ? seg.color
                      : "var(--color-text-muted)",
                  }}
                >
                  <span className="sm:hidden">{seg.shortLabel}</span>
                  <span className="hidden sm:inline">{seg.label}</span>
                </span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
