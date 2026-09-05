interface HeroPortraitProps {
  /** Real photo/illustration path, once the owner supplies one. Omit to
   * render the placeholder monogram — this is the entire swap mechanism:
   * one prop, no layout change, no other file to touch. */
  src?: string;
}

export function HeroPortrait({ src }: HeroPortraitProps) {
  if (src) {
    return (
      <img
        src={src}
        alt="Tejit Pabari"
        className="h-auto w-full max-w-[160px] object-contain sm:max-w-[190px] md:max-w-[210px] lg:max-w-[230px]"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex aspect-square w-full max-w-[160px] items-center justify-center rounded-panel border border-teal-secondary/15 bg-placeholder text-[2.5rem] font-extrabold tracking-tight text-teal-secondary sm:max-w-[190px] md:max-w-[210px] lg:max-w-[230px]"
    >
      TP
    </div>
  );
}
