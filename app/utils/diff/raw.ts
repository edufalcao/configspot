import { createTwoFilesPatch } from 'diff';

export interface DiffOptions {
  ignoreWhitespace?: boolean
}

/**
 * Collapse all whitespace sequences in a string to a single space.
 * Applied before diffing when ignoreWhitespace is true.
 */
function collapseWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ');
}

export function rawDiff(left: string, right: string, options: DiffOptions = {}): string {
  const { ignoreWhitespace = false } = options;

  const leftProcessed = ignoreWhitespace ? collapseWhitespace(left) : left;
  const rightProcessed = ignoreWhitespace ? collapseWhitespace(right) : right;

  return createTwoFilesPatch('left', 'right', leftProcessed, rightProcessed, '', '', {
    ignoreWhitespace
  });
}
