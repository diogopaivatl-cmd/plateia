import Link from "next/link";
import { getContaAtual } from "@/lib/conta";
import { CriarConta } from "./criar-conta";

export const metadata = { title: "Painel · Plateia" };

const proximasEtapas = [
  { titulo: "Ficha completa", texto: "Todo o histórico de cada pessoa em uma tela." },
  { titulo: "Formulários", texto: "Pesquisas que caem direto na ficha de cada pessoa." },
  { titulo: "Newsletter", texto: "Envie para grupos filtrados, com consentimento." },
  { titulo: "Assistente", texto: "Insights da sua base e do seu mercado." },
];

export default async function PainelPage() {
  const { supabase, conta } = await getContaAtual();

  if (!conta) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <CriarConta />
      </main>
    );
  }

  const [pessoas, projetos] = await Promise.all([
    supabase.from("pessoas").select("id", { count: "exact", head: true }).eq("conta_id", conta.id),
    supabase.from("projetos").select("id", { count: "exact", head: true }).eq("conta_id", conta.id),
  ]);

  const semLogo = !conta.marca.logo_url;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--cor-secundaria)]">
        Seu painel
      </h1>

      {semLogo && conta.papel === "dono" ? (
        <Link
          href="/painel/marca"
          className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--cor-primaria)]/30 bg-white px-6 py-4 text-sm"
        >
          <span>Deixe a Plateia com a cara da sua marca: envie seu logo e confira suas cores.</span>
          <span className="font-semibold text-[var(--cor-primaria)]">Configurar marca</span>
        </Link>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border-t-4 border-[var(--cor-primaria)] bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-500">Pessoas na base</p>
          <p className="mt-1 text-4xl font-bold text-[var(--cor-secundaria)]">{pessoas.count ?? 0}</p>
        </div>
        <div className="rounded-2xl border-t-4 border-[var(--cor-destaque)] bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-500">Projetos</p>
          <p className="mt-1 text-4xl font-bold text-[var(--cor-secundaria)]">{projetos.count ?? 0}</p>
        </div>
      </div>

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

      <h2 className="mt-12 text-lg font-semibold text-[var(--cor-secundaria)]">Em construção</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {proximasEtapas.map((etapa) => (
          <li key={etapa.titulo} className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-5">
            <p className="font-semibold">{etapa.titulo}</p>
            <p className="mt-1 text-sm text-stone-600">{etapa.texto}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
