import Link from "next/link";

export default function CtaBand() {
  return (
    <section className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h2 className="text-display mx-auto max-w-3xl text-[1.75rem] leading-[1.2] text-ink sm:text-[2.5rem] lg:text-[3rem]">
          Armá tu primer flujo hoy
        </h2>
        <div className="mx-auto mt-8 max-w-md flow-line" aria-hidden="true" />
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-body sm:text-lg">
          Crea un workflow, lanzá un asistente o simplemente conversá con un
          modelo — sin tarjeta de crédito.
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
