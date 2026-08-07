-- ============================================================
-- MeuGasto — Atualização: editar cliente + chave teste com expiração (24h)
-- Rode este script inteiro no SQL Editor do Supabase (uma vez só).
-- Ele é seguro de rodar mesmo se você já tiver as funções antigas:
-- todas usam "create or replace" / "add column if not exists".
-- ============================================================

-- 1) Nova coluna: data/hora em que o código expira (null = sem validade)
alter table public.licencas
  add column if not exists expira_em timestamptz;

-- 2) Nova coluna: marca quem é código "master" (dono/admin), caso ainda não exista
alter table public.licencas
  add column if not exists is_master boolean not null default false;

-- ============================================================
-- 3) validar_licenca — agora também bloqueia códigos expirados
-- ============================================================
create or replace function public.validar_licenca(p_codigo text, p_dispositivo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ativo boolean;
  v_dispositivo text;
  v_expira_em timestamptz;
begin
  select ativo, dispositivo_id, expira_em into v_ativo, v_dispositivo, v_expira_em
  from public.licencas
  where codigo = p_codigo;

  if not found then
    return false; -- código não existe
  end if;

  if v_ativo = false then
    return false; -- código desativado
  end if;

  if v_expira_em is not null and v_expira_em < now() then
    return false; -- código expirado
  end if;

  if v_dispositivo is not null and v_dispositivo <> p_dispositivo then
    return false; -- já ativado em outro aparelho
  end if;

  if v_dispositivo is null then
    update public.licencas
      set dispositivo_id = p_dispositivo, ativado_em = now()
      where codigo = p_codigo;
  end if;

  return true;
end;
$$;

grant execute on function public.validar_licenca(text, text) to anon;

-- ============================================================
-- 4) checar_master — diz se um código é master (mostra a aba "Códigos" no app)
-- ============================================================
create or replace function public.checar_master(p_codigo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_master boolean;
  v_ativo boolean;
begin
  select is_master, ativo into v_master, v_ativo
  from public.licencas
  where codigo = p_codigo;

  if not found then
    return false;
  end if;

  return coalesce(v_master, false) and coalesce(v_ativo, false);
end;
$$;

grant execute on function public.checar_master(text) to anon;

-- ============================================================
-- 5) Função auxiliar interna: garante que quem chama é master ativo
-- ============================================================
create or replace function public._exige_master(p_master text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  select coalesce(is_master, false) and coalesce(ativo, false) into v_ok
  from public.licencas
  where codigo = p_master;

  if v_ok is not true then
    raise exception 'Acesso negado: código master inválido';
  end if;
end;
$$;

-- ============================================================
-- 6) admin_criar_codigo — agora aceita p_expira_em (opcional)
-- ============================================================
create or replace function public.admin_criar_codigo(
  p_master text,
  p_codigo text,
  p_cliente_nome text,
  p_observacao text default null,
  p_expira_em timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._exige_master(p_master);

  insert into public.licencas (codigo, cliente_nome, observacao, expira_em)
  values (p_codigo, p_cliente_nome, p_observacao, p_expira_em);
end;
$$;

grant execute on function public.admin_criar_codigo(text, text, text, text, timestamptz) to anon;

-- ============================================================
-- 7) admin_editar_codigo — NOVO: edita nome, código, observação e expiração
-- ============================================================
create or replace function public.admin_editar_codigo(
  p_master text,
  p_codigo_atual text,
  p_novo_codigo text,
  p_cliente_nome text,
  p_observacao text default null,
  p_expira_em timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._exige_master(p_master);

  if not exists (select 1 from public.licencas where codigo = p_codigo_atual) then
    raise exception 'Código não encontrado';
  end if;

  if p_novo_codigo <> p_codigo_atual
     and exists (select 1 from public.licencas where codigo = p_novo_codigo) then
    raise exception 'Já existe um cliente com esse código';
  end if;

  update public.licencas
  set codigo = p_novo_codigo,
      cliente_nome = p_cliente_nome,
      observacao = p_observacao,
      expira_em = p_expira_em
  where codigo = p_codigo_atual;
end;
$$;

grant execute on function public.admin_editar_codigo(text, text, text, text, text, timestamptz) to anon;

-- ============================================================
-- 8) admin_listar_codigos — agora também devolve expira_em
-- ============================================================
create or replace function public.admin_listar_codigos(p_master text)
returns table (
  codigo text,
  cliente_nome text,
  observacao text,
  ativo boolean,
  dispositivo_id text,
  ativado_em timestamptz,
  criado_em timestamptz,
  expira_em timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._exige_master(p_master);

  return query
    select l.codigo, l.cliente_nome, l.observacao, l.ativo, l.dispositivo_id,
           l.ativado_em, l.criado_em, l.expira_em
    from public.licencas l
    order by l.criado_em desc;
end;
$$;

grant execute on function public.admin_listar_codigos(text) to anon;

-- ============================================================
-- 9) admin_definir_status — ativar/revogar
-- ============================================================
create or replace function public.admin_definir_status(p_master text, p_codigo text, p_ativo boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._exige_master(p_master);

  update public.licencas set ativo = p_ativo where codigo = p_codigo;
end;
$$;

grant execute on function public.admin_definir_status(text, text, boolean) to anon;

-- ============================================================
-- 10) admin_resetar_dispositivo — libera o código pra ativar em outro aparelho
-- ============================================================
create or replace function public.admin_resetar_dispositivo(p_master text, p_codigo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._exige_master(p_master);

  update public.licencas
  set dispositivo_id = null, ativado_em = null
  where codigo = p_codigo;
end;
$$;

grant execute on function public.admin_resetar_dispositivo(text, text) to anon;

-- ============================================================
-- COMO TORNAR UM CÓDIGO SEU "MASTER" (só precisa fazer isso 1 vez,
-- com o código que você mesmo vai usar para logar como admin no app):
-- ============================================================
-- update public.licencas set is_master = true where codigo = 'SEU-CODIGO-MASTER';
--
-- Se esse código ainda não existir, crie ele primeiro:
-- insert into public.licencas (codigo, cliente_nome, is_master) values ('SEU-CODIGO-MASTER', 'Admin', true);
