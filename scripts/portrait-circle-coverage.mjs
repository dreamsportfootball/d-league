/**
 * Shared circular-headshot geometry gate for actual browser-rendered portraits.
 * Ensures the transformed image fully covers the circle, not merely that it
 * has loaded. This cannot identify a face or evaluate the source's sharpness.
 * Portraits must still be compared manually at 48/104/160px.
 */
export const PORTRAIT_CIRCLE_RULES = Object.freeze({
  samples: 720,
  radiusRatio: 0.495, // sample just inside the antialiased circle edge
  maxUncoveredRatio: 0.005,
  minAvatarSizePx: 46,
  maxAspectDeltaPx: 1,
});

export const inspectPortraitCircle = ({
  width, height, transform = 'none', overflowX, overflowY, borderRadius,
  objectFit,
}) => {
  const errors = [];
  if (!(Number.isFinite(width) && Number.isFinite(height)) ||
      width < PORTRAIT_CIRCLE_RULES.minAvatarSizePx ||
      Math.abs(width - height) > PORTRAIT_CIRCLE_RULES.maxAspectDeltaPx) {
    errors.push('Avatar container must be square and at least 46px');
  }
  if (!['hidden', 'clip'].includes(overflowX) ||
      !['hidden', 'clip'].includes(overflowY)) {
    errors.push('Avatar container must clip overflow');
  }
  if (!Number.isFinite(Number.parseFloat(borderRadius)) ||
      Number.parseFloat(borderRadius) <= 0) {
    errors.push('Avatar container must be circular');
  }
  if (objectFit !== 'cover') errors.push('Image must use object-fit: cover');

  const matrix = transform === 'none'
    ? [1, 0, 0, 1, 0, 0]
    : /^matrix\(([^)]+)\)$/.exec(transform)?.[1].split(',').map(Number);
  if (!matrix || matrix.length !== 6 || matrix.some(v => !Number.isFinite(v))) {
    return { passed: false, uncoveredRatio: null, uncoveredSamples: null,
      errors: [...errors, 'Unsupported or invalid CSS transformation'] };
  }
  const [a, b, c, d, e, f] = matrix;
  const determinant = a * d - b * c;
  if (Math.abs(determinant) < 1e-6) {
    return { passed: false, uncoveredRatio: null, uncoveredSamples: null,
      errors: [...errors, 'Non-invertible CSS image transformation'] };
  }
  let missing = 0;
  for (let i = 0; i < PORTRAIT_CIRCLE_RULES.samples; i++) {
    const angle = (i * 2 * Math.PI) / PORTRAIT_CIRCLE_RULES.samples;
    const dx = PORTRAIT_CIRCLE_RULES.radiusRatio * width * Math.cos(angle) - e;
    const dy = PORTRAIT_CIRCLE_RULES.radiusRatio * height * Math.sin(angle) - f;
    const sourceX = (d * dx - c * dy) / determinant + width / 2;
    const sourceY = (-b * dx + a * dy) / determinant + height / 2;
    if (sourceX < 0 || sourceY < 0 || sourceX > width || sourceY > height) missing++;
  }
  const uncoveredRatio = missing / PORTRAIT_CIRCLE_RULES.samples;
  if (uncoveredRatio > PORTRAIT_CIRCLE_RULES.maxUncoveredRatio) {
    errors.push('Transformed photo leaves part of the circular avatar uncovered');
  }
  return { passed: errors.length === 0, uncoveredRatio, uncoveredSamples: missing, errors };
};
