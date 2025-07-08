/**
 * Automated Report Generation for STPA Analysis
 * Generates comprehensive reports in multiple formats
 */

import {
  Loss,
  Hazard,
  Controller,
  ControlAction,
  UnsafeControlAction,
  UCCA,
  CausalScenario,
  Requirement,
  ControllerType
} from '@/types';
import { completenessChecker } from './completenessChecker';
import { versionControlManager } from './versionControl';
import { format } from 'date-fns';

export interface ReportOptions {
  format: 'pdf' | 'docx' | 'html' | 'markdown';
  includeExecutiveSummary?: boolean;
  includeDetailedAnalysis?: boolean;
  includeVisualizations?: boolean;
  includeAppendices?: boolean;
  includeVersionHistory?: boolean;
  includeTraceabilityMatrix?: boolean;
  customSections?: ReportSection[];
  metadata?: {
    title?: string;
    author?: string;
    organization?: string;
    classification?: string;
    version?: string;
  };
}

export interface ReportSection {
  id: string;
  title: string;
  content: string | (() => string);
  level: 1 | 2 | 3;
  pageBreakBefore?: boolean;
}

export interface GeneratedReport {
  format: string;
  content: string | Blob;
  metadata: {
    generatedAt: Date;
    pageCount?: number;
    wordCount?: number;
    includedSections: string[];
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  defaultOptions: Partial<ReportOptions>;
}

/**
 * Report Generator for STPA Analysis
 */
export class ReportGenerator {
  private templates = new Map<string, ReportTemplate>();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Generate a comprehensive STPA report
   */
  async generateReport(
    data: {
      losses: Loss[];
      hazards: Hazard[];
      controllers: Controller[];
      controlActions: ControlAction[];
      ucas: UnsafeControlAction[];
      uccas: UCCA[];
      scenarios: CausalScenario[];
      requirements: Requirement[];
    },
    options: ReportOptions
  ): Promise<GeneratedReport> {
    const sections: ReportSection[] = [];

    // Title page
    sections.push(this.generateTitlePage(options.metadata));

    // Table of contents
    sections.push(this.generateTableOfContents(data, options));

    // Executive summary if requested
    if (options.includeExecutiveSummary) {
      sections.push(this.generateExecutiveSummary(data));
    }

    // Main content sections
    sections.push(...this.generateMainContent(data, options));

    // Appendices if requested
    if (options.includeAppendices) {
      sections.push(...this.generateAppendices(data, options));
    }

    // Add custom sections
    if (options.customSections) {
      sections.push(...options.customSections);
    }

    // Generate report in requested format
    let content: string | Blob;
    switch (options.format) {
      case 'markdown':
        content = this.generateMarkdownReport(sections, data, options);
        break;
      case 'html':
        content = this.generateHTMLReport(sections, data, options);
        break;
      case 'pdf':
        content = await this.generatePDFReport(sections, data, options);
        break;
      case 'docx':
        content = await this.generateDOCXReport(sections, data, options);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    const metadata = {
      generatedAt: new Date(),
      includedSections: sections.map(s => s.title),
      wordCount: this.calculateWordCount(sections),
      pageCount: this.estimatePageCount(sections)
    };

    return { format: options.format, content, metadata };
  }

  /**
   * Generate title page
   */
  private generateTitlePage(metadata?: ReportOptions['metadata']): ReportSection {
    const today = format(new Date(), 'MMMM d, yyyy');
    
    return {
      id: 'title-page',
      title: 'Title Page',
      level: 1,
      content: `
# ${metadata?.title || 'System-Theoretic Process Analysis (STPA) Report'}

${metadata?.organization ? `**Organization:** ${metadata.organization}\n\n` : ''}
${metadata?.author ? `**Author:** ${metadata.author}\n\n` : ''}
${metadata?.version ? `**Version:** ${metadata.version}\n\n` : ''}
${metadata?.classification ? `**Classification:** ${metadata.classification}\n\n` : ''}
**Date:** ${today}

---

This report was generated using the STAMP Web Tool, implementing the System-Theoretic Accident Model and Processes (STAMP) methodology developed by Prof. Nancy Leveson at MIT.
      `.trim()
    };
  }

  /**
   * Generate table of contents
   */
  private generateTableOfContents(
    data: any,
    options: ReportOptions
  ): ReportSection {
    const sections = [];
    
    sections.push('1. Introduction');
    sections.push('2. System Overview');
    sections.push('3. Loss and Hazard Analysis');
    sections.push('4. Control Structure');
    sections.push('5. Unsafe Control Actions (UCAs)');
    sections.push('6. Causal Analysis (UCCAs)');
    sections.push('7. Causal Scenarios');
    sections.push('8. Safety Requirements and Mitigations');
    
    if (options.includeDetailedAnalysis) {
      sections.push('9. Detailed Analysis');
    }
    
    if (options.includeTraceabilityMatrix) {
      sections.push('10. Traceability Matrix');
    }
    
    if (options.includeVersionHistory) {
      sections.push('11. Version History');
    }

    return {
      id: 'table-of-contents',
      title: 'Table of Contents',
      level: 1,
      content: sections.join('\n')
    };
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(data: any): ReportSection {
    const completenessReport = completenessChecker.checkCompleteness(data);
    const criticalFindings = this.analyzeCriticalFindings(data);
    
    return {
      id: 'executive-summary',
      title: 'Executive Summary',
      level: 1,
      pageBreakBefore: true,
      content: `
## Executive Summary

### Analysis Overview
This STPA analysis identified **${data.losses.length} losses**, **${data.hazards.length} hazards**, and **${data.ucas.length} unsafe control actions** across **${data.controllers.length} controllers** in the system.

### Key Findings
- **Critical Risk UCAs:** ${criticalFindings.criticalUCAs} unsafe control actions require immediate attention
- **High-Priority Hazards:** ${criticalFindings.highPriorityHazards} hazards pose significant system risks
- **Coverage:** ${criticalFindings.ucaCoverage}% of UCAs have associated causal scenarios
- **Requirements:** ${data.requirements.length} safety requirements identified

### Completeness Assessment
- **Overall Completeness:** ${completenessReport.overallCompleteness.toFixed(1)}%
- **Critical Issues:** ${completenessReport.issues.filter(i => i.severity === 'critical').length}
- **Recommendations:** ${completenessReport.suggestions.length} improvement suggestions

### Risk Summary
${this.generateRiskSummary(data)}

### Next Steps
1. Address ${criticalFindings.unmitigatedRisks} unmitigated critical risks
2. Complete causal analysis for ${criticalFindings.ucasWithoutScenarios} UCAs
3. Implement ${criticalFindings.pendingRequirements} pending safety requirements
      `.trim()
    };
  }

  /**
   * Generate main content sections
   */
  private generateMainContent(
    data: any,
    options: ReportOptions
  ): ReportSection[] {
    const sections: ReportSection[] = [];

    // Introduction
    sections.push({
      id: 'introduction',
      title: 'Introduction',
      level: 1,
      pageBreakBefore: true,
      content: this.generateIntroduction()
    });

    // System Overview
    sections.push({
      id: 'system-overview',
      title: 'System Overview',
      level: 1,
      content: this.generateSystemOverview(data)
    });

    // Losses and Hazards
    sections.push({
      id: 'losses-hazards',
      title: 'Loss and Hazard Analysis',
      level: 1,
      pageBreakBefore: true,
      content: this.generateLossesAndHazards(data)
    });

    // Control Structure
    sections.push({
      id: 'control-structure',
      title: 'Control Structure',
      level: 1,
      pageBreakBefore: true,
      content: this.generateControlStructure(data)
    });

    // UCAs
    sections.push({
      id: 'ucas',
      title: 'Unsafe Control Actions (UCAs)',
      level: 1,
      pageBreakBefore: true,
      content: this.generateUCAs(data)
    });

    // UCCAs
    sections.push({
      id: 'uccas',
      title: 'Causal Analysis (UCCAs)',
      level: 1,
      pageBreakBefore: true,
      content: this.generateUCCAs(data)
    });

    // Causal Scenarios
    sections.push({
      id: 'scenarios',
      title: 'Causal Scenarios',
      level: 1,
      pageBreakBefore: true,
      content: this.generateScenarios(data)
    });

    // Requirements
    sections.push({
      id: 'requirements',
      title: 'Safety Requirements and Mitigations',
      level: 1,
      pageBreakBefore: true,
      content: this.generateRequirements(data)
    });

    return sections;
  }

  /**
   * Generate appendices
   */
  private generateAppendices(
    data: any,
    options: ReportOptions
  ): ReportSection[] {
    const sections: ReportSection[] = [];

    if (options.includeTraceabilityMatrix) {
      sections.push({
        id: 'traceability-matrix',
        title: 'Traceability Matrix',
        level: 1,
        pageBreakBefore: true,
        content: this.generateTraceabilityMatrix(data)
      });
    }

    if (options.includeVersionHistory) {
      sections.push({
        id: 'version-history',
        title: 'Version History',
        level: 1,
        pageBreakBefore: true,
        content: this.generateVersionHistory()
      });
    }

    // Glossary
    sections.push({
      id: 'glossary',
      title: 'Glossary',
      level: 1,
      pageBreakBefore: true,
      content: this.generateGlossary()
    });

    // References
    sections.push({
      id: 'references',
      title: 'References',
      level: 1,
      content: this.generateReferences()
    });

    return sections;
  }

  /**
   * Content generation methods
   */
  private generateIntroduction(): string {
    return `
This report documents the System-Theoretic Process Analysis (STPA) conducted on the system. STPA is a hazard analysis technique based on systems theory that is particularly effective for analyzing complex systems with software-intensive control, human operators, and organizational aspects.

## Methodology
The analysis follows the standard STPA process:
1. Define purpose of the analysis
2. Model the control structure
3. Identify unsafe control actions
4. Identify loss scenarios

## Scope
This analysis covers all identified system components, their interactions, and potential hazardous scenarios that could lead to losses.
    `.trim();
  }

  private generateSystemOverview(data: any): string {
    const controllerTypes = this.groupControllersByType(data.controllers);
    
    return `
The system consists of ${data.controllers.length} controllers managing ${data.controlActions.length} control actions.

## Controller Distribution
${Object.entries(controllerTypes).map(([type, controllers]) => 
  `- **${type} Controllers:** ${controllers.length}`
).join('\n')}

## System Boundaries
The analysis encompasses all controllers and their associated control actions, feedback mechanisms, and communication pathways within the defined system boundary.

## Key System Components
${data.controllers.slice(0, 5).map((c: Controller) => 
  `- **${c.name}:** ${c.description || 'No description provided'}`
).join('\n')}
${data.controllers.length > 5 ? `\n... and ${data.controllers.length - 5} more controllers` : ''}
    `.trim();
  }

  private generateLossesAndHazards(data: any): string {
    return `
## Losses (${data.losses.length} identified)

${data.losses.map((loss: Loss, idx: number) => `
### ${loss.code || `L-${idx + 1}`}: ${loss.title}
${loss.description}
`).join('\n')}

## Hazards (${data.hazards.length} identified)

${data.hazards.map((hazard: Hazard, idx: number) => `
### ${hazard.code || `H-${idx + 1}`}: ${hazard.title}
**System Condition:** ${hazard.systemCondition}
${hazard.environmentalCondition ? `**Environmental Condition:** ${hazard.environmentalCondition}` : ''}

**Associated Losses:** ${hazard.lossIds.map(id => {
  const loss = data.losses.find((l: Loss) => l.id === id);
  return loss ? loss.code || loss.title : id;
}).join(', ')}
`).join('\n')}
    `.trim();
  }

  private generateControlStructure(data: any): string {
    const hierarchy = this.buildControllerHierarchy(data);
    
    return `
The control structure consists of ${data.controllers.length} controllers organized in a hierarchical structure.

## Controller Hierarchy
${this.formatHierarchy(hierarchy)}

## Control Actions Summary
- **Total Control Actions:** ${data.controlActions.length}
- **Average Actions per Controller:** ${(data.controlActions.length / data.controllers.length).toFixed(1)}

## Key Control Loops
${this.identifyKeyControlLoops(data).map((loop: any) => 
  `- ${loop.controller} → ${loop.action} → ${loop.controlledProcess}`
).join('\n')}
    `.trim();
  }

  private generateUCAs(data: any): string {
    const ucasByType = this.groupUCAsByType(data.ucas);
    const ucasByRisk = this.groupUCAsByRisk(data.ucas);
    
    return `
## UCA Summary
- **Total UCAs Identified:** ${data.ucas.length}
- **Critical/High Risk:** ${ucasByRisk.critical + ucasByRisk.high}
- **Medium Risk:** ${ucasByRisk.medium}
- **Low Risk:** ${ucasByRisk.low}

## UCAs by Type
${Object.entries(ucasByType).map(([type, ucas]) => 
  `- **${type}:** ${ucas.length} UCAs`
).join('\n')}

## Detailed UCA List

${data.ucas.map((uca: UnsafeControlAction, idx: number) => `
### ${uca.code || `UCA-${idx + 1}`}
**Controller:** ${this.getControllerName(data.controllers, uca.controllerId)}
**Control Action:** ${this.getControlActionName(data.controlActions, uca.controlActionId)}
**Type:** ${uca.ucaType}
**Context:** ${uca.context}

**Description:** ${uca.description}

**Associated Hazards:** ${uca.hazardIds.map(id => {
  const hazard = data.hazards.find((h: Hazard) => h.id === id);
  return hazard ? hazard.code || hazard.title : id;
}).join(', ')}

**Risk Assessment:**
- Category: ${uca.riskCategory || 'Not assessed'}
- Score: ${uca.riskScore || 'N/A'}
`).join('\n')}
    `.trim();
  }

  private generateUCCAs(data: any): string {
    const uccasByType = this.groupUCCAsByType(data.uccas);
    
    return `
## UCCA Summary
- **Total UCCAs Identified:** ${data.uccas.length}
- **Type 1a (Controller):** ${uccasByType['1a'] || 0}
- **Type 1b (Actuator/CA Execution):** ${uccasByType['1b'] || 0}
- **Type 2a (Feedback):** ${uccasByType['2a'] || 0}
- **Type 2b (External Info):** ${uccasByType['2b'] || 0}

## Detailed UCCA Analysis

${data.uccas.map((ucca: UCCA, idx: number) => `
### ${ucca.code || `UCCA-${idx + 1}`}
**Type:** ${ucca.uccaType}
**Context:** ${ucca.context || 'General'}

**Description:** ${ucca.description}

**Involved Controllers:** ${ucca.involvedControllerIds.map(id => 
  this.getControllerName(data.controllers, id)
).join(', ')}

**Associated Hazards:** ${ucca.hazardIds.map(id => {
  const hazard = data.hazards.find((h: Hazard) => h.id === id);
  return hazard ? hazard.code || hazard.title : id;
}).join(', ')}

${ucca.specificCause ? `**Specific Cause:** ${ucca.specificCause}` : ''}
${ucca.timingConstraints ? `**Timing Constraints:** ${ucca.timingConstraints}` : ''}
`).join('\n')}
    `.trim();
  }

  private generateScenarios(data: any): string {
    return `
## Scenario Summary
- **Total Scenarios:** ${data.scenarios.length}
- **Scenarios with Requirements:** ${data.scenarios.filter((s: CausalScenario) => 
    data.requirements.some((r: Requirement) => r.scenarioIds?.includes(s.id))
  ).length}

## Detailed Scenarios

${data.scenarios.map((scenario: CausalScenario, idx: number) => `
### ${scenario.code || `CS-${idx + 1}`}: ${scenario.title}

**Description:** ${scenario.description}

**Associated UCAs:** ${(scenario.ucaIds || []).map((id: string) => {
  const uca = data.ucas.find((u: UnsafeControlAction) => u.id === id);
  return uca ? uca.code || `UCA-${data.ucas.indexOf(uca) + 1}` : id;
}).join(', ')}

**Associated UCCAs:** ${(scenario.uccaIds || []).map((id: string) => {
  const ucca = data.uccas.find((u: UCCA) => u.id === id);
  return ucca ? ucca.code || `UCCA-${data.uccas.indexOf(ucca) + 1}` : id;
}).join(', ')}

${scenario.triggers ? `**Triggers:** ${scenario.triggers}` : ''}
${scenario.conditions ? `**Conditions:** ${scenario.conditions}` : ''}
${scenario.consequences ? `**Consequences:** ${scenario.consequences}` : ''}
`).join('\n')}
    `.trim();
  }

  private generateRequirements(data: any): string {
    const reqsByType = this.groupRequirementsByType(data.requirements);
    
    return `
## Requirements Summary
- **Total Requirements:** ${data.requirements.length}
- **Functional Safety:** ${reqsByType.functional || 0}
- **Safety Constraints:** ${reqsByType.constraint || 0}
- **Design Requirements:** ${reqsByType.design || 0}
- **Operational:** ${reqsByType.operational || 0}

## Detailed Requirements

${data.requirements.map((req: Requirement, idx: number) => `
### ${req.code || `REQ-${idx + 1}`}
**Type:** ${req.type}
**Priority:** ${req.priority || 'Not specified'}

**Description:** ${req.description}

**Verification Method:** ${req.verificationMethod || 'TBD'}

**Associated Scenarios:** ${(req.scenarioIds || []).map((id: string) => {
  const scenario = data.scenarios.find((s: CausalScenario) => s.id === id);
  return scenario ? scenario.code || scenario.title : id;
}).join(', ')}

${req.implementation ? `**Implementation Notes:** ${req.implementation}` : ''}
`).join('\n')}
    `.trim();
  }

  private generateTraceabilityMatrix(data: any): string {
    // Generate a text-based traceability matrix
    const matrix: string[] = ['## Full Traceability Matrix\n'];
    
    matrix.push('| Loss | Hazards | UCAs | Scenarios | Requirements |');
    matrix.push('|------|---------|------|-----------|--------------|');
    
    data.losses.forEach((loss: Loss) => {
      const hazards = data.hazards.filter((h: Hazard) => h.lossIds.includes(loss.id));
      const ucas = data.ucas.filter((u: UnsafeControlAction) => 
        hazards.some(h => u.hazardIds.includes(h.id))
      );
      const scenarios = data.scenarios.filter((s: CausalScenario) =>
        ucas.some(u => s.ucaIds?.includes(u.id))
      );
      const requirements = data.requirements.filter((r: Requirement) =>
        scenarios.some(s => r.scenarioIds?.includes(s.id))
      );
      
      matrix.push(`| ${loss.code || loss.title} | ${hazards.length} | ${ucas.length} | ${scenarios.length} | ${requirements.length} |`);
    });
    
    return matrix.join('\n');
  }

  private generateVersionHistory(): string {
    const history = versionControlManager.getHistory(undefined, 10);
    
    return `
## Version History

${history.map(version => `
### ${version.version} - ${format(version.timestamp, 'yyyy-MM-dd HH:mm')}
**Author:** ${version.author.name}
**Message:** ${version.message}
**Changes:** ${version.changes.summary.totalChanges} total
- Additions: ${version.changes.additions.length}
- Modifications: ${version.changes.modifications.length}
- Deletions: ${version.changes.deletions.length}
`).join('\n')}
    `.trim();
  }

  private generateGlossary(): string {
    return `
## STPA Terminology

**CAST:** Causal Analysis based on STAMP
**Control Action:** A command or instruction from a controller to a controlled process
**Controller:** A system component that issues control actions
**Hazard:** A system state or set of conditions that can lead to a loss
**Loss:** Something of value to stakeholders that can be lost
**STAMP:** Systems-Theoretic Accident Model and Processes
**STPA:** System-Theoretic Process Analysis
**UCA:** Unsafe Control Action
**UCCA:** Unsafe Control action Causal Analysis
    `.trim();
  }

  private generateReferences(): string {
    return `
1. Leveson, N. (2011). Engineering a Safer World: Systems Thinking Applied to Safety. MIT Press.
2. Leveson, N., & Thomas, J. (2018). STPA Handbook. MIT.
3. Thomas, J. (2013). Extending and Automating a Systems-Theoretic Hazard Analysis for Requirements Generation and Analysis. PhD Thesis, MIT.
    `.trim();
  }

  /**
   * Format generation methods
   */
  private generateMarkdownReport(
    sections: ReportSection[],
    data: any,
    options: ReportOptions
  ): string {
    return sections.map(section => {
      const content = typeof section.content === 'function' 
        ? section.content() 
        : section.content;
      
      return `${section.pageBreakBefore ? '\\pagebreak\n\n' : ''}${content}`;
    }).join('\n\n---\n\n');
  }

  private generateHTMLReport(
    sections: ReportSection[],
    data: any,
    options: ReportOptions
  ): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.metadata?.title || 'STPA Report'}</title>
  <style>
    body { font-family: -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    h2 { color: #334155; margin-top: 30px; }
    h3 { color: #475569; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background-color: #f8fafc; }
    .page-break { page-break-before: always; }
    .metadata { color: #64748b; font-style: italic; }
    pre { background-color: #f8fafc; padding: 10px; border-radius: 4px; overflow-x: auto; }
    code { background-color: #f1f5f9; padding: 2px 4px; border-radius: 2px; }
  </style>
</head>
<body>
${sections.map(section => {
  const content = typeof section.content === 'function' 
    ? section.content() 
    : section.content;
  
  // Convert markdown to HTML (simplified)
  const htmlContent = content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/g, '<p>')
    .replace(/$/g, '</p>');
  
  return `${section.pageBreakBefore ? '<div class="page-break"></div>' : ''}${htmlContent}`;
}).join('\n')}
</body>
</html>
    `.trim();
    
    return html;
  }

  private async generatePDFReport(
    sections: ReportSection[],
    data: any,
    options: ReportOptions
  ): Promise<Blob> {
    // This would use a library like jsPDF or puppeteer
    // For now, return a placeholder
    const content = this.generateMarkdownReport(sections, data, options);
    return new Blob([content], { type: 'application/pdf' });
  }

  private async generateDOCXReport(
    sections: ReportSection[],
    data: any,
    options: ReportOptions
  ): Promise<Blob> {
    // This would use a library like docx
    // For now, return a placeholder
    const content = this.generateMarkdownReport(sections, data, options);
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  /**
   * Helper methods
   */
  private analyzeCriticalFindings(data: any): any {
    const criticalUCAs = data.ucas.filter((u: UnsafeControlAction) => 
      u.riskCategory === 'Critical' || u.riskCategory === 'High'
    ).length;
    
    const highPriorityHazards = data.hazards.filter((h: Hazard) => {
      const associatedUCAs = data.ucas.filter((u: UnsafeControlAction) => 
        u.hazardIds.includes(h.id)
      );
      return associatedUCAs.some(u => u.riskCategory === 'Critical' || u.riskCategory === 'High');
    }).length;
    
    const ucasWithScenarios = new Set(
      data.scenarios.flatMap((s: CausalScenario) => s.ucaIds || [])
    ).size;
    
    const ucaCoverage = data.ucas.length > 0 
      ? (ucasWithScenarios / data.ucas.length) * 100 
      : 0;
    
    return {
      criticalUCAs,
      highPriorityHazards,
      ucaCoverage,
      ucasWithoutScenarios: data.ucas.length - ucasWithScenarios,
      unmitigatedRisks: criticalUCAs, // Simplified
      pendingRequirements: data.requirements.filter((r: Requirement) => 
        !r.implementation
      ).length
    };
  }

  private generateRiskSummary(data: any): string {
    const riskCategories = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unassessed: 0
    };
    
    data.ucas.forEach((uca: UnsafeControlAction) => {
      const category = uca.riskCategory?.toLowerCase() || 'unassessed';
      if (category in riskCategories) {
        riskCategories[category as keyof typeof riskCategories]++;
      }
    });
    
    return Object.entries(riskCategories)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => `- **${category.charAt(0).toUpperCase() + category.slice(1)}:** ${count} UCAs`)
      .join('\n');
  }

  private groupControllersByType(controllers: Controller[]): Record<string, Controller[]> {
    return controllers.reduce((acc, controller) => {
      const type = controller.ctrlType || 'Unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(controller);
      return acc;
    }, {} as Record<string, Controller[]>);
  }

  private groupUCAsByType(ucas: UnsafeControlAction[]): Record<string, UnsafeControlAction[]> {
    return ucas.reduce((acc, uca) => {
      if (!acc[uca.ucaType]) acc[uca.ucaType] = [];
      acc[uca.ucaType].push(uca);
      return acc;
    }, {} as Record<string, UnsafeControlAction[]>);
  }

  private groupUCAsByRisk(ucas: UnsafeControlAction[]): Record<string, number> {
    return {
      critical: ucas.filter(u => u.riskCategory === 'Critical').length,
      high: ucas.filter(u => u.riskCategory === 'High').length,
      medium: ucas.filter(u => u.riskCategory === 'Medium').length,
      low: ucas.filter(u => u.riskCategory === 'Low').length,
      unassessed: ucas.filter(u => !u.riskCategory).length
    };
  }

  private groupUCCAsByType(uccas: UCCA[]): Record<string, number> {
    return uccas.reduce((acc, ucca) => {
      acc[ucca.uccaType] = (acc[ucca.uccaType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupRequirementsByType(requirements: Requirement[]): Record<string, number> {
    return requirements.reduce((acc, req) => {
      acc[req.type] = (acc[req.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private buildControllerHierarchy(data: any): any {
    // Simplified hierarchy building
    return data.controllers.map((c: Controller) => ({
      name: c.name,
      type: c.ctrlType,
      children: []
    }));
  }

  private formatHierarchy(hierarchy: any[], level: number = 0): string {
    return hierarchy.map(node => 
      `${'  '.repeat(level)}- ${node.name} (${node.type})\n${
        node.children.length > 0 ? this.formatHierarchy(node.children, level + 1) : ''
      }`
    ).join('');
  }

  private identifyKeyControlLoops(data: any): any[] {
    // Simplified control loop identification
    return data.controlActions.slice(0, 5).map((action: ControlAction) => {
      const controller = data.controllers.find((c: Controller) => c.id === action.controllerId);
      return {
        controller: controller?.name || 'Unknown',
        action: `${action.verb} ${action.object}`,
        controlledProcess: 'Controlled Process' // Simplified
      };
    });
  }

  private getControllerName(controllers: Controller[], id: string): string {
    const controller = controllers.find(c => c.id === id);
    return controller?.name || 'Unknown Controller';
  }

  private getControlActionName(actions: ControlAction[], id: string): string {
    const action = actions.find(a => a.id === id);
    return action ? `${action.verb} ${action.object}` : 'Unknown Action';
  }

  private calculateWordCount(sections: ReportSection[]): number {
    return sections.reduce((count, section) => {
      const content = typeof section.content === 'function' 
        ? section.content() 
        : section.content;
      return count + content.split(/\s+/).length;
    }, 0);
  }

  private estimatePageCount(sections: ReportSection[]): number {
    const wordCount = this.calculateWordCount(sections);
    return Math.ceil(wordCount / 300); // Rough estimate: 300 words per page
  }

  /**
   * Initialize default report templates
   */
  private initializeDefaultTemplates(): void {
    // Executive Report Template
    this.templates.set('executive', {
      id: 'executive',
      name: 'Executive Report',
      description: 'High-level summary for management',
      sections: [],
      defaultOptions: {
        includeExecutiveSummary: true,
        includeDetailedAnalysis: false,
        includeAppendices: false
      }
    });

    // Technical Report Template
    this.templates.set('technical', {
      id: 'technical',
      name: 'Technical Report',
      description: 'Detailed technical analysis',
      sections: [],
      defaultOptions: {
        includeExecutiveSummary: false,
        includeDetailedAnalysis: true,
        includeAppendices: true,
        includeTraceabilityMatrix: true
      }
    });

    // Compliance Report Template
    this.templates.set('compliance', {
      id: 'compliance',
      name: 'Compliance Report',
      description: 'For regulatory compliance',
      sections: [],
      defaultOptions: {
        includeExecutiveSummary: true,
        includeDetailedAnalysis: true,
        includeVersionHistory: true,
        includeTraceabilityMatrix: true
      }
    });
  }

  /**
   * Get available templates
   */
  getTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.get(id);
  }
}

// Export singleton instance
export const reportGenerator = new ReportGenerator();