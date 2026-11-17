"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Plateia } from "@/components/plateia";
import { CAMPOS, detectarFonte, sugerirCampo, type Campo } from "@/lib/importar/campos";
import { lerArquivo, type Planilha } from "@/lib/importar/ler-arquivo";
import { montarLinhas, type Montagem } from "@/lib/importar/montar";
import {
  contarExistentes,
  enviarLote,
  finalizarImportacao,
  prepararImportacao,
  type EscolhaProjeto,
} from "./actions";

type ProjetoExistente = { id: string; nome: string; tipo: string; data: string | null };

const TIPOS: { valor: Exclude<EscolhaProjeto, { modo: "existente" } | { modo: "nenhum" }>["tipo"]; rotulo: string }[] = [
  { valor: "palestra", rotulo: "Palestra" },
  { valor: "aula", rotulo: "Aula" },
  { valor: "workshop", rotulo: "Workshop" },
  { valor: "treinamento", rotulo: "Treinamento" },
  { valor: "vivencia", rotulo: "Vivência" },
  { valor: "mentoria", rotulo: "Mentoria" },
  { valor: "outro", rotulo: "Outro" },
];

const PASSOS = ["Projeto", "Planilha", "Colunas", "Revisão"] as const;
const TAMANHO_LOTE = 500;

const FONTES = {
  sympla: "Parece uma lista de participantes do Sympla.",
  google_forms: "Parece uma planilha de respostas do Google Forms.",
  planilha: "Planilha lida.",
};

type Resultado = { novas: number; existentes: number; fora: number };

export function Assistente({ projetos }: { projetos: ProjetoExistente[] }) {
  const [passo, setPasso] = useState(0);

  // Passo 1
  const [modo, setModo] = useState<EscolhaProjeto["modo"]>(projetos.length ? "existente" : "novo");
  const [projetoId, setProjetoId] = useState(projetos[0]?.id ?? "");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<(typeof TIPOS)[number]["valor"]>("palestra");
  const [novaData, setNovaData] = useState("");

  // Passo 2
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [planilha, setPlanilha] = useState<Planilha | null>(null);
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const entradaArquivo = useRef<HTMLInputElement>(null);

  // Passo 3
  const [mapa, setMapa] = useState<Campo[]>([]);

  // Passo 4
  const [montagem, setMontagem] = useState<Montagem | null>(null);
  const [existentes, setExistentes] = useState(0);
  const [conferindo, setConferindo] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const [erro, setErro] = useState("");

  const fonte = useMemo(() => (planilha ? detectarFonte(planilha.cabecalhos) : "planilha"), [planilha]);

  const escolhaProjeto: EscolhaProjeto =
    modo === "existente"
      ? { modo, id: projetoId }
      : modo === "novo"
        ? { modo, nome: novoNome, tipo: novoTipo, data: novaData }
        : { modo: "nenhum" };

  const nomeDoProjeto =
    modo === "existente"
      ? projetos.find((p) => p.id === projetoId)?.nome
      : modo === "novo"
        ? novoNome.trim()
        : null;

  function irPara(n: number) {
    setErro("");
    setPasso(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validarProjeto() {
    if (modo === "novo" && novoNome.trim().length < 2) {
      setErro("Dê um nome ao projeto, por exemplo: Presença em Pauta — novembro.");
      return;
    }
    if (modo === "existente" && !projetoId) {
      setErro("Escolha um projeto da lista.");
      return;
    }
    irPara(1);
  }

  async function receberArquivo(f: File) {
    setErro("");
    setLendo(true);
    try {
      const lida = await lerArquivo(f);
      setArquivo(f);
      setPlanilha(lida);
      setMapa(lida.cabecalhos.map(sugerirCampo));
    } catch (e) {
      setArquivo(null);
      setPlanilha(null);
      setErro(e instanceof Error ? e.message : "Não foi possível ler este arquivo.");
    } finally {
      setLendo(false);
    }
  }

  async function revisar() {
    if (!planilha) return;
    const m = montarLinhas(planilha, mapa);
    if (!m.temEmail) {
      setErro("Escolha qual coluna tem o e-mail. É por ele que reconhecemos cada pessoa.");
      return;
    }
    if (m.linhas.length === 0) {
      setErro("Nenhuma linha tem um e-mail válido. Confira se a coluna escolhida é mesmo a do e-mail.");
      return;
    }
    setConferindo(true);
    setErro("");
    try {
      setExistentes(await contarExistentes(m.linhas.map((l) => l.email)));
      setMontagem(m);
      irPara(3);
    } catch {
      setErro("Não foi possível conferir sua base agora. Tente de novo.");
    } finally {
      setConferindo(false);
    }
  }

  async function importar() {
    if (!montagem || !arquivo) return;
    setErro("");
    setProgresso(0);
    const preparo = await prepararImportacao({
      projeto: escolhaProjeto,
      arquivo: arquivo.name,
      fonte,
      perguntas: montagem.perguntas,
    });
    if (!preparo.ok) {
      setErro(preparo.erro);
      setProgresso(null);
      return;
    }

    let novas = 0;
    let atualizadas = 0;
    for (let i = 0; i < montagem.linhas.length; i += TAMANHO_LOTE) {
      const r = await enviarLote({
        importacaoId: preparo.importacaoId,
        projetoId: preparo.projetoId,
        formularioId: preparo.formularioId,
        linhas: montagem.linhas.slice(i, i + TAMANHO_LOTE),
      });
      if (!r.ok) {
        setErro(`${r.erro} ${novas + atualizadas} pessoas já tinham entrado antes da falha.`);
        setProgresso(null);
        return;
      }
      novas += r.novas;
      atualizadas += r.existentes;
      setProgresso(Math.min(1, (i + TAMANHO_LOTE) / montagem.linhas.length));
    }

    await finalizarImportacao();
    setResultado({ novas, existentes: atualizadas, fora: montagem.semEmail + montagem.repetidas });
    setProgresso(null);
    setPasso(4);
  }

  function recomecar() {
    setArquivo(null);
    setPlanilha(null);
    setMapa([]);
    setMontagem(null);
    setResultado(null);
    irPara(0);
  }

  // ——— Conclusão ———
  if (passo === 4 && resultado) {
    return (
      <section className="mx-auto max-w-3xl text-center">
        <div className="mx-auto max-w-xl text-[var(--cor-secundaria)]">
          <Plateia
            animar
            rotulo={`${resultado.novas} pessoas novas e ${resultado.existentes} já existentes`}
            grupos={[
              { quantidade: resultado.novas, cor: "var(--cor-primaria)" },
              { quantidade: resultado.existentes, cor: "var(--cor-secundaria)" },
            ]}
          />
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-[var(--cor-secundaria)] sm:text-5xl">
          {resultado.novas === 1 ? "1 pessoa nova" : `${resultado.novas.toLocaleString("pt-BR")} pessoas novas`} na sua base
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-stone-600">
          {resultado.existentes > 0
            ? `${resultado.existentes.toLocaleString("pt-BR")} pessoas já estavam na base e tiveram a ficha completada. `
            : ""}
          {nomeDoProjeto ? `Todas ficaram ligadas a "${nomeDoProjeto}". ` : ""}
          {resultado.fora > 0 ? `${resultado.fora} linhas ficaram de fora por falta de e-mail ou repetição.` : ""}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/painel/pessoas"
            className="rounded-full bg-[var(--cor-primaria)] px-7 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Ver pessoas
          </Link>
          <button
            onClick={recomecar}
            className="rounded-full px-7 py-3 font-semibold text-[var(--cor-secundaria)] ring-1 ring-black/15 transition hover:bg-white"
          >
            Importar outra planilha
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
      {/* Etapas: são uma sequência de fato, por isso numeradas */}
      <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Etapas da importação">
        {PASSOS.map((nome, i) => {
          const atual = i === passo;
          const feito = i < passo;
          return (
            <li key={nome}>
              <button
                type="button"
                disabled={i > passo || progresso !== null}
                onClick={() => irPara(i)}
                aria-current={atual ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  atual ? "bg-white font-semibold shadow-sm" : feito ? "text-stone-700 hover:bg-white/60" : "text-stone-400"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    atual || feito ? "bg-[var(--cor-primaria)] text-white" : "bg-black/5 text-stone-500"
                  }`}
                >
                  {feito ? "✓" : i + 1}
                </span>
                <span className="whitespace-nowrap">{nome}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <section className="min-w-0 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10">
        {erro ? (
          <p role="alert" className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {erro}
          </p>
        ) : null}

        {/* ——— 1. Projeto ——— */}
        {passo === 0 ? (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--cor-secundaria)]">
              De qual projeto é esta planilha?
            </h2>
            <p className="mt-2 text-stone-600">
              Cada pessoa importada fica ligada ao projeto, para você saber depois quem esteve onde.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Opcao ativa={modo === "novo"} onClick={() => setModo("novo")} titulo="Um projeto novo" texto="Uma palestra, aula ou turma que ainda não está aqui." />
              <Opcao
                ativa={modo === "existente"}
                onClick={() => setModo("existente")}
                desativada={projetos.length === 0}
                titulo="Um projeto que já existe"
                texto={projetos.length ? `${projetos.length} na sua lista` : "Nenhum projeto ainda"}
              />
              <Opcao ativa={modo === "nenhum"} onClick={() => setModo("nenhum")} titulo="Nenhum projeto" texto="Só quero trazer pessoas para a base." />
            </div>

            {modo === "novo" ? (
              <div className="mt-8 grid gap-5">
                <label className="flex flex-col gap-2 text-sm font-medium">
                  Nome do projeto
                  <input
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex.: Presença em Pauta — aula de novembro"
                    maxLength={120}
                    className="rounded-xl border border-stone-300 px-4 py-3 text-base outline-none focus:border-[var(--cor-primaria)] focus:ring-2 focus:ring-[var(--cor-primaria)]/20"
                  />
                </label>
                <fieldset>
                  <legend className="text-sm font-medium">Formato</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TIPOS.map((t) => (
                      <button
                        type="button"
                        key={t.valor}
                        onClick={() => setNovoTipo(t.valor)}
                        aria-pressed={novoTipo === t.valor}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                          novoTipo === t.valor
                            ? "bg-[var(--cor-secundaria)] text-white"
                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                        }`}
                      >
                        {t.rotulo}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="flex max-w-xs flex-col gap-2 text-sm font-medium">
                  Data (opcional)
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="rounded-xl border border-stone-300 px-4 py-3 text-base outline-none focus:border-[var(--cor-primaria)]"
                  />
                </label>
              </div>
            ) : null}

            {modo === "existente" && projetos.length ? (
              <label className="mt-8 flex max-w-md flex-col gap-2 text-sm font-medium">
                Projeto
                <select
                  value={projetoId}
                  onChange={(e) => setProjetoId(e.target.value)}
                  className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-[var(--cor-primaria)]"
                >
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                      {p.data ? ` · ${new Date(p.data + "T12:00").toLocaleDateString("pt-BR")}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <Rodape>
              <BotaoPrincipal onClick={validarProjeto}>Continuar</BotaoPrincipal>
            </Rodape>
          </div>
        ) : null}

        {/* ——— 2. Planilha ——— */}
        {passo === 1 ? (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--cor-secundaria)]">Envie a planilha</h2>
            <p className="mt-2 text-stone-600">
              A lista de participantes do Sympla, as respostas do Google Forms ou qualquer planilha com e-mails.
            </p>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastando(false);
                const f = e.dataTransfer.files?.[0];
                if (f) receberArquivo(f);
              }}
              className={`mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
                arrastando ? "border-[var(--cor-primaria)] bg-[var(--cor-primaria)]/5" : "border-stone-300 bg-stone-50/60"
              }`}
            >
              {lendo ? (
                <p className="text-stone-600">Lendo a planilha...</p>
              ) : planilha && arquivo ? (
                <>
                  <p className="text-lg font-semibold">{arquivo.name}</p>
                  <p className="mt-1 text-stone-600">
                    {planilha.linhas.length.toLocaleString("pt-BR")} linhas e {planilha.cabecalhos.length} colunas.{" "}
                    {FONTES[fonte]}
                  </p>
                  <button
                    type="button"
                    onClick={() => entradaArquivo.current?.click()}
                    className="mt-4 text-sm font-semibold text-[var(--cor-primaria)] underline-offset-4 hover:underline"
                  >
                    Trocar arquivo
                  </button>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold">Arraste a planilha para cá</p>
                  <p className="mt-1 text-stone-600">Arquivos .csv ou .xlsx</p>
                  <button
                    type="button"
                    onClick={() => entradaArquivo.current?.click()}
                    className="mt-5 rounded-full bg-[var(--cor-secundaria)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Escolher arquivo
                  </button>
                </>
              )}
              <input
                ref={entradaArquivo}
                type="file"
                accept=".csv,.xlsx,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) receberArquivo(f);
                  e.target.value = "";
                }}
              />
            </div>

            <p className="mt-4 text-sm text-stone-500">
              Quer testar antes? Use uma planilha de exemplo:{" "}
              <a className="font-medium text-[var(--cor-primaria)] hover:underline" href="/exemplos/sympla-participantes.csv" download>
                participantes do Sympla
              </a>{" "}
              ou{" "}
              <a className="font-medium text-[var(--cor-primaria)] hover:underline" href="/exemplos/google-forms-temas.csv" download>
                respostas do Google Forms
              </a>
              .
            </p>

            <Rodape>
              <BotaoSecundario onClick={() => irPara(0)}>Voltar</BotaoSecundario>
              <BotaoPrincipal disabled={!planilha} onClick={() => irPara(2)}>
                Continuar
              </BotaoPrincipal>
            </Rodape>
          </div>
        ) : null}

        {/* ——— 3. Colunas ——— */}
        {passo === 2 && planilha ? (
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--cor-secundaria)]">O que é cada coluna?</h2>
            <p className="mt-2 text-stone-600">
              Já sugerimos o que reconhecemos. Confira e ajuste o que precisar. O e-mail é obrigatório.
            </p>

            <ul className="mt-8 divide-y divide-stone-100 rounded-2xl ring-1 ring-stone-200">
              {planilha.cabecalhos.map((cab, i) => {
                const exemplos = planilha.linhas.map((l) => l[i]).filter(Boolean).slice(0, 3);
                const ignorada = mapa[i] === "ignorar";
                return (
                  <li key={i} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_240px] sm:items-center">
                    <div className={`min-w-0 ${ignorada ? "opacity-50" : ""}`}>
                      <p className="truncate font-semibold" title={cab}>
                        {cab}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-stone-500">
                        {exemplos.length ? exemplos.join("  ·  ") : "Coluna vazia"}
                      </p>
                    </div>
                    <select
                      aria-label={`Significado da coluna ${cab}`}
                      value={mapa[i]}
                      onChange={(e) => {
                        const novo = [...mapa];
                        novo[i] = e.target.value as Campo;
                        setMapa(novo);
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[var(--cor-primaria)] ${
                        mapa[i] === "email"
                          ? "border-[var(--cor-primaria)] bg-[var(--cor-primaria)]/5 font-semibold"
                          : "border-stone-300 bg-white"
                      }`}
                    >
                      {CAMPOS.map((c) => (
                        <option key={c.valor} value={c.valor}>
                          {c.rotulo}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>

            <p className="mt-4 text-sm text-stone-500">
              Ninguém entra na lista da newsletter só por estar na planilha. Isso só acontece se houver uma coluna de aceite com
              resposta &quot;sim&quot;.
            </p>

            <Rodape>
              <BotaoSecundario onClick={() => irPara(1)}>Voltar</BotaoSecundario>
              <BotaoPrincipal disabled={conferindo} onClick={revisar}>
                {conferindo ? "Conferindo sua base..." : "Revisar importação"}
              </BotaoPrincipal>
            </Rodape>
          </div>
        ) : null}

        {/* ——— 4. Revisão ——— */}
        {passo === 3 && montagem ? (
          <Revisao
            montagem={montagem}
            existentes={existentes}
            projeto={nomeDoProjeto}
            temPresenca={mapa.includes("presenca")}
            progresso={progresso}
            onVoltar={() => irPara(2)}
            onImportar={importar}
          />
        ) : null}
      </section>
    </div>
  );
}

export function Revisao({
  montagem,
  existentes,
  projeto,
  temPresenca,
  progresso,
  onVoltar,
  onImportar,
}: {
  montagem: Montagem;
  existentes: number;
  projeto: string | null | undefined;
  temPresenca: boolean;
  progresso: number | null;
  onVoltar: () => void;
  onImportar: () => void;
}) {
  const total = montagem.linhas.length;
  const novas = Math.max(0, total - existentes);
  const fora = montagem.semEmail + montagem.repetidas;
  const presentes = montagem.linhas.filter((l) => l.presente).length;
  const aceites = montagem.linhas.filter((l) => l.consentimento === true).length;
  const comTemas = montagem.linhas.filter((l) => l.temas?.length).length;
  const fmt = (n: number) => n.toLocaleString("pt-BR");

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-[var(--cor-secundaria)]">Pronto para importar</h2>
      <p className="mt-2 text-stone-600">Confira quem vai entrar. Nada é gravado antes de você confirmar.</p>

      <div className="mt-8 grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
        <div className="text-[var(--cor-secundaria)]">
          <Plateia
            rotulo={`${novas} novas, ${existentes} já na base, ${fora} fora`}
            grupos={[
              { quantidade: novas, cor: "var(--cor-primaria)" },
              { quantidade: existentes, cor: "var(--cor-secundaria)" },
              { quantidade: fora, cor: "#a8a29e", vazado: true },
            ]}
          />
        </div>
        <dl className="grid gap-5">
          <Legenda cor="var(--cor-primaria)" numero={fmt(novas)} texto={novas === 1 ? "pessoa nova" : "pessoas novas"} />
          <Legenda
            cor="var(--cor-secundaria)"
            numero={fmt(existentes)}
            texto="já estão na base"
            detalhe="Mantemos o que já existe e completamos o que faltar."
          />
          {fora > 0 ? (
            <Legenda
              cor="#a8a29e"
              vazado
              numero={fmt(fora)}
              texto="ficam de fora"
              detalhe={[
                montagem.semEmail ? `${fmt(montagem.semEmail)} sem e-mail válido` : "",
                montagem.repetidas
                  ? `${fmt(montagem.repetidas)} ${montagem.repetidas === 1 ? "repetida" : "repetidas"} na planilha`
                  : "",
              ]
                .filter(Boolean)
                .join(" e ")}
            />
          ) : null}
        </dl>
      </div>

      <ul className="mt-8 grid gap-2 rounded-2xl bg-stone-50 p-5 text-sm text-stone-700">
        <li>{projeto ? `Projeto: ${projeto}` : "Sem projeto: as pessoas entram só na base."}</li>
        {projeto && temPresenca ? <li>{fmt(presentes)} marcadas como presentes.</li> : null}
        {comTemas ? <li>{fmt(comTemas)} pessoas com temas de interesse.</li> : null}
        {montagem.perguntas.length ? <li>{montagem.perguntas.length} perguntas guardadas como resposta.</li> : null}
        <li>
          {aceites
            ? `${fmt(aceites)} aceitaram receber newsletter.`
            : "Ninguém será incluído na newsletter: a planilha não tem aceite."}
        </li>
      </ul>

      {progresso !== null ? (
        <div className="mt-8" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-[var(--cor-primaria)] transition-[width] duration-300"
              style={{ width: `${Math.max(4, progresso * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-stone-500">Importando...</p>
        </div>
      ) : null}

      <Rodape>
        <BotaoSecundario disabled={progresso !== null} onClick={onVoltar}>
          Voltar
        </BotaoSecundario>
        <BotaoPrincipal disabled={progresso !== null} onClick={onImportar}>
          Importar {fmt(total)} {total === 1 ? "pessoa" : "pessoas"}
        </BotaoPrincipal>
      </Rodape>
    </div>
  );
}

function Legenda({
  cor,
  numero,
  texto,
  detalhe,
  vazado,
}: {
  cor: string;
  numero: string;
  texto: string;
  detalhe?: string;
  vazado?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="mt-2 h-3.5 w-3.5 shrink-0 rounded-full"
        style={vazado ? { border: `2px solid ${cor}` } : { background: cor }}
      />
      <div>
        <dt className="sr-only">{texto}</dt>
        <dd>
          <span className="text-3xl font-bold tabular-nums text-[var(--cor-secundaria)]">{numero}</span>{" "}
          <span className="text-stone-700">{texto}</span>
          {detalhe ? <span className="mt-0.5 block text-sm text-stone-500">{detalhe}</span> : null}
        </dd>
      </div>
    </div>
  );
}

function Opcao({
  ativa,
  desativada,
  onClick,
  titulo,
  texto,
}: {
  ativa: boolean;
  desativada?: boolean;
  onClick: () => void;
  titulo: string;
  texto: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativada}
      aria-pressed={ativa}
      className={`rounded-2xl p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
        ativa
          ? "bg-[var(--cor-primaria)]/[0.06] ring-2 ring-[var(--cor-primaria)]"
          : "ring-1 ring-stone-200 hover:ring-stone-300"
      }`}
    >
      <span className="block font-semibold">{titulo}</span>
      <span className="mt-1 block text-sm text-stone-500">{texto}</span>
    </button>
  );
}

function Rodape({ children }: { children: React.ReactNode }) {
  return <div className="mt-10 flex flex-wrap items-center justify-end gap-3 border-t border-stone-100 pt-6">{children}</div>;
}

function BotaoPrincipal(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-full bg-[var(--cor-primaria)] px-7 py-3 font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cor-primaria)] disabled:opacity-50"
    />
  );
}

function BotaoSecundario(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-full px-6 py-3 font-semibold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
    />
  );
}
