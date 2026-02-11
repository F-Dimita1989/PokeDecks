/**
 * Pokémon Card Crop Utility
 *
 * Standard Pokémon card dimensions: 63mm × 88mm
 * Aspect ratio (width/height): 63/88 ≈ 0.716
 *
 * This module calculates central crop regions matching
 * the card aspect ratio for both photo processing and
 * camera overlay positioning.
 */

/** Width / Height ratio of a standard Pokémon card */
export const CARD_ASPECT_RATIO = 63 / 88;

/** How much of the frame width the card area occupies (0–1) */
export const CARD_WIDTH_PERCENT = 0.75;

export interface CropRegion {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * Calculates the central crop region for a Pokémon card
 * from a photo of the given pixel dimensions.
 *
 * The crop is centered and sized so that the card fills
 * `widthPercent` of the image width.
 */
export function calculateCardCrop(
  imageWidth: number,
  imageHeight: number,
  widthPercent: number = CARD_WIDTH_PERCENT
): CropRegion {
  let cropWidth = imageWidth * widthPercent;
  let cropHeight = cropWidth / CARD_ASPECT_RATIO;

  // Clamp to image bounds
  if (cropHeight > imageHeight) {
    cropHeight = imageHeight;
    cropWidth = cropHeight * CARD_ASPECT_RATIO;
  }

  // Arrotonda e poi forza il clamp finale per evitare
  // "x + width must be <= bitmap.width()" su Android
  const rw = Math.round(cropWidth);
  const rh = Math.round(cropHeight);
  const ox = Math.max(0, Math.round((imageWidth - cropWidth) / 2));
  const oy = Math.max(0, Math.round((imageHeight - cropHeight) / 2));

  return {
    originX: ox,
    originY: oy,
    width: Math.min(rw, imageWidth - ox),
    height: Math.min(rh, imageHeight - oy),
  };
}
