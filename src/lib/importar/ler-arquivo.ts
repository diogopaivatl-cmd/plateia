// Lê CSV ou Excel no navegador e devolve cabeçalhos + linhas como texto.

import Papa from "papaparse";

export type Planilha = { cabecalhos: string[]; linhas: string[][] };

export const LIMITE_LINHAS = 20000;

function paraTexto(celula: unknown): string {
  if (celula === null || celula === undefined) return "";
  if (celula instanceof Date) {
    const d = String(celula.getDate()).padStart(2, "0");
    const m = String(celula.getMonth() + 1).padStart(2, "0");
    return `${d}/${m}/${celula.getFullYear()}`;
  }
  return String(celula).trim();
}

// Exportações brasileiras às vezes vêm em Windows-1252 em vez de UTF-8.
function decodificar(buffer: ArrayBuffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function limpar(matriz: string[][]): Planilha {
  const linhas = matriz.filter((l) => l.some((c) => c !== ""));
  if (linhas.length === 0) throw new Error("A planilha está vazia.");
  const cabecalhos = linhas[0].map((c, i) => c.replace(/^﻿/, "") || `Coluna ${i + 1}`);
  const corpo = linhas.slice(1).map((l) => cabecalhos.map((_, i) => l[i] ?? ""));
  if (corpo.length === 0) throw new Error("A planilha só tem o cabeçalho, sem nenhuma pessoa.");
  if (corpo.length > LIMITE_LINHAS) {
    throw new Error(`A planilha tem mais de ${LIMITE_LINHAS.toLocaleString("pt-BR")} linhas. Divida em arquivos menores.`);
  }
  return { cabecalhos, linhas: corpo };
}

export async function lerArquivo(arquivo: File): Promise<Planilha> {
  const nome = arquivo.name.toLowerCase();

  if (nome.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    const matriz = (await readSheet(arquivo)) as unknown[][];
    return limpar(matriz.map((l) => l.map(paraTexto)));
  }

  if (nome.endsWith(".csv") || nome.endsWith(".txt")) {
    const texto = decodificar(await arquivo.arrayBuffer());
    const resultado = Papa.parse<string[]>(texto, { skipEmptyLines: "greedy" });
    return limpar(resultado.data.map((l) => l.map(paraTexto)));
  }

  if (nome.endsWith(".xls")) {
    throw new Error("Arquivos .xls antigos não são aceitos. Abra no Excel e salve como .xlsx ou .csv.");
  }

  throw new Error("Envie um arquivo .csv ou .xlsx.");
}
