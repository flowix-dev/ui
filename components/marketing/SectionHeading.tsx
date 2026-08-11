type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={`flex flex-col ${centered ? "items-center text-center" : "items-start text-left"}`}
    >
      <span className="badge-pill">{eyebrow}</span>
      <h2 className="mt-5 max-w-2xl text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[2.25rem] lg:text-[2.5rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
