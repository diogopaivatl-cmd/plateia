-- Plateia: criação da conta do cliente no primeiro acesso.
-- Função privilegiada de propósito: cria a conta e já torna quem chamou "dono".
-- Só usuários logados podem chamar; cada usuário cria no máximo uma conta como dono.

create or replace function public.criar_conta(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_nome text := trim(p_nome);
  v_id uuid;
  v_slug text;
begin
  if v_user is null then
    raise exception 'Usuário não autenticado';
  end if;

  if v_nome is null or length(v_nome) < 2 or length(v_nome) > 120 then
    raise exception 'Nome da conta inválido';
  end if;

  if exists (select 1 from membros where user_id = v_user and papel = 'dono') then
    raise exception 'Este usuário já é dono de uma conta';
  end if;

  v_slug := trim(both '-' from lower(regexp_replace(v_nome, '[^a-zA-Z0-9]+', '-', 'g')))
            || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into contas (nome, slug) values (v_nome, v_slug) returning id into v_id;
  insert into membros (conta_id, user_id, papel) values (v_id, v_user, 'dono');

  return v_id;
end;
$$;

revoke execute on function public.criar_conta(text) from public, anon;
grant execute on function public.criar_conta(text) to authenticated;
