'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  containerClassName?: string;
  dropdownClassName?: string;
  fullWidth?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  children,
  placeholder = 'Select option...',
  disabled = false,
  name,
  id,
  className,
  containerClassName,
  dropdownClassName,
  fullWidth = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract options from either `options` prop or `children` (<option> tags)
  const parsedOptions: SelectOption[] = useMemo(() => {
    if (options && options.length > 0) return options;
    const list: SelectOption[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        list.push({
          value: String(child.props.value ?? ''),
          label: child.props.children,
          disabled: Boolean(child.props.disabled),
        });
      }
    });
    return list;
  }, [options, children]);

  // Find currently selected option
  const selectedOption = parsedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const displayLabel = selectedOption
    ? selectedOption.label
    : (placeholder || value || 'Select an option');

  // Handle outside click & Esc key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string, isDisabled?: boolean) => {
    if (isDisabled || disabled) return;
    if (onChange) {
      onChange({
        target: {
          value: optionValue,
          name: name || '',
        },
      });
    }
    setIsOpen(false);
  };

  const isFullWidth = fullWidth || className?.includes('w-full');

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative',
        isFullWidth ? 'w-full' : 'inline-block',
        containerClassName
      )}
    >
      {/* Hidden input for form submission compatibility */}
      {name && <input type="hidden" name={name} value={value || ''} />}

      {/* Select Trigger */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center justify-between text-xs rounded-xl border bg-white pl-3.5 pr-3 py-2 text-left transition-all duration-150',
          'hover:border-slate-300 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20 bg-slate-50/30'
            : 'border-slate-200 shadow-sm',
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-100'
            : 'cursor-pointer',
          isFullWidth ? 'w-full' : '',
          className
        )}
      >
        <span className="truncate pr-2 font-medium text-slate-800">
          {displayLabel}
        </span>
        {/* Down Arrow shifted inwards with proper left margin and right padding */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ml-1.5',
            isOpen && 'rotate-180 text-brand-600'
          )}
        />
      </button>

      {/* Beautiful Open Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 mt-1.5 w-full min-w-[200px] bg-white rounded-xl shadow-xl shadow-slate-200/80 border border-slate-200/90 py-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150 max-h-60 overflow-y-auto',
            dropdownClassName
          )}
        >
          {parsedOptions.length === 0 ? (
            <div className="px-3.5 py-2.5 text-xs text-slate-400 italic">
              No options available
            </div>
          ) : (
            parsedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={cn(
                    'w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors',
                    isSelected
                      ? 'bg-brand-50/80 text-brand-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                    opt.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
