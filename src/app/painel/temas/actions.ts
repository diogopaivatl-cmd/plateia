"use server";

import { revalidatePath } from "next/cache";
import { getContaAtual } from "@/lib/conta";

const TRILHAS = ["eu", "relacoes", "equipes", "outra"];

export async function salvarTrilha(formData: FormData) {
  const { supabase, conta } = await getContaAtual();
  if (!conta || conta.papel === "leitor") return;

  const id = String(formData.get("id") ?? "");
  const trilha = String(formData.get("trilha") ?? "");
  if (!id || !TRILHAS.includes(trilha)) return;

  await supabase.from("tags").update({ trilha }).eq("id", id).eq("conta_id", conta.id);
  revalidatePath("/painel");
  revalidatePath("/painel/temas");
}
