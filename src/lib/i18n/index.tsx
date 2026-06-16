import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionaries, type LangCode } from "./dictionaries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type I18nCtx = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string, fallback?: string) => string;
  formatDate: (d: Date | string | number) => string;
  formatTime: (d: Date | string | number) => string;
  formatNumber: (n: number) => string;
  formatCurrency: (n: number, currency?: string) => string;
};

const Ctx = createContext<I18nCtx | null>(null);
const STORAGE_KEY = "dios.lang";

function detectInitial(): LangCode {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) return saved;
  const nav = window.navigator?.language?.slice(0, 2)?.toLowerCase();
  if (nav && dictionaries[nav]) return nav;
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lang, setLangState] = useState<LangCode>(detectInitial);

  // Sync from profile on login
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("preferred_language").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        const p = data?.preferred_language;
        if (p && dictionaries[p]) setLangState(p);
      });
  }, [user]);

  const setLang = (l: LangCode) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
    if (typeof document !== "undefined") document.documentElement.lang = l;
    if (user) supabase.from("profiles").update({ preferred_language: l }).eq("id", user.id).then(() => {});
  };

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nCtx>(() => {
    const dict = dictionaries[lang] ?? dictionaries.en;
    const fallbackDict = dictionaries.en;
    const locale = lang === "uk" ? "uk-UA" : lang === "ru" ? "ru-RU" : "en-US";
    const t = (key: string, fb?: string) => dict[key] ?? fallbackDict[key] ?? fb ?? key;
    const toDate = (d: Date | string | number) => (d instanceof Date ? d : new Date(d));
    return {
      lang,
      setLang,
      t,
      formatDate: (d) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(toDate(d)),
      formatTime: (d) => new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(toDate(d)),
      formatNumber: (n) => new Intl.NumberFormat(locale).format(n),
      formatCurrency: (n, currency = "USD") => new Intl.NumberFormat(locale, { style: "currency", currency }).format(n),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, user]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used inside I18nProvider");
  return c;
}

export function useT() {
  return useI18n().t;
}