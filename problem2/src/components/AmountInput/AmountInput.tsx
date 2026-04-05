import type { ChangeEvent } from 'react';

interface AmountInputProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function AmountInput({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder = '0.00',
  error,
  disabled,
}: AmountInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Allow digits and at most one decimal point
    if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
      onChange?.(raw);
    }
  }

  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        readOnly={readOnly}
        disabled={disabled}
        placeholder={placeholder}
        className={[
          'w-full bg-transparent text-white text-2xl font-semibold outline-none placeholder-white/20',
          'py-1 transition-colors',
          readOnly ? 'text-white/60 cursor-default' : '',
          error ? 'text-red-400' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}
