'use client';

// =====================
// Sistema de licenças — 100% compatível com o MeuGasto original
// Usa as MESMAS chaves de localStorage e o MESMO device ID do app antigo,
// então clientes que já ativaram não precisam ativar de novo.
// =====================

const SB_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  'https://zdyjqsserfxtzxeawcgq.supabase.co';
const SB_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkeWpxc3NlcmZ4dHp4ZWF3Y2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjkzOTQsImV4cCI6MjA5OTIwNTM5NH0.VszcNX0v1I2W1iSiDVgCgikH0GfduvjE432KwrKdjEA';

// Chaves idênticas às do app original (v1) — transição transparente
export const LICENCA_KEYS = {
  deviceId: 'meugasto_device_id',
  ok: 'meugasto_licenca_ok',
  codigo: 'meugasto_licenca_codigo',
  isMaster: 'meugasto_is_master',
} as const;

export interface CodigoLicenca {
  codigo: string;
  cliente_nome: string | null;
  observacao: string | null;
  ativo: boolean;
  dispositivo_id: string | null;
  ativado_em: string | null;
  criado_em: string;
  expira_em: string | null;
  cobranca_pendente: boolean;
}

export interface CobrancaStatus {
  pendente: boolean;
  msg: string | null;
}

/** Lê (ou cria) o ID do aparelho — mesmo formato do app original. */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(LICENCA_KEYS.deviceId);
    if (!id) {
      id = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 12);
      localStorage.setItem(LICENCA_KEYS.deviceId, id);
    }
    return id;
  } catch {
    return 'dev-desconhecido';
  }
}

/** A licença já foi ativada neste aparelho? */
export function licencaJaAtiva(): boolean {
  try {
    return localStorage.getItem(LICENCA_KEYS.ok) === 'true';
  } catch {
    return false;
  }
}

export function getCodigoSalvo(): string {
  try {
    return localStorage.getItem(LICENCA_KEYS.codigo) ?? '';
  } catch {
    return '';
  }
}

export function getIsMasterSalvo(): boolean {
  try {
    return localStorage.getItem(LICENCA_KEYS.isMaster) === 'true';
  } catch {
    return false;
  }
}

async function rpc<T>(nome: string, params: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/rpc/${nome}`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const erro =
      data && typeof data === 'object' && ('message' in data || 'hint' in data)
        ? String((data as { message?: string; hint?: string }).message ??
            (data as { hint?: string }).hint)
        : `Erro ${res.status}`;
    throw new Error(erro);
  }
  return data as T;
}

/** Valida e ativa o código no Supabase (RPC validar_licenca). */
export function validarLicenca(codigo: string): Promise<boolean> {
  return rpc<boolean>('validar_licenca', {
    p_codigo: codigo,
    p_dispositivo: getDeviceId(),
  });
}

/** O código é master (admin)? (RPC checar_master) */
export function checarMaster(codigo: string): Promise<boolean> {
  return rpc<boolean>('checar_master', { p_codigo: codigo });
}

// ===================== ADMIN (código master) =====================

export function adminListarCodigos(masterCodigo: string): Promise<CodigoLicenca[]> {
  return rpc<CodigoLicenca[]>('admin_listar_codigos', { p_master: masterCodigo });
}

export function adminCriarCodigo(params: {
  masterCodigo: string;
  codigo: string;
  nome: string;
  observacao?: string | null;
  expiraEm?: string | null;
}): Promise<null> {
  return rpc<null>('admin_criar_codigo', {
    p_master: params.masterCodigo,
    p_codigo: params.codigo,
    p_cliente_nome: params.nome,
    p_observacao: params.observacao ?? null,
    p_expira_em: params.expiraEm ?? null,
  });
}

export function adminEditarCodigo(params: {
  masterCodigo: string;
  codigoAtual: string;
  novoCodigo: string;
  nome: string;
  observacao?: string | null;
  expiraEm?: string | null;
}): Promise<null> {
  return rpc<null>('admin_editar_codigo', {
    p_master: params.masterCodigo,
    p_codigo_atual: params.codigoAtual,
    p_novo_codigo: params.novoCodigo,
    p_cliente_nome: params.nome,
    p_observacao: params.observacao ?? null,
    p_expira_em: params.expiraEm ?? null,
  });
}

export function adminDefinirStatus(
  masterCodigo: string,
  codigo: string,
  ativo: boolean
): Promise<null> {
  return rpc<null>('admin_definir_status', {
    p_master: masterCodigo,
    p_codigo: codigo,
    p_ativo: ativo,
  });
}

export function adminResetarDispositivo(
  masterCodigo: string,
  codigo: string
): Promise<null> {
  return rpc<null>('admin_resetar_dispositivo', {
    p_master: masterCodigo,
    p_codigo: codigo,
  });
}

export function adminDeletarCodigo(
  masterCodigo: string,
  codigo: string
): Promise<null> {
  return rpc<null>('admin_deletar_codigo', {
    p_master: masterCodigo,
    p_codigo: codigo,
  });
}

/** Envia cobrança in-app para um cliente (master apenas). */
export function adminEnviarCobranca(
  masterCodigo: string,
  codigo: string,
  msg?: string | null
): Promise<null> {
  return rpc<null>('admin_enviar_cobranca', {
    p_master: masterCodigo,
    p_codigo: codigo,
    p_msg: msg ?? null,
  });
}

/** Cancela cobrança in-app de um cliente (master apenas). */
export function adminCancelarCobranca(
  masterCodigo: string,
  codigo: string
): Promise<null> {
  return rpc<null>('admin_cancelar_cobranca', {
    p_master: masterCodigo,
    p_codigo: codigo,
  });
}

/** Cliente verifica se tem cobrança pendente — chamado silenciosamente ao abrir o app. */
export async function verificarCobrancaPendente(codigo: string): Promise<CobrancaStatus> {
  try {
    const result = await rpc<CobrancaStatus>('checar_cobranca', { p_codigo: codigo });
    return result ?? { pendente: false, msg: null };
  } catch {
    return { pendente: false, msg: null };
  }
}

/** Gera um código automático a partir do nome: NOME-SLUG-XXXX */
export function gerarCodigo(nome: string): string {
  const slug = (nome || 'cliente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 14) || 'CLIENTE';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${slug}-${rand}`;
}

/** Gera uma chave de teste com validade de 24h. */
export function gerarChaveTeste(nome: string): {
  codigo: string;
  expiraEm: string;
} {
  const slug = (nome || 'TESTE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 10) || 'TESTE';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    codigo: `TESTE-${slug}-${rand}`,
    expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/** Status derivado de um código (para exibição). */
export function statusCodigo(c: CodigoLicenca): {
  texto: 'Ativo' | 'Revogado' | 'Expirado';
  expirado: boolean;
} {
  if (!c.ativo) return { texto: 'Revogado', expirado: false };
  if (c.expira_em && new Date(c.expira_em).getTime() < Date.now()) {
    return { texto: 'Expirado', expirado: true };
  }
  return { texto: 'Ativo', expirado: false };
}
