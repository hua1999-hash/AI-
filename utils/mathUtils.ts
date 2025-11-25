
/**
 * Safely parses a math string like "5*sqrt(2)"
 */
export const parseMathString = (str: string): number => {
  try {
    const sanitized = str.toLowerCase()
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/√/g, 'Math.sqrt');
    
    // Basic security check: only allow numbers, math operators, and Math.sqrt
    if (/[^0-9\.\+\-\*\/\(\)\ Math\.sqrt]/.test(sanitized)) {
      return NaN;
    }
    
    // Using Function here is a conscious choice for a calculator-like feature 
    // where we need to evaluate user input. The regex above limits scope.
    // eslint-disable-next-line no-new-func
    return Function('"use strict";return (' + sanitized + ')')();
  } catch (e) {
    return NaN;
  }
};

/**
 * Simplifies a square root for LaTeX display
 */
const simplifySqrt = (n: number): { out: number; in: number } => {
  if (n < 0) return { out: 1, in: n };
  const rounded = Math.round(n * 1e5) / 1e5;
  let num = n;
  
  if (Math.abs(num - Math.round(num)) < 1e-5) {
    num = Math.round(num);
  }
  
  for (let i = Math.floor(Math.sqrt(num)); i >= 1; i--) {
    if (num % (i * i) === 0) {
      return { out: i, in: num / (i * i) };
    }
  }
  return { out: 1, in: num };
};

/**
 * Generates LaTeX strings for the solution
 */
const generateLatex = (S1: number, deltaVal: number): { min: string; max: string } => {
  let sqrtPart = "";
  const d = deltaVal;
  
  if (Math.abs(d - Math.round(d)) < 1e-4) {
    const s = simplifySqrt(Math.round(d));
    if (s.in === 0) sqrtPart = "0";
    else if (s.in === 1) sqrtPart = `${s.out}`;
    else if (s.out === 1) sqrtPart = `\\sqrt{${s.in}}`;
    else sqrtPart = `${s.out}\\sqrt{${s.in}}`;
  } else {
    sqrtPart = `\\sqrt{${d.toFixed(2)}}`;
  }

  const s1Fixed = parseFloat(S1.toFixed(2));
  // The formula is (S1 +/- sqrt(delta/4)) / 3
  const nMin = `${s1Fixed} - ${sqrtPart}`;
  const nMax = `${s1Fixed} + ${sqrtPart}`;
  
  return { 
    min: `h_A = \\frac{${nMin}}{3}`, 
    max: `h_A = \\frac{${nMax}}{3}` 
  };
};

/**
 * Solves the quadratic equation for the height of A
 */
export const solveTetrahedron = (
  L: number, 
  hB: number, 
  hC: number, 
  hD: number
) => {
  const S1 = hB + hC + hD;
  const S2 = hB * hB + hC * hC + hD * hD;
  const S_cross = hB * hC + hC * hD + hD * hB;

  // Formula derivation: 3*hA^2 - 2*S1*hA + (3*S2 - 2*S_cross - 2*L^2) = 0
  const a = 3;
  const b = -2 * S1;
  const c = 3 * S2 - 2 * S_cross - 2 * L * L;
  const delta = b * b - 4 * a * c;

  if (delta < 0 || isNaN(delta)) {
    return {
      hasSolution: false,
      min: 0,
      max: 0,
      latexMin: "\\text{No Solution}",
      latexMax: "\\text{No Solution}"
    };
  }

  const r1 = (-b - Math.sqrt(delta)) / (2 * a);
  const r2 = (-b + Math.sqrt(delta)) / (2 * a);
  
  // We pass delta / 4 to generateLatex because the formula simplifies to:
  // hA = (S1 +/- sqrt(delta/4)) / 3
  const latex = generateLatex(S1, delta / 4);

  return {
    hasSolution: true,
    min: Math.min(r1, r2),
    max: Math.max(r1, r2),
    latexMin: latex.min,
    latexMax: latex.max
  };
};
