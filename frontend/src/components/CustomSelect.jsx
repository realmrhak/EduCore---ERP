import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect - A drop-in replacement for native <select> elements
 * Custom-built dropdown that works perfectly on mobile and desktop
 * Supports empty string values (unlike Radix UI Select)
 *
 * Props:
 * - value: current selected value (string)
 * - onValueChange: callback when value changes (string) => void
 * - options: array of { value: string, label: string }
 * - placeholder: placeholder text (default: "Select...")
 * - className: additional classes for the trigger
 * - disabled: boolean
 * - id: optional id
 */
export default function CustomSelect({
  value,
  onValueChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  disabled = false,
  id,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('touchstart', handleClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const selectedOption = options.find(o => o.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`
          w-full flex items-center justify-between gap-2
          bg-white border border-[#E2E8F0] rounded-lg
          text-xs sm:text-sm text-left
          h-[34px] sm:h-9 px-2.5 sm:px-3
          outline-none transition-all
          focus:border-[#16a34a] focus:ring-2 focus:ring-[#16a34a]/15
          hover:border-[#16a34a]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${!selectedOption ? 'text-[#94A3B8]' : 'text-[#0F172A]'}
        `}
      >
        <span className="truncate flex-1">{displayText}</span>
        <ChevronDown className={`w-4 h-4 text-[#16a34a] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="max-h-[240px] overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#94A3B8] text-center">No options</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 text-left text-xs sm:text-sm
                    transition-colors
                    ${opt.value === value
                      ? 'bg-[#f0fdf4] text-[#16a34a] font-medium'
                      : 'text-[#0F172A] hover:bg-[#f0fdf4] hover:text-[#16a34a]'
                    }
                  `}
                >
                  <span className="truncate flex-1">{opt.label}</span>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-[#16a34a] flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
