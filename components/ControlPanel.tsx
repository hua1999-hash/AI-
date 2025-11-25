import React from 'react';
import InputGroup from './InputGroup';
import MathDisplay from './MathDisplay';
import { TetrahedronState, Solution, SolutionMode, COLORS } from '../types';

interface ControlPanelProps {
  state: TetrahedronState;
  solution: Solution;
  mode: SolutionMode;
  onStateChange: (newState: TetrahedronState) => void;
  onModeChange: (mode: SolutionMode) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  solution,
  mode,
  onStateChange,
  onModeChange,
}) => {
  const update = (key: keyof TetrahedronState, val: number) => {
    onStateChange({ ...state, [key]: val });
  };

  return (
    <div 
      id="ui-panel"
      className="absolute top-3 left-3 w-[340px] max-h-[90vh] overflow-y-auto custom-scrollbar bg-gray-950/90 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl z-50 flex flex-col gap-2"
    >
      <h1 className="text-amber-400 text-lg font-bold text-center border-b border-gray-700 pb-2 mb-1">
        Tetrahedron Lab v7.0
      </h1>
      <div className="text-xs text-gray-500 text-center mb-2">
        Examples: 10, sqrt(20), 5*sqrt(2)
      </div>

      <InputGroup
        label="Edge Length (L)"
        color={COLORS.A} // White/Teal for L
        value={state.edgeLength}
        min={2}
        onChange={(v) => update('edgeLength', v)}
      />

      <InputGroup
        label="B Height"
        color={COLORS.B}
        value={state.hB}
        onChange={(v) => update('hB', v)}
      />

      <InputGroup
        label="C Height"
        color={COLORS.C}
        value={state.hC}
        onChange={(v) => update('hC', v)}
      />

      <InputGroup
        label="D Height"
        color={COLORS.D}
        value={state.hD}
        onChange={(v) => update('hD', v)}
      />

      <div className="border-t border-gray-700 pt-3 mt-1">
        {solution.hasSolution ? (
          <>
            <MathDisplay
              label="A Height (Min Solution):"
              latex={solution.latexMin}
              subLabel={`≈ ${solution.min.toFixed(3)}`}
              isActive={mode === 'min'}
              activeColor="cyan"
              onClick={() => onModeChange('min')}
            />
            
            <MathDisplay
              label="A Height (Max Solution):"
              latex={solution.latexMax}
              subLabel={`≈ ${solution.max.toFixed(3)}`}
              isActive={mode === 'max'}
              activeColor="amber"
              onClick={() => onModeChange('max')}
            />
          </>
        ) : (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded text-center font-bold animate-pulse">
             ⚠️ No Real Solution
             <div className="text-xs font-normal mt-1 text-red-300">Edge length too short for these height differences.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
