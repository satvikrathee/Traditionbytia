import React from 'react';

interface Props {
  className?: string;
}

export const MandalaDivider: React.FC<Props> = ({ className = 'my-8' }) => {
  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      <div className="h-[1px] w-16 md:w-32 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
      <div className="flex items-center space-x-1.5 text-gold-500">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2L14.39 8.26L21 9.27L16.24 13.97L17.36 20.6L12 17.77L6.64 20.6L7.76 13.97L3 9.27L9.61 8.26L12 2Z" />
        </svg>
        <span className="text-xs uppercase tracking-[0.25em] font-serif font-semibold text-maroon-600">
          Traditions
        </span>
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2L14.39 8.26L21 9.27L16.24 13.97L17.36 20.6L12 17.77L6.64 20.6L7.76 13.97L3 9.27L9.61 8.26L12 2Z" />
        </svg>
      </div>
      <div className="h-[1px] w-16 md:w-32 bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
    </div>
  );
};

