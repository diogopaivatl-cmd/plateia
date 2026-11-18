import { PainelView } from "@/components/painel/painel-view";
import { getContaAtual } from "@/lib/conta";
import type { ResumoPainel } from "@/lib/painel/resumo";
import { CriarConta } from "./criar-conta";

export const metadata = { title: "Sua plateia · Plateia" };

export default async function PainelPage() {
  const { supabase, conta } = await getContaAtual();

  if (!conta) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <CriarConta />
      </main>
    );
  }

  const { data } = await supabase.rpc("painel_resumo", { p_conta_id: conta.id });

  return (
    <PainelView
      r={data as ResumoPainel | null}
      papel={conta.papel}
      semLogo={!conta.marca.logo_url}
    />
  );
}
