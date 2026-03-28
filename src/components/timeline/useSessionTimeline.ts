import { useEffect, useMemo, useState } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import {
  getSessions,
  getOverlaps,
  computeSegments,
  getSessionEvents,
  getDstStatus,
} from "./sessions";

export function useSessionTimeline() {
  const [now, setNow] = useState(() => new Date());
  const marketType = useSettingsStore((s) => s.settings.marketType);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const sessions = useMemo(() => getSessions(now, marketType), [now, marketType]);
  const overlaps = useMemo(() => getOverlaps(now, marketType), [now, marketType]);

  const currentHourFrac = useMemo(() => {
    return now.getUTCHours() + now.getUTCMinutes() / 60;
  }, [now]);

  const currentTimePct = useMemo(() => {
    return (currentHourFrac / 24) * 100;
  }, [currentHourFrac]);

  const segments = useMemo(() => {
    return computeSegments(sessions, currentHourFrac);
  }, [sessions, currentHourFrac]);

  const sessionEvents = useMemo(() => {
    return getSessionEvents(sessions, currentHourFrac);
  }, [sessions, currentHourFrac]);

  const dstKey = useMemo(() => getDstStatus(now).key, [now]);

  const utcTimeString = useMemo(() => {
    const h = String(now.getUTCHours()).padStart(2, "0");
    const m = String(now.getUTCMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }, [now]);

  return { marketType, sessions, overlaps, segments, currentTimePct, utcTimeString, sessionEvents, dstKey };
}
