'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ACCENT_THEMES } from '@/lib/constants';

type AccentContextType = {
  accent: string;
  setAccent: (id: string) => void;
};

const AccentContext = React.createContext<AccentContextType>({
  accent: 'violeta',
  setAccent: () => {},
});

export function useAccent() {
  return React.useContext(AccentContext);
}

function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = React.useState<string>('violeta');

  React.useEffect(() => {
    const saved = localStorage.getItem('meugasto-accent');
    if (saved && ACCENT_THEMES.some((t) => t.id === saved)) {
      setAccentState(saved);
      document.documentElement.setAttribute('data-accent', saved);
    }
  }, []);

  const setAccent = React.useCallback((id: string) => {
    setAccentState(id);
    localStorage.setItem('meugasto-accent', id);
    document.documentElement.setAttribute('data-accent', id);
  }, []);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AccentProvider>{children}</AccentProvider>
    </NextThemesProvider>
  );
}
