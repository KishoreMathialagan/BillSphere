import React from 'react';

type ButtonVariant = 'neuo' | 'filled' | 'ghost' | 'danger' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'neuo',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return `
          background: var(--color-cyprus);
          color: var(--color-sand);
          box-shadow: 5px 5px 12px rgba(0,71,65,0.35), -2px -2px 8px rgba(0,150,135,0.15);
        `;
      case 'danger':
        return `
          background: var(--color-danger);
          color: var(--color-sand);
          box-shadow: 5px 5px 12px rgba(176,58,46,0.25), -2px -2px 8px rgba(255,100,100,0.15);
        `;
      case 'ghost':
        return `
          background: transparent;
          color: var(--color-cyprus);
          box-shadow: none;
          border: 1px solid var(--color-cyprus);
        `;
      case 'icon':
        return `
          background: var(--color-sand);
          color: var(--color-night);
          box-shadow: var(--shadow-neuo-sm);
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
        `;
      case 'neuo':
      default:
        return `
          background: var(--color-sand);
          color: var(--color-cyprus);
          box-shadow: var(--shadow-neuo-sm);
        `;
    }
  };

  const getHoverAndActiveStyles = () => {
    if (disabled || isLoading) return '';
    switch (variant) {
      case 'filled':
        return `
          &:hover { background: var(--color-cyprus-mid); box-shadow: 3px 3px 8px rgba(0,71,65,0.40), -2px -2px 6px rgba(0,150,135,0.12); }
          &:active { background: var(--color-cyprus-deep); box-shadow: inset 2px 2px 6px rgba(0,0,0,0.25); transform: scale(0.99); }
        `;
      case 'danger':
        return `
          &:hover { opacity: 0.9; }
          &:active { box-shadow: inset 2px 2px 6px rgba(0,0,0,0.25); transform: scale(0.99); }
        `;
      case 'ghost':
        return `
          &:hover { background: var(--color-cyprus-tint); }
          &:active { background: var(--color-cyprus-glass); transform: scale(0.99); }
        `;
      case 'icon':
      case 'neuo':
      default:
        return `
          &:hover { box-shadow: 2px 2px 5px #D4D0C7, -2px -2px 5px #FFFFFF; }
          &:active { box-shadow: inset 3px 3px 8px #D4D0C7, inset -3px -3px 8px #FFFFFF; transform: scale(0.99); }
        `;
    }
  };

  const getSizeStyles = () => {
    if (variant === 'icon') return ''; // icon has fixed size
    switch (size) {
      case 'sm': return 'height: 32px; padding: 0 14px; font-size: 13px; border-radius: 8px;';
      case 'lg': return 'height: 48px; padding: 0 28px; font-size: 16px; border-radius: 12px;';
      case 'xl': return 'height: 56px; padding: 0 36px; font-size: 17px; border-radius: 14px;';
      case 'md':
      default: return 'height: 40px; padding: 0 20px; font-size: 15px; border-radius: 10px;';
    }
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`btn-${variant}-${size} ${className}`}
      {...props}
      style={{
        border: 'none',
        fontFamily: 'var(--font-heading)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all var(--duration-fast) var(--ease-standard)',
        ...props.style
      }}
    >
      <style>{`
        .btn-${variant}-${size} {
          ${getVariantStyles()}
          ${getSizeStyles()}
        }
        .btn-${variant}-${size}:not(:disabled) {
          ${getHoverAndActiveStyles()}
        }
      `}</style>
      {isLoading ? (
        <span className="spinner">Loading...</span> // simple fallback
      ) : (
        <>
          {leftIcon && <span className="icon-left">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="icon-right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
