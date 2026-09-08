'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Megaphone, Sparkles, X } from 'lucide-react';
import { useMGStore } from '@/lib/store';
import type { Notificacao } from '@/lib/types';
import { useLicenca } from './license-gate';

const TIPO_CONFIG: Record<
  Notificacao['tipo'],
  { icon: React.ElementType; bg: string; border: string; iconColor: string }
> = {
  agradecimento: {
    icon: Gift,
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/40',
    iconColor: 'text-emerald-500',
  },
  novidade: {
    icon: Sparkles,
    bg: 'bg-primary/10',
    border: 'border-primary/40',
    iconColor: 'text-primary',
  },
  aviso: {
    icon: Megaphone,
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/40',
    iconColor: 'text-amber-500',
  },
};

const VISTAS_KEY = 'meugasto_notificacoes_vistas';

function getNotificacoesVistas(): string[] {
  try {
    const raw = localStorage.getItem(VISTAS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function marcarComoVista(id: string) {
  try {
    const vistas = getNotificacoesVistas();
    if (!vistas.includes(id)) {
      localStorage.setItem(VISTAS_KEY, JSON.stringify([...vistas, id]));
    }
  } catch {
    // silencioso
  }
}

export function NotificacaoBanner() {
  const notificacoes = useMGStore((s) => s.notificacoes);
  const { isMaster } = useLicenca();
  const [atual, setAtual] = React.useState<Notificacao | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    // Master não vê o popup (ele gerencia as notificações)
    if (isMaster) return;

    const vistas = getNotificacoesVistas();
    // Pega a notificação publicada mais recente que o cliente ainda não viu
    const pendente = notificacoes
      .filter((n) => n.publicada && !vistas.includes(n.id))
      .sort((a, b) => (a.criadaEm < b.criadaEm ? 1 : -1))[0];

    if (pendente) {
      // Pequeno delay para não aparecer imediatamente ao abrir o app
      const timer = setTimeout(() => setAtual(pendente), 1200);
      return () => clearTimeout(timer);
    }
  }, [notificacoes, isMaster, mounted]);

  const fechar = () => {
    if (atual) marcarComoVista(atual.id);
    setAtual(null);
  };

  if (!atual) return null;

  const cfg = TIPO_CONFIG[atual.tipo];
  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      {atual && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={fechar}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border p-5 shadow-2xl ${cfg.bg} ${cfg.border} bg-background/95 backdrop-blur-xl`}
          >
            {/* Fechar */}
            <button
              onClick={fechar}
              className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="size-4" />
            </button>

            {/* Ícone */}
            <div className={`mb-3 flex size-12 items-center justify-center rounded-2xl border ${cfg.border} ${cfg.bg}`}>
              <Icon className={`size-6 ${cfg.iconColor}`} />
            </div>

            {/* Conteúdo */}
            <h3 className="text-base font-extrabold leading-tight">{atual.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{atual.mensagem}</p>

            {/* Botão */}
            <button
              onClick={fechar}
              className={`mt-4 w-full rounded-2xl py-2.5 text-sm font-bold transition-opacity hover:opacity-80 ${
                atual.tipo === 'agradecimento'
                  ? 'bg-emerald-500 text-white'
                  : atual.tipo === 'novidade'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {atual.tipo === 'agradecimento' ? '💚 Obrigado!' : atual.tipo === 'novidade' ? '🚀 Incrível!' : '✅ Entendido'}
            </button>

            <p className="mt-2.5 text-center text-[0.65rem] text-muted-foreground">
              MeuGasto Pro
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
