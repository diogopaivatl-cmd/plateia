# Plateia: estado atual e próximos passos

Atualizado em 17/11/2026. Leia junto com o `CLAUDE.md`, que tem as regras e as decisões técnicas.

## Onde estamos

| Etapa do MVP | Situação |
| --- | --- |
| 1. Fundação (login, contas, app no ar) | Pronta e testada em produção |
| Marca do cliente (logo, cores, remetente) | Pronta; falta subir os logos pela tela "Sua marca" |
| 2. Importar planilhas | Pronta e publicada; falta testar logado em produção |
| Painel "Sua plateia" (tela inicial) | **Próxima tarefa, já aprovada** (ver item 0 abaixo) |
| 3. Unificar (ficha completa da pessoa) | Depois do painel |
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

1. **Testar a importação** logado em produção, com as planilhas de `public/exemplos/`. Quem importa é o Diogo; a Fernanda só explora o painel.
2. **Subir os logos** em "Sua marca": `presenca-plena-logo.svg` (fundo claro) e `presenca-plena-logo-creme.svg` (fundo escuro).
3. **Criar o usuário da Fernanda** no Supabase (Authentication → Users → Add user, com Auto Confirm). O e-mail dela está com o Diogo; não deve ficar no repositório.
4. **Servidores DNS:** a Fernanda informou que trocou em 17/11, mas às 19h20 a zona ainda estava "pending" na Cloudflare, e o DNS público ainda mostrava `a.auto.dns.br`. Se continuar assim, pedir print da tela do registro.br. Atenção ao DNSSEC.
5. **Pedir à Fernanda as exportações reais** (participantes do Sympla e respostas do Google Forms) para afinar o reconhecimento de colunas.

## Próximas tarefas para o Claude Code

Sempre apresentar o plano e esperar aprovação antes de escrever código.

### 0. Painel "Sua plateia": a tela inicial que encanta (aprovado pelo Diogo em 17/11)

Objetivo: quando a Fernanda entrar, ela precisa **ver o potencial do negócio dela** nos próprios dados, não uma lista de contadores. Quem importa as planilhas é o Diogo; a Fernanda explora. Substitui o conteúdo atual de `/painel` (contadores + "Em construção").

1. **Abertura:** o componente `Plateia` com a base inteira, colorida por perfil (pessoal, líder, empresa, sem perfil), com uma frase-resumo do tipo "Sua plateia tem 64 pessoas em 3 projetos".
2. **Temas mais pedidos:** ranking (top 8), agrupado nas trilhas Eu, Relações e Equipes. Os 10 temas atuais do formulário dela se dividem assim:
    - **Eu:** inteligência emocional e autorregulação; presença e linguagem corporal; oratória e posicionamento; reputação profissional.
    - **Relações:** CNV; escuta ativa e comunicação empática; feedback; gestão de conflitos.
    - **Equipes:** segurança psicológica; colaboração e relações de confiança.

    Gravar a trilha em `tags.trilha`, com uma tela simples para corrigir. Responde com dados à dúvida dela sobre onde focar: pessoa física ou empresas.
3. **Quem volta:** pessoas em 2 ou mais projetos, as candidatas naturais à mentoria.
4. **Projetos:** cada evento com inscritos, presentes e taxa de presença.
5. **Pronto para a newsletter:** quantas pessoas têm aceite ativo.
6. **Prévia da assistente:** 2 ou 3 observações calculadas por regras sobre os dados reais (ainda sem IA), por exemplo "Feedback é o tema mais pedido entre líderes". Nada inventado: só o que os números mostram.

Implementação sugerida: uma função SQL `painel_resumo(p_conta_id)` (SECURITY INVOKER) que devolve tudo em um JSON, para a página fazer uma única consulta. Seguir a marca do cliente (variáveis CSS) e o padrão visual das telas de importação. Revisar por print no desktop e no celular antes de abrir o PR.

**Dados para a demonstração:** o Diogo importa as duas planilhas de `public/exemplos/` na conta Presença Plena. A Fernanda deve ser avisada de que são dados de exemplo. Quando chegarem as exportações reais, apagar as pessoas `@example.com` (e o que estiver ligado a elas) e importar os dados de verdade.

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
