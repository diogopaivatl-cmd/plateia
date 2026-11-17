# Plateia: estado atual e próximos passos

Atualizado em 17/11/2026. Leia junto com o `CLAUDE.md`, que tem as regras e as decisões técnicas.

## Onde estamos

| Etapa do MVP | Situação |
| --- | --- |
| 1. Fundação (login, contas, app no ar) | Pronta e testada em produção |
| Marca do cliente (logo, cores, remetente) | Pronta; falta subir os logos pela tela "Sua marca" |
| 2. Importar planilhas | Pronta no branch `etapa-2-importar`; falta testar logado em produção |
| 3. Unificar (ficha completa da pessoa) | Próxima etapa de código |
| 4. Formulário próprio | A fazer |
| 5. Comunicar (newsletter) | A fazer; depende do domínio e do Resend |
| 6. Assistente de IA | A fazer |

## Infraestrutura

| Item | Valor |
| --- | --- |
| App em produção | https://plateia.diogo-paiva-tl.workers.dev |
| Hospedagem | Cloudflare Workers (worker `plateia`), publicação automática a cada push no `main` (Workers Builds) |
| Build na Cloudflare | Build: `npx opennextjs-cloudflare build` · Deploy: `npx wrangler deploy` |
| Supabase | projeto `plateia`, ref `iigvtcqtmmgcbahheqdv`, região `sa-east-1`, organização "TTL" (plano Pro) |
| Migrações aplicadas | `0001` a `0007` |
| Conta da Cloudflare | `e34a6611ec49591ddd7d881d23761ae3` |
| Domínio da cliente piloto | `pplena.com.br` (zona `d03d7549d50ed66fe883cb6857f95642`, plano Free) |
| Servidores DNS a usar no registro.br | `robin.ns.cloudflare.com` e `wesley.ns.cloudflare.com` |

## Dados atuais

- Conta "Presença Plena" (`7f063eb7-4ca1-480c-b002-d414498426a3`) já existe, com cores e remetente configurados ("Fernanda Paim | Presença Plena", `contato@pplena.com.br`).
- Hoje o **Diogo é o dono** dessa conta, porque ele a criou no teste. A Fernanda ainda não tem usuário.
- A base de pessoas está vazia.

## Pendências manuais (Diogo ou Fernanda)

1. **Juntar o PR da etapa 2** e testar a importação logado em produção, com as planilhas de `public/exemplos/`.
2. **Subir os logos** em "Sua marca": `presenca-plena-logo.svg` (fundo claro) e `presenca-plena-logo-creme.svg` (fundo escuro).
3. **Criar o usuário da Fernanda** no Supabase (Authentication → Users → Add user, com Auto Confirm). O e-mail dela está com o Diogo; não deve ficar no repositório.
4. **Fernanda troca os servidores DNS** no registro.br para os da Cloudflare (tabela acima). Atenção ao DNSSEC: se houver registro ativo, removê-lo antes.
5. **Pedir à Fernanda as exportações reais** (participantes do Sympla e respostas do Google Forms) para afinar o reconhecimento de colunas.

## Próximas tarefas para o Claude Code

Sempre apresentar o plano e esperar aprovação antes de escrever código.

### A. Passar a conta para a Fernanda (quando o usuário dela existir)
- Inserir a Fernanda em `membros` como `dono` da conta Presença Plena.
- Passar o Diogo para `editor`, para ele continuar dando suporte.
- Atenção: `criar_conta` bloqueia quem já é dono de alguma conta. Depois da troca, o Diogo volta a poder criar uma conta de teste.

### B. Domínio, e-mail e login com a marca (quando `pplena.com.br` estiver ativo na Cloudflare)
1. Confirmar pela API da Cloudflare que a zona saiu de "pending" para "active".
2. Adicionar `app.pplena.com.br` como domínio personalizado do worker `plateia`.
3. Incluir `https://app.pplena.com.br/**` nas Redirect URLs do Supabase. Isso é feito no painel do Supabase; não há ferramenta para isso.
4. **Email Routing**: encaminhar `contato@pplena.com.br` para o Gmail da Fernanda. Ela precisa confirmar o e-mail de verificação.
5. **Resend**: criar o domínio de envio, de preferência o subdomínio `news.pplena.com.br`, e publicar os registros SPF, DKIM e DMARC na zona da Cloudflare.
6. Configurar o **SMTP do Supabase Auth** com o Resend. Isso acaba com o limite de poucos e-mails de login por hora.
7. Tela de login com a marca do cliente: identificar a conta pelo domínio acessado. Isso pede uma coluna nova, `contas.dominio`, em migração nova.

### C. Etapa 3: ficha completa da pessoa
- `/painel/pessoas/[id]`: dados, perfil, temas, todas as participações (projeto, tipo, data, presença), respostas de formulários e histórico de consentimento.
- Edição dos dados básicos e das etiquetas de tema.
- Lista de projetos (`/painel/projetos`), com contagem de inscritos e presentes.
- Classificar temas em trilhas (Eu, Relações, Equipes), usando a coluna `tags.trilha`, que já existe.

## Como testar a importação

1. Entrar no app, abrir **Importar**, criar um projeto novo e enviar `sympla-participantes.csv`.
2. O resultado esperado é **52 pessoas novas**, com 1 linha sem e-mail e 1 repetida ficando de fora, e 36 presentes.
3. Importar `google-forms-temas.csv` sem projeto. O resultado esperado é **12 novas e 18 já na base**, com temas, perfis e aceites de newsletter.
4. Em **Pessoas**, conferir as fichas, os temas e a contagem de projetos.
