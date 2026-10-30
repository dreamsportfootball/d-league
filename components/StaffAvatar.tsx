import React, { useState } from 'react';
import { UserRound } from 'lucide-react';

interface StaffAvatarProps {
  src?: string;
  name: string;
  large?: boolean;
}

const StaffAvatar: React.FC<StaffAvatarProps> = ({ src, name, large = false }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && src !== failedSrc);
  return (
    <div className={large
      ? 'flex h-[104px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-neutral-200 sm:h-32 sm:w-32 lg:h-40 lg:w-40'
      : 'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 ring-1 ring-neutral-200'
    }>
      {showImage ? (
        <img
          src={src}
          alt={name + ' 大頭貼'}
          loading={large ? 'eager' : 'lazy'}
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <UserRound aria-hidden="true"
          className={large ? 'h-12 w-12 text-neutral-300 sm:h-14 sm:w-14 lg:h-16 lg:w-16' : 'h-6 w-6 text-neutral-400'} />
      )}
    </div>
  );
};

export default StaffAvatar;
