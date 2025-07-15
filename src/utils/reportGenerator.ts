/**
 * Report Generator Utility
 * Generates various report formats from STPA analysis data
 */

import { AnalysisData, ReportOptions, GeneratedReport } from '@/types/types';

export interface ReportSection {
  title: string;
  content: string;
  level: number;
  subsections?: ReportSection[];
}

class ReportGenerator {
  generateReport(
    analysisData: AnalysisData,
    options: ReportOptions
  ): GeneratedReport {
    const reportId = `report-${Date.now()}`;
    const fileName = this.generateFileName(analysisData, options);
    
    let content: string | Blob;
    
    switch (options.format) {
      case 'markdown':
        content = this.generateMarkdownReport(analysisData, options);
        break;
      case 'html':
        content = this.generateHTMLReport(analysisData, options);
        break;
      case 'pdf':
        content = this.generatePDFReport(analysisData, options);
        break;
      case 'docx':
        content = this.generateDOCXReport(analysisData, options);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
    
    return {
      id: reportId,
      format: options.format,
      generatedAt: new Date(),
      fileName,
      content,
      options
    };
  }

  private generateFileName(data: AnalysisData, options: ReportOptions): string {
    const projectName = data.analysisSession?.title || 'STPA-Analysis';
    const date = new Date().toISOString().split('T')[0];
    const extension = options.format === 'docx' ? 'docx' : options.format;
    return `${projectName}-${date}.${extension}`;
  }

  private generateMarkdownReport(data: AnalysisData, options: ReportOptions): string {
    const sections: string[] = [];
    
    // Title
    sections.push(`# ${options.customTitle || 'STPA Analysis Report'}\n`);
    if (options.customSubtitle) {
      sections.push(`## ${options.customSubtitle}\n`);
    }
    
    // Metadata
    if (options.includeMetadata) {
      sections.push('### Report Information\n');
      sections.push(`- **Generated:** ${new Date().toLocaleString()}`);
      sections.push(`- **Author:** ${options.customAuthor || 'Unknown'}`);
      sections.push(`- **Organization:** ${options.customOrganization || 'Unknown'}`);
      sections.push(`- **Analysis Type:** ${data.analysisSession?.analysisType || 'STPA'}\n`);
    }
    
    // Executive Summary
    if (options.includeExecutiveSummary) {
      sections.push('## Executive Summary\n');
      sections.push('This report presents the results of a System-Theoretic Process Analysis (STPA)...\n');
    }
    
    // System Overview
    if (options.includeSystemOverview && data.analysisSession?.scope) {
      sections.push('## System Overview\n');
      sections.push(`**Scope:** ${data.analysisSession.scope}\n`);
    }
    
    // Losses
    if (options.includeLosses && data.losses?.length > 0) {
      sections.push('## Losses\n');
      data.losses.forEach((loss, index) => {
        sections.push(`### L-${index + 1}: ${loss.title}`);
        sections.push(`${loss.description}\n`);
      });
    }
    
    // Hazards
    if (options.includeHazards && data.hazards?.length > 0) {
      sections.push('## Hazards\n');
      data.hazards.forEach((hazard) => {
        sections.push(`### ${hazard.code}: ${hazard.title}`);
        sections.push(`**System Component:** ${hazard.systemComponent}`);
        sections.push(`**Environmental Condition:** ${hazard.environmentalCondition}`);
        sections.push(`**System State:** ${hazard.systemState}`);
        if (hazard.linkedLossIds?.length > 0) {
          sections.push(`**Associated Losses:** ${hazard.linkedLossIds.join(', ')}\n`);
        }
      });
    }
    
    // System Safety Constraints
    if (options.includeConstraints && data.systemConstraints?.length > 0) {
      sections.push('## System Safety Constraints\n');
      data.systemConstraints.forEach((constraint) => {
        sections.push(`### ${constraint.code}`);
        sections.push(`${constraint.text}`);
        if (constraint.hazardId) {
          sections.push(`**Associated Hazard:** ${constraint.hazardId}\n`);
        }
      });
    }
    
    // UCAs
    if (options.includeUCAs && data.ucas?.length > 0) {
      sections.push('## Unsafe Control Actions\n');
      data.ucas.forEach((uca) => {
        sections.push(`### ${uca.code}`);
        sections.push(`**Description:** ${uca.description}`);
        sections.push(`**Type:** ${uca.ucaType}`);
        sections.push(`**Context:** ${uca.context}\n`);
      });
    }
    
    return sections.join('\n');
  }

  private generateHTMLReport(data: AnalysisData, options: ReportOptions): string {
    const markdown = this.generateMarkdownReport(data, options);
    // Convert markdown to HTML (simplified version)
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${options.customTitle || 'STPA Analysis Report'}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    ul { list-style-type: disc; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  ${markdown.replace(/\n/g, '<br>')}
</body>
</html>`;
  }

  private generatePDFReport(_data: AnalysisData, _options: ReportOptions): Blob {
    // In a real implementation, this would use a PDF generation library
    // For now, return a placeholder Blob
    return new Blob(['PDF content would be generated here'], { type: 'application/pdf' });
  }

  private generateDOCXReport(_data: AnalysisData, _options: ReportOptions): Blob {
    // In a real implementation, this would use a DOCX generation library
    // For now, return a placeholder Blob
    return new Blob(['DOCX content would be generated here'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
}

export const reportGenerator = new ReportGenerator();