import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react";

export type PageContext = {
  route?: string;
  scope?: string; // "project" | "task" | "file" | etc
  title?: string;
  ids?: Record<string, string | undefined>;
  notes?: string;
};

type Ctx = {
  context: PageContext;
  setPageContext: (c: PageContext | null) => void;
};

const AiPageContext = createContext<Ctx>({ context: {}, setPageContext: () => {} });

export function AiPageContextProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<PageContext>({});
  const value = useMemo<Ctx>(
    () => ({
      context,
      setPageContext: (c) => setContext(c ?? {}),
    }),
    [context],
  );
  return <AiPageContext.Provider value={value}>{children}</AiPageContext.Provider>;
}

export function useAiPageContext() {
  return useContext(AiPageContext);
}

/** Convenience: set page context on mount, clear on unmount. */
export function useSetPageContext(ctx: PageContext, deps: unknown[] = []) {
  const { setPageContext } = useAiPageContext();
  useEffect(() => {
    setPageContext(ctx);
    return () => setPageContext(null);
  }, deps);
}
