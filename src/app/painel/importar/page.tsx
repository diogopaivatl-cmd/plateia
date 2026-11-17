import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { Assistente } from "./assistente";

export const metadata = { title: "Importar planilha · Plateia" };

export default async function ImportarPage() {
  const { supabase, conta } = await getContaAtual();
  if (!conta) redirect("/painel");

  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, nome, tipo, data")
    .eq("conta_id", conta.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--cor-secundaria)]">Importar planilha</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Traga para a sua base quem participou dos seus eventos. Quem já estiver aqui não é duplicado.
      </p>
      <div className="mt-10">
        <Assistente projetos={projetos ?? []} />
      </div>
    </main>
  );
}
