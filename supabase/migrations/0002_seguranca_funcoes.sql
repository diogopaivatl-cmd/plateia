-- Plateia: tira funções privilegiadas da API pública

-- 1. is_membro vai para um schema privado, fora da Data API.
--    As políticas continuam usando a função, mas ninguém a chama por /rpc.
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

alter function public.is_membro(uuid) set schema privado;
revoke execute on function privado.is_membro(uuid) from public, anon;
grant execute on function privado.is_membro(uuid) to authenticated;

-- 2. rls_auto_enable (gatilho criado pelo Supabase para ligar RLS sozinho)
--    roda como gatilho de evento; não precisa ser chamável pela API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
