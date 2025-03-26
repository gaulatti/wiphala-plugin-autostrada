import { LighthouseResult } from 'src/types/lighthouse';

/**
 * Deeply merges the properties of the source object into the target object.
 * If a property in the source object is an object itself, the function will
 * recursively merge its properties into the corresponding object in the target.
 *
 * @template T - The type of the target object.
 * @param {T} target - The target object to which properties will be merged.
 * @param {Partial<T>} source - The source object containing properties to merge.
 * @returns {T} - The target object with merged properties.
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  for (const key of Object.keys(source) as (keyof T)[]) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) {
        (target[key] as any) = {};
      }
      deepMerge(target[key] as any, source[key] as any);
    } else {
      target[key] = source[key] as T[keyof T];
    }
  }
  return target;
}

/**
 * Merges the contents of multiple JSON files into a single object.
 *
 * @param files - An array of strings, where each string is the content of a JSON file.
 * @returns A single object containing the merged contents of all the JSON files.
 *
 * @throws Will log an error message if any file content cannot be parsed as JSON.
 */
function mergeFiles(files: string[]): LighthouseResult {
  let mergedData: Partial<LighthouseResult> = {};

  files.forEach((file) => {
    try {
      mergedData = deepMerge(mergedData, JSON.parse(file));
    } catch (error) {
      console.error(`Error reading or parsing file`, error);
    }
  });

  return mergedData as LighthouseResult;
}

export { mergeFiles };
