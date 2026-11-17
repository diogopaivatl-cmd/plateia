import Link from "next/link";
import { getContaAtual } from "@/lib/conta";
import { estiloDaMarca } from "@/lib/marca";

export default async function PainelLayout({ children }: LayoutProps<"/painel">) {
  const { conta } = await getContaAtual();
  const marca = conta?.marca;

  return (
    <div
      className="flex flex-1 flex-col bg-[var(--cor-fundo)]"
      style={estiloDaMarca(marca)}
    >
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
          <Link href="/painel" className="flex items-center gap-3">
            {marca?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={marca.logo_url}
                alt={conta?.nome ?? "Logo"}
                className="h-7 w-auto max-w-[220px] object-contain"
              />
            ) : (
              <span className="text-lg font-bold text-[var(--cor-primaria)]">
                {conta?.nome ?? "Plateia"}
              </span>
            )}
          </Link>

          <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm">
            {conta ? (
              <Link href="/painel" className="text-stone-600 hover:text-stone-900">
                Início
              </Link>
            ) : null}
            {conta ? (
              <>
                <Link href="/painel/pessoas" className="text-stone-600 hover:text-stone-900">
                  Pessoas
                </Link>
                <Link href="/painel/importar" className="text-stone-600 hover:text-stone-900">
                  Importar
                </Link>
              </>
            ) : null}
            {conta?.papel === "dono" ? (
              <Link href="/painel/marca" className="text-stone-600 hover:text-stone-900">
                Sua marca
              </Link>
            ) : null}
            <form action="/auth/sair" method="post">
              <button className="text-stone-600 hover:text-stone-900">Sair</button>
            </form>
          </nav>
        </div>
      </header>

      {children}

      <footer className="px-6 py-6 text-center text-xs text-stone-400">
        Feito com Plateia
      </footer>
    </div>
  );
}
