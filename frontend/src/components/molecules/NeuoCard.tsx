import React from 'react';

type NeuoCardSize = 'sm' | 'md';

export interface NeuoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: NeuoCardSize;
  children: React.ReactNode;
}

export const NeuoCard: React.FC<NeuoCardProps> = ({ size = 'md', children, className = '', ...props }) => {
  return (
    <div className={`neuo-card${size === 'sm' ? '-sm' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};
