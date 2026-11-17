-- Plateia: armazenamento dos logos de cada cliente.
--
-- Formato de contas.marca (jsonb), usado pela interface:
-- {
--   "logo_url":        "https://.../marcas/<conta_id>/logo.svg",   -- para fundo claro
--   "logo_escuro_url": "https://.../marcas/<conta_id>/logo-creme.svg", -- para fundo escuro
--   "cores": {
--     "primaria":   "#0074E5",  -- botões e links
--     "secundaria": "#562F82",  -- títulos e áreas escuras
--     "destaque":   "#FF7350",
--     "apoio":      "#F7C64F",
--     "fundo":      "#FFF7EE"
--   },
--   "remetente": { "nome": "Fernanda Paim | Presença Plena", "email": "contato@pplena.com.br" }
-- }

-- Bucket público: logos são feitos para serem vistos (app, e-mails, formulários).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marcas', 'marcas', true, 1048576,
  array['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- Cada conta só altera a própria pasta: marcas/<conta_id>/...
create policy marcas_inserir_propria_conta on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'marcas'
    and privado.is_membro(((storage.foldername(name))[1])::uuid)
  );

create policy marcas_atualizar_propria_conta on storage.objects
  for update to authenticated
  using (
    bucket_id = 'marcas'
    and privado.is_membro(((storage.foldername(name))[1])::uuid)
  );

create policy marcas_apagar_propria_conta on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'marcas'
    and privado.is_membro(((storage.foldername(name))[1])::uuid)
  );
