export interface TetrahedronState {
  edgeLength: number;
  hB: number;
  hC: number;
  hD: number;
}

export type SolutionMode = 'min' | 'max';

export interface Solution {
  min: number;
  max: number;
  hasSolution: boolean;
  latexMin: string;
  latexMax: string;
}

export interface MarkerColors {
  A: string;
  B: string;
  C: string;
  D: string;
}

export const COLORS: MarkerColors = {
  A: '#00ffcc',
  B: '#ff4444',
  C: '#00ff00',
  D: '#4488ff',
};
