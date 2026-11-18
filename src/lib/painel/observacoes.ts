import type { ResumoPainel, Trilha } from "./resumo";
import { NOME_TRILHA } from "./resumo";

// Observações calculadas por regras, sem IA. Só aparece o que os números
// sustentam, e cada regra tem um mínimo de amostra para não "inventar" tendência.

const POR_PERFIL: Record<string, string> = {
  pessoal: "quem busca desenvolvimento pessoal",
  lider: "líderes",
  empresa: "quem representa empresas e RH",
};

const pct = (parte: number, todo: number) => Math.round((parte / todo) * 100);

export function observacoes(r: ResumoPainel): string[] {
  const saida: string[] = [];

  // 1. Tema mais pedido dentro de cada perfil (mínimo: 5 pessoas no perfil e 3 no tema).
  for (const perfil of ["lider", "empresa", "pessoal"] as const) {
    if ((r.perfis[perfil] ?? 0) < 5) continue;
    const top = r.temas_por_perfil
      .filter((t) => t.perfil === perfil)
      .sort((a, b) => b.pessoas - a.pessoas || a.tema.localeCompare(b.tema))[0];
    if (top && top.pessoas >= 3) {
      saida.push(
        `${top.tema} é o tema mais pedido entre ${POR_PERFIL[perfil]} (${top.pessoas} pessoas).`,
      );
    }
  }

  // 2. Trilha que concentra mais pedidos (mínimo: 10 pedidos no total).
  const totalPedidos = r.temas.reduce((s, t) => s + t.pessoas, 0);
  if (totalPedidos >= 10) {
    const porTrilha = new Map<Trilha, number>();
    for (const t of r.temas) porTrilha.set(t.trilha, (porTrilha.get(t.trilha) ?? 0) + t.pessoas);
    const [trilha, n] = [...porTrilha.entries()]
      .filter(([k]) => k !== "outra")
      .sort((a, b) => b[1] - a[1])[0] ?? [];
    if (trilha && n && pct(n, totalPedidos) >= 35) {
      saida.push(
        `A trilha ${NOME_TRILHA[trilha]} reúne ${pct(n, totalPedidos)}% de todos os pedidos de tema.`,
      );
    }
  }

  // 3. Quem volta.
  if (r.volta_total > 0) {
    saida.push(
      r.volta_total === 1
        ? "1 pessoa já participou de mais de um projeto: candidata natural à mentoria."
        : `${r.volta_total} pessoas já participaram de mais de um projeto: candidatas naturais à mentoria.`,
    );
  }

  // 4. Newsletter (mínimo: 10 pessoas).
  if (r.pessoas >= 10) {
    const p = pct(r.aceite_newsletter, r.pessoas);
    if (p < 60) {
      saida.push(
        `Só ${p}% da base aceitou receber a newsletter. Vale convidar o resto a aceitar no próximo formulário.`,
      );
    }
  }

  return saida.slice(0, 3);
}
