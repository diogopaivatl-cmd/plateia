# Plateia

Base de relacionamento com IA para educadores, mentores e palestrantes.

Regras do projeto, escopo do MVP e decisões técnicas: veja `CLAUDE.md`.

## Rodar localmente

```bash
npm install
npm run dev
```

## Banco

Supabase, projeto `plateia` (`sa-east-1`). As migrações em `supabase/migrations/` já estão aplicadas.

## Publicar na Cloudflare

Opção recomendada: **Workers Builds** (publica sozinho a cada push).

1. No painel da Cloudflare: Workers & Pages → Create → Import a repository → `plateia`.
2. Build command: `npx opennextjs-cloudflare build`
3. Deploy command: `npx opennextjs-cloudflare deploy`
4. O nome do worker deve ser `plateia` (igual ao `wrangler.jsonc`).

Depois de publicar, cadastre o endereço do app no Supabase (Authentication → URL Configuration):

- Site URL: o endereço `*.workers.dev` (ou o domínio próprio)
- Redirect URLs: `https://SEU-ENDERECO/auth/confirmar` e `http://localhost:3000/auth/confirmar`
