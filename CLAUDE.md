# Plateia

Base de relacionamento com IA para quem ensina: educadores, mentores, palestrantes e facilitadores independentes.
Cada pessoa que passou por um evento, curso ou mentoria vira uma ficha única, e uma assistente de IA ajuda o cliente a decidir o próximo passo.

Cliente piloto: Fernanda Paim / Presença Plena (série "Presença em Pauta"), que trabalha com comunicação.

## O problema que resolvemos

- Cada projeto (palestra, treinamento, workshop, vivência, mentoria) gera um formulário ou uma lista separada.
- Eventos no Sympla prendem os dados lá; pesquisas no Google Forms não identificam quem respondeu.
- O cliente perde horas juntando e tratando dados à mão, e não consegue mandar newsletter para a base.

## Escopo do MVP (nesta ordem)

1. **Fundação:** login, contas, app no ar.
2. **Importar:** upload de CSV/XLSX exportado do Sympla e do Google Forms, com mapeamento de colunas.
3. **Unificar:** uma ficha por pessoa, deduplicada por e-mail (depois telefone), com histórico de projetos, presença, respostas e temas.
4. **Formulário próprio:** substitui o Google Forms e grava direto na ficha (e-mail obrigatório, perfil, até 3 temas, origem, consentimento).
5. **Comunicar:** filtros salvos e envio de newsletter com consentimento e descadastro em um clique.
6. **Assistente de IA:** insights da base, radar de mercado com fontes, briefing semanal, chat e rascunhos no tom do cliente.

Fora do MVP: pagamentos, área do aluno, agenda de mentorias, integração por API com o Sympla.

## Stack

- **Front e back:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
- **Hospedagem:** Cloudflare Workers, via adaptador OpenNext.
- **Banco e login:** Supabase (Postgres, Auth, RLS), região `sa-east-1`.
- **E-mail:** Resend.
- **IA:** API da Anthropic (Claude).

## Regras inegociáveis

- **Multi-cliente desde o início.** Toda tabela de negócio tem `conta_id`. Nenhuma consulta sem filtro de conta.
- **RLS ligado em todas as tabelas.** Acesso só para membros da conta (função `is_membro`). Nunca usar a service role no navegador.
- **LGPD.** Newsletter só para quem tem consentimento ativo, com data e origem registradas. Descadastro sempre funciona. O cliente é o controlador dos dados; a Plateia é operadora.
- **IA com dados mínimos.** Mandar ao modelo dados agregados ou anonimizados sempre que possível. Nome, e-mail e telefone só quando a tarefa exigir.
- **IA com fonte.** Todo insight de mercado cita a fonte. Nada de tendência inventada.
- **Marca do cliente.** A interface e os e-mails mostram a marca do cliente (logo, cores, nome do remetente), não a da Plateia.
- **Interface em português do Brasil**, linguagem simples, pensada para quem não é técnico.

## Como trabalhar neste repositório

- Sempre apresentar um plano antes de escrever código e esperar aprovação.
- Uma etapa do MVP por vez; ao terminar, explicar o que mudou e como testar.
- Mudanças de banco sempre como migração nova em `supabase/migrations/`, nunca editando migração já aplicada.
- Depois de mudar o banco, rodar os avisos de segurança do Supabase (RLS faltando etc.).
- Segredos só em variáveis de ambiente; nunca no código.
- Commits pequenos, com mensagem em português.
