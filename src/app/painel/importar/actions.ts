"use server";

import { revalidatePath } from "next/cache";
import { getContaAtual } from "@/lib/conta";
import type { LinhaImportacao } from "@/lib/importar/montar";

const TIPOS = ["palestra", "treinamento", "workshop", "vivencia", "mentoria", "aula", "outro"] as const;
type TipoProjeto = (typeof TIPOS)[number];

export type EscolhaProjeto =
  | { modo: "existente"; id: string }
  | { modo: "novo"; nome: string; tipo: TipoProjeto; data: string }
  | { modo: "nenhum" };

export type Preparo =
  | { ok: true; importacaoId: string; projetoId: string | null; formularioId: string | null }
  | { ok: false; erro: string };

export async function prepararImportacao(entrada: {
  projeto: EscolhaProjeto;
  arquivo: string;
  fonte: string;
  perguntas: string[];
}): Promise<Preparo> {
  const { supabase, conta } = await getContaAtual();
  if (!conta) return { ok: false, erro: "Crie sua conta antes de importar." };

  let projetoId: string | null = null;
  const p = entrada.projeto;

  if (p.modo === "existente") {
    const { data } = await supabase
      .from("projetos").select("id").eq("id", p.id).eq("conta_id", conta.id).maybeSingle();
    if (!data) return { ok: false, erro: "Projeto não encontrado." };
    projetoId = data.id;
  } else if (p.modo === "novo") {
    const nome = p.nome.trim().slice(0, 120);
    if (nome.length < 2) return { ok: false, erro: "Dê um nome ao projeto." };
    if (!TIPOS.includes(p.tipo)) return { ok: false, erro: "Tipo de projeto inválido." };
    const data = /^\d{4}-\d{2}-\d{2}$/.test(p.data) ? p.data : null;
    const { data: novo, error } = await supabase
      .from("projetos")
      .insert({ conta_id: conta.id, nome, tipo: p.tipo, data })
      .select("id")
      .single();
    if (error || !novo) return { ok: false, erro: "Não foi possível criar o projeto." };
    projetoId = novo.id;
  }

  let formularioId: string | null = null;
  const perguntas = entrada.perguntas.slice(0, 100).map((t) => String(t).slice(0, 300));
  if (perguntas.length) {
    const { data: form, error } = await supabase
      .from("formularios")
      .insert({
        conta_id: conta.id,
        projeto_id: projetoId,
        titulo: `Respostas importadas de ${entrada.arquivo}`.slice(0, 200),
        perguntas: perguntas.map((titulo) => ({ titulo, tipo: "texto" })),
      })
      .select("id")
      .single();
    if (error || !form) return { ok: false, erro: "Não foi possível registrar as respostas." };
    formularioId = form.id;
  }

  const { data: imp, error } = await supabase
    .from("importacoes")
    .insert({
      conta_id: conta.id,
      fonte: entrada.fonte.slice(0, 40),
      arquivo: entrada.arquivo.slice(0, 200),
    })
    .select("id")
    .single();
  if (error || !imp) return { ok: false, erro: "Não foi possível iniciar a importação." };

  return { ok: true, importacaoId: imp.id, projetoId, formularioId };
}

export type ResultadoLote =
  | { ok: true; novas: number; existentes: number; validas: number }
  | { ok: false; erro: string };

export async function enviarLote(entrada: {
  importacaoId: string;
  projetoId: string | null;
  formularioId: string | null;
  linhas: LinhaImportacao[];
}): Promise<ResultadoLote> {
  const { supabase, conta } = await getContaAtual();
  if (!conta) return { ok: false, erro: "Sessão expirada. Entre de novo." };
  if (entrada.linhas.length > 2000) return { ok: false, erro: "Lote grande demais." };

  const { data, error } = await supabase.rpc("importar_lote", {
    p_conta_id: conta.id,
    p_importacao_id: entrada.importacaoId,
    p_projeto_id: entrada.projetoId,
    p_formulario_id: entrada.formularioId,
    p_linhas: entrada.linhas,
  });
  if (error || !data) return { ok: false, erro: "Uma parte da planilha não foi importada. Tente de novo." };

  const r = data as { novas: number; existentes: number; validas: number };
  return { ok: true, novas: r.novas, existentes: r.existentes, validas: r.validas };
}

export async function finalizarImportacao() {
  revalidatePath("/painel", "layout");
}

export async function contarExistentes(emails: string[]): Promise<number> {
  const { supabase, conta } = await getContaAtual();
  if (!conta || emails.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < emails.length; i += 1000) {
    const { data } = await supabase.rpc("contar_existentes", {
      p_conta_id: conta.id,
      p_emails: emails.slice(i, i + 1000),
    });
    total += Number(data ?? 0);
  }
  return total;
}
