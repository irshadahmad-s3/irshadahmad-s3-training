import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  children: PropsWithChildren['children'];
}

export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonProps) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}
