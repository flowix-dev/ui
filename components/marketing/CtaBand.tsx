import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h2 className="mx-auto max-w-3xl text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[2.75rem] lg:text-[3.5rem]">
          Empieza a automatizar hoy
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-body sm:text-lg">
          Crea tu primer workflow, lanza un asistente o simplemente conversa con
          un modelo — sin tarjeta de crédito.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary">
            Empezar gratis
          </Link>
          <Link href="/login" className="btn-secondary">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  );
}
