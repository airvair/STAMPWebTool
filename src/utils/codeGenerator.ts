import { UCAType } from '@/types/types';

/**
 * Generates a unique code for a UCA based on its type and action
 */
export function generateUCACode(ucaType: UCAType, controlActionId: string): string {
  const typePrefix = {
    'not-provided': 'NP',
    'provided': 'P',
    'too-early': 'TE',
    'too-late': 'TL',
    'wrong-order': 'WO',
    'too-long': 'TLo',
    'too-short': 'TS'
  };
  
  const prefix = typePrefix[ucaType] || 'UCA';
  const timestamp = Date.now().toString().slice(-6);
  
  return `${prefix}-${timestamp}`;
}

/**
 * Generates a unique code for a UCCA
 */
export function generateUCCACode(uccaType: string): string {
  const typePrefix = {
    'Team-based': 'T',
    'Role-based': 'R',
    'Organizational': 'O',
    'Cross-Controller': 'CC',
    'Temporal': 'TM'
  };
  
  const prefix = typePrefix[uccaType] || 'UCCA';
  const timestamp = Date.now().toString().slice(-6);
  
  return `UCCA-${prefix}-${timestamp}`;
}