import React from 'react';

type BadgeVariant = 'cyprus' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'cyprus', children, className = '', ...props }) => {
  const getVariantColor = () => {
    switch (variant) {
      case 'success': return 'var(--color-success)';
      case 'warning': return 'var(--color-warning)';
      case 'danger': return 'var(--color-danger)';
      case 'info': return 'var(--color-info)';
      case 'cyprus':
      default: return 'var(--color-cyprus)';
    }
  };

  return (
    <span
      className={`badge badge-${variant} ${className}`}
      {...props}
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 10px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-sand)',
        boxShadow: '2px 2px 5px #D4D0C7, -2px -2px 5px #FFFFFF',
        color: getVariantColor(),
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        ...props.style
      }}
    >
      {children}
    </span>
  );
};
