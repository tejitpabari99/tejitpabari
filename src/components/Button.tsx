import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'solid' | 'outline';

type CommonProps = {
  variant?: ButtonVariant; // default 'solid'
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };

type ButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const BASE =
  'inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold transition lg:px-7 lg:py-3 lg:text-[0.92rem]';

const VARIANTS: Record<ButtonVariant, string> = {
  solid: 'bg-teal text-white hover:opacity-90',
  outline: 'border border-teal-secondary text-teal-secondary hover:bg-teal-secondary hover:text-white',
};

export function Button({ variant = 'solid', className = '', children, ...rest }: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${className}`;
  if ('href' in rest && rest.href) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
