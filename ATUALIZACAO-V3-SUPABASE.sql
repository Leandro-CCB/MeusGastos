-- ============================================================
-- MeuGasto Pro — Atualização v3: sistema de cobrança in-app
-- Rode este script no SQL Editor do Supabase (uma vez só).
-- ============================================================

-- 1) Nova coluna: flag de cobrança pendente para o cliente
alter table public.licencas
  add column if not exists cobranca_pendente boolean not null default false;

-- 2) Nova coluna: mensagem personalizada de cobrança (opcional)
alter table public.licencas
  add column if not exists cobranca_msg text;

-- ============================================================
-- 3) admin_enviar_cobranca: master ativa a cobrança de um cliente
-- ============================================================
drop function if exists public.admin_enviar_cobranca(text, text, text);

create or replace function public.admin_enviar_cobranca(
  p_master text,
  p_codigo text,
  p_msg text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._exige_master(p_master);

  if not exists (select 1 from public.licencas where codigo = p_codigo) then
    raise exception 'Código não encontrado';
  end if;

  update public.licencas
  set cobranca_pendente = true,
      cobranca_msg = p_msg
  where codigo = p_codigo;
end;
$$;

grant execute on function public.admin_enviar_cobranca(text, text, text) to anon;

-- ============================================================
-- 4) admin_cancelar_cobranca: master cancela a cobrança de um cliente
-- ============================================================
drop function if exists public.admin_cancelar_cobranca(text, text);

create or replace function public.admin_cancelar_cobranca(
  p_master text,
  p_codigo text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._exige_master(p_master);

  update public.licencas
  set cobranca_pendente = false,
      cobranca_msg = null
  where codigo = p_codigo;
end;
$$;

grant execute on function public.admin_cancelar_cobranca(text, text) to anon;

-- ============================================================
-- 5) checar_cobranca: cliente verifica se tem cobrança pendente
--    Retorna objeto com {pendente, msg} — chamado anônimo pelo cliente
-- ============================================================
drop function if exists public.checar_cobranca(text);

create or replace function public.checar_cobranca(p_codigo text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pendente boolean;
  v_msg text;
begin
  select cobranca_pendente, cobranca_msg
  into v_pendente, v_msg
  from public.licencas
  where codigo = p_codigo;

  if not found then
    return json_build_object('pendente', false, 'msg', null);
  end if;

  return json_build_object(
    'pendente', coalesce(v_pendente, false),
    'msg', v_msg
  );
end;
$$;

grant execute on function public.checar_cobranca(text) to anon;

-- ============================================================
-- 6) admin_listar_codigos — atualizado para incluir cobranca_pendente
--    (precisa dropar e recriar pois muda o tipo de retorno)
-- ============================================================
drop function if exists public.admin_listar_codigos(text);

create or replace function public.admin_listar_codigos(p_master text)
returns table (
  codigo text,
  cliente_nome text,
  observacao text,
  ativo boolean,
  dispositivo_id text,
  ativado_em timestamptz,
  criado_em timestamptz,
  expira_em timestamptz,
  cobranca_pendente boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._exige_master(p_master);

  return query
    select l.codigo, l.cliente_nome, l.observacao, l.ativo, l.dispositivo_id,
           l.ativado_em, l.criado_em, l.expira_em, l.cobranca_pendente
    from public.licencas l
    order by l.criado_em desc;
end;
$$;

grant execute on function public.admin_listar_codigos(text) to anon;
