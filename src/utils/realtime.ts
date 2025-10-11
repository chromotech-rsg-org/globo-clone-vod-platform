/**
 * Utility functions for Supabase Realtime channels
 */

/**
 * Generates a unique channel name by appending a random suffix
 * This prevents "tried to subscribe multiple times" errors when multiple
 * component instances use the same base channel name
 * 
 * @param baseName - The base name for the channel
 * @returns A unique channel name with random suffix
 */
export const uniqueChannel = (baseName: string): string => {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${baseName}-${suffix}`;
};

/**
 * Creates a stable unique identifier for a hook instance
 * Use this in a useRef to maintain the same ID across re-renders
 * 
 * @returns A random string suitable for use as a unique identifier
 */
export const createInstanceId = (): string => {
  return Math.random().toString(36).slice(2, 8);
};
