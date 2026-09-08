'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Lancamento,
  Receita,
  Cartao,
  Investimento,
  ContaFixa,
  MGConfig,
  PageId,
  Notificacao,
} from './types';
import { uid, currentMonth, shiftMonth, addMonthsToData, jurosCompostos } from './format';

export interface BackupObj {
  app: string;
  versao: number;
  exportadoEm: string;
  lancamentos: Lancamento[];
  config: MGConfig;
  cartoes: Cartao[];
  compras: Lancamento[];
  investimentos: Investimento[];
  contasFixas: ContaFixa[];
  receitas: Receita[];
}

// =====================
// Proteção de dados — migração legada (app v1 vendido a clientes)
// O app novo NUNCA apaga nem altera as chaves do app antigo:
// apenas lê, copia e mantém uma cópia de segurança imutável.
// =====================

export const LEGADO_KEYS = {
  lancamentos: 'meugasto_lancamentos',
  receitas: 'meugasto_receitas',
  cartoes: 'meugasto_cartoes',
  compras: 'meugasto_compras_cartao',
  investimentos: 'meugasto_investimentos',
  contasFixas: 'meugasto_contas_fixas',
  config: 'meugasto_config',
} as const;

/** Cópia de segurança imutável criada ANTES da primeira migração (nunca sobrescrita). */
export const SEGURANCA_KEY = 'meugasto_pro_seguranca_legado';
/** Registro da migração: quando ocorreu e quantos itens foram importados. */
export const MIGRACAO_KEY = 'meugasto_pro_migracao';

export interface MigracaoLegadoInfo {
  migradoEm: string;
  lancamentos: number;
  receitas: number;
  cartoes: number;
  investimentos: number;
  contasFixas: number;
}

export interface SegurancaLegadoObj {
  app: string;
  salvoEm: string;
  lancamentos: Lancamento[];
  receitas: Receita[];
  cartoes: Cartao[];
  compras: Lancamento[];
  investimentos: Investimento[];
  contasFixas: ContaFixa[];
  config: MGConfig;
}

/** Existem dados do app original neste dispositivo? */
export function existeDadosLegados(): boolean {
  try {
    return Object.values(LEGADO_KEYS).some((k) => {
      const raw = localStorage.getItem(k);
      if (!raw) return false;
      try {
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v.length > 0 : v != null && typeof v === 'object';
      } catch {
        return raw.length > 2; // até JSON corrompido conta como dado existente
      }
    });
  } catch {
    return false;
  }
}

/** Info da migração realizada (null se nunca migrou). */
export function getMigracaoInfo(): MigracaoLegadoInfo | null {
  try {
    const raw = localStorage.getItem(MIGRACAO_KEY);
    return raw ? (JSON.parse(raw) as MigracaoLegadoInfo) : null;
  } catch {
    return null;
  }
}

/** Lê a cópia de segurança legada criada na migração (null se não existir). */
export function getSegurancaLegado(): SegurancaLegadoObj | null {
  try {
    const raw = localStorage.getItem(SEGURANCA_KEY);
    return raw ? (JSON.parse(raw) as SegurancaLegadoObj) : null;
  } catch {
    return null;
  }
}

/** Baixa a cópia de segurança legada como arquivo .json. Retorna false se não existir. */
export function baixarSegurancaLegado(): boolean {
  const snap = getSegurancaLegado();
  if (!snap) return false;
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `copia-seguranca-meugasto-original-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

/**
 * RESTAURAÇÃO DE EMERGÊNCIA: substitui os dados atuais do app pela cópia de
 * segurança legada. Só deve ser chamada com confirmação explícita do usuário.
 */
export function restaurarSegurancaLegado(): { ok: boolean; msg: string } {
  const snap = getSegurancaLegado();
  if (!snap) return { ok: false, msg: 'Nenhuma cópia de segurança encontrada.' };
  try {
    useMGStore.setState({
      lancamentos: safeArr<Lancamento>(snap.lancamentos).map((l) => ({
        ...l,
        isCartao: l.isCartao ?? false,
        cartaoId: l.cartaoId ?? null,
        parcelaAtual: l.parcelaAtual ?? null,
        parcelaTotal: l.parcelaTotal ?? null,
        grupoParcelaId: l.grupoParcelaId ?? null,
      })),
      receitas: safeArr<Receita>(snap.receitas),
      cartoes: safeArr<Cartao>(snap.cartoes),
      investimentos: safeArr<Investimento>(snap.investimentos),
      contasFixas: safeArr<ContaFixa>(snap.contasFixas).map((c) => ({
        ...c,
        pagamentos: c.pagamentos ?? {},
      })),
      config: {
        plans: safeArr<MGConfig['plans'][0]>(snap.config?.plans),
        customCats: safeArr<MGConfig['customCats'][0]>(snap.config?.customCats),
      },
    });
    return { ok: true, msg: 'Dados do MeuGasto original restaurados!' };
  } catch {
    return { ok: false, msg: 'Não foi possível restaurar a cópia de segurança.' };
  }
}

interface MGState {
  lancamentos: Lancamento[];
  receitas: Receita[];
  cartoes: Cartao[];
  investimentos: Investimento[];
  contasFixas: ContaFixa[];
  config: MGConfig;
  notificacoes: Notificacao[];
  // UI
  activePage: PageId;
  currentMonth: string;
  lanFilterCat: string;
  // actions
  setActivePage: (p: PageId) => void;
  setLanFilterCat: (c: string) => void;
  changeMonth: (delta: number) => void;
  addLancamento: (l: Omit<Lancamento, 'id'>) => void;
  addLancamentoParcelado: (
    l: Omit<Lancamento, 'id'>,
    parcelas: number
  ) => number;
  updateLancamento: (id: string, patch: Partial<Lancamento>) => void;
  deleteLancamento: (id: string) => void;
  addReceita: (r: Omit<Receita, 'id'>) => void;
  deleteReceita: (id: string) => void;
  addCartao: (c: Omit<Cartao, 'id'>) => void;
  updateCartao: (id: string, patch: Partial<Cartao>) => void;
  deleteCartao: (id: string) => void;
  pagarFaturaCartao: (id: string, mes: string) => void;
  desfazerFaturaCartao: (id: string, mes: string) => void;
  addInvestimento: (i: Omit<Investimento, 'id'>) => void;
  deleteInvestimento: (id: string) => void;
  addContaFixa: (c: Omit<ContaFixa, 'id' | 'pagamentos'>) => void;
  updateContaFixa: (id: string, patch: Partial<ContaFixa>) => void;
  deleteContaFixa: (id: string) => void;
  pagarContaFixa: (id: string, mes: string, valor: number, data: string) => void;
  desfazerPagamentoFixa: (id: string, mes: string) => void;
  addPlan: (p: Omit<MGConfig['plans'][0], 'id'>) => void;
  updatePlan: (id: string, patch: Partial<MGConfig['plans'][0]>) => void;
  deletePlan: (id: string) => void;
  addCustomCat: (c: Omit<MGConfig['customCats'][0], never>) => void;
  deleteCustomCat: (id: string) => void;
  // Notificações (master)
  addNotificacao: (n: Omit<Notificacao, 'id' | 'criadaEm'>) => void;
  updateNotificacao: (id: string, patch: Partial<Notificacao>) => void;
  deleteNotificacao: (id: string) => void;
  publicarNotificacao: (id: string) => void;
  limparMes: (ym: string) => void;
  limparTudo: () => void;
  exportarBackup: () => BackupObj;
  importarBackup: (data: unknown) => { ok: boolean; msg: string };
  importarDadosLegados: () => MigracaoLegadoInfo | null;
}

const DEFAULT_CONFIG: MGConfig = { plans: [], customCats: [] };

function safeArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/** Lê e faz parse de uma chave do localStorage de forma tolerante a falhas. */
function lsParseLegado(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null; // chave corrompida não bloqueia as demais
  }
}

export const useMGStore = create<MGState>()(
  persist(
    (set, get) => ({
      lancamentos: [],
      receitas: [],
      cartoes: [],
      investimentos: [],
      contasFixas: [],
      config: DEFAULT_CONFIG,
      notificacoes: [],
      activePage: 'dashboard',
      currentMonth: currentMonth(),
      lanFilterCat: '',

      setActivePage: (p) => set({ activePage: p }),
      setLanFilterCat: (c) => set({ lanFilterCat: c }),
      changeMonth: (delta) =>
        set((s) => ({ currentMonth: shiftMonth(s.currentMonth, delta) })),

      addLancamento: (l) =>
        set((s) => ({
          lancamentos: [{ ...l, id: uid() }, ...s.lancamentos],
        })),

      addLancamentoParcelado: (l, parcelas) => {
        const grupoParcelaId = parcelas > 1 ? uid() : null;
        const valorParcela = Math.round((l.valor / parcelas) * 100) / 100;
        const novos: Lancamento[] = [];
        for (let i = 0; i < parcelas; i++) {
          novos.push({
            ...l,
            valor: l.isCartao ? valorParcela : l.valor,
            id: uid(),
            data: addMonthsToData(l.data, i),
            parcelaAtual: parcelas > 1 ? i + 1 : null,
            parcelaTotal: parcelas > 1 ? parcelas : null,
            grupoParcelaId,
          });
        }
        set((s) => ({ lancamentos: [...novos, ...s.lancamentos] }));
        return parcelas;
      },

      updateLancamento: (id, patch) =>
        set((s) => ({
          lancamentos: s.lancamentos.map((l) =>
            l.id === id ? { ...l, ...patch } : l
          ),
        })),

      deleteLancamento: (id) =>
        set((s) => ({ lancamentos: s.lancamentos.filter((l) => l.id !== id) })),

      addReceita: (r) =>
        set((s) => ({ receitas: [{ ...r, id: uid() }, ...s.receitas] })),

      deleteReceita: (id) =>
        set((s) => ({ receitas: s.receitas.filter((r) => r.id !== id) })),

      addCartao: (c) =>
        set((s) => ({ cartoes: [...s.cartoes, { ...c, id: uid(), faturasPagas: {} }] })),

      updateCartao: (id, patch) =>
        set((s) => ({
          cartoes: s.cartoes.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      deleteCartao: (id) =>
        set((s) => ({
          cartoes: s.cartoes.filter((c) => c.id !== id),
          lancamentos: s.lancamentos.map((l) =>
            l.cartaoId === id ? { ...l, cartaoId: null } : l
          ),
        })),

      pagarFaturaCartao: (id, mes) =>
        set((s) => ({
          cartoes: s.cartoes.map((c) =>
            c.id === id
              ? { ...c, faturasPagas: { ...(c.faturasPagas ?? {}), [mes]: true } }
              : c
          ),
        })),

      desfazerFaturaCartao: (id, mes) =>
        set((s) => ({
          cartoes: s.cartoes.map((c) => {
            if (c.id !== id) return c;
            const fp = { ...(c.faturasPagas ?? {}) };
            delete fp[mes];
            return { ...c, faturasPagas: fp };
          }),
        })),

      addNotificacao: (n) =>
        set((s) => ({
          notificacoes: [
            { ...n, id: uid(), criadaEm: new Date().toISOString() },
            ...s.notificacoes,
          ],
        })),

      updateNotificacao: (id, patch) =>
        set((s) => ({
          notificacoes: s.notificacoes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        })),

      deleteNotificacao: (id) =>
        set((s) => ({
          notificacoes: s.notificacoes.filter((n) => n.id !== id),
        })),

      publicarNotificacao: (id) =>
        set((s) => ({
          notificacoes: s.notificacoes.map((n) =>
            n.id === id ? { ...n, publicada: true } : n
          ),
        })),

      addInvestimento: (i) =>
        set((s) => ({ investimentos: [{ ...i, id: uid() }, ...s.investimentos] })),

      deleteInvestimento: (id) =>
        set((s) => ({
          investimentos: s.investimentos.filter((i) => i.id !== id),
        })),

      addContaFixa: (c) =>
        set((s) => ({
          contasFixas: [...s.contasFixas, { ...c, id: uid(), pagamentos: {} }],
        })),

      updateContaFixa: (id, patch) =>
        set((s) => ({
          contasFixas: s.contasFixas.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      deleteContaFixa: (id) =>
        set((s) => ({
          contasFixas: s.contasFixas.filter((c) => c.id !== id),
        })),

      pagarContaFixa: (id, mes, valor, data) =>
        set((s) => {
          const conta = s.contasFixas.find((c) => c.id === id);
          const novoLan: Lancamento = {
            id: uid(),
            valor,
            desc: conta ? conta.nome : 'Conta fixa',
            cat: conta ? conta.cat : 'outros',
            data,
            isCartao: false,
          };
          return {
            contasFixas: s.contasFixas.map((c) =>
              c.id === id
                ? { ...c, pagamentos: { ...c.pagamentos, [mes]: { valor, data } } }
                : c
            ),
            lancamentos: [novoLan, ...s.lancamentos],
          };
        }),

      desfazerPagamentoFixa: (id, mes) =>
        set((s) => ({
          contasFixas: s.contasFixas.map((c) => {
            if (c.id !== id) return c;
            const pagamentos = { ...c.pagamentos };
            delete pagamentos[mes];
            return { ...c, pagamentos };
          }),
        })),

      addPlan: (p) =>
        set((s) => ({
          config: {
            ...s.config,
            plans: [...s.config.plans, { ...p, id: 'p' + Date.now() }],
          },
        })),

      updatePlan: (id, patch) =>
        set((s) => ({
          config: {
            ...s.config,
            plans: s.config.plans.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        })),

      deletePlan: (id) =>
        set((s) => ({
          config: { ...s.config, plans: s.config.plans.filter((p) => p.id !== id) },
        })),

      addCustomCat: (c) =>
        set((s) => ({
          config: { ...s.config, customCats: [...s.config.customCats, c as never] },
        })),

      deleteCustomCat: (id) =>
        set((s) => ({
          config: {
            ...s.config,
            customCats: s.config.customCats.filter((c) => c.id !== id),
          },
        })),

      limparMes: (ym) =>
        set((s) => ({
          lancamentos: s.lancamentos.filter((l) => l.data.slice(0, 7) !== ym),
          receitas: s.receitas.filter((r) => r.data.slice(0, 7) !== ym),
        })),

      limparTudo: () =>
        set({
          lancamentos: [],
          receitas: [],
          cartoes: [],
          investimentos: [],
          contasFixas: [],
          config: DEFAULT_CONFIG,
        }),

      exportarBackup: () => {
        const s = get();
        return {
          app: 'MeuGasto',
          versao: 1,
          exportadoEm: new Date().toISOString(),
          lancamentos: s.lancamentos,
          config: s.config,
          cartoes: s.cartoes,
          compras: [],
          investimentos: s.investimentos,
          contasFixas: s.contasFixas,
          receitas: s.receitas,
        };
      },

      importarBackup: (data) => {
        try {
          const d = data as Partial<BackupObj>;
          if (!d || typeof d !== 'object') return { ok: false, msg: 'Arquivo inválido.' };
          const lancamentos = safeArr<Lancamento>(d.lancamentos);
          const receitas = safeArr<Receita>(d.receitas);
          const cartoes = safeArr<Cartao>(d.cartoes);
          const compras = safeArr<Lancamento>(d.compras);
          const investimentos = safeArr<Investimento>(d.investimentos);
          const contasFixas = safeArr<ContaFixa>(d.contasFixas);
          const config = {
            plans: safeArr<MGConfig['plans'][0]>(d.config?.plans),
            customCats: safeArr<MGConfig['customCats'][0]>(d.config?.customCats),
          };
          // migra compras antigas para lançamentos (como no app original)
          const todasLanc = [...lancamentos, ...compras].map((l) => ({
            ...l,
            isCartao: l.isCartao ?? false,
          }));
          set({
            lancamentos: todasLanc,
            receitas,
            cartoes,
            investimentos,
            contasFixas,
            config,
          });
          return { ok: true, msg: `Backup importado: ${todasLanc.length} lançamentos.` };
        } catch {
          return { ok: false, msg: 'Não foi possível ler o arquivo de backup.' };
        }
      },

      importarDadosLegados: () => {
        // importa dados do app original (v1) que estejam no mesmo localStorage
        // cada chave é lida de forma independente: uma corrompida não bloqueia as demais
        const legado = lsParseLegado(LEGADO_KEYS.lancamentos);
        if (!Array.isArray(legado) || legado.length === 0) return null;

        // apenas importa se o app novo ainda estiver vazio (não sobrescreve dados novos)
        if (get().lancamentos.length > 0) return null;

        // ----- CAMADA 1 DE PROTEÇÃO: cópia de segurança IMUTÁVEL antes de migrar -----
        // salva o estado completo do app antigo em chave própria, uma única vez.
        try {
          if (!localStorage.getItem(SEGURANCA_KEY)) {
            const snap: SegurancaLegadoObj = {
              app: 'MeuGasto-original-copia-seguranca',
              salvoEm: new Date().toISOString(),
              lancamentos: safeArr<Lancamento>(legado),
              receitas: safeArr<Receita>(lsParseLegado(LEGADO_KEYS.receitas)),
              cartoes: safeArr<Cartao>(lsParseLegado(LEGADO_KEYS.cartoes)),
              compras: safeArr<Lancamento>(lsParseLegado(LEGADO_KEYS.compras)),
              investimentos: safeArr<Investimento>(lsParseLegado(LEGADO_KEYS.investimentos)),
              contasFixas: safeArr<ContaFixa>(lsParseLegado(LEGADO_KEYS.contasFixas)),
              config: (lsParseLegado(LEGADO_KEYS.config) as MGConfig) ?? DEFAULT_CONFIG,
            };
            localStorage.setItem(SEGURANCA_KEY, JSON.stringify(snap));
          }
        } catch {
          // se não conseguir salvar a cópia, aborta sem tocar em nada — dados intactos
          return null;
        }

        // compras antigas de cartão (chave separada no app v1) migram para lançamentos,
        // mesma lógica do migrarComprasAntigasParaLancamentos() do app original
        const comprasLegado = safeArr<Lancamento>(
          lsParseLegado(LEGADO_KEYS.compras)
        );
        const comprasMigradas = comprasLegado.map((c) => ({
          ...c,
          isCartao: true,
          cartaoId: c.cartaoId ?? null,
          parcelaAtual: c.parcelaAtual ?? null,
          parcelaTotal: c.parcelaTotal ?? null,
          grupoParcelaId: c.grupoParcelaId ?? null,
        }));

        const lancamentosNormalizados = [
          ...safeArr<Lancamento>(legado),
          ...comprasMigradas,
        ].map((l) => ({
          ...l,
          valor: Number(l.valor) || 0,
          isCartao: l.isCartao ?? false,
          cartaoId: l.cartaoId ?? null,
          parcelaAtual: l.parcelaAtual ?? null,
          parcelaTotal: l.parcelaTotal ?? null,
          grupoParcelaId: l.grupoParcelaId ?? null,
        }));
        set({ lancamentos: lancamentosNormalizados });

        const legadoReceitas = lsParseLegado(LEGADO_KEYS.receitas);
        if (
          Array.isArray(legadoReceitas) &&
          legadoReceitas.length > 0 &&
          get().receitas.length === 0
        ) {
          set({ receitas: legadoReceitas as Receita[] });
        }

        const legadoCartoes = lsParseLegado(LEGADO_KEYS.cartoes);
        if (
          Array.isArray(legadoCartoes) &&
          legadoCartoes.length > 0 &&
          get().cartoes.length === 0
        ) {
          set({ cartoes: legadoCartoes as Cartao[] });
        }

        const legadoInvest = lsParseLegado(LEGADO_KEYS.investimentos);
        if (
          Array.isArray(legadoInvest) &&
          legadoInvest.length > 0 &&
          get().investimentos.length === 0
        ) {
          set({ investimentos: legadoInvest as Investimento[] });
        }

        const legadoFixas = lsParseLegado(LEGADO_KEYS.contasFixas);
        if (
          Array.isArray(legadoFixas) &&
          legadoFixas.length > 0 &&
          get().contasFixas.length === 0
        ) {
          // garante que pagamentos exista em cada conta fixa legada
          set({
            contasFixas: (legadoFixas as ContaFixa[]).map((c) => ({
              ...c,
              pagamentos: c.pagamentos ?? {},
            })),
          });
        }

        const legadoCfg = lsParseLegado(LEGADO_KEYS.config) as MGConfig | null;
        if (
          legadoCfg &&
          ((legadoCfg.plans?.length ?? 0) > 0 ||
            (legadoCfg.customCats?.length ?? 0) > 0) &&
          get().config.plans.length === 0 &&
          get().config.customCats.length === 0
        ) {
          set({
            config: {
              plans: safeArr<MGConfig['plans'][0]>(legadoCfg.plans),
              customCats: safeArr<MGConfig['customCats'][0]>(legadoCfg.customCats),
            },
          });
        }

        // ----- REGISTRO da migração (para exibir em Ajustes e notificar o cliente) -----
        const info: MigracaoLegadoInfo = {
          migradoEm: new Date().toISOString(),
          lancamentos: lancamentosNormalizados.length,
          receitas: safeArr<Receita>(legadoReceitas).length,
          cartoes: safeArr<Cartao>(legadoCartoes).length,
          investimentos: safeArr<Investimento>(legadoInvest).length,
          contasFixas: safeArr<ContaFixa>(legadoFixas).length,
        };
        try {
          localStorage.setItem(MIGRACAO_KEY, JSON.stringify(info));
        } catch {
          // registro é apenas informativo
        }
        return info;
      },
    }),
    {
      name: 'meugasto-pro-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        lancamentos: s.lancamentos,
        receitas: s.receitas,
        cartoes: s.cartoes,
        investimentos: s.investimentos,
        contasFixas: s.contasFixas,
        config: s.config,
        notificacoes: s.notificacoes,
      }),
    }
  )
);

// ===================== SELETORES / HELPERS =====================

export function getLancamentosDoMes(lancamentos: Lancamento[], mes: string) {
  return lancamentos.filter((l) => l.data.startsWith(mes));
}

export function getReceitasDoMes(receitas: Receita[], mes: string) {
  return receitas.filter((r) => r.data.startsWith(mes));
}

export function totalMes(lancamentos: Lancamento[], mes: string): number {
  return getLancamentosDoMes(lancamentos, mes).reduce((acc, l) => acc + l.valor, 0);
}

export function calcularEstimativa(
  valor: number,
  taxa: number,
  periodicidade: 'mensal' | 'diario',
  data: string,
  vencimento: string
) {
  return jurosCompostos(valor, taxa, periodicidade, data, vencimento);
}
