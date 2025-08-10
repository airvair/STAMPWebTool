import { UCAType } from '@/types/types';

/**
 * Generates a unique code for a UCA based on its type and action
 */
export function generateUCACode(ucaType: UCAType, controlActionId: string): string {
  const typePrefix: Record<UCAType, string> = {
    [UCAType.NotProvided]: 'NP',
    [UCAType.ProvidedUnsafe]: 'P',
    [UCAType.TooEarly]: 'TE',
    [UCAType.TooLate]: 'TL',
    [UCAType.WrongOrder]: 'WO',
    [UCAType.TooLong]: 'TLo',
    [UCAType.TooShort]: 'TS',
  };

  const prefix = typePrefix[ucaType] || 'UCA';
  const timestamp = Date.now().toString().slice(-6);

  return `${prefix}-${timestamp}`;
}
