import imageUrlBuilder from "@sanity/image-url";
import { client } from "./sanity";

const builder = imageUrlBuilder(client);

/**
 * Resolves a profile picture reference to an image URL
 * @param profilePictureRef - The reference object from Sanity
 * @param size - The size of the image (default: 100)
 * @returns The image URL or undefined if invalid
 */
export function resolveProfilePictureUrl(
  profilePictureRef?: { _ref?: string; _type?: string } | null,
  size: number = 100
): string | undefined {
  if (!profilePictureRef?._ref) return undefined;

  try {
    return builder
      .image({ _type: "image", asset: { _ref: profilePictureRef._ref } as any })
      .width(size)
      .height(size)
      .auto("format")
      .fit("crop")
      .url();
  } catch {
    return undefined;
  }
}

/**
 * Resolves multiple profile picture references to image URLs
 * @param profilePictureRefs - Array of reference objects from Sanity
 * @param size - The size of the images (default: 100)
 * @returns Array of image URLs (undefined for invalid references)
 */
export function resolveProfilePictureUrls(
  profilePictureRefs: Array<
    { _ref?: string; _type?: string } | null | undefined
  >,
  size: number = 100
): Array<string | undefined> {
  return profilePictureRefs.map((ref) => resolveProfilePictureUrl(ref, size));
}

/**
 * Gets a fallback profile picture URL when no specific one is provided
 * @param size - The size of the image (default: 100)
 * @returns A default profile picture URL
 */
export function getDefaultProfilePictureUrl(size: number = 100): string {
  // You can replace this with a default image from your Sanity project
  // or use a placeholder service like https://via.placeholder.com
  return `https://via.placeholder.com/${size}x${size}/cccccc/666666?text=?`;
}
