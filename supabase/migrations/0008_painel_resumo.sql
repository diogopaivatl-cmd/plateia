-- Plateia: painel "Sua plateia" (tela inicial).
--
-- painel_resumo devolve tudo em um JSON, para a página fazer uma única consulta.
-- SECURITY INVOKER: roda com as permissões de quem chama, então o RLS vale.

create or replace function public.painel_resumo(p_conta_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_resultado jsonb;
begin
  if not privado.is_membro(p_conta_id) then
    raise exception 'Sem acesso a esta conta';
  end if;

  with
  perfis as (
    select perfil::text as perfil, count(*) as n
    from pessoas where conta_id = p_conta_id group by perfil
  ),
  proj as (
    select pr.id, pr.nome, pr.tipo::text as tipo, pr.data,
      count(pa.id) filter (where pa.status <> 'cancelado') as inscritos,
      count(pa.id) filter (where pa.status = 'presente') as presentes
    from projetos pr
    left join participacoes pa on pa.projeto_id = pr.id and pa.conta_id = p_conta_id
    where pr.conta_id = p_conta_id
    group by pr.id
  ),
  temas as (
    select tg.nome, tg.trilha::text as trilha, count(pt.pessoa_id) as pessoas
    from tags tg
    join pessoa_tags pt on pt.tag_id = tg.id and pt.conta_id = p_conta_id
    where tg.conta_id = p_conta_id
    group by tg.id
  ),
  temas_perfil as (
    select tg.nome as tema, p.perfil::text as perfil, count(*) as pessoas
    from pessoa_tags pt
    join tags tg on tg.id = pt.tag_id
    join pessoas p on p.id = pt.pessoa_id
    where pt.conta_id = p_conta_id and p.perfil <> 'desconhecido'
    group by tg.nome, p.perfil
  ),
  volta as (
    select p.id, p.nome, count(*) as projetos
    from participacoes pa
    join pessoas p on p.id = pa.pessoa_id
    where pa.conta_id = p_conta_id and pa.status <> 'cancelado'
    group by p.id
    having count(*) >= 2
  ),
  aceite as (
    select count(*) as n from (
      select distinct on (pessoa_id) concedido
      from consentimentos
      where conta_id = p_conta_id and tipo = 'newsletter'
      order by pessoa_id, created_at desc
    ) c where c.concedido
  )
  select jsonb_build_object(
    'pessoas', (select count(*) from pessoas where conta_id = p_conta_id),
    'perfis', coalesce((select jsonb_object_agg(perfil, n) from perfis), '{}'::jsonb),
    'projetos', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.data desc nulls last, x.nome)
      from (select * from proj) x), '[]'::jsonb),
    'temas', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.pessoas desc, x.nome)
      from (select * from temas) x), '[]'::jsonb),
    'temas_por_perfil', coalesce((select jsonb_agg(to_jsonb(x)) from temas_perfil x), '[]'::jsonb),
    'volta_total', (select count(*) from volta),
    'volta', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (select * from volta order by projetos desc, nome limit 6) x), '[]'::jsonb),
    'aceite_newsletter', (select n from aceite)
  ) into v_resultado;

  return v_resultado;
end;
$$;

revoke execute on function public.painel_resumo(uuid) from public, anon;
grant execute on function public.painel_resumo(uuid) to authenticated;

-- Trilhas dos temas atuais do formulário da Presença Plena. Só mexe em temas
-- que ainda estão como "outra", então nunca desfaz uma correção manual.
update public.tags set trilha = case
  when nome ~* 'intelig.ncia emocional|autorregula|presen.a e linguagem|orat.ria|posicionamento|reputa' then 'eu'::trilha_tema
  when nome ~* '(^|[^a-z])cnv([^a-z]|$)|comunica..o n.o violenta|escuta ativa|empatic|feedback|conflito' then 'relacoes'::trilha_tema
  when nome ~* 'seguran.a psicol|colabora|confian.a' then 'equipes'::trilha_tema
  else trilha end
where trilha = 'outra';
