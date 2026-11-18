"use client";

import { useState } from "react";
import { NOME_TRILHA, type ResumoPainel, type Trilha } from "@/lib/painel/resumo";

const ABAS: { chave: Trilha | "todas"; nome: string }[] = [
  { chave: "todas", nome: "Todos" },
  { chave: "eu", nome: "Eu" },
  { chave: "relacoes", nome: "Relações" },
  { chave: "equipes", nome: "Equipes" },
];

const COR_TRILHA = {
  eu: "var(--cor-primaria)",
  relacoes: "var(--cor-destaque)",
  equipes: "var(--cor-secundaria)",
} as const;

export function TemasRanking({ temas }: { temas: ResumoPainel["temas"] }) {
  const [aba, setAba] = useState<Trilha | "todas">("todas");

  const totalPedidos = temas.reduce((s, t) => s + t.pessoas, 0);
  const lista = temas.filter((t) => aba === "todas" || t.trilha === aba).slice(0, 8);
  const maximo = Math.max(1, ...lista.map((t) => t.pessoas));

  const porTrilha = (["eu", "relacoes", "equipes"] as const).map((k) => ({
    chave: k,
    cor: COR_TRILHA[k],
    n: temas.filter((t) => t.trilha === k).reduce((s, t) => s + t.pessoas, 0),
  }));

  return (
    <div>
      <div role="tablist" aria-label="Trilhas" className="flex flex-wrap gap-2">
        {ABAS.map((a) => (
          <button
            key={a.chave}
            role="tab"
            aria-selected={aba === a.chave}
            onClick={() => setAba(a.chave)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition " +
              (aba === a.chave
                ? "bg-[var(--cor-primaria)] text-white"
                : "bg-[var(--cor-apoio)] text-[var(--cor-secundaria)] hover:opacity-80")
            }
          >
            {a.nome}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="mt-6 text-sm text-stone-500">Ainda não há temas nesta trilha.</p>
      ) : (
        <ol className="mt-5 space-y-3">
          {lista.map((t, i) => (
            <li key={t.nome}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 font-medium text-[var(--cor-secundaria)]">
                  <span className="mr-2 text-stone-400 tabular-nums">{i + 1}</span>
                  {t.nome}
                </span>
                <span className="shrink-0 tabular-nums text-stone-600">
                  {t.pessoas}
                  <span className="ml-2 hidden text-xs text-stone-400 sm:inline">
                    {NOME_TRILHA[t.trilha]}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-[var(--cor-apoio)]/30">
                <div
                  className="h-full rounded-full bg-[var(--cor-primaria)]"
                  style={{ width: `${Math.max(4, (t.pessoas / maximo) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      {totalPedidos > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Peso de cada trilha nos pedidos
          </p>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-[var(--cor-apoio)]/30">
            {porTrilha.map((t) => (
              <div
                key={t.chave}
                title={`${NOME_TRILHA[t.chave]}: ${t.n}`}
                className="h-full"
                style={{ width: `${(t.n / totalPedidos) * 100}%`, background: t.cor }}
              />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
            {porTrilha.map((t) => (
              <li key={t.chave} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: t.cor }}
                />
                {NOME_TRILHA[t.chave]} {Math.round((t.n / totalPedidos) * 100)}%
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
