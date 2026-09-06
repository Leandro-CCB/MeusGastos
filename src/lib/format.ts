// ===================== FORMATAÇÃO =====================
export function fmt(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);
}

export function fmtShort(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) {
    return 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k';
  }
  return 'R$ ' + (Math.round(v * 100) / 100).toFixed(2).replace('.', ',');
}

export function fmtPct(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1).replace('.', ',') + '%';
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES[m - 1]} ${y}`;
}

export function monthLabelShort(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MESES_CURTOS[m - 1]}/${String(y).slice(2)}`;
}

export function monthOf(data: string): string {
  return data.slice(0, 7);
}

export function currentMonth(): string {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export function todayISO(): string {
  const now = new Date();
  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0')
  );
}

export function formatarDataBr(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function diasEntre(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

export function addMonthsToData(data: string, i: number): string {
  const [y, m, d] = data.split('-').map(Number);
  const dt = new Date(y, m - 1 + i, Math.min(d, 28));
  return (
    dt.getFullYear() +
    '-' +
    String(dt.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(dt.getDate()).padStart(2, '0')
  );
}

export function uid(): string {
  return 'id' + Date.now() + Math.random().toString(36).slice(2, 7);
}

export function jurosCompostos(
  valor: number,
  taxa: number,
  periodicidade: 'mensal' | 'diario',
  dataInicio: string,
  dataVencimento: string
): { valorFuturo: number; dias: number; periodos: number } | null {
  if (!valor || valor <= 0 || !taxa || taxa <= 0 || !dataInicio || !dataVencimento) return null;
  const dias = diasEntre(dataInicio, dataVencimento);
  if (dias <= 0) return null;
  const i = taxa / 100;
  const periodos = periodicidade === 'diario' ? dias : dias / 30;
  const valorFuturo = valor * Math.pow(1 + i, periodos);
  return { valorFuturo, dias, periodos };
}
