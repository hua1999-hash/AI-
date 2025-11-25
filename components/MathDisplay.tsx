import React, { useEffect, useRef } from 'react';

interface MathDisplayProps {
  latex: string;
  label?: string;
  subLabel?: string;
  isActive?: boolean;
  activeColor?: 'cyan' | 'amber';
  onClick?: () => void;
}

const MathDisplay: React.FC<MathDisplayProps> = ({ 
  latex, 
  label, 
  subLabel, 
  isActive, 
  activeColor = 'cyan',
  onClick 
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nodeRef.current && (window as any).MathJax) {
      // Clear previous content handled by MathJax to avoid duplication
      nodeRef.current.innerHTML = `$$${latex}$$`;
      (window as any).MathJax.typesetPromise([nodeRef.current]).catch((err: any) => console.log(err));
    }
  }, [latex]);

  const activeClasses = isActive 
    ? activeColor === 'cyan' 
      ? 'border-cyan-400 bg-cyan-400/10' 
      : 'border-amber-500 bg-amber-500/10'
    : 'border-transparent bg-gray-800 hover:bg-gray-700';

  return (
    <div className="mb-3">
      {label && <div className="text-xs text-gray-400 mb-1">{label}</div>}
      <div 
        onClick={onClick}
        className={`
          cursor-pointer transition-all duration-200 
          border-2 rounded-lg p-2 min-h-[50px] 
          flex items-center justify-center 
          ${activeClasses}
        `}
      >
        <div ref={nodeRef} className="text-sm"></div>
      </div>
      {subLabel && <div className="text-xs font-mono text-gray-500 text-right">{subLabel}</div>}
    </div>
  );
};

export default MathDisplay;
