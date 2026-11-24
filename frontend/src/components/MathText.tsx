import katex from 'katex';
import 'katex/dist/katex.min.css';
import { splitMathText } from '../lib/mathFormat';

export function MathFormula({ tex, fallback }: { tex: string; fallback: string }) {
  try {
    const html = katex.renderToString(tex, { trust: false, strict: 'ignore' });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (error) {
    if (!(error instanceof katex.ParseError)) throw error;
    return <span>{fallback}</span>;
  }
}

export function MathText({ text, enabled = true }: { text: string; enabled?: boolean }) {
  if (!enabled) return text;
  return splitMathText(text).map((part, index) =>
    part.tex
      ? <MathFormula key={index} tex={part.tex} fallback={part.text} />
      : <span key={index}>{part.text}</span>,
  );
}
