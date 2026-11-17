import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CriarConta } from "./criar-conta";

export const metadata = { title: "Painel · Plateia" };

const proximasEtapas = [
  { titulo: "Importar", texto: "Suba as planilhas do Sympla e do Google Forms." },
  { titulo: "Pessoas", texto: "Uma ficha por pessoa, com todo o histórico." },
  { titulo: "Formulários", texto: "Pesquisas que caem direto na ficha de cada pessoa." },
  { titulo: "Newsletter", texto: "Envie para grupos filtrados, com consentimento." },
  { titulo: "Assistente", texto: "Insights da sua base e do seu mercado." },
];

export default async function PainelPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/entrar");

  const { data: vinculo } = await supabase
    .from("membros")
    .select("papel, contas(id, nome)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const conta = vinculo?.contas as { id: string; nome: string } | null | undefined;

  const [pessoas, projetos] = conta
    ? await Promise.all([
        supabase.from("pessoas").select("id", { count: "exact", head: true }).eq("conta_id", conta.id),
        supabase.from("projetos").select("id", { count: "exact", head: true }).eq("conta_id", conta.id),
      ])
    : [null, null];

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-bold text-violet-700">Plateia</span>
          {conta ? <span className="text-stone-500">{conta.nome}</span> : null}
        </div>
        <form action="/auth/sair" method="post">
          <button className="text-sm text-stone-600 hover:text-stone-900">Sair</button>
        </form>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        {!conta ? (
          <CriarConta />
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">Seu painel</h1>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <p className="text-sm text-stone-500">Pessoas na base</p>
                <p className="mt-1 text-4xl font-bold">{pessoas?.count ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <p className="text-sm text-stone-500">Projetos</p>
                <p className="mt-1 text-4xl font-bold">{projetos?.count ?? 0}</p>
              </div>
            </div>

            <h2 className="mt-12 text-lg font-semibold">Em construção</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {proximasEtapas.map((etapa) => (
                <li key={etapa.titulo} className="rounded-2xl border border-dashed border-stone-300 p-5">
                  <p className="font-semibold">{etapa.titulo}</p>
                  <p className="mt-1 text-sm text-stone-600">{etapa.texto}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
