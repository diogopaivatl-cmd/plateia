import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Marca } from "@/lib/marca";

export type ContaAtual = {
  id: string;
  nome: string;
  marca: Marca;
  papel: "dono" | "editor" | "leitor";
};

// Usuário logado e a conta dele (ou null, se ainda não criou).
// Em cache por requisição: layout e página compartilham a mesma consulta.
export const getContaAtual = cache(async () => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/entrar");

  const { data } = await supabase
    .from("membros")
    .select("papel, contas(id, nome, marca)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const conta = data?.contas as
    | { id: string; nome: string; marca: Marca | null }
    | null
    | undefined;

  return {
    supabase,
    userId,
    conta: conta
      ? ({
          id: conta.id,
          nome: conta.nome,
          marca: conta.marca ?? {},
          papel: data!.papel,
        } satisfies ContaAtual)
      : null,
  };
});
