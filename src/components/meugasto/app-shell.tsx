'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  KeyRound,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  MoreHorizontal,
  PiggyBank,
  PlusCircle,
  Repeat,
  Settings,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useMGStore } from '@/lib/store';
import { monthLabel } from '@/lib/format';
import type { PageId } from '@/lib/types';
import { PAGE_LABELS } from '@/lib/types';
import { ThemeToggle } from './theme-switcher';
import { useLicenca } from './license-gate';

// ===================== NAV ITEMS =====================
// Painel principal: Painel, Lançar, Cartões, Receita, Contas Fixas
const NAV_MAIN: { id: PageId; icon: React.ElementType }[] = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'lancar', icon: PlusCircle },
  { id: 'cartoes', icon: CreditCard },
  { id: 'receitas', icon: Wallet },
  { id: 'fixas', icon: Repeat },
];

// Extras (ficam no "Mais")
const NAV_EXTRA: { id: PageId; icon: React.ElementType }[] = [
  { id: 'lancamentos', icon: ListOrdered },
  { id: 'investimentos', icon: PiggyBank },
  { id: 'config', icon: Settings },
  { id: 'codigos', icon: KeyRound },
  { id: 'notificacoes', icon: Bell },
];

const ALL_NAV = [...NAV_MAIN, ...NAV_EXTRA];

/** Filtro de navegação: itens exclusivos do master. */
const SOLO_MASTER: PageId[] = ['codigos', 'notificacoes'];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="card-gradient flex size-9 shrink-0 items-center justify-center rounded-xl shadow-lg shadow-primary/25">
        <Landmark className="size-5 text-white" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <span className="text-[1.05rem] font-extrabold tracking-tight">
            Meu<span className="text-primary">Gasto</span>
          </span>
          <span className="ml-1.5 rounded-md bg-primary/12 px-1.5 py-0.5 align-middle text-[0.6rem] font-bold uppercase tracking-wider text-primary">
            Pro
          </span>
        </div>
      )}
    </div>
  );
}

function NavButton({
  id,
  icon: Icon,
  active,
  onClick,
  label = true,
}: {
  id: PageId;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
  label?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary/12 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {active && (
        <motion.span
          layoutId="sidebar-pill"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
        />
      )}
      <Icon className={`size-[1.15rem] shrink-0 ${id === 'lancar' && active ? 'scale-110' : ''} transition-transform`} />
      {label && <span>{PAGE_LABELS[id]}</span>}
    </button>
  );
}

// ===================== APP SHELL =====================
export function AppShell({ children }: { children: React.ReactNode }) {
  const activePage = useMGStore((s) => s.activePage);
  const setActivePage = useMGStore((s) => s.setActivePage);
  const currentMonth = useMGStore((s) => s.currentMonth);
  const changeMonth = useMGStore((s) => s.changeMonth);
  const { isMaster } = useLicenca();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const navVisivel = React.useMemo(
    () => ALL_NAV.filter(({ id }) => !SOLO_MASTER.includes(id) || isMaster),
    [isMaster]
  );
  const extraVisivel = React.useMemo(
    () => NAV_EXTRA.filter(({ id }) => !SOLO_MASTER.includes(id) || isMaster),
    [isMaster]
  );

  const go = React.useCallback(
    (p: PageId) => {
      setActivePage(p);
      setMoreOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setActivePage]
  );

  const isMobileExtra = (id: PageId) =>
    id === 'lancamentos' || id === 'investimentos' || id === 'config' || id === 'codigos' || id === 'notificacoes';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen w-full">
        {/* ================= SIDEBAR (desktop) ================= */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r bg-sidebar px-3 py-4 lg:flex">
          <div className="px-2 pb-5">
            <Logo />
          </div>
          <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação principal">
            {navVisivel.map(({ id, icon }) => (
              <NavButton
                key={id}
                id={id}
                icon={icon}
                active={activePage === id}
                onClick={() => go(id)}
              />
            ))}
          </nav>
          <div className="mt-4 rounded-xl border bg-card/50 p-3 text-[0.7rem] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Dica:</span> toque na bolinha
            colorida no topo para trocar o tema e as cores do app.
          </div>
        </aside>

        {/* ================= MAIN COLUMN ================= */}
        <div className="flex min-h-screen w-full flex-col lg:pl-60">
          {/* HEADER */}
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 overflow-hidden px-3 sm:px-6">
              <div className="min-w-0 lg:hidden">
                <Logo compact />
              </div>
              <div className="hidden min-w-0 items-center gap-2 lg:flex">
                <h2 className="truncate text-lg font-bold tracking-tight">
                  {PAGE_LABELS[activePage]}
                </h2>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {/* Navegação por mês */}
                <div className="flex items-center gap-0.5 rounded-xl border bg-card px-1 py-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg"
                    onClick={() => changeMonth(-1)}
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="min-w-[5.75rem] text-center text-[0.74rem] font-semibold sm:min-w-[7.5rem] sm:text-[0.8rem]">
                    {monthLabel(currentMonth)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-lg"
                    onClick={() => changeMonth(1)}
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* CONTEÚDO */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          <footer className="hidden pb-6 text-center text-xs text-muted-foreground lg:block">
            MeuGasto Pro · seus dados ficam salvos apenas neste dispositivo
          </footer>
        </div>

        {/* ================= BOTTOM NAV (mobile) ================= */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          aria-label="Navegação inferior"
        >
          <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
            {NAV_MAIN.map(({ id, icon: Icon }) => {
              const active = activePage === id;
              if (id === 'lancar') {
                return (
                  <button
                    key={id}
                    onClick={() => go(id)}
                    aria-label="Lançar gasto"
                    className="relative -mt-5 flex flex-col items-center"
                  >
                    <span
                      className={`card-gradient flex size-14 items-center justify-center rounded-2xl shadow-xl shadow-primary/35 transition-transform active:scale-90 ${
                        active ? 'ring-4 ring-primary/20' : ''
                      }`}
                    >
                      <PlusCircle className="size-7 text-white" />
                    </span>
                    <span
                      className={`mt-0.5 text-[0.6rem] font-semibold ${
                        active ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      Lançar
                    </span>
                  </button>
                );
              }
              return (
                <button
                  key={id}
                  onClick={() => go(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="size-[1.25rem]" />
                  <span className="text-[0.6rem] font-semibold">
                    {PAGE_LABELS[id]}
                  </span>
                  {active && (
                    <span className="absolute bottom-0 h-1 w-6 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}

            {/* Mais */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors ${
                    isMobileExtra(activePage) ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <MoreHorizontal className="size-[1.25rem]" />
                  <span className="text-[0.6rem] font-semibold">Mais</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-8">
                <SheetHeader className="pb-2">
                  <SheetTitle>Mais seções</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-4 gap-3">
                  {extraVisivel.map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => go(id)}
                      className="flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 transition-transform active:scale-95"
                    >
                      <span
                        className={`flex size-10 items-center justify-center rounded-xl ${
                          activePage === id
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="text-center text-[0.65rem] font-semibold leading-tight">
                        {PAGE_LABELS[id]}
                      </span>
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
