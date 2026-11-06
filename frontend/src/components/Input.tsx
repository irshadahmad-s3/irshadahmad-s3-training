import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label: string; name: string }

export function Input({ label, id, name, className = '', ...props }: InputProps) {
  const inputId = id ?? name;
  return <label className="field" htmlFor={inputId}><span className="field__label">{label}</span><input id={inputId} name={name} className={`input ${className}`} {...props} /></label>;
}
