"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoCriarConta = { erro?: string };

export async function criarConta(
  _anterior: EstadoCriarConta,
  formData: FormData,
): Promise<EstadoCriarConta> {
  const nome = String(formData.get("nome") ?? "").trim();
  if (nome.length < 2) {
    return { erro: "Digite o nome da sua marca ou do seu trabalho." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("criar_conta", { p_nome: nome });
  if (error) {
    return { erro: "Não foi possível criar a conta agora. Tente de novo." };
  }

  revalidatePath("/painel");
  return {};
}
