"use server";

import { revalidatePath } from "next/cache";
import { getContaAtual } from "@/lib/conta";
import { ehHex, type CoresMarca, type Marca } from "@/lib/marca";
import { SUPABASE_URL } from "@/lib/supabase/config";

export type EstadoMarca = { ok?: boolean; erro?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function salvarMarca(
  _anterior: EstadoMarca,
  formData: FormData,
): Promise<EstadoMarca> {
  const { supabase, conta } = await getContaAtual();
  if (!conta || conta.papel !== "dono") {
    return { erro: "Só a dona ou o dono da conta pode alterar a marca." };
  }

  // Logos só podem apontar para a pasta desta conta no Storage.
  const prefixo = `${SUPABASE_URL}/storage/v1/object/public/marcas/${conta.id}/`;
  const logo = String(formData.get("logo_url") ?? "");
  const logoEscuro = String(formData.get("logo_escuro_url") ?? "");
  for (const url of [logo, logoEscuro]) {
    if (url && !url.startsWith(prefixo)) {
      return { erro: "Endereço de logo inválido. Envie o arquivo de novo." };
    }
  }

  const cores: Partial<CoresMarca> = {};
  for (const chave of ["primaria", "secundaria", "destaque", "apoio", "fundo"] as const) {
    const valor = String(formData.get(`cor_${chave}`) ?? "").trim();
    if (valor) {
      if (!ehHex(valor)) return { erro: `Cor inválida: ${valor}. Use o formato #RRGGBB.` };
      cores[chave] = valor.toUpperCase();
    }
  }

  const remetenteNome = String(formData.get("remetente_nome") ?? "").trim().slice(0, 120);
  const remetenteEmail = String(formData.get("remetente_email") ?? "").trim().toLowerCase();
  if (remetenteEmail && !EMAIL.test(remetenteEmail)) {
    return { erro: "O e-mail do remetente não parece válido." };
  }

  const marca: Marca = {
    ...(logo ? { logo_url: logo } : {}),
    ...(logoEscuro ? { logo_escuro_url: logoEscuro } : {}),
    cores,
    remetente: { nome: remetenteNome, email: remetenteEmail },
  };

  const { error } = await supabase.from("contas").update({ marca }).eq("id", conta.id);
  if (error) return { erro: "Não foi possível salvar agora. Tente de novo." };

  revalidatePath("/painel", "layout");
  return { ok: true };
}
