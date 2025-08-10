/**
 * Step 3: UCAs and UCCAs Module
 *
 * This module exports components for analyzing Unsafe Control Actions (UCAs)
 * and Unsafe Combinations of Control Actions (UCCAs) as part of the STPA/CAST methodology.
 */

// Main exports from components directory (maintains backward compatibility)
export * from './components';

// Export UCA module
export * as UCAModule from './ucas';

// Export UCCA module
export * as UCCAModule from './uccas';

// Direct exports for convenience
export { UCAEditor, UCANavigator, UCAWorkspace, UCAAnalysis, EnterpriseUCAMatrix } from './ucas';

export { UCCAs, UCCAPlaceholder } from './uccas';
