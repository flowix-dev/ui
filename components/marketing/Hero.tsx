import Link from "next/link";
import DeviceMockup from "./DeviceMockup";

export default function Hero() {
  return (
    <section className="hero-wash">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 lg:pt-28">
        <span className="eyebrow justify-center">
          Plataforma de automatización
        </span>
        <h1 className="text-display mx-auto mt-6 max-w-4xl text-[1.75rem] leading-[1.15] tracking-[-0.03em] text-ink sm:text-[2.5rem] lg:text-[3.25rem]">
          Conectá nodos, no cables. Hacé que el trabajo fluya solo.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
          Armá flujos visuales que disparan HTTP, corren IA y avisan cuando algo
          pasa. O simplemente hablá con los modelos desde el mismo lugar.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary">
            Empezar gratis
          </Link>
          <Link href="#features" className="btn-secondary">
            Ver qué podés crear
          </Link>
        </div>
        <div className="mx-auto mt-8 max-w-md flow-line" aria-hidden="true" />
        <DeviceMockup />
      </div>
    </section>
  );
}
