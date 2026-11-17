import { redirect } from "next/navigation";
import { getContaAtual } from "@/lib/conta";
import { coresDaMarca } from "@/lib/marca";
import { FormularioMarca } from "./formulario";

export const metadata = { title: "Sua marca · Plateia" };

export default async function MarcaPage() {
  const { conta } = await getContaAtual();
  if (!conta) redirect("/painel");

  if (conta.papel !== "dono") {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <p className="text-stone-600">Só a dona ou o dono da conta pode alterar a marca.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--cor-secundaria)]">Sua marca</h1>
      <p className="mt-2 text-stone-600">
        É assim que seus participantes e você vão ver a Plateia: com o seu logo, as suas cores e o
        seu nome nos e-mails.
      </p>
      <FormularioMarca
        contaId={conta.id}
        inicial={{
          logo_url: conta.marca.logo_url ?? "",
          logo_escuro_url: conta.marca.logo_escuro_url ?? "",
          cores: coresDaMarca(conta.marca),
          remetente_nome: conta.marca.remetente?.nome ?? conta.nome,
          remetente_email: conta.marca.remetente?.email ?? "",
        }}
      />
    </main>
  );
}
