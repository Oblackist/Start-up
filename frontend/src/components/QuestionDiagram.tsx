export function QuestionDiagram({ svg }: { svg: string }) {
  // Inline SVGs in the bank use currentColor for labels and geometry.
  // Give the standalone image an explicit drawing color on its light canvas.
  const drawing = svg.replace(/\bcurrentColor\b/g, '#172635');

  return (
    <figure
      aria-label="Sualın şəkli"
      className="m-0 flex justify-center rounded-2xl border border-stone-200 bg-stone-50 px-3 py-4 dark:border-stone-700 dark:bg-inset-dark"
    >
      <img
        src={'data:image/svg+xml,' + encodeURIComponent(drawing)}
        alt="Suala aid həndəsi sxem"
        width={320}
        height={220}
        className="block h-auto w-full max-w-sm rounded-xl bg-white object-contain"
      />
    </figure>
  );
}
