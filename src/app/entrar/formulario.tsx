"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Estado = "parado" | "enviando" | "enviado" | "erro";

export function FormularioEntrar() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("parado");
  const [mensagem, setMensagem] = useState("");

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEstado("enviando");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Piloto fechado: só entra quem já foi cadastrado no Supabase.
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/confirmar`,
      },
    });

    if (error) {
      setEstado("erro");
      setMensagem(
        "Não conseguimos enviar o link. Confira o e-mail ou fale com o suporte da Plateia.",
      );
      return;
    }

    setEstado("enviado");
  }

  if (estado === "enviado") {
    return (
      <div className="mt-8 rounded-2xl border border-violet-200 bg-white p-6">
        <p className="font-semibold">Confira seu e-mail</p>
        <p className="mt-2 text-sm text-stone-600">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra o link
          neste mesmo navegador.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium">
        E-mail
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-200"
          placeholder="voce@exemplo.com"
        />
      </label>
      <button
        type="submit"
        disabled={estado === "enviando"}
        className="rounded-full bg-violet-700 px-6 py-3 font-semibold text-white transition hover:bg-violet-800 disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando..." : "Receber link de acesso"}
      </button>
      {estado === "erro" ? (
        <p className="text-sm text-red-700">{mensagem}</p>
      ) : null}
    </form>
  );
}
