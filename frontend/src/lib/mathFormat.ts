type MathPart = { text: string; tex?: string };
type Atom = { tex: string; argument: string; end: number };

const words = /\d+(?:[.,]\d+)?|[ⁿₙ]|(?:(?![ⁿₙ])[\p{L}\p{M}])+|\s+|./gu;
const symbol = /^[+\-−×·÷*/^=<>≤≥≈≠⇒±:()[\]|%°√∛⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿ⁽⁾₀₁₂₃₄₅₆₇₈₉ₙ]$/u;
const mathWord =
  /^(?:[A-Za-zαβγθπσ]|sin|cos|tan|tg|ctg|cot|log|ln|[xyz]{2,3}|ab|ac|bc|AB|AC|BC|ABC|[A-Za-zαβγθπσ]*[αβγθπσ][A-Za-zαβγθπσ]*)$/u;
const boundaries = /^[+\-−×·÷*=<>≤≥≈≠⇒±:]$/u;
const superscript = '⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿ⁽⁾';
const subscript = '₀₁₂₃₄₅₆₇₈₉ₙ';
const symbols: Record<string, string> = {
  '−': '-',
  '·': '\\cdot ',
  '×': '\\times ',
  '÷': '\\div ',
  '±': '\\pm ',
  '≤': '\\le ',
  '≥': '\\ge ',
  '≈': '\\approx ',
  '≠': '\\ne ',
  '⇒': '\\Rightarrow ',
  '°': '{}^\\circ ',
  '%': '\\%',
  π: '\\pi ',
  α: '\\alpha ',
  β: '\\beta ',
  γ: '\\gamma ',
  θ: '\\theta ',
  σ: '\\sigma ',
  sin: '\\sin ',
  cos: '\\cos ',
  tan: '\\tan ',
  tg: '\\operatorname{tg} ',
  ctg: '\\operatorname{ctg} ',
  cot: '\\cot ',
  log: '\\log ',
  ln: '\\ln ',
};

function tokenTex(token: string) {
  return (
    symbols[token] ?? token.replace(/[αβγθπσ,]/gu, (char) => (char === ',' ? '{,}' : symbols[char]))
  );
}

function readAtom(tokens: string[], start: number): Atom | undefined {
  const token = tokens[start];
  if (!token || boundaries.test(token) || /^[/^)\]]$/u.test(token)) return;
  const close = token === '(' ? ')' : token === '[' ? ']' : null;
  let end = start + 1;
  let tex = tokenTex(token);
  let argument = tex;

  if (close) {
    let depth = 1;
    while (end < tokens.length && depth > 0) {
      if (tokens[end] === token) depth++;
      if (tokens[end] === close) depth--;
      end++;
    }
    if (depth !== 0) return;
    argument = compile(tokens.slice(start + 1, end - 1));
    tex = '\\left' + token + argument + '\\right' + close;
  } else if (token === '√' || token === '∛') {
    const radicand = readAtom(tokens, end);
    if (!radicand) return;
    end = radicand.end;
    tex = '\\sqrt' + (token === '∛' ? '[3]' : '') + '{' + radicand.argument + '}';
    argument = tex;
  }

  while (end < tokens.length) {
    const suffix = tokens[end];
    if (suffix === '^') {
      const exponent = readAtom(tokens, end + 1);
      if (!exponent) break;
      tex += '^{' + exponent.argument + '}';
      end = exponent.end;
    } else if (superscript.includes(suffix) || subscript.includes(suffix)) {
      const isSuper = superscript.includes(suffix);
      const alphabet = isSuper ? superscript : subscript;
      const translated = isSuper ? '0123456789-+n()' : '0123456789n';
      let value = '';
      while (end < tokens.length && alphabet.includes(tokens[end])) {
        value += translated[alphabet.indexOf(tokens[end++])];
      }
      tex += (isSuper ? '^{' : '_{') + value + '}';
    } else {
      break;
    }
    argument = tex;
  }
  return { tex, argument, end };
}

function compile(tokens: string[]) {
  let rendered = '';
  let product: Atom[] = [];
  const argument = (atoms: Atom[]) =>
    atoms.length === 1 ? atoms[0].argument : atoms.map((atom) => atom.tex).join('');

  for (let index = 0; index < tokens.length;) {
    const token = tokens[index];
    if (token === '/' && product.length) {
      const right: Atom[] = [];
      let end = index + 1;
      let atom = readAtom(tokens, end);
      while (atom) {
        right.push(atom);
        end = atom.end;
        atom = readAtom(tokens, end);
      }
      if (right.length) {
        const value = '\\frac{' + argument(product) + '}{' + argument(right) + '}';
        product = [{ tex: value, argument: value, end }];
        index = end;
        continue;
      }
    }
    const atom = readAtom(tokens, index);
    if (atom) {
      product.push(atom);
      index = atom.end;
    } else {
      rendered += product.map((item) => item.tex).join('') + tokenTex(token);
      product = [];
      index++;
    }
  }
  return rendered + product.map((item) => item.tex).join('');
}

export function splitMathText(input: string): MathPart[] {
  const parts: MathPart[] = [];
  const plain = (text: string) => {
    if (!text) return;
    const previous = parts.at(-1);
    if (previous && !previous.tex) previous.text += text;
    else parts.push({ text });
  };
  const flush = (candidate: string) => {
    const text = candidate.replace(/^[\s:]+|[\s:+=\-−]+$/g, '');
    // A slash between prose words (such as km/saat) and calendar dates stay literal.
    if (
      !text ||
      !/[√∛/^⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ₀₁₂₃₄₅₆₇₈₉ₙ]/u.test(text) ||
      !/[\dA-Za-zπθαβ]/u.test(text) ||
      /^\d{1,2}\/\d{1,2}\/\d{4}$/u.test(text) ||
      /^\//u.test(text) ||
      /\/$/u.test(text)
    ) {
      plain(candidate);
      return;
    }
    const start = candidate.indexOf(text);
    plain(candidate.slice(0, start));
    const tokens = text.match(words)?.filter((token) => token.trim().length > 0) ?? [];
    parts.push({ text, tex: compile(tokens) });
    plain(candidate.slice(start + text.length));
  };

  let candidate = '';
  for (const token of input.match(words) ?? []) {
    if (/^(?:\d|\s)/u.test(token) || symbol.test(token) || mathWord.test(token)) {
      // Preserve line breaks in prose and avoid joining formulas on separate lines.
      if (!token.includes('\n')) {
        candidate += token;
        continue;
      }
    }
    flush(candidate);
    candidate = '';
    plain(token);
  }
  flush(candidate);
  return parts;
}
