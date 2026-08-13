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
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="text-display mt-5 max-w-2xl text-[1.5rem] leading-[1.2] text-ink sm:text-[2rem] lg:text-[2.25rem]">
        {title}
      </h2>
      <div className="mt-5 w-16 flow-line" aria-hidden="true" />
      {description && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-body sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
