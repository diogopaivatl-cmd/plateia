// Marca de cada conta (cliente). Mora em contas.marca (jsonb).
// A interface "se veste" com a marca de quem está logado.

export type CoresMarca = {
  primaria: string; // botões e links
  secundaria: string; // títulos e áreas escuras
  destaque: string;
  apoio: string;
  fundo: string;
};

export type Marca = {
  logo_url?: string; // para fundo claro
  logo_escuro_url?: string; // para fundo escuro
  cores?: Partial<CoresMarca>;
  remetente?: { nome?: string; email?: string };
};

// Visual padrão da Plateia, usado quando a conta ainda não tem marca.
export const CORES_PADRAO: CoresMarca = {
  primaria: "#6D28D9",
  secundaria: "#1C1917",
  destaque: "#7C3AED",
  apoio: "#EDE9FE",
  fundo: "#FAFAF9",
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function coresDaMarca(marca: Marca | null | undefined): CoresMarca {
  const cores = { ...CORES_PADRAO };
  for (const chave of Object.keys(cores) as (keyof CoresMarca)[]) {
    const valor = marca?.cores?.[chave];
    if (valor && HEX.test(valor)) cores[chave] = valor;
  }
  return cores;
}

// Variáveis CSS aplicadas no topo da área logada.
export function estiloDaMarca(marca: Marca | null | undefined) {
  const c = coresDaMarca(marca);
  return {
    "--cor-primaria": c.primaria,
    "--cor-secundaria": c.secundaria,
    "--cor-destaque": c.destaque,
    "--cor-apoio": c.apoio,
    "--cor-fundo": c.fundo,
  } as React.CSSProperties;
}

export function ehHex(valor: string) {
  return HEX.test(valor);
}
