import { cn } from './utils';

describe('cn utility', () => {
  it('merges tailwind classes correctly', () => {
    expect(cn('p-4', 'm-4')).toBe('p-4 m-4');
  });

  it('handles conditional classes', () => {
    const isTrue = true;
    const isFalse = false;
    
    expect(cn('p-4', isTrue && 'text-red-500', isFalse && 'text-blue-500')).toBe('p-4 text-red-500');
  });

  it('resolves tailwind conflicts correctly using tailwind-merge', () => {
    // text-red-500 should be overridden by text-blue-500
    expect(cn('p-4 text-red-500', 'text-blue-500')).toBe('p-4 text-blue-500');
  });
});
