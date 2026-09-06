'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Check, Moon, Palette, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ACCENT_THEMES } from '@/lib/constants';
import { useAccent } from './theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted ? theme === 'dark' : true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Abrir seletor de tema"
          className="rounded-xl bg-card/60 backdrop-blur"
        >
          <Palette className="size-[1.1rem]" />
          <span className="sr-only">Trocar tema e cores</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Palette className="size-3.5" /> Cor de destaque
        </DropdownMenuLabel>
        <div className="grid grid-cols-3 gap-1.5 px-2 pb-2">
          {ACCENT_THEMES.map((t) => {
            const active = mounted && accent === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setAccent(t.id)}
                title={t.nome}
                aria-label={`Tema ${t.nome}`}
                aria-pressed={active}
                className="group relative flex h-11 items-center justify-center rounded-lg border bg-background/40 transition-all hover:scale-105 active:scale-95"
                style={{
                  borderColor: active ? t.swatch : undefined,
                  boxShadow: active ? `0 0 0 1px ${t.swatch}` : undefined,
                }}
              >
                <span
                  className="size-5 rounded-full transition-transform group-hover:scale-110"
                  style={{ background: t.swatch }}
                />
                {active && (
                  <Check
                    className="absolute right-1 top-1 size-3"
                    style={{ color: t.swatch }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          {isDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />} Aparência
        </DropdownMenuLabel>
        <div className="grid grid-cols-2 gap-1.5 px-2 pb-2">
          <Button
            size="sm"
            variant={mounted && !isDark ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
            className="rounded-lg"
          >
            <Sun className="mr-1.5 size-3.5" /> Claro
          </Button>
          <Button
            size="sm"
            variant={isDark ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
            className="rounded-lg"
          >
            <Moon className="mr-1.5 size-3.5" /> Escuro
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
