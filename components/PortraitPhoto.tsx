import React from 'react';
import { getAvatarPhotoStyle } from '../config/avatarImagePosition';

interface PortraitPhotoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
}

/**
 * Keep good existing portraits unchanged; allow only verified image-specific
 * framing corrections, without any runtime aspect-ratio auto-shift.
 */
const PortraitPhoto: React.FC<PortraitPhotoProps> = ({ src, style, ...props }) => (
  <img
    {...props}
    src={src}
    style={{ ...style, ...getAvatarPhotoStyle(src) }}
  />
);

export default PortraitPhoto;
