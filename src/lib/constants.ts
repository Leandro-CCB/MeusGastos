import type { CustomCat } from './types';

// ===================== CATEGORIAS PADRÃO =====================
export const CATS_PADRAO = [
  { id: 'alimentacao', emoji: '🍽️', nome: 'Alimentação' },
  { id: 'combustivel', emoji: '⛽', nome: 'Combustível' },
  { id: 'mercado', emoji: '🛒', nome: 'Mercado' },
  { id: 'saude', emoji: '💊', nome: 'Saúde' },
  { id: 'lazer', emoji: '🎮', nome: 'Lazer' },
  { id: 'transporte', emoji: '🚌', nome: 'Transporte' },
  { id: 'casa', emoji: '🏠', nome: 'Casa' },
  { id: 'roupas', emoji: '👕', nome: 'Roupas' },
  { id: 'educacao', emoji: '📚', nome: 'Educação' },
  { id: 'outros', emoji: '📦', nome: 'Outros' },
];

export const CAT_COLORS: Record<string, string> = {
  alimentacao: '#f7b731',
  combustivel: '#45aaf2',
  mercado: '#26de81',
  saude: '#fd9644',
  lazer: '#a55eea',
  transporte: '#4bcffa',
  casa: '#fd79a8',
  roupas: '#fdcb6e',
  educacao: '#6c5ce7',
  outros: '#b2bec3',
};

export const REC_CATS = [
  { id: 'salario', emoji: '💼', nome: 'Salário' },
  { id: 'servico', emoji: '🛠️', nome: 'Serviço' },
  { id: 'informal', emoji: '🤝', nome: 'Informal' },
  { id: 'freela', emoji: '💻', nome: 'Freelance' },
  { id: 'outros_rec', emoji: '📦', nome: 'Outros' },
];

export const INV_TIPOS: Record<string, { emoji: string; nome: string }> = {
  cdb: { emoji: '🏦', nome: 'CDB' },
  tesouro: { emoji: '🇧🇷', nome: 'Tesouro Direto' },
  acoes: { emoji: '📈', nome: 'Ações' },
  fii: { emoji: '🏢', nome: 'Fundos Imobiliários' },
  poupanca: { emoji: '🐷', nome: 'Poupança' },
  cripto: { emoji: '🪙', nome: 'Criptomoedas' },
  outros: { emoji: '📦', nome: 'Outros' },
};

export const EMOJI_OPTIONS = [
  '🍽️', '⛽', '🛒', '💊', '🎮', '🚌', '🏠', '👕', '📚', '📦',
  '☕', '🍕', '🐕', '🎵', '🎬', '⚽', '✈️', '🚗', 'Uber', '💡',
  '📱', '💧', '🎓', '💅', '🏋️', '🎁', '🧾', '💳', '💰', '🔧',
];

// ===================== TEMAS DE COR (ACCENT) =====================
export interface AccentTheme {
  id: string;
  nome: string;
  swatch: string; // cor de pré-visualização
}

export const ACCENT_THEMES: AccentTheme[] = [
  { id: 'violeta', nome: 'Violeta', swatch: '#8b5cf6' },
  { id: 'esmeralda', nome: 'Esmeralda', swatch: '#10b981' },
  { id: 'rosa', nome: 'Rosa', swatch: '#f43f5e' },
  { id: 'ambar', nome: 'Âmbar', swatch: '#f59e0b' },
  { id: 'ciano', nome: 'Ciano', swatch: '#06b6d4' },
  { id: 'funcho', nome: 'Funcho', swatch: '#84cc16' },
];

// ===================== HELPERS DE CATEGORIA =====================
export function getAllCats(customCats: CustomCat[]) {
  return [
    ...CATS_PADRAO,
    ...customCats.map((c) => ({ id: c.id, emoji: c.emoji, nome: c.nome })),
  ];
}

export function getCatColor(catId: string, customCats: CustomCat[]): string {
  const custom = customCats.find((c) => c.id === catId);
  if (custom) return custom.cor;
  return CAT_COLORS[catId] || '#8b8fa3';
}
