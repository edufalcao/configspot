import { createTwoFilesPatch } from 'diff';

export function rawDiff(left: string, right: string): string {
  return createTwoFilesPatch('left', 'right', left, right);
}
