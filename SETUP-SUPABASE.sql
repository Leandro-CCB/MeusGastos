-- ============================================================
-- MeuGasto — Controle de licenças (rodar no SQL Editor do Supabase)
-- ============================================================

-- 1) Tabela de licenças
create table if not exists public.licencas (
  id bigserial primary key,
  codigo text unique not null,
  ativo boolean not null default true,
  dispositivo_id text,
  ativado_em timestamptz,
  criado_em timestamptz not null default now(),
  observacao text
);

-- 2) Segurança: habilita RLS e NÃO cria nenhuma policy pra tabela.
--    Isso significa que ninguém consegue ler/listar a tabela direto pela API
--    (nem com a chave anon). O único jeito de "consultar" é pela função abaixo.
alter table public.licencas enable row level security;

-- 3) Função que valida e ativa o código, sem expor a tabela inteira
create or replace function public.validar_licenca(p_codigo text, p_dispositivo text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ativo boolean;
  v_dispositivo text;
begin
  select ativo, dispositivo_id into v_ativo, v_dispositivo
  from public.licencas
  where codigo = p_codigo;

  if not found then
    return false; -- código não existe
  end if;

  if v_ativo = false then
    return false; -- código desativado por você
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

-- 4) Permite que a chave anon (usada pelo app) execute a função
grant execute on function public.validar_licenca(text, text) to anon;

-- ============================================================
-- COMO CRIAR UM NOVO CÓDIGO PARA VENDER:
-- ============================================================
insert into public.licencas (codigo) values ('SEU-CODIGO-AQUI');

-- Exemplo prático:
-- insert into public.licencas (codigo) values ('JOAO-2026-XK92');


-- ============================================================
-- COMO "RESETAR" UM CÓDIGO (cliente trocou de aparelho, etc.)
-- ============================================================
-- Isso libera o código para ser ativado de novo em um novo aparelho:
update public.licencas
set dispositivo_id = null, ativado_em = null
where codigo = 'JOAO-2026-XK92';


-- ============================================================
-- COMO DESATIVAR UM CÓDIGO (ex: cliente pediu reembolso, ou suspeita de fraude)
-- ============================================================
update public.licencas
set ativo = false
where codigo = 'JOAO-2026-XK92';

-- Para reativar depois, é só voltar ativo = true.


-- ============================================================
-- COMO VER TODOS OS CÓDIGOS E STATUS (rode isso e olhe o resultado)
-- ============================================================
select codigo, ativo, dispositivo_id, ativado_em, criado_em, observacao
from public.licencas
order by criado_em desc;
