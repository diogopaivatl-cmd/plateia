"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CoresMarca } from "@/lib/marca";
import { salvarMarca, type EstadoMarca } from "./actions";

type Inicial = {
  logo_url: string;
  logo_escuro_url: string;
  cores: CoresMarca;
  remetente_nome: string;
  remetente_email: string;
};

const ROTULOS: Record<keyof CoresMarca, { nome: string; ajuda: string }> = {
  primaria: { nome: "Principal", ajuda: "Botões e links" },
  secundaria: { nome: "Secundária", ajuda: "Títulos" },
  destaque: { nome: "Destaque", ajuda: "Detalhes e alertas" },
  apoio: { nome: "Apoio", ajuda: "Etiquetas e fundos de apoio" },
  fundo: { nome: "Fundo", ajuda: "Fundo das telas" },
};

const TIPOS = ["image/svg+xml", "image/png", "image/jpeg", "image/webp"];

export function FormularioMarca({ contaId, inicial }: { contaId: string; inicial: Inicial }) {
  const [estado, acao, salvando] = useActionState<EstadoMarca, FormData>(salvarMarca, {});
  const [logo, setLogo] = useState(inicial.logo_url);
  const [logoEscuro, setLogoEscuro] = useState(inicial.logo_escuro_url);
  const [cores, setCores] = useState<CoresMarca>(inicial.cores);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erroUpload, setErroUpload] = useState("");

  async function enviarLogo(arquivo: File, tipo: "logo" | "logo-escuro") {
    setErroUpload("");
    if (!TIPOS.includes(arquivo.type)) {
      setErroUpload("Envie um arquivo SVG, PNG, JPG ou WEBP.");
      return;
    }
    if (arquivo.size > 1024 * 1024) {
      setErroUpload("O arquivo precisa ter no máximo 1 MB.");
      return;
    }
    setEnviando(tipo);
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "png";
    const caminho = `${contaId}/${tipo}-${Date.now()}.${extensao}`;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("marcas")
      .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
    setEnviando(null);
    if (error) {
      setErroUpload("Não foi possível enviar o arquivo. Tente de novo.");
      return;
    }
    const { data } = supabase.storage.from("marcas").getPublicUrl(caminho);
    if (tipo === "logo") setLogo(data.publicUrl);
    else setLogoEscuro(data.publicUrl);
  }

  return (
    <form action={acao} className="mt-8 flex flex-col gap-8">
      <input type="hidden" name="logo_url" value={logo} />
      <input type="hidden" name="logo_escuro_url" value={logoEscuro} />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Logo</h2>
        <p className="mt-1 text-sm text-stone-600">De preferência em SVG, com fundo transparente.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <CampoLogo
            titulo="Para fundo claro"
            url={logo}
            fundo={cores.fundo}
            enviando={enviando === "logo"}
            onArquivo={(f) => enviarLogo(f, "logo")}
          />
          <CampoLogo
            titulo="Para fundo escuro (opcional)"
            url={logoEscuro}
            fundo={cores.secundaria}
            enviando={enviando === "logo-escuro"}
            onArquivo={(f) => enviarLogo(f, "logo-escuro")}
          />
        </div>
        {erroUpload ? <p className="mt-3 text-sm text-red-700">{erroUpload}</p> : null}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Cores</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {(Object.keys(ROTULOS) as (keyof CoresMarca)[]).map((chave) => (
            <label key={chave} className="flex items-center gap-3">
              <input
                type="color"
                value={cores[chave]}
                onChange={(e) => setCores({ ...cores, [chave]: e.target.value.toUpperCase() })}
                className="h-11 w-11 cursor-pointer rounded-lg border border-stone-200"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium">
                  {ROTULOS[chave].nome} <span className="font-normal text-stone-500">{cores[chave]}</span>
                </span>
                <span className="text-xs text-stone-500">{ROTULOS[chave].ajuda}</span>
              </span>
              <input type="hidden" name={`cor_${chave}`} value={cores[chave]} />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Remetente dos e-mails</h2>
        <p className="mt-1 text-sm text-stone-600">Como seus participantes vão ver suas newsletters.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Nome
            <input
              name="remetente_nome"
              defaultValue={inicial.remetente_nome}
              maxLength={120}
              className="rounded-xl border border-stone-300 px-4 py-3 text-base outline-none focus:border-[var(--cor-primaria)]"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            E-mail
            <input
              name="remetente_email"
              type="email"
              defaultValue={inicial.remetente_email}
              placeholder="contato@suamarca.com.br"
              className="rounded-xl border border-stone-300 px-4 py-3 text-base outline-none focus:border-[var(--cor-primaria)]"
            />
          </label>
        </div>
      </section>

      <section
        className="rounded-2xl p-6"
        style={{ background: cores.fundo }}
        aria-label="Prévia"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Prévia</p>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white px-5 py-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Logo" className="h-6 w-auto max-w-[200px] object-contain" />
          ) : (
            <span className="font-bold" style={{ color: cores.primaria }}>Sua marca</span>
          )}
          <span className="text-sm text-stone-500">Início</span>
        </div>
        <p className="mt-5 text-2xl font-bold" style={{ color: cores.secundaria }}>Seu painel</p>
        <button
          type="button"
          className="mt-4 rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ background: cores.primaria }}
        >
          Botão de exemplo
        </button>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={salvando || enviando !== null}
          className="rounded-full bg-[var(--cor-primaria)] px-8 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar marca"}
        </button>
        {estado.ok ? <p className="text-sm text-green-700">Marca salva.</p> : null}
        {estado.erro ? <p className="text-sm text-red-700">{estado.erro}</p> : null}
      </div>
    </form>
  );
}

function CampoLogo({
  titulo,
  url,
  fundo,
  enviando,
  onArquivo,
}: {
  titulo: string;
  url: string;
  fundo: string;
  enviando: boolean;
  onArquivo: (arquivo: File) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{titulo}</p>
      <div
        className="flex h-24 items-center justify-center rounded-xl border border-stone-200 px-4"
        style={{ background: fundo }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={titulo} className="max-h-12 w-auto max-w-full object-contain" />
        ) : (
          <span className="text-sm text-stone-400">Nenhum logo enviado</span>
        )}
      </div>
      <label className="cursor-pointer text-sm font-semibold text-[var(--cor-primaria)]">
        {enviando ? "Enviando..." : url ? "Trocar arquivo" : "Escolher arquivo"}
        <input
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/webp"
          className="sr-only"
          disabled={enviando}
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) onArquivo(arquivo);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
