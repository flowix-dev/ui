import Link from "next/link";
import DeviceMockup from "./DeviceMockup";

export default function Hero() {
  return (
    <section className="hero-wash">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 lg:pt-28">
        <span className="badge-pill">Plataforma de IA</span>
        <h1 className="mx-auto mt-6 max-w-4xl text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[3rem] lg:text-[4rem] lg:leading-[1.05]">
          Automatización, asistentes y chat con IA en un solo lugar
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
          Crea workflows de automatización, asistentes y chatbots, y conversa
          con los modelos más avanzados — todo desde una sola plataforma.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary">
            Empezar gratis
          </Link>
          <Link href="#features" className="btn-secondary">
            Ver qué puedes crear
          </Link>
        </div>
        <DeviceMockup />
      </div>
    </section>
  );
}
