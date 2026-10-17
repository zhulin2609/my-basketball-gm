import { useId, useLayoutEffect, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import '@/components/password-input.css';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  autoComplete?: 'current-password' | 'new-password';
}

export const PasswordInput: FC<PasswordInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  minLength,
  maxLength,
  required,
  autoComplete,
}) => {
  const { t } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef<{ start: number; end: number; focused: boolean } | null>(null);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const saved = selection.current;
    if (!saved || !input.current) return;
    if (saved.focused) input.current.focus({ preventScroll: true });
    input.current.setSelectionRange(saved.start, saved.end);
    selection.current = null;
  }, [visible]);

  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className={`password-control${error ? ' password-control-error' : ''}`}>
        <input
          ref={input}
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          className="password-toggle"
          type="button"
          disabled={disabled}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-controls={id}
          aria-pressed={visible}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            if (!input.current) return;
            selection.current = {
              start: input.current.selectionStart ?? value.length,
              end: input.current.selectionEnd ?? value.length,
              focused: document.activeElement === input.current,
            };
            setVisible((current) => !current);
          }}
        >
          <span
            className={`password-eye${visible ? ' password-eye-visible' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
