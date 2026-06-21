import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className={`input-wrapper ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {label && (
          <label style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 500, color: 'var(--color-night)' }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <div style={{ position: 'absolute', left: '12px', color: 'var(--color-night-40)', display: 'flex' }}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className="neuo-input"
            {...props}
            style={{
              width: '100%',
              height: '44px',
              padding: `0 ${rightIcon ? '40px' : '16px'} 0 ${leftIcon ? '40px' : '16px'}`,
              background: 'var(--color-sand)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-neuo-inset)',
              color: 'var(--color-night)',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              outline: 'none',
              transition: 'box-shadow var(--duration-fast) var(--ease-standard)',
              ...props.style
            }}
          />
          <style>{`
            .neuo-input:focus {
              box-shadow: inset 4px 4px 9px #C8C4BB, inset -3px -3px 7px #FFFFFF, 0 0 0 2px rgba(0, 71, 65, 0.35) !important;
            }
            .neuo-input::placeholder {
              color: var(--color-night-40);
            }
          `}</style>
          {rightIcon && (
            <div style={{ position: 'absolute', right: '12px', color: 'var(--color-night-40)', display: 'flex' }}>
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <span style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: '13px', 
            color: error ? 'var(--color-danger)' : 'var(--color-night-60)' 
          }}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
