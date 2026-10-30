import React, { useState } from 'react';
import { getAvatarImagePosition } from '../config/avatarImagePosition';

interface PortraitPhotoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
}

interface ImageDimensions {
  src: string;
  width: number;
  height: number;
}

/** One consistent image crop across player / staff / stats avatars. */
const PortraitPhoto: React.FC<PortraitPhotoProps> = ({ src, onLoad, style, ...props }) => {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const imageSize = dimensions?.src === src ? dimensions : null;

  return (
    <img
      {...props}
      src={src}
      style={{
        ...style,
        objectPosition: getAvatarImagePosition(src, imageSize?.width, imageSize?.height),
      }}
      onLoad={(event) => {
        setDimensions({
          src,
          width: event.currentTarget.naturalWidth,
          height: event.currentTarget.naturalHeight,
        });
        onLoad?.(event);
      }}
    />
  );
};

export default PortraitPhoto;
