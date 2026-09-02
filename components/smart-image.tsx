'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
};

// 按图片真实比例渲染：加载后读取 naturalWidth/naturalHeight 设置容器 aspect-ratio，
// 800×800 方图与 750×1000 竖图都能按原格式铺满容器，避免 object-contain 产生黑边。
export function SmartImage({ src, alt, sizes, priority, className, imgClassName }: Props) {
  const [ratio, setRatio] = useState<number | null>(null);
  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      style={{ aspectRatio: ratio ? `${ratio}` : '1 / 1' }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        className={cn('object-cover', imgClassName)}
        onLoad={(event) => {
          const img = event.currentTarget;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setRatio(img.naturalWidth / img.naturalHeight);
          }
        }}
      />
    </div>
  );
}