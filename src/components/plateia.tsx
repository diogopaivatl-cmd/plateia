// Visualização em meia-lua: cada assento é uma pessoa (ou um grupo de pessoas,
// quando a planilha é grande). Os grupos ocupam a plateia da esquerda para a direita.

type Grupo = { quantidade: number; cor: string; vazado?: boolean };

const MAX_ASSENTOS = 360;

type Assento = { x: number; y: number; angulo: number };

function posicoes(total: number): { assentos: Assento[]; raio: number } {
  const fileiras = Math.min(14, Math.max(2, Math.round(Math.sqrt(total / 3.4))));
  const r0 = 0.38;
  const raios = Array.from({ length: fileiras }, (_, i) => r0 + ((1 - r0) * (i + 0.5)) / fileiras);
  const somaRaios = raios.reduce((a, b) => a + b, 0);
  const porFileira = raios.map((r) => Math.max(1, Math.round((total * r) / somaRaios)));
  porFileira[fileiras - 1] += total - porFileira.reduce((a, b) => a + b, 0);

  const assentos: Assento[] = [];
  raios.forEach((r, i) => {
    const n = Math.max(1, porFileira[i]);
    for (let k = 0; k < n; k++) {
      const angulo = n === 1 ? Math.PI / 2 : Math.PI - (Math.PI * (k + 0.5)) / n;
      assentos.push({ x: r * Math.cos(angulo), y: -r * Math.sin(angulo), angulo });
    }
  });
  assentos.sort((a, b) => b.angulo - a.angulo);
  const espaco = (1 - r0) / fileiras;
  return { assentos: assentos.slice(0, total), raio: Math.min(0.045, espaco * 0.36) };
}

export function Plateia({
  grupos,
  animar = false,
  rotulo,
}: {
  grupos: Grupo[];
  animar?: boolean;
  rotulo: string;
}) {
  const totalPessoas = grupos.reduce((s, g) => s + g.quantidade, 0);
  const escala = Math.max(1, Math.ceil(totalPessoas / MAX_ASSENTOS));
  const porGrupo = grupos.map((g) => (g.quantidade > 0 ? Math.ceil(g.quantidade / escala) : 0));
  const total = porGrupo.reduce((a, b) => a + b, 0);

  if (total === 0) return null;

  const { assentos, raio } = posicoes(total);
  const cores: Grupo[] = porGrupo.flatMap((n, i) => Array.from({ length: n }, () => grupos[i]));
  const passo = Math.min(14, 1400 / total);

  return (
    <figure className="w-full">
      <svg viewBox="-1.08 -1.08 2.16 1.2" role="img" aria-label={rotulo} className="w-full">
        {assentos.map((a, i) => {
          const g = cores[i];
          return (
            <circle
              key={i}
              cx={a.x}
              cy={a.y}
              r={raio}
              fill={g.vazado ? "none" : g.cor}
              stroke={g.vazado ? g.cor : "none"}
              strokeWidth={g.vazado ? raio * 0.35 : 0}
              className={animar ? "assento-entra" : undefined}
              style={animar ? { animationDelay: `${Math.round(i * passo)}ms` } : undefined}
            />
          );
        })}
        <rect x={-0.26} y={0.03} width={0.52} height={0.05} rx={0.025} fill="currentColor" opacity={0.18} />
      </svg>
      {escala > 1 ? (
        <figcaption className="mt-2 text-center text-xs text-stone-500">
          Cada assento representa {escala} pessoas.
        </figcaption>
      ) : null}
    </figure>
  );
}
