// Transforma a planilha + o significado de cada coluna nas linhas que vão ao banco.

import {
  EMAIL_VALIDO,
  lerConsentimento,
  lerPerfil,
  lerPresenca,
  lerTemas,
  type Campo,
} from "./campos";
import type { Planilha } from "./ler-arquivo";

export type LinhaImportacao = {
  email: string;
  nome?: string;
  telefone?: string;
  perfil?: "pessoal" | "lider" | "empresa";
  origem?: string;
  presente?: boolean;
  consentimento?: boolean;
  temas?: string[];
  respostas?: Record<string, string>;
};

export type Montagem = {
  linhas: LinhaImportacao[]; // uma por e-mail, sem repetição
  semEmail: number;
  repetidas: number;
  perguntas: string[]; // colunas guardadas como resposta
  temEmail: boolean;
};

function primeiro(valores: string[]) {
  return valores.find((v) => v.trim() !== "")?.trim() ?? "";
}

export function montarLinhas(planilha: Planilha, mapa: Campo[]): Montagem {
  const indices = (campo: Campo) =>
    mapa.flatMap((c, i) => (c === campo ? [i] : []));

  const colEmail = indices("email");
  const perguntas = indices("resposta").map((i) => planilha.cabecalhos[i]);
  const vistos = new Set<string>();
  const linhas: LinhaImportacao[] = [];
  let semEmail = 0;
  let repetidas = 0;

  for (const bruta of planilha.linhas) {
    const pegar = (campo: Campo) => indices(campo).map((i) => bruta[i] ?? "");

    const email = primeiro(pegar("email")).toLowerCase();
    if (!EMAIL_VALIDO.test(email)) {
      semEmail++;
      continue;
    }
    if (vistos.has(email)) {
      repetidas++;
      continue;
    }
    vistos.add(email);

    const nome = [primeiro(pegar("nome")), primeiro(pegar("sobrenome"))]
      .filter(Boolean)
      .join(" ");
    const perfil = lerPerfil(primeiro(pegar("perfil")));
    const consentimento = lerConsentimento(primeiro(pegar("consentimento")));
    const temas = [...new Set(pegar("temas").flatMap(lerTemas))];

    const respostas: Record<string, string> = {};
    for (const i of indices("resposta")) {
      const valor = (bruta[i] ?? "").trim();
      if (valor) respostas[planilha.cabecalhos[i]] = valor;
    }

    const linha: LinhaImportacao = { email };
    if (nome) linha.nome = nome;
    const telefone = primeiro(pegar("telefone"));
    if (telefone) linha.telefone = telefone;
    if (perfil) linha.perfil = perfil;
    const origem = primeiro(pegar("origem"));
    if (origem) linha.origem = origem.slice(0, 120);
    if (indices("presenca").length) linha.presente = pegar("presenca").some(lerPresenca);
    if (consentimento !== null) linha.consentimento = consentimento;
    if (temas.length) linha.temas = temas;
    if (Object.keys(respostas).length) linha.respostas = respostas;

    linhas.push(linha);
  }

  return { linhas, semEmail, repetidas, perguntas, temEmail: colEmail.length > 0 };
}
