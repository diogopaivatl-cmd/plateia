// Formato do JSON devolvido por public.painel_resumo (migração 0008).

export type Trilha = "eu" | "relacoes" | "equipes" | "outra";
export type PerfilChave = "pessoal" | "lider" | "empresa" | "desconhecido";

export type ResumoPainel = {
  pessoas: number;
  perfis: Partial<Record<PerfilChave, number>>;
  projetos: {
    id: string;
    nome: string;
    tipo: string;
    data: string | null;
    inscritos: number;
    presentes: number;
  }[];
  temas: { nome: string; trilha: Trilha; pessoas: number }[];
  temas_por_perfil: { tema: string; perfil: PerfilChave; pessoas: number }[];
  volta_total: number;
  volta: { id: string; nome: string | null; projetos: number }[];
  aceite_newsletter: number;
};

export const TRILHAS: { chave: Trilha; nome: string }[] = [
  { chave: "eu", nome: "Eu" },
  { chave: "relacoes", nome: "Relações" },
  { chave: "equipes", nome: "Equipes" },
  { chave: "outra", nome: "Outras" },
];

export const NOME_TRILHA: Record<Trilha, string> = {
  eu: "Eu",
  relacoes: "Relações",
  equipes: "Equipes",
  outra: "Outras",
};

export const NOME_PERFIL: Record<PerfilChave, string> = {
  pessoal: "Desenvolvimento pessoal",
  lider: "Líderes",
  empresa: "Empresas e RH",
  desconhecido: "Sem perfil",
};
