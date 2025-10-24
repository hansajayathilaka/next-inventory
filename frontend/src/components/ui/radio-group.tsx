import React, { createContext, useContext } from 'react';

const RadioGroupContext = createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: '',
  onValueChange: () => {},
});

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function RadioGroup({
  value,
  onValueChange,
  disabled = false,
  className = '',
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="radiogroup" className={className} {...props} />
    </RadioGroupContext.Provider>
  );
}

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

export function RadioGroupItem({
  value,
  id,
  disabled,
  ...props
}: RadioGroupItemProps) {
  const { value: groupValue, onValueChange } = useContext(RadioGroupContext);

  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={groupValue === value}
      onChange={() => onValueChange(value)}
      disabled={disabled}
      className="h-4 w-4 accent-blue-600 cursor-pointer"
      {...props}
    />
  );
}
