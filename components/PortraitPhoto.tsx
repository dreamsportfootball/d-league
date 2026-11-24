import React from 'react';
import { getImageThumbnailUrl } from '../utils/imageThumbnail';
import { getAvatarPhotoStyle } from '../config/avatarImagePosition';

interface PortraitPhotoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  thumbnail?: boolean;
}

/**
 * Keep good existing portraits unchanged; allow only verified image-specific
 * framing corrections, without any runtime aspect-ratio auto-shift.
 */
const PortraitPhoto: React.FC<PortraitPhotoProps> = ({ src, style, thumbnail = false, onError, ...props }) => {
  const imageUrl = thumbnail ? getImageThumbnailUrl(src, 'portrait') : src;
  return (
    <img
      decoding="async"
      {...props}
      src={imageUrl}
      onError={(event) => {
        if (imageUrl !== src && event.currentTarget.getAttribute('src') === imageUrl) {
          event.currentTarget.src = src;
          return;
        }
        onError?.(event);
      }}
      style={{ ...style, ...getAvatarPhotoStyle(src) }}
    />
  );
};

export default PortraitPhoto;
