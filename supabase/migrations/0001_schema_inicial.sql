-- Plateia: schema inicial (multi-cliente, RLS por conta)

create extension if not exists citext with schema extensions;

-- Tipos
create type papel_membro as enum ('dono', 'editor', 'leitor');
create type tipo_projeto as enum ('palestra', 'treinamento', 'workshop', 'vivencia', 'mentoria', 'aula', 'outro');
create type status_participacao as enum ('inscrito', 'presente', 'ausente', 'cancelado');
create type perfil_pessoa as enum ('pessoal', 'lider', 'empresa', 'desconhecido');
create type trilha_tema as enum ('eu', 'relacoes', 'equipes', 'outra');

-- Contas (cada cliente da Plateia)
create table contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  marca jsonb not null default '{}'::jsonb, -- logo, cores, nome do remetente
  created_at timestamptz not null default now()
);

create table membros (
  conta_id uuid not null references contas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel papel_membro not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (conta_id, user_id)
);

-- Função de acesso usada pelas políticas
create or replace function is_membro(p_conta_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from membros
    where conta_id = p_conta_id and user_id = auth.uid()
  );
$$;

-- Pessoas (ficha única)
create table pessoas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  nome text,
  email extensions.citext,
  telefone text,
  perfil perfil_pessoa not null default 'desconhecido',
  origem text, -- instagram, indicacao, empresa...
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conta_id, email)
);

-- Projetos (palestra, treinamento, mentoria...)
create table projetos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  nome text not null,
  tipo tipo_projeto not null default 'outro',
  data date,
  created_at timestamptz not null default now()
);

create table participacoes (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  projeto_id uuid not null references projetos(id) on delete cascade,
  status status_participacao not null default 'inscrito',
  canal text, -- sympla, formulario, manual...
  created_at timestamptz not null default now(),
  unique (pessoa_id, projeto_id)
);

-- Formulários e respostas
create table formularios (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  projeto_id uuid references projetos(id) on delete set null,
  titulo text not null,
  perguntas jsonb not null default '[]'::jsonb,
  publico boolean not null default false,
  created_at timestamptz not null default now()
);

create table respostas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  formulario_id uuid not null references formularios(id) on delete cascade,
  pessoa_id uuid references pessoas(id) on delete set null,
  conteudo jsonb not null,
  created_at timestamptz not null default now()
);

-- Temas de interesse
create table tags (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  nome text not null,
  trilha trilha_tema not null default 'outra',
  unique (conta_id, nome)
);

create table pessoa_tags (
  conta_id uuid not null references contas(id) on delete cascade,
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  origem text, -- formulario, importacao, manual
  created_at timestamptz not null default now(),
  primary key (pessoa_id, tag_id)
);

-- Consentimento (LGPD)
create table consentimentos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  tipo text not null default 'newsletter',
  concedido boolean not null,
  origem text not null, -- formulario, importacao, descadastro...
  created_at timestamptz not null default now()
);

-- Importações e envios
create table importacoes (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  fonte text not null, -- sympla, google_forms, csv
  arquivo text,
  linhas_total int,
  pessoas_novas int,
  pessoas_atualizadas int,
  created_at timestamptz not null default now()
);

create table envios (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  assunto text not null,
  corpo text,
  filtro jsonb not null default '{}'::jsonb,
  total_destinatarios int,
  enviado_em timestamptz,
  created_at timestamptz not null default now()
);

-- Índices
create index on pessoas (conta_id);
create index on projetos (conta_id);
create index on participacoes (conta_id, projeto_id);
create index on respostas (conta_id, formulario_id);
create index on consentimentos (conta_id, pessoa_id, created_at desc);

-- Permissões da Data API (o projeto NÃO expõe tabelas novas automaticamente).
-- Só usuários logados acessam; o RLS abaixo limita cada um à própria conta.
-- O papel anon não recebe nada: o formulário público grava via função no servidor.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function is_membro(uuid) to authenticated;
revoke execute on function is_membro(uuid) from anon, public;

-- RLS
alter table contas enable row level security;
alter table membros enable row level security;
alter table pessoas enable row level security;
alter table projetos enable row level security;
alter table participacoes enable row level security;
alter table formularios enable row level security;
alter table respostas enable row level security;
alter table tags enable row level security;
alter table pessoa_tags enable row level security;
alter table consentimentos enable row level security;
alter table importacoes enable row level security;
alter table envios enable row level security;

create policy contas_membro on contas
  for select using (is_membro(id));

create policy membros_proprios on membros
  for select using (user_id = auth.uid() or is_membro(conta_id));

do $$
declare t text;
begin
  foreach t in array array[
    'pessoas','projetos','participacoes','formularios','respostas',
    'tags','pessoa_tags','consentimentos','importacoes','envios'
  ] loop
    execute format(
      'create policy %I on %I for all using (is_membro(conta_id)) with check (is_membro(conta_id))',
      t || '_por_conta', t
    );
  end loop;
end $$;
