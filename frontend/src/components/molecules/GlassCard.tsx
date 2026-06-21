import React from 'react';

type GlassVariant = 'light' | 'dark' | 'modal';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ variant = 'light', children, className = '', ...props }) => {
  return (
    <div className={`glass-card-${variant} ${className}`} {...props}>
      {children}
    </div>
  );
};
