// =====================
// MeuGasto Pro — Tipos de dados
// Compatível com o formato de backup original (MeuGasto v1)
// =====================

export interface Lancamento {
  id: string;
  valor: number;
  desc: string;
  cat: string;
  data: string; // YYYY-MM-DD
  isCartao: boolean;
  cartaoId?: string | null;
  parcelaAtual?: number | null;
  parcelaTotal?: number | null;
  grupoParcelaId?: string | null;
}

export interface Receita {
  id: string;
  valor: number;
  desc: string;
  cat: string;
  data: string; // YYYY-MM-DD
}

export interface Cartao {
  id: string;
  emoji: string;
  nome: string;
  limite: number;
  venc: number | null;
}

export type InvTipo =
  | 'cdb'
  | 'tesouro'
  | 'acoes'
  | 'fii'
  | 'poupanca'
  | 'cripto'
  | 'outros';

export interface Investimento {
  id: string;
  tipo: InvTipo;
  nome: string;
  valor: number;
  data: string;
  vencimento: string;
  taxa: number;
  periodicidade: 'mensal' | 'diario';
  valorEstimado: number | null;
}

export interface PagamentoFixa {
  valor: number;
  data: string;
}

export interface ContaFixa {
  id: string;
  nome: string;
  cat: string;
  dia: number;
  valorEstimado: number;
  pagamentos: Record<string, PagamentoFixa>; // chave 'YYYY-MM'
}

export interface Plan {
  id: string;
  emoji: string;
  nome: string;
  cat: string;
  limite: number;
}

export interface CustomCat {
  id: string;
  emoji: string;
  nome: string;
  cor: string;
}

export interface MGConfig {
  plans: Plan[];
  customCats: CustomCat[];
}

export type PageId =
  | 'dashboard'
  | 'lancar'
  | 'lancamentos'
  | 'receitas'
  | 'cartoes'
  | 'investimentos'
  | 'fixas'
  | 'config'
  | 'codigos';

export const PAGE_IDS: PageId[] = [
  'dashboard',
  'lancar',
  'lancamentos',
  'receitas',
  'cartoes',
  'investimentos',
  'fixas',
  'config',
  'codigos',
];

export const PAGE_LABELS: Record<PageId, string> = {
  dashboard: 'Painel',
  lancar: 'Lançar',
  lancamentos: 'Lançamentos',
  receitas: 'Receitas',
  cartoes: 'Cartões',
  investimentos: 'Investimentos',
  fixas: 'Contas Fixas',
  config: 'Ajustes',
  codigos: 'Códigos',
};
