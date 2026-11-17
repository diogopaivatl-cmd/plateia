-- Plateia: o dono da conta pode editar nome e marca da própria conta.

create or replace function privado.is_dono(p_conta_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from membros
    where conta_id = p_conta_id and user_id = auth.uid() and papel = 'dono'
  );
$$;

revoke execute on function privado.is_dono(uuid) from public, anon;
grant execute on function privado.is_dono(uuid) to authenticated;

create policy contas_dono_edita on contas
  for update to authenticated
  using (privado.is_dono(id))
  with check (privado.is_dono(id));

-- O slug identifica a conta e não deve mudar pela interface.
revoke update on contas from authenticated;
grant update (nome, marca) on contas to authenticated;
