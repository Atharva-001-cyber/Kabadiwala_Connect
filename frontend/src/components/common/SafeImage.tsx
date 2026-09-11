import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  category?: string;
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&q=80';

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'E-Waste Item',
  className = '',
  fallbackSrc = DEFAULT_FALLBACK,
  ...props
}) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden ${className}`}>
        <Package className="w-1/2 h-1/2 text-slate-600" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...props}
    />
  );
};
