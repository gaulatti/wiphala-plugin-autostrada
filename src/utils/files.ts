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

/**
 * Groups a list of file paths by their identifier, which is derived from the filename
 * (the portion before the first dot in the filename).
 *
 * @param acc - The accumulator object that stores files grouped by their identifier.
 *              Keys are identifiers, and values are arrays of file paths.
 * @param file - The file path to be processed and grouped.
 * @returns The updated accumulator object with the file grouped under its identifier.
 */
const groupFilesById = (acc: Record<string, string[]>, file: string) => {
  const id = getIdFromFilename(file);

  if (!acc[id]) {
    acc[id] = [];
  }

  acc[id].push(file);
  return acc;
};

/**
 * Extracts the ID from a given file path by taking the last segment of the path,
 * splitting it by the file extension delimiter, and returning the first part.
 *
 * @param file - The full file path as a string.
 * @returns The extracted ID from the filename.
 *
 * @example
 * ```typescript
 * const id = getIdFromFilename('/path/to/file/12345.txt');
 * console.log(id); // Output: '12345'
 * ```
 */
const getIdFromFilename = (file: string) => {
  const filename = file.split('/').pop();
  const [id] = filename!.split('.');

  return id;
};

export { getIdFromFilename, groupFilesById, mergeFiles };
