import React, { useState, useEffect } from 'react';
import { parseMathString } from '../utils/mathUtils';

interface InputGroupProps {
  label: string;
  color: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  color, 
  value, 
  onChange,
  min = 0,
  max = 30,
  step = 0.1
}) => {
  const [textVal, setTextVal] = useState(value.toString());

  // Sync internal text state when external value prop changes (e.g. from slider)
  useEffect(() => {
    // We use parseMathString here instead of parseFloat to respect user-entered formulas.
    // If the user types "10*sqrt(2)", the parsed value matches the prop value, 
    // so we don't overwrite it with "14.14".
    const currentParsed = parseMathString(textVal);
    
    // Only update text if the numeric value is significantly different to avoid fighting user input
    // If currentParsed is NaN (e.g. partial typing), we assume no match and don't update automatically 
    // to avoid clearing user input while typing invalid stuff, unless the prop value changed drastically from elsewhere.
    // But here we rely on the diff check.
    if (!isNaN(currentParsed) && Math.abs(currentParsed - value) > 0.001) {
      setTextVal(value.toFixed(2));
    } else if (isNaN(currentParsed)) {
      // If the current text is invalid math, but the value prop changed significantly (e.g. slider drag),
      // we force update.
      // However, comparing NaN to number is tricky. 
      // Typically if text is invalid, we might want to leave it alone unless it's a slider event.
      // But since we can't easily distinguish slider vs parent update here without more state,
      // we'll leave it be if it's invalid, assuming the user is typing.
      // A common pattern is to just let the slider overwrite text via the handleSliderChange directly,
      // which we do.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setTextVal(newVal);
    
    const parsed = parseMathString(newVal);
    if (!isNaN(parsed)) {
      // Clamp for safety if it's edge length
      const finalVal = (label.includes('Length') && parsed < 0.1) ? 0.1 : parsed;
      onChange(finalVal);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(val);
    setTextVal(val.toFixed(2));
  };

  return (
    <div 
      className="bg-white/5 p-3 rounded-lg border-l-4 mb-2"
      style={{ borderLeftColor: color }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center text-sm font-medium text-gray-200">
          <span 
            className="w-2.5 h-2.5 rounded-full mr-2 shadow-[0_0_5px_currentColor]" 
            style={{ backgroundColor: color, color: color }} 
          />
          {label}
        </div>
        <input
          type="text"
          value={textVal}
          onChange={handleTextChange}
          className="w-24 bg-gray-800 border border-gray-600 text-cyan-400 rounded px-2 py-1 text-right text-sm font-mono focus:border-cyan-400 focus:outline-none"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer opacity-80 hover:opacity-100 accent-white"
      />
    </div>
  );
};

export default InputGroup;