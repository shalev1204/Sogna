/**
 * Sogna Native String Utilities
 */
export class Strings {
  /**
   * Generates a URL-friendly slug from a string.
   */
  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD') // Remove accents
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start
      .replace(/-+$/, ''); // Trim - from end
  }
}
