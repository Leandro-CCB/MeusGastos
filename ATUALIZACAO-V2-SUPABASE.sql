-- ============================================================
-- MeuGasto Pro — Atualização v2: excluir cliente
-- Rode este script no SQL Editor do Supabase (uma vez só).
-- ============================================================

-- Função para excluir um código de licença (somente master pode chamar)
drop function if exists public.admin_deletar_codigo(text, text);

create or replace function public.admin_deletar_codigo(
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

  if not exists (select 1 from public.licencas where codigo = p_codigo) then
    raise exception 'Código não encontrado';
  end if;

  -- Não permite excluir o próprio código master
  if p_codigo = p_master then
    raise exception 'Você não pode excluir o seu próprio código master';
  end if;

  delete from public.licencas where codigo = p_codigo;
end;
$$;

grant execute on function public.admin_deletar_codigo(text, text) to anon;
