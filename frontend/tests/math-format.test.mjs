import assert from 'node:assert/strict';
import test from 'node:test';
import { splitMathText } from '../src/lib/mathFormat.ts';

const formulas = (text) =>
  splitMathText(text)
    .filter((part) => part.tex)
    .map((part) => part.tex);

test('keeps Azerbaijani prose and typesets numeric fractions', () => {
  assert.deepEqual(splitMathText('Ədədin 3/8 hissəsini tapın.'), [
    { text: 'Ədədin ' },
    { text: '3/8', tex: '\\frac{3}{8}' },
    { text: ' hissəsini tapın.' },
  ]);
  assert.deepEqual(formulas('Sürət 60 km/saat, tarix 20/11/2026.'), []);
});

test('root bar covers the entire nested grouped expression', () => {
  assert.deepEqual(formulas('Sadələşdirin: √(3 + 2√2)'), ['\\sqrt{3+2\\sqrt{2}}']);
  assert.deepEqual(formulas('∛125'), ['\\sqrt[3]{125}']);
});

test('typesets nested denominators, powers and subscripts', () => {
  assert.deepEqual(formulas('1/(√7 − √6)'), ['\\frac{1}{\\sqrt{7}-\\sqrt{6}}']);
  assert.deepEqual(formulas('1/x₁ + 1/x₂'), ['\\frac{1}{x_{1}}+\\frac{1}{x_{2}}']);
  assert.deepEqual(formulas('2^(−2)'), ['2^{-2}']);
  assert.deepEqual(formulas('b₁(qⁿ − 1)/(q − 1)'), ['\\frac{b_{1}\\left(q^{n}-1\\right)}{q-1}']);
});
