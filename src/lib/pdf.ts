'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useMGStore, getLancamentosDoMes, getReceitasDoMes } from './store';
import { getAllCats, getCatColor, INV_TIPOS } from './constants';
import { fmt, formatarDataBr, monthLabel } from './format';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function getAccentHex(): string {
  if (typeof window === 'undefined') return '#8b5cf6';
  const style = getComputedStyle(document.documentElement);
  const primary = style.getPropertyValue('--primary').trim();
  // converte oklch para aproximação via canvas
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return '#8b5cf6';
    ctx.fillStyle = primary;
    const computed = ctx.fillStyle;
    if (typeof computed === 'string' && computed.startsWith('#')) return computed;
  } catch {
    /* fallback */
  }
  return '#8b5cf6';
}

export function gerarRelatorioPDF(mes: string) {
  const s = useMGStore.getState();
  const lanMes = getLancamentosDoMes(s.lancamentos, mes);
  const recMes = getReceitasDoMes(s.receitas, mes);
  const customCats = s.config.customCats;
  const accent = getAccentHex();

  const total = lanMes.reduce((a, l) => a + l.valor, 0);
  const receitas = recMes.reduce((a, r) => a + r.valor, 0);
  const saldo = receitas - total;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const accentRgb = hexToRgb(accent);

  // ---------- Cabeçalho ----------
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, 0, W, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('MeuGasto Pro', 48, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Relatório mensal · ${monthLabel(mes)}`, 48, 64);

  doc.setFontSize(9);
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')} · dados locais do dispositivo`,
    48,
    80
  );

  // ---------- Resumo ----------
  doc.setTextColor(30, 30, 40);
  autoTable(doc, {
    startY: 115,
    head: [['Resumo do mês', 'Valor']],
    body: [
      ['Receitas', fmt(receitas)],
      ['Despesas', fmt(total)],
      ['Saldo', fmt(saldo)],
      ['Lançamentos', String(lanMes.length)],
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: accentRgb, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 48, right: 48 },
  });

  // ---------- Gastos por categoria ----------
  const porCat = new Map<string, number>();
  lanMes.forEach((l) => porCat.set(l.cat, (porCat.get(l.cat) || 0) + l.valor));
  const catRows = [...porCat.entries()]
    .map(([cat, v]) => ({
      cat,
      v,
      nome: getAllCats(customCats).find((c) => c.id === cat)?.nome || cat,
    }))
    .sort((a, b) => b.v - a.v)
    .map((c) => [c.nome, fmt(c.v), total > 0 ? `${((c.v / total) * 100).toFixed(1)}%` : '0%']);

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24,
    head: [['Gastos por categoria', 'Valor', '% do total']],
    body: catRows.length > 0 ? catRows : [['— nenhum lançamento —', '', '']],
    theme: 'grid',
    styles: { fontSize: 9.5, cellPadding: 5 },
    headStyles: { fillColor: accentRgb, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: 48, right: 48 },
  });

  // ---------- Cartões ----------
  if (s.cartoes.length > 0) {
    const cartaoRows = s.cartoes.map((c) => {
      const gasto = lanMes
        .filter((l) => l.isCartao && l.cartaoId === c.id)
        .reduce((a, l) => a + l.valor, 0);
      return [`${c.emoji} ${c.nome}`, fmt(gasto), c.limite ? fmt(c.limite) : '—', c.venc ? `dia ${c.venc}` : '—'];
    });
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24,
      head: [['Cartão', 'Gasto no mês', 'Limite', 'Vencimento']],
      body: cartaoRows,
      theme: 'grid',
      styles: { fontSize: 9.5, cellPadding: 5 },
      headStyles: { fillColor: accentRgb, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'center' } },
      margin: { left: 48, right: 48 },
    });
  }

  // ---------- Investimentos ----------
  if (s.investimentos.length > 0) {
    const invRows = s.investimentos.map((i) => [
      `${INV_TIPOS[i.tipo]?.emoji || '📦'} ${i.nome || INV_TIPOS[i.tipo]?.nome || i.tipo}`,
      fmt(i.valor),
      formatarDataBr(i.data),
      i.vencimento ? formatarDataBr(i.vencimento) : '—',
      i.valorEstimado ? fmt(i.valorEstimado) : '—',
    ]);
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24,
      head: [['Investimento', 'Aplicado', 'Aplicação', 'Vencimento', 'Estimado']],
      body: invRows,
      theme: 'grid',
      styles: { fontSize: 9.5, cellPadding: 5 },
      headStyles: { fillColor: accentRgb, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 4: { halign: 'right' } },
      margin: { left: 48, right: 48 },
    });
  }

  // ---------- Lançamentos (nova página) ----------
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 40);
  doc.text(`Lançamentos de ${monthLabel(mes)}`, 48, 52);

  const lanRows = [...lanMes]
    .sort((a, b) => (a.data > b.data ? 1 : -1))
    .map((l) => {
      const catNome = getAllCats(customCats).find((c) => c.id === l.cat)?.nome || l.cat;
      const parcela = l.parcelaTotal ? ` (${l.parcelaAtual}/${l.parcelaTotal})` : '';
      return [formatarDataBr(l.data), (l.desc || 'Sem descrição') + parcela, catNome, fmt(l.valor)];
    });

  autoTable(doc, {
    startY: 70,
    head: [['Data', 'Descrição', 'Categoria', 'Valor']],
    body: lanRows.length > 0 ? lanRows : [['—', 'nenhum lançamento', '—', '—']],
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 4.5 },
    headStyles: { fillColor: accentRgb, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 48, right: 48 },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 160);
      doc.text(
        'MeuGasto Pro · relatório gerado localmente',
        48,
        doc.internal.pageSize.getHeight() - 28
      );
    },
  });

  const nome = `relatorio-meugasto-${mes}.pdf`;
  doc.save(nome);
}
