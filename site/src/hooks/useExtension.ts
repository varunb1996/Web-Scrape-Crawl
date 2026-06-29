import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtMessage, JobState } from "../types";

export type ExtStatus = "detecting" | "connected" | "not_installed";

export function useExtension() {
  const [status, setStatus] = useState<ExtStatus>("detecting");
  const [jobs, setJobs] = useState<JobState[]>([]);
  const pendingRef = useRef<Map<string, (res: ExtMessage) => void>>(new Map());

  const send = useCallback((msg: ExtMessage): Promise<ExtMessage> => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2);
      const payload = { ...msg, _id: id };
      pendingRef.current.set(id, resolve);
      window.postMessage({ source: "WSC_PAGE", payload }, "*");
      setTimeout(() => {
        if (pendingRef.current.has(id)) {
          pendingRef.current.delete(id);
          resolve({ type: "PONG", version: "" }); // timeout fallback
        }
      }, 5_000);
    });
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (!event.data || event.data.source !== "WSC_EXT") return;

      const msg = event.data.payload as (ExtMessage & { _id?: string }) | undefined;
      if (!msg) return;

      // Handle broadcasts (no _id)
      if (!msg._id) {
        if (msg.type === "JOB_UPDATE") {
          setJobs((prev) => {
            const idx = prev.findIndex((j) => j.config.id === (msg as any).job.config.id);
            if (idx === -1) return [...prev, (msg as any).job];
            const next = [...prev];
            next[idx] = (msg as any).job;
            return next;
          });
        }
        if (msg.type === "PONG") setStatus("connected");
        return;
      }

      // Handle responses
      const resolve = pendingRef.current.get(msg._id);
      if (resolve) {
        pendingRef.current.delete(msg._id);
        resolve(msg);
      }
    };

    window.addEventListener("message", handler);

    // Detect extension
    const detectTimeout = setTimeout(() => {
      setStatus("not_installed");
    }, 2_000);

    window.postMessage({ source: "WSC_PAGE", payload: { type: "PING" } }, "*");

    window.addEventListener("message", function onPong(e) {
      if (e.data?.source === "WSC_EXT" && e.data?.payload?.type === "PONG") {
        clearTimeout(detectTimeout);
        setStatus("connected");
        window.removeEventListener("message", onPong);
      }
    });

    return () => window.removeEventListener("message", handler);
  }, []);

  // Load jobs once connected
  useEffect(() => {
    if (status !== "connected") return;
    send({ type: "GET_JOBS" }).then((res) => {
      if (res.type === "JOBS_LIST") setJobs((res as any).jobs ?? []);
    });
  }, [status, send]);

  return { status, jobs, setJobs, send };
}
