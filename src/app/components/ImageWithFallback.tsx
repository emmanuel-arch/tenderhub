import React, { useState } from 'react';
import { Landmark } from 'lucide-react';

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className, ...rest } = props;

  if (!src || didError) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-slate-100 text-slate-400 ${className ?? ''}`}
        style={style}
        aria-label={alt ?? 'Image unavailable'}
      >
        <Landmark className="h-1/2 w-1/2" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  );
}
