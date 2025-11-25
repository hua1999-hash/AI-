import React, { useState, useMemo } from 'react';
import Scene3D from './components/Scene3D';
import ControlPanel from './components/ControlPanel';
import { TetrahedronState, SolutionMode } from './types';
import { solveTetrahedron } from './utils/mathUtils';
import { Eye, Box } from 'lucide-react'; // Assuming we can use simple icons, if not, text is fine. Using text/svg fallback if library not available but prompt allowed generic popular libs. I'll use text button to be safe.

const App: React.FC = () => {
  const [geoState, setGeoState] = useState<TetrahedronState>({
    edgeLength: 10,
    hB: 10,
    hC: 11,
    hD: 12,
  });

  const [mode, setMode] = useState<SolutionMode>('min');
  const [horizontalView, setHorizontalView] = useState(false);

  // Calculate geometry result
  const solution = useMemo(() => {
    return solveTetrahedron(geoState.edgeLength, geoState.hB, geoState.hC, geoState.hD);
  }, [geoState]);

  // If currently selected mode is invalid (e.g. became NaN during transition), we might want to handle it, 
  // but solveTetrahedron returns 0 with hasSolution=false.

  const currentHeightA = mode === 'min' ? solution.min : solution.max;

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white overflow-hidden font-sans">
      <Scene3D 
        geometryState={geoState}
        hA={currentHeightA}
        hasSolution={solution.hasSolution}
        mode={mode}
        horizontalView={horizontalView}
      />

      <ControlPanel 
        state={geoState}
        solution={solution}
        mode={mode}
        onStateChange={setGeoState}
        onModeChange={setMode}
      />

      <div className="absolute bottom-6 w-full text-center pointer-events-none text-gray-500 text-sm z-10">
        Drag to rotate view
      </div>

      <button
        onClick={() => setHorizontalView(!horizontalView)}
        className={`
          absolute bottom-6 right-6 z-50 
          px-5 py-3 rounded-lg font-bold shadow-lg transition-all duration-200
          flex items-center gap-2
          ${horizontalView 
            ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50' 
            : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600'}
        `}
      >
        {horizontalView ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
            <span>Back to 3D View</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/></svg>
            <span>Horizontal View</span>
          </>
        )}
      </button>
    </div>
  );
};

export default App;
