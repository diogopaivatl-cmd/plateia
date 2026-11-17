// O que cada coluna da planilha pode significar, e como reconhecer/normalizar.

export type Campo =
  | "nome"
  | "sobrenome"
  | "email"
  | "telefone"
  | "presenca"
  | "perfil"
  | "origem"
  | "temas"
  | "consentimento"
  | "resposta"
  | "ignorar";

export const CAMPOS: { valor: Campo; rotulo: string; ajuda: string }[] = [
  { valor: "nome", rotulo: "Nome", ajuda: "Nome ou nome completo" },
  { valor: "sobrenome", rotulo: "Sobrenome", ajuda: "Junta com o nome" },
  { valor: "email", rotulo: "E-mail", ajuda: "Identifica a pessoa na base" },
  { valor: "telefone", rotulo: "Telefone", ajuda: "Celular ou WhatsApp" },
  { valor: "presenca", rotulo: "Presença", ajuda: "Check-in: sim, não ou data" },
  { valor: "perfil", rotulo: "Perfil", ajuda: "Pessoal, líder ou empresa" },
  { valor: "origem", rotulo: "Como chegou", ajuda: "Instagram, indicação..." },
  { valor: "temas", rotulo: "Temas de interesse", ajuda: "Viram etiquetas na ficha" },
  { valor: "consentimento", rotulo: "Aceite da newsletter", ajuda: "Só um sim explícito conta" },
  { valor: "resposta", rotulo: "Guardar como resposta", ajuda: "Fica no histórico da pessoa" },
  { valor: "ignorar", rotulo: "Não importar", ajuda: "A coluna é deixada de fora" },
];

export function semAcento(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Sugestão automática a partir do título da coluna.
export function sugerirCampo(cabecalho: string): Campo {
  const t = semAcento(cabecalho);
  if (!t) return "ignorar";
  // Aceite vem antes do e-mail: "Aceito receber a newsletter por e-mail" é aceite.
  if (/aceito|autorizo|concordo|consent|newsletter|deseja receber|quero receber/.test(t)) return "consentimento";
  if (/(^|\s)(e-?mail|endereco de e-?mail)/.test(t)) return "email";
  if (/sobrenome|ultimo nome/.test(t)) return "sobrenome";
  if (/(^|\s)(nome|nome completo|participante|seu nome)(\s|$|:|\?)/.test(t) || t === "nome") return "nome";
  if (/telefone|celular|whats|fone/.test(t)) return "telefone";
  if (/check-?in|presenca|presente|compareceu/.test(t)) return "presenca";
  if (/voce participa|perfil|participa por|participa como/.test(t)) return "perfil";
  if (/como (chegou|conheceu|soube)|origem|canal/.test(t)) return "origem";
  if (/tema/.test(t)) return "temas";
  if (/carimbo|timestamp|data\/hora|pedido|codigo|ingresso|valor|cupom|status|id$/.test(t)) return "ignorar";
  return t.endsWith("?") ? "resposta" : "ignorar";
}

// Origem do arquivo, só para registro e para afinar sugestões.
export function detectarFonte(cabecalhos: string[]): "sympla" | "google_forms" | "planilha" {
  const t = cabecalhos.map(semAcento).join(" | ");
  if (/carimbo de data\/hora|timestamp/.test(t)) return "google_forms";
  if (/numero do pedido|ingresso|check-?in/.test(t)) return "sympla";
  return "planilha";
}

const SIM = /^(s|sim|y|yes|true|x|1|ok|feito|presente|check-?in( realizado| feito)?|compareceu)$/;
const NAO = /^(n|nao|no|false|0|ausente|nao compareceu|pendente)$/;

export function lerPresenca(valor: string): boolean {
  const t = semAcento(valor);
  if (!t || NAO.test(t)) return false;
  if (SIM.test(t)) return true;
  // Uma data ou hora de check-in também conta como presença.
  return /\d{1,2}[/.-]\d{1,2}|\d{1,2}:\d{2}/.test(t);
}

export function lerConsentimento(valor: string): boolean | null {
  const t = semAcento(valor);
  if (!t) return null;
  if (/^(n|nao|no|false)\b|nao (aceito|autorizo|quero|concordo)/.test(t)) return false;
  if (/^(s|sim|y|yes|true)\b|aceito|autorizo|concordo|quero receber/.test(t)) return true;
  return null;
}

export function lerPerfil(valor: string): "pessoal" | "lider" | "empresa" | null {
  const t = semAcento(valor);
  if (!t) return null;
  if (/lider|gestor|gerente|coordena/.test(t)) return "lider";
  if (/empresa|\brh\b|recursos humanos|organizacao/.test(t)) return "empresa";
  if (/pessoal|desenvolvimento|propria|individual/.test(t)) return "pessoal";
  return null;
}

// "1. Feedback, 3. Escuta ativa" -> ["Feedback", "Escuta ativa"]
export function lerTemas(valor: string): string[] {
  return valor
    .split(/[;\n]|,\s+(?=\d+[.)]|\p{Lu})/u)
    .map((t) => t.replace(/^\s*\d+[.)]\s*/, "").replace(/^outro:\s*/i, "").trim())
    .filter((t) => t.length > 1 && t.length <= 80);
}

export const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
