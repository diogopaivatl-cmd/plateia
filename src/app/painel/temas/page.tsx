import Link from "next/link";
import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { TRILHAS } from "@/lib/painel/resumo";
import { salvarTrilha } from "./actions";

export const metadata = { title: "Temas · Plateia" };

export default async function TemasPage() {
  const { supabase, conta } = await getContaAtual();
  if (!conta) redirect("/painel");

  const { data } = await supabase
    .from("tags")
    .select("id, nome, trilha")
    .eq("conta_id", conta.id)
    .order("nome");
  const temas = data ?? [];
  const podeEditar = conta.papel !== "leitor";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/painel" className="text-sm text-stone-600 hover:underline">
        ← Voltar para Sua plateia
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--cor-secundaria)]">
        Trilhas dos temas
      </h1>
      <p className="mt-2 text-stone-600">
        Cada tema fica em uma trilha: <strong>Eu</strong>, <strong>Relações</strong> ou{" "}
        <strong>Equipes</strong>. É isso que mostra, no painel, onde está o maior interesse.
      </p>

      {temas.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-stone-500">
          Ainda não há temas. Eles aparecem aqui quando você importa uma planilha com temas de interesse.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-stone-100 rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          {temas.map((t) => (
            <li key={t.id}>
              <form action={salvarTrilha} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <input type="hidden" name="id" value={t.id} />
                <span className="font-medium">{t.nome}</span>
                <span className="flex gap-2">
                  <select
                    name="trilha"
                    defaultValue={t.trilha}
                    disabled={!podeEditar}
                    className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
                  >
                    {TRILHAS.map((tr) => (
                      <option key={tr.chave} value={tr.chave}>
                        {tr.nome}
                      </option>
                    ))}
                  </select>
                  {podeEditar ? (
                    <button className="rounded-full bg-[var(--cor-primaria)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                      Salvar
                    </button>
                  ) : null}
                </span>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
