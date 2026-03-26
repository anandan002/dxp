import React, { useState, useMemo } from 'react';
import { cn } from '../utils/cn';
import { Card } from './Card';

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  label?: string;
  unit?: string;
  formatValue?: (value: number) => string;
  showTicks?: boolean;
  tickCount?: number;
  color?: string;
  centerZero?: boolean;
  variant?: 'default' | 'card';
  disabled?: boolean;
}

export function Slider({
  min, max, step = 1, value: controlledValue, defaultValue, onChange,
  label, unit, formatValue, showTicks = true, tickCount = 20,
  color, centerZero = false, variant = 'default', disabled,
}: SliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? (centerZero ? 0 : min));
  const value = controlledValue ?? internalValue;
  const percent = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : `${value >= 0 && centerZero ? '+' : ''}${value}`;
  const fillColor = color || 'var(--dxp-brand)';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setInternalValue(v);
    onChange?.(v);
  };

  // For center-zero sliders, fill from center to thumb
  const centerPercent = centerZero ? ((0 - min) / (max - min)) * 100 : 0;
  const fillStyle = useMemo(() => {
    if (centerZero) {
      const left = Math.min(centerPercent, percent);
      const right = Math.max(centerPercent, percent);
      return {
        background: `linear-gradient(to right,
          var(--dxp-border-light) 0%, var(--dxp-border-light) ${left}%,
          ${fillColor}40 ${left}%, ${fillColor}40 ${right}%,
          var(--dxp-border-light) ${right}%, var(--dxp-border-light) 100%)`,
      };
    }
    return {
      background: `linear-gradient(to right, ${fillColor}30 0%, ${fillColor}30 ${percent}%, var(--dxp-border-light) ${percent}%, var(--dxp-border-light) 100%)`,
    };
  }, [percent, centerPercent, centerZero, fillColor]);

  const ticks = useMemo(() => {
    if (!showTicks) return [];
    return Array.from({ length: tickCount + 1 }, (_, i) => i / tickCount * 100);
  }, [showTicks, tickCount]);

  const content = (
    <div className={cn('space-y-1', disabled && 'opacity-50 pointer-events-none')}>
      {/* Label row with value */}
      <div className="flex items-center justify-between mb-2">
        {label && <span className="text-sm font-semibold text-[var(--dxp-text)]">{label}</span>}
        <span className="text-sm font-bold tabular-nums" style={{ color: fillColor }}>
          {displayValue}{unit ? ` ${unit}` : ''}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-8 flex items-center">
        {/* Background track with fill */}
        <div className="absolute inset-x-0 h-3 rounded-full overflow-hidden" style={fillStyle}>
          {/* Center line for center-zero */}
          {centerZero && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[var(--dxp-text-muted)]"
              style={{ left: `${centerPercent}%` }}
            />
          )}
        </div>

        {/* Range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="relative w-full h-3 appearance-none cursor-pointer bg-transparent z-10
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-8
            [&::-webkit-slider-thumb]:rounded-[3px] [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--dxp-border)]
            [&::-webkit-slider-thumb]:bg-[var(--dxp-surface)]
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:rounded-[3px]
            [&::-moz-range-thumb]:bg-[var(--dxp-surface)] [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-[var(--dxp-border)]
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      {/* Tick marks */}
      {showTicks && (
        <div className="relative h-3 mx-2">
          {ticks.map((pos, i) => {
            const isMajor = i % 5 === 0;
            return (
              <div
                key={i}
                className={cn(
                  'absolute bottom-0',
                  isMajor ? 'w-0.5 h-2.5 bg-[var(--dxp-text-muted)]/40' : 'w-px h-1.5 bg-[var(--dxp-border)]',
                )}
                style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  if (variant === 'card') {
    return <Card className="p-4">{content}</Card>;
  }
  return content;
}
