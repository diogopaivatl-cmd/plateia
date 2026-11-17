-- Plateia: importação de planilhas (Sympla, Google Forms, CSV).
--
-- A tela de importação lê o arquivo no navegador, o usuário confirma o que cada
-- coluna significa, e as linhas chegam aqui em lotes já normalizados:
--
-- [{ "email": "ana@x.com", "nome": "Ana", "telefone": "...", "perfil": "lider",
--    "origem": "instagram", "presente": true, "consentimento": true,
--    "temas": ["Feedback", "CNV"], "respostas": { "Pergunta": "Resposta" } }]
--
-- SECURITY INVOKER: roda com as permissões de quem chama, então o RLS vale.
-- Pessoas já existentes não têm dados apagados: só campos vazios são completados.

-- Uma pessoa pode ter várias respostas, mas não deve ganhar a mesma tag duas vezes
-- em importações diferentes; pessoa_tags já tem PK (pessoa_id, tag_id).

create or replace function public.importar_lote(
  p_conta_id uuid,
  p_importacao_id uuid,
  p_projeto_id uuid,
  p_formulario_id uuid,
  p_linhas jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_total int;
  v_validas int;
  v_existentes int;
  v_novas int;
begin
  if not privado.is_membro(p_conta_id) then
    raise exception 'Sem acesso a esta conta';
  end if;

  if jsonb_typeof(p_linhas) <> 'array' or jsonb_array_length(p_linhas) > 2000 then
    raise exception 'Lote inválido (máximo de 2000 linhas)';
  end if;

  create temp table _linhas on commit drop as
  select distinct on (lower(trim(l.email)))
    lower(trim(l.email))                              as email,
    nullif(trim(l.nome), '')                          as nome,
    nullif(trim(l.telefone), '')                      as telefone,
    case when l.perfil in ('pessoal', 'lider', 'empresa')
         then l.perfil::perfil_pessoa
         else 'desconhecido'::perfil_pessoa end      as perfil,
    nullif(trim(l.origem), '')                        as origem,
    coalesce(l.presente, false)                       as presente,
    l.consentimento                                   as consentimento,
    coalesce(l.temas, '[]'::jsonb)                    as temas,
    coalesce(l.respostas, '{}'::jsonb)                as respostas
  from jsonb_to_recordset(p_linhas) as l(
    email text, nome text, telefone text, perfil text, origem text,
    presente boolean, consentimento boolean, temas jsonb, respostas jsonb
  )
  where l.email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  order by lower(trim(l.email));

  v_total := jsonb_array_length(p_linhas);
  select count(*) into v_validas from _linhas;

  select count(*) into v_existentes
  from pessoas p join _linhas l on l.email = p.email::text
  where p.conta_id = p_conta_id;
  v_novas := v_validas - v_existentes;

  -- Pessoas: cria as novas e completa campos vazios das existentes.
  insert into pessoas (conta_id, email, nome, telefone, perfil, origem)
  select p_conta_id, l.email, l.nome, l.telefone, l.perfil, l.origem from _linhas l
  on conflict (conta_id, email) do update set
    nome       = coalesce(pessoas.nome, excluded.nome),
    telefone   = coalesce(pessoas.telefone, excluded.telefone),
    perfil     = case when pessoas.perfil = 'desconhecido' then excluded.perfil else pessoas.perfil end,
    origem     = coalesce(pessoas.origem, excluded.origem),
    updated_at = now();

  create temp table _ids on commit drop as
  select p.id as pessoa_id, l.* from _linhas l
  join pessoas p on p.conta_id = p_conta_id and p.email::text = l.email;

  -- Participação no projeto (presença nunca é rebaixada).
  if p_projeto_id is not null then
    insert into participacoes (conta_id, pessoa_id, projeto_id, status, canal)
    select p_conta_id, i.pessoa_id, p_projeto_id,
           case when i.presente then 'presente'::status_participacao else 'inscrito'::status_participacao end,
           'importacao'
    from _ids i
    on conflict (pessoa_id, projeto_id) do update set
      status = case when excluded.status = 'presente' then 'presente'::status_participacao
                    else participacoes.status end;
  end if;

  -- Respostas do formulário.
  if p_formulario_id is not null then
    insert into respostas (conta_id, formulario_id, pessoa_id, conteudo)
    select p_conta_id, p_formulario_id, i.pessoa_id, i.respostas
    from _ids i where i.respostas <> '{}'::jsonb;
  end if;

  -- Temas de interesse.
  insert into tags (conta_id, nome)
  select distinct p_conta_id, trim(t.tema)
  from _ids i, jsonb_array_elements_text(i.temas) as t(tema)
  where trim(t.tema) <> ''
  on conflict (conta_id, nome) do nothing;

  insert into pessoa_tags (conta_id, pessoa_id, tag_id, origem)
  select distinct p_conta_id, i.pessoa_id, tg.id, 'importacao'
  from _ids i, jsonb_array_elements_text(i.temas) as t(tema)
  join tags tg on tg.conta_id = p_conta_id and tg.nome = trim(t.tema)
  on conflict (pessoa_id, tag_id) do nothing;

  -- Consentimento: só quando a planilha traz um aceite explícito.
  insert into consentimentos (conta_id, pessoa_id, tipo, concedido, origem)
  select p_conta_id, i.pessoa_id, 'newsletter', i.consentimento, 'importacao'
  from _ids i where i.consentimento is not null;

  -- Totais da importação.
  if p_importacao_id is not null then
    update importacoes set
      linhas_total        = coalesce(linhas_total, 0) + v_total,
      pessoas_novas       = coalesce(pessoas_novas, 0) + v_novas,
      pessoas_atualizadas = coalesce(pessoas_atualizadas, 0) + v_existentes
    where id = p_importacao_id and conta_id = p_conta_id;
  end if;

  return jsonb_build_object(
    'linhas', v_total,
    'validas', v_validas,
    'novas', v_novas,
    'existentes', v_existentes,
    'ignoradas', v_total - v_validas
  );
end;
$$;

revoke execute on function public.importar_lote(uuid, uuid, uuid, uuid, jsonb) from public, anon;
grant execute on function public.importar_lote(uuid, uuid, uuid, uuid, jsonb) to authenticated;

-- Consulta usada na prévia: quantos e-mails do arquivo já estão na base.
create or replace function public.contar_existentes(p_conta_id uuid, p_emails text[])
returns int
language sql
stable
security invoker
set search_path = public
as $$
  select count(*)::int from pessoas
  where conta_id = p_conta_id and email::text = any (
    select lower(trim(e)) from unnest(p_emails) as e
  );
$$;

revoke execute on function public.contar_existentes(uuid, text[]) from public, anon;
grant execute on function public.contar_existentes(uuid, text[]) to authenticated;
