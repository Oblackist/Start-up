"""Compare arithmetic answers exactly, using a small grammar for numbers and roots."""
from __future__ import annotations

import ast
from fractions import Fraction
from math import gcd, isqrt
import re
import unicodedata

# Each entry represents a rational coefficient times the square root of a
# positive square-free integer. Key 1 is the rational part.
Terms = dict[int, Fraction]
_SIGNS = str.maketrans({"−": "-", "–": "-", "×": "*", "·": "*", "÷": "/", ",": ".", "^": "^"})
_POWERS = {"²": "^2", "³": "^3"}


def _rational(value: Fraction) -> Terms:
    return {1: value} if value else {}


def _add(left: Terms, right: Terms, sign: int) -> Terms:
    result = left.copy()
    for root, coeff in right.items():
        result[root] = result.get(root, Fraction()) + sign * coeff
    return {root: coeff for root, coeff in result.items() if coeff}


def _multiply(left: Terms, right: Terms) -> Terms:
    result: Terms = {}
    for first, a in left.items():
        for second, b in right.items():
            common = gcd(first, second)
            root = (first // common) * (second // common)
            result[root] = result.get(root, Fraction()) + a * b * common
    return {root: coeff for root, coeff in result.items() if coeff}


def _inverse(terms: Terms) -> Terms:
    rational = terms.get(1, Fraction())
    radicals = [(root, coeff) for root, coeff in terms.items() if root != 1]
    if not radicals:
        return _rational(1 / rational)
    if len(radicals) != 1:
        raise ValueError("Unsupported denominator")
    root, coeff = radicals[0]
    norm = rational**2 - root * coeff**2
    return {**_rational(rational / norm), root: -coeff / norm}


def _square_root(terms: Terms) -> Terms:
    if any(root != 1 for root in terms):
        raise ValueError("Expected rational radicand")
    value = terms.get(1, Fraction())
    a, b = isqrt(value.numerator), isqrt(value.denominator)
    if a*a == value.numerator and b*b == value.denominator:
        return _rational(Fraction(a, b))
    radicand = value.numerator * value.denominator
    if radicand > 1_000_000:
        raise ValueError("Radicand too large")
    factor = 1
    for divisor in range(2, isqrt(radicand) + 1):
        while radicand % (divisor * divisor) == 0:
            radicand //= divisor * divisor
            factor *= divisor
        if divisor * divisor > radicand:
            break
    return {radicand: Fraction(factor, value.denominator)}


def exact_math_value(answer: str) -> Terms | None:
    if len(answer) > 200:
        return None
    for symbol, replacement in _POWERS.items():
        answer = answer.replace(symbol, replacement)
    source = unicodedata.normalize("NFKC", answer).translate(_SIGNS).strip().casefold()
    source = re.sub(r"√\s*([0-9]+(?:\.[0-9]+)?)", r"sqrt(\1)", source)
    source = re.sub(r"√\s*\(", "sqrt(", source)
    source = re.sub(r"(?<=[0-9)])\s*(?=sqrt\()", "*", source)
    source = source.replace("^", "**")
    if not re.fullmatch(r"[0-9.sqrt+*/()\s-]+", source):
        return None

    def expression(node: ast.AST) -> Terms:
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            literal = ast.get_source_segment(source, node) or ""
            if not re.fullmatch(r"(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)", literal):
                raise ValueError("Expected decimal number")
            result = _rational(Fraction(literal))
        elif isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            sign = -1 if isinstance(node.op, ast.USub) else 1
            result = {root: sign * coeff for root, coeff in expression(node.operand).items()}
        elif (
            isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
            and node.func.id == "sqrt" and len(node.args) == 1 and not node.keywords
        ):
            result = _square_root(expression(node.args[0]))
        elif isinstance(node, ast.BinOp):
            left, right = expression(node.left), expression(node.right)
            if isinstance(node.op, (ast.Add, ast.Sub)):
                result = _add(left, right, -1 if isinstance(node.op, ast.Sub) else 1)
            elif isinstance(node.op, ast.Mult):
                result = _multiply(left, right)
            elif isinstance(node.op, ast.Div):
                result = _multiply(left, _inverse(right))
            elif isinstance(node.op, ast.Pow):
                exponent = right.get(1, Fraction())
                if any(root != 1 for root in right) or exponent.denominator != 1 or abs(exponent) > 6:
                    raise ValueError("Unsupported exponent")
                base = _inverse(left) if exponent < 0 else left
                result = _rational(Fraction(1))
                for _ in range(abs(int(exponent))):
                    result = _multiply(result, base)
                    check_size(result)
            else:
                raise ValueError("Unsupported operator")
        else:
            raise ValueError("Unsupported expression")
        check_size(result)
        return result

    def check_size(terms: Terms) -> None:
        if len(terms) > 24 or any(
            root.bit_length() > 80 or max(coeff.numerator.bit_length(), coeff.denominator.bit_length()) > 512
            for root, coeff in terms.items()
        ):
            raise ValueError("Expression too large")

    try:
        tree = ast.parse(source, mode="eval")
        if sum(1 for _ in ast.walk(tree)) <= 100:
            return expression(tree.body)
    except (SyntaxError, ValueError, ArithmeticError):
        pass
    return None
