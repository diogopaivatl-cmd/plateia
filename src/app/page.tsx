import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-700">
          Plateia
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Todo mundo que passou por você, em um só lugar
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-600">
          Reúna os participantes dos seus eventos, cursos e mentorias, entenda o
          seu público e fale com ele sem trabalho manual.
        </p>
        <Link
          href="/entrar"
          className="mt-10 inline-block rounded-full bg-violet-700 px-8 py-3 font-semibold text-white transition hover:bg-violet-800"
        >
          Entrar
        </Link>
      </div>
    </main>
  );
}
