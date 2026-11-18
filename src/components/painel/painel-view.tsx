import Link from "next/link";
import { Plateia } from "@/components/plateia";
import { TemasRanking } from "@/components/painel/temas-ranking";
import { observacoes } from "@/lib/painel/observacoes";
import { NOME_PERFIL, type PerfilChave, type ResumoPainel } from "@/lib/painel/resumo";

const COR_PERFIL: Record<PerfilChave, string> = {
  pessoal: "var(--cor-primaria)",
  lider: "var(--cor-destaque)",
  empresa: "var(--cor-secundaria)",
  desconhecido: "#a8a29e",
};

const ORDEM: PerfilChave[] = ["pessoal", "lider", "empresa", "desconhecido"];

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function Cartao({ titulo, children, className = "" }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 ${className}`}>
      <h2 className="text-lg font-semibold text-[var(--cor-secundaria)]">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PainelView({
  r,
  papel,
  semLogo,
}: {
  r: ResumoPainel | null;
  papel: "dono" | "editor" | "leitor";
  semLogo: boolean;
}) {
  const aviso =
    semLogo && papel === "dono" ? (
      <Link
        href="/painel/marca"
        className="mb-6 flex flex-col gap-1 rounded-2xl border border-[var(--cor-primaria)]/30 bg-white px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <span>Deixe a Plateia com a cara da sua marca: envie seu logo e confira suas cores.</span>
        <span className="font-semibold text-[var(--cor-primaria)]">Configurar marca</span>
      </Link>
    ) : null;

  if (!r || r.pessoas === 0) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {aviso}
        <section className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5 sm:p-12">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--cor-secundaria)]">Sua plateia</h1>
          <p className="mx-auto mt-3 max-w-md text-stone-600">
            Sua plateia ainda está vazia. Importe a planilha de um evento e cada pessoa ganha um lugar aqui.
          </p>
          <Link
            href="/painel/importar"
            className="mt-6 inline-block rounded-full bg-[var(--cor-primaria)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Importar planilha
          </Link>
        </section>
      </main>
    );
  }

  const grupos = ORDEM.map((p) => ({
    quantidade: r.perfis[p] ?? 0,
    cor: COR_PERFIL[p],
    vazado: p === "desconhecido",
  }));
  const comAceite = r.aceite_newsletter;
  const pctAceite = Math.round((comAceite / r.pessoas) * 100);
  const notas = observacoes(r);
  const projetosComInscritos = r.projetos.filter((p) => p.inscritos > 0);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      {aviso}

      {/* Abertura */}
      <section className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-black/5">
        <div className="bg-gradient-to-b from-[var(--cor-apoio)]/45 to-white px-4 pb-6 pt-8 text-[var(--cor-secundaria)] sm:px-10 sm:pt-10">
          <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-[var(--cor-primaria)]">
            Sua plateia
          </p>
          <h1 className="mx-auto mt-2 max-w-2xl text-balance text-center text-2xl font-bold tracking-tight sm:text-4xl">
            Sua plateia tem {plural(r.pessoas, "pessoa", "pessoas")} em{" "}
            {plural(r.projetos.length, "projeto", "projetos")}
          </h1>
          <div className="mx-auto mt-6 max-w-3xl">
            <Plateia
              animar
              grupos={grupos}
              rotulo={`Plateia com ${r.pessoas} pessoas, colorida por perfil`}
            />
          </div>
        </div>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 px-6 pb-6 text-sm text-stone-700">
          {ORDEM.filter((p) => (r.perfis[p] ?? 0) > 0).map((p) => (
            <li key={p} className="flex items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={
                  p === "desconhecido"
                    ? { border: "2px solid #a8a29e" }
                    : { background: COR_PERFIL[p] }
                }
              />
              {NOME_PERFIL[p]} <strong className="tabular-nums">{r.perfis[p]}</strong>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Temas */}
        <Cartao titulo="Temas mais pedidos" className="lg:col-span-3">
          {r.temas.length === 0 ? (
            <p className="text-sm text-stone-500">
              Quando a base tiver temas de interesse, o ranking aparece aqui.
            </p>
          ) : (
            <TemasRanking temas={r.temas} />
          )}
          {papel !== "leitor" && r.temas.length > 0 ? (
            <Link
              href="/painel/temas"
              className="mt-5 inline-block text-sm font-semibold text-[var(--cor-primaria)] hover:underline"
            >
              Ajustar as trilhas dos temas
            </Link>
          ) : null}
        </Cartao>

        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Newsletter */}
          <Cartao titulo="Pronto para a newsletter">
            <p className="text-4xl font-bold tabular-nums text-[var(--cor-primaria)]">
              {comAceite}
              <span className="ml-2 text-base font-medium text-stone-500">
                de {r.pessoas} {comAceite === 1 ? "aceitou" : "aceitaram"}
              </span>
            </p>
            <div className="mt-3 h-3 rounded-full bg-[var(--cor-apoio)]/30">
              <div
                className="h-full rounded-full bg-[var(--cor-primaria)]"
                style={{ width: `${comAceite > 0 ? Math.max(3, pctAceite) : 0}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-stone-600">
              {pctAceite}% da base tem aceite ativo. Só essas pessoas recebem e-mails.
            </p>
          </Cartao>

          {/* Quem volta */}
          <Cartao titulo="Quem volta">
            {r.volta_total === 0 ? (
              <p className="text-sm text-stone-500">
                Ninguém participou de mais de um projeto ainda. Quando acontecer, essas pessoas aparecem aqui.
              </p>
            ) : (
              <>
                <p className="text-4xl font-bold tabular-nums text-[var(--cor-primaria)]">
                  {r.volta_total}
                  <span className="ml-2 text-base font-medium text-stone-500">
                    {r.volta_total === 1 ? "pessoa em 2 ou mais projetos" : "pessoas em 2 ou mais projetos"}
                  </span>
                </p>
                <ul className="mt-3 divide-y divide-stone-100 text-sm">
                  {r.volta.map((p) => (
                    <li key={p.id} className="flex justify-between py-1.5">
                      <Link href="/painel/pessoas" className="truncate pr-3 hover:underline">
                        {p.nome || "Sem nome"}
                      </Link>
                      <span className="shrink-0 text-stone-500">{p.projetos} projetos</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-stone-500">Candidatas naturais à mentoria.</p>
              </>
            )}
          </Cartao>
        </div>
      </div>

      {/* Projetos */}
      <Cartao titulo="Projetos" className="mt-6">
        {projetosComInscritos.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhum projeto com inscritos ainda.</p>
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-5 md:grid-cols-2">
            {projetosComInscritos.map((p) => {
              const taxa = Math.round((p.presentes / p.inscritos) * 100);
              return (
                <li key={p.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate font-medium text-[var(--cor-secundaria)]">{p.nome}</p>
                    <p className="shrink-0 text-lg font-bold tabular-nums text-[var(--cor-primaria)]">
                      {taxa}%
                    </p>
                  </div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-[var(--cor-apoio)]/30">
                    <div
                      className="h-full rounded-full bg-[var(--cor-destaque)]"
                      style={{ width: `${p.presentes > 0 ? Math.max(3, taxa) : 0}%` }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {p.inscritos} inscritos · {p.presentes} presentes
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>

      {/* Prévia da assistente */}
      {notas.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-[var(--cor-secundaria)] p-6 text-white sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
            Prévia da assistente
          </p>
          <h2 className="mt-1 text-xl font-semibold">O que seus dados mostram</h2>
          <ul className="mt-4 space-y-3">
            {notas.map((n) => (
              <li key={n} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-[var(--cor-apoio)]" />
                {n}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-white/50">
            Observações calculadas só com os números da sua base. Em breve, a assistente vai conversar com você sobre elas.
          </p>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/painel/importar"
          className="rounded-full bg-[var(--cor-primaria)] px-6 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Importar planilha
        </Link>
        <Link
          href="/painel/pessoas"
          className="rounded-full px-6 py-3 font-semibold text-[var(--cor-secundaria)] ring-1 ring-black/15 transition hover:bg-white"
        >
          Ver pessoas
        </Link>
      </div>
    </main>
  );
}
