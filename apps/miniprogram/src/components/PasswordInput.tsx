import { useRef, useState, type FC } from 'react';
import { Button, Input, View } from '@tarojs/components';
import '@/components/password-input.css';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
  maxLength?: number;
}

export const PasswordInput: FC<PasswordInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error,
  placeholder,
  maxLength = 72,
}) => {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selection, setSelection] = useState({ start: -1, end: -1 });
  const lastSelection = useRef({ start: value.length, end: value.length });
  const restoreFocus = useRef(false);

  return (
    <View className="password-field">
      <View className="label">{label}</View>
      <View className={`password-control${error ? ' password-control-error' : ''}`}>
        <Input
          className="input password-input"
          type="text"
          password={!visible}
          value={value}
          disabled={disabled}
          maxlength={maxLength}
          placeholder={placeholder}
          ariaLabel={label}
          focus={focused}
          holdKeyboard
          selectionStart={selection.start}
          selectionEnd={selection.end}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSelectionChange={(event) => {
            const detail = event.detail as { selectionStart?: number; selectionEnd?: number };
            if (
              typeof detail.selectionStart === 'number' &&
              typeof detail.selectionEnd === 'number'
            ) {
              lastSelection.current = { start: detail.selectionStart, end: detail.selectionEnd };
            }
          }}
          onInput={(event) => {
            lastSelection.current = { start: event.detail.cursor, end: event.detail.cursor };
            onChange(event.detail.value);
          }}
        />
        <Button
          className="password-toggle"
          disabled={disabled}
          ariaLabel={visible ? '隐藏密码' : '显示密码'}
          hoverClass="none"
          onTouchStart={() => {
            restoreFocus.current = focused;
          }}
          onClick={() => {
            if (disabled) return;
            setSelection({ ...lastSelection.current });
            setFocused(restoreFocus.current);
            setVisible((current) => !current);
          }}
        >
          <View className={`password-eye${visible ? ' password-eye-visible' : ''}`} />
        </Button>
      </View>
      {error && (
        <View className="error" ariaRole="alert">
          {error}
        </View>
      )}
    </View>
  );
};
