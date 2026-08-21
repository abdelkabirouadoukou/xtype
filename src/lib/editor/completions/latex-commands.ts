export interface LatexCommand {
  trigger: string;
  label: string;
  detail: string;
  template: string;
  previewSource?: string;
  category: Category;
}

export type Category =
  | "arithmetic"
  | "greek"
  | "calculus"
  | "sets"
  | "logic"
  | "arrows"
  | "misc"
  | "structure";

const GREEK_LETTERS: Array<[string, string]> = [
  ["alpha", "α"],
  ["beta", "β"],
  ["gamma", "γ"],
  ["delta", "δ"],
  ["epsilon", "ε"],
  ["varepsilon", "ε"],
  ["zeta", "ζ"],
  ["eta", "η"],
  ["theta", "θ"],
  ["vartheta", "ϑ"],
  ["iota", "ι"],
  ["kappa", "κ"],
  ["lambda", "λ"],
  ["mu", "μ"],
  ["nu", "ν"],
  ["xi", "ξ"],
  ["pi", "π"],
  ["rho", "ρ"],
  ["sigma", "σ"],
  ["tau", "τ"],
  ["upsilon", "υ"],
  ["phi", "ϕ"],
  ["varphi", "φ"],
  ["chi", "χ"],
  ["psi", "ψ"],
  ["omega", "ω"],
  ["Gamma", "Γ"],
  ["Delta", "Δ"],
  ["Theta", "Θ"],
  ["Lambda", "Λ"],
  ["Xi", "Ξ"],
  ["Pi", "Π"],
  ["Sigma", "Σ"],
  ["Phi", "Φ"],
  ["Psi", "Ψ"],
  ["Omega", "Ω"],
];

function greekCommands(): LatexCommand[] {
  return GREEK_LETTERS.map(([name, glyph]) => ({
    trigger: `\\${name}`,
    label: `\\${name}`,
    detail: `Greek: ${glyph}`,
    template: `\\${name} `,
    category: "greek" as const,
  }));
}

type Cmd = [string, string, string, Category];

function build(defs: Cmd[]): LatexCommand[] {
  return defs.map(([trigger, label, detail, category]) => ({
    trigger,
    label,
    detail,
    template: label,
    previewSource: label,
    category,
  }));
}

function wrap(
  defs: Array<[string, string, string, string]>,
  category: Category,
): LatexCommand[] {
  return defs.map(([trigger, argCount, detail, sample]) => {
    const args = Array.from(
      { length: Number(argCount) },
      (_, i) => `{${i + 1}}`,
    ).join("");
    return {
      trigger,
      label: `${trigger}${args.replace(/\{\d+\}/g, "{}")}`,
      detail,
      template: `${trigger}${args}`,
      previewSource: sample,
      category,
    } satisfies LatexCommand;
  });
}

const ARITHMETIC = build([
  ["\\times", "\\times", "Multiplication: ×", "arithmetic"],
  ["\\div", "\\div", "Division: ÷", "arithmetic"],
  ["\\pm", "\\pm", "Plus-minus: ±", "arithmetic"],
  ["\\mp", "\\mp", "Minus-plus: ∓", "arithmetic"],
  ["\\cdot", "\\cdot", "Center dot: ⋅", "arithmetic"],
  ["\\leq", "\\leq", "Less or equal: ≤", "arithmetic"],
  ["\\geq", "\\geq", "Greater or equal: ≥", "arithmetic"],
  ["\\neq", "\\neq", "Not equal: ≠", "arithmetic"],
  ["\\approx", "\\approx", "Approximately: ≈", "arithmetic"],
  ["\\equiv", "\\equiv", "Equivalent: ≡", "arithmetic"],
  ["\\sim", "\\sim", "Similar: ∼", "arithmetic"],
  ["\\propto", "\\propto", "Proportional: ∝", "arithmetic"],
  ["\\degree", "^{\\circ}", "Degree sign", "arithmetic"],
]);

const CALCULUS = build([
  ["\\sum", "\\sum_{i=1}^{n}", "Summation", "calculus"],
  ["\\prod", "\\prod_{i=1}^{n}", "Product", "calculus"],
  ["\\int", "\\int_{a}^{b}", "Integral", "calculus"],
  ["\\iint", "\\iint_{D}", "Double integral", "calculus"],
  ["\\oint", "\\oint_{C}", "Contour integral", "calculus"],
  ["\\lim", "\\lim_{x \\to \\infty}", "Limit", "calculus"],
  ["\\partial", "\\partial", "Partial: ∂", "calculus"],
  ["\\nabla", "\\nabla", "Nabla: ∇", "calculus"],
  ["\\infty", "\\infty", "Infinity: ∞", "calculus"],
]);

const SETS = build([
  ["\\in", "\\in", "Element of: ∈", "sets"],
  ["\\notin", "\\notin", "Not element of: ∉", "sets"],
  ["\\subset", "\\subset", "Subset: ⊂", "sets"],
  ["\\subseteq", "\\subseteq", "Subset or equal: ⊆", "sets"],
  ["\\supset", "\\supset", "Superset: ⊃", "sets"],
  ["\\cup", "\\cup", "Union: ∪", "sets"],
  ["\\cap", "\\cap", "Intersection: ∩", "sets"],
  ["\\emptyset", "\\emptyset", "Empty set: ∅", "sets"],
  ["\\setminus", "\\setminus", "Set difference: ∖", "sets"],
  ["\\mathbb{R}", "\\mathbb{R}", "Real numbers: ℝ", "sets"],
  ["\\mathbb{Z}", "\\mathbb{Z}", "Integers: ℤ", "sets"],
  ["\\mathbb{N}", "\\mathbb{N}", "Natural numbers: ℕ", "sets"],
]);

const LOGIC = build([
  ["\\land", "\\land", "And: ∧", "logic"],
  ["\\lor", "\\lor", "Or: ∨", "logic"],
  ["\\neg", "\\neg", "Negation: ¬", "logic"],
  ["\\implies", "\\implies", "Implies: ⇒", "logic"],
  ["\\iff", "\\iff", "If and only if: ⇔", "logic"],
  ["\\forall", "\\forall", "For all: ∀", "logic"],
  ["\\exists", "\\exists", "There exists: ∃", "logic"],
]);

const ARROWS = build([
  ["\\to", "\\to", "Right arrow: →", "arrows"],
  ["\\rightarrow", "\\rightarrow", "Right arrow: →", "arrows"],
  ["\\leftarrow", "\\leftarrow", "Left arrow: ←", "arrows"],
  ["\\leftrightarrow", "\\leftrightarrow", "Left-right arrow: ↔", "arrows"],
  ["\\Rightarrow", "\\Rightarrow", "Double right arrow: ⇒", "arrows"],
  ["\\mapsto", "\\mapsto", "Maps to: ↦", "arrows"],
]);

const MISC = build([
  ["\\ldots", "\\ldots", "Low dots: …", "misc"],
  ["\\cdots", "\\cdots", "Center dots: ⋯", "misc"],
  ["\\perp", "\\perp", "Perpendicular: ⟂", "misc"],
  ["\\parallel", "\\parallel", "Parallel: ∥", "misc"],
  ["\\angle", "\\angle", "Angle: ∠", "misc"],
  ["\\prime", "\\prime", "Prime: ′", "misc"],
]);

const WRAPPERS: LatexCommand[] = [
  ...wrap(
    [
      ["\\sqrt", "1", "Square root", "\\sqrt{x}"],
      ["\\frac", "2", "Fraction", "\\frac{a}{b}"],
      ["\\binom", "2", "Binomial coefficient", "\\binom{n}{k}"],
      ["\\text", "1", "Text inside math", "\\text{text}"],
      ["\\mathbf", "1", "Bold math", "\\mathbf{B}"],
      ["\\mathrm", "1", "Roman math", "\\mathrm{d}x"],
      ["\\mathcal", "1", "Calligraphic", "\\mathcal{L}"],
      ["\\hat", "1", "Hat accent", "\\hat{x}"],
      ["\\bar", "1", "Bar accent", "\\bar{x}"],
      ["\\vec", "1", "Vector accent", "\\vec{v}"],
      ["\\tilde", "1", "Tilde accent", "\\tilde{x}"],
      ["\\overline", "1", "Overline", "\\overline{AB}"],
      ["\\underline", "1", "Underline", "\\underline{x}"],
      ["\\left(", "0", "Auto-sized ( ", "(x)"],
      ["\\begin{cases}", "0", "Cases environment", "\\begin{cases}a & x>0\\\\ b & x\\leq 0\\end{cases}"],
      ["\\begin{matrix}", "0", "Matrix environment", "\\begin{matrix}a & b\\\\ c & d\\end{matrix}"],
    ],
    "structure",
  ),
];

export const LATEX_COMMANDS: LatexCommand[] = [
  ...WRAPPERS,
  ...ARITHMETIC,
  ...CALCULUS,
  ...SETS,
  ...LOGIC,
  ...ARROWS,
  ...MISC,
  ...greekCommands(),
].sort((a, b) => a.trigger.localeCompare(b.trigger));

export const COMMAND_CATEGORIES: Record<Category, string> = {
  arithmetic: "Arithmetic",
  greek: "Greek letters",
  calculus: "Calculus",
  sets: "Sets",
  logic: "Logic",
  arrows: "Arrows",
  misc: "Miscellaneous",
  structure: "Structure",
};

export function filterCommands(prefix: string): LatexCommand[] {
  return LATEX_COMMANDS.filter((c) =>
    c.trigger.startsWith(prefix.toLowerCase()),
  );
}
