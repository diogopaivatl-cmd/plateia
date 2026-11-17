"use client";

import { useActionState } from "react";
import { criarConta, type EstadoCriarConta } from "./actions";

const inicial: EstadoCriarConta = {};

export function CriarConta() {
  const [estado, acao, pendente] = useActionState(criarConta, inicial);

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8">
      <h2 className="text-2xl font-bold tracking-tight">Boas-vindas à Plateia</h2>
      <p className="mt-2 text-stone-600">
        Para começar, diga como sua marca ou seu trabalho se chama. É esse nome
        que seus participantes vão ver.
      </p>
      <form action={acao} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Nome da marca
          <input
            name="nome"
            required
            minLength={2}
            maxLength={120}
            placeholder="Ex.: Presença Plena"
            className="rounded-xl border border-stone-300 px-4 py-3 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
          />
        </label>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-full bg-violet-700 px-6 py-3 font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60"
        >
          {pendente ? "Criando..." : "Criar minha conta"}
        </button>
        {estado.erro ? (
          <p className="text-sm text-red-700">{estado.erro}</p>
        ) : null}
      </form>
    </div>
  );
}
