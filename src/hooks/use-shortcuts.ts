import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

export function useShortcuts(onCommandBar?: () => void, onQuickCreate?: () => void) {
  const navigate = useNavigate();
  const seq = useRef<string>("");
  const seqTimer = useRef<number | null>(null);

  useEffect(() => {
    function isTyping(t: EventTarget | null) {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    }

    function handler(e: KeyboardEvent) {
      if (isTyping(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onCommandBar?.();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        const s = document.querySelector<HTMLInputElement>("[data-global-search]");
        s?.focus();
        return;
      }
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onQuickCreate?.();
        return;
      }
      if (e.key === "p" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate({ to: "/projects" });
        return;
      }
      // G then D/T/P sequence
      if (e.key === "g") {
        seq.current = "g";
        if (seqTimer.current) window.clearTimeout(seqTimer.current);
        seqTimer.current = window.setTimeout(() => { seq.current = ""; }, 800);
        return;
      }
      if (seq.current === "g") {
        seq.current = "";
        if (e.key === "d") { navigate({ to: "/dashboard" }); }
        else if (e.key === "t") { navigate({ to: "/tasks" }); }
        else if (e.key === "p") { navigate({ to: "/projects" }); }
        else if (e.key === "i") { navigate({ to: "/inbox" }); }
        else if (e.key === "m") { navigate({ to: "/my-work" }); }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, onCommandBar, onQuickCreate]);
}