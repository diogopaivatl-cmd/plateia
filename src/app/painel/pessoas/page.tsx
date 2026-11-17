import Link from "next/link";
import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";

export const metadata = { title: "Pessoas · Plateia" };

const POR_PAGINA = 50;

const PERFIS: Record<string, string> = {
  pessoal: "Pessoal",
  lider: "Líder",
  empresa: "Empresa",
};

type Linha = {
  id: string;
  nome: string | null;
  email: string;
  perfil: string;
  created_at: string;
  participacoes: { count: number }[];
  pessoa_tags: { tags: { nome: string } | null }[];
};

function iniciais(nome: string | null, email: string) {
  const base = (nome || email).trim();
  const partes = base.split(/[\s@._-]+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export default async function PessoasPage({ searchParams }: PageProps<"/painel/pessoas">) {
  const { supabase, conta } = await getContaAtual();
  if (!conta) redirect("/painel");

  const params = await searchParams;
  const busca = String(params.q ?? "").trim().slice(0, 80);
  const pagina = Math.max(1, Number(params.pagina) || 1);

  let consulta = supabase
    .from("pessoas")
    .select("id, nome, email, perfil, created_at, participacoes(count), pessoa_tags(tags(nome))", {
      count: "exact",
    })
    .eq("conta_id", conta.id)
    .order("created_at", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

  if (busca) {
    const termo = busca.replace(/[%_,()]/g, " ");
    consulta = consulta.or(`nome.ilike.%${termo}%,email.ilike.%${termo}%`);
  }

  const { data, count } = await consulta;
  const pessoas = (data ?? []) as unknown as Linha[];
  const total = count ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const link = (p: number) => {
    const q = new URLSearchParams();
    if (busca) q.set("q", busca);
    if (p > 1) q.set("pagina", String(p));
    const s = q.toString();
    return `/painel/pessoas${s ? `?${s}` : ""}`;
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--cor-secundaria)]">Pessoas</h1>
          <p className="mt-1 text-stone-600">
            {busca
              ? `${total.toLocaleString("pt-BR")} encontradas para "${busca}"`
              : `${total.toLocaleString("pt-BR")} ${total === 1 ? "pessoa" : "pessoas"} na sua base`}
          </p>
        </div>
        <Link
          href="/painel/importar"
          className="rounded-full bg-[var(--cor-primaria)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Importar planilha
        </Link>
      </div>

      <form className="mt-8" role="search">
        <label className="sr-only" htmlFor="busca">
          Buscar por nome ou e-mail
        </label>
        <input
          id="busca"
          name="q"
          defaultValue={busca}
          placeholder="Buscar por nome ou e-mail"
          className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-3.5 text-base shadow-sm outline-none focus:border-[var(--cor-primaria)] focus:ring-2 focus:ring-[var(--cor-primaria)]/20"
        />
      </form>

      {pessoas.length === 0 ? (
        <div className="mt-10 rounded-3xl bg-white px-8 py-16 text-center shadow-sm ring-1 ring-black/5">
          {busca ? (
            <>
              <p className="text-lg font-semibold">Ninguém encontrado</p>
              <p className="mt-2 text-stone-600">Tente outra parte do nome ou do e-mail.</p>
              <Link href="/painel/pessoas" className="mt-6 inline-block font-semibold text-[var(--cor-primaria)] hover:underline">
                Limpar busca
              </Link>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Sua base ainda está vazia</p>
              <p className="mx-auto mt-2 max-w-md text-stone-600">
                Importe a lista de participantes de um evento ou as respostas de um formulário. Cada pessoa vira uma ficha.
              </p>
              <Link
                href="/painel/importar"
                className="mt-6 inline-block rounded-full bg-[var(--cor-primaria)] px-7 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Importar a primeira planilha
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-100 text-stone-500">
              <tr>
                <th className="px-6 py-3 font-medium">Pessoa</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Perfil</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Projetos</th>
                <th className="hidden px-6 py-3 font-medium lg:table-cell">Temas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pessoas.map((p) => {
                const temas = p.pessoa_tags.map((t) => t.tags?.nome).filter(Boolean) as string[];
                const projetos = p.participacoes[0]?.count ?? 0;
                return (
                  <tr key={p.id} className="align-middle">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cor-apoio)] text-xs font-bold text-[var(--cor-secundaria)]"
                        >
                          {iniciais(p.nome, p.email)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{p.nome || "Sem nome"}</span>
                          <span className="block truncate text-stone-500">{p.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3.5 text-stone-600 md:table-cell">{PERFIS[p.perfil] ?? "—"}</td>
                    <td className="hidden px-4 py-3.5 text-right tabular-nums sm:table-cell">{projetos}</td>
                    <td className="hidden px-6 py-3.5 lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {temas.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">
                            {t}
                          </span>
                        ))}
                        {temas.length > 3 ? (
                          <span className="px-1 py-1 text-xs text-stone-500">+{temas.length - 3}</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 ? (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Páginas">
          {pagina > 1 ? (
            <Link href={link(pagina - 1)} className="font-semibold text-[var(--cor-primaria)] hover:underline">
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-stone-500">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link href={link(pagina + 1)} className="font-semibold text-[var(--cor-primaria)] hover:underline">
              Próxima
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}
