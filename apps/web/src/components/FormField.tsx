import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  suffix?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, suffix, className = '', id, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="label-text">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            className={`input-field ${error ? 'input-field-error' : ''} ${suffix ? 'pr-12' : ''} ${className}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{suffix}</div>
          )}
        </div>
        {error && (
          <p id={`${fieldId}-error`} className="text-[13px] text-red-500 font-medium">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-[13px] text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = 'FormField';
