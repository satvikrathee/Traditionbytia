import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-cream-300 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-cream-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-cream-300 rounded w-1/3" />
        <div className="h-4 bg-cream-300 rounded w-4/5" />
        <div className="h-3 bg-cream-200 rounded w-1/4" />
        <div className="pt-2 flex justify-between items-center">
          <div className="h-5 bg-cream-300 rounded w-1/3" />
          <div className="h-8 w-8 bg-cream-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-14 bg-cream-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
};

