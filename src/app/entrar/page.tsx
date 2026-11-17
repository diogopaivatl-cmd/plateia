import { FormularioEntrar } from "./formulario";

export const metadata = { title: "Entrar · Plateia" };

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { erro } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
          Plateia
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Entrar</h1>
        <p className="mt-2 text-stone-600">
          Enviamos um link de acesso para o seu e-mail. Sem senha.
        </p>
        {erro ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            O link expirou ou já foi usado. Peça um novo abaixo.
          </p>
        ) : null}
        <FormularioEntrar />
      </div>
    </main>
  );
}
