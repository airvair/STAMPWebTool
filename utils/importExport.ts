/**
 * Import/Export functionality for STPA analysis data
 * Supports multiple formats: JSON, CSV, STPA-ML
 */

import { 
  Loss, 
  Hazard, 
  Controller, 
  ControlAction, 
  UnsafeControlAction, 
  UCCA,
  Requirement,
  FeedbackPath,
  ControlPath,
  CommunicationPath,
  SystemComponent
} from '@/types';

export interface ExportOptions {
  format: 'json' | 'csv' | 'stpa-ml';
  includeMetadata?: boolean;
  prettyPrint?: boolean;
  version?: string;
}

export interface ImportOptions {
  format: 'json' | 'csv' | 'stpa-ml';
  validateSchema?: boolean;
  mergeWithExisting?: boolean;
}

export interface STAPAnalysisData {
  metadata?: {
    projectName?: string;
    projectId?: string;
    version?: string;
    exportDate?: string;
    exportedBy?: string;
    toolVersion?: string;
  };
  losses: Loss[];
  hazards: Hazard[];
  controllers: Controller[];
  controlActions: ControlAction[];
  feedbackPaths: FeedbackPath[];
  controlPaths: ControlPath[];
  communicationPaths: CommunicationPath[];
  systemComponents: SystemComponent[];
  ucas: UnsafeControlAction[];
  uccas: UCCA[];
  requirements: Requirement[];
}

export interface ImportResult {
  success: boolean;
  data?: STAPAnalysisData;
  errors: string[];
  warnings: string[];
  statistics: {
    totalItems: number;
    importedItems: number;
    skippedItems: number;
    failedItems: number;
  };
}

/**
 * Import/Export Manager for STPA Analysis Data
 */
export class ImportExportManager {
  
  /**
   * Export complete STPA analysis
   */
  export(data: STAPAnalysisData, options: ExportOptions): string | Blob {
    switch (options.format) {
      case 'json':
        return this.exportToJSON(data, options);
      case 'csv':
        return this.exportToCSV(data, options);
      case 'stpa-ml':
        return this.exportToSTPAML(data, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Import STPA analysis data
   */
  async import(content: string | File, options: ImportOptions): Promise<ImportResult> {
    try {
      let textContent: string;
      
      if (content instanceof File) {
        textContent = await this.readFileContent(content);
      } else {
        textContent = content;
      }

      switch (options.format) {
        case 'json':
          return await this.importFromJSON(textContent, options);
        case 'csv':
          return await this.importFromCSV(textContent, options);
        case 'stpa-ml':
          return await this.importFromSTPAML(textContent, options);
        default:
          throw new Error(`Unsupported import format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Import failed'],
        warnings: [],
        statistics: {
          totalItems: 0,
          importedItems: 0,
          skippedItems: 0,
          failedItems: 0
        }
      };
    }
  }

  /**
   * Export to JSON format
   */
  private exportToJSON(data: STAPAnalysisData, options: ExportOptions): string {
    const exportData: STAPAnalysisData = {
      ...data,
      metadata: options.includeMetadata ? {
        ...data.metadata,
        exportDate: new Date().toISOString(),
        version: options.version || '1.0.0',
        toolVersion: 'STAMP Web Tool v1.0'
      } : undefined
    };

    return options.prettyPrint 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  }

  /**
   * Export to CSV format (multiple files)
   */
  private exportToCSV(data: STAPAnalysisData, options: ExportOptions): Blob {
    const zip = new (window as any).JSZip();
    
    // Export each entity type as a separate CSV
    this.exportEntitiesToCSV(zip, 'losses.csv', data.losses, this.lossToCSVRow);
    this.exportEntitiesToCSV(zip, 'hazards.csv', data.hazards, this.hazardToCSVRow);
    this.exportEntitiesToCSV(zip, 'controllers.csv', data.controllers, this.controllerToCSVRow);
    this.exportEntitiesToCSV(zip, 'control_actions.csv', data.controlActions, this.controlActionToCSVRow);
    this.exportEntitiesToCSV(zip, 'ucas.csv', data.ucas, this.ucaToCSVRow);
    this.exportEntitiesToCSV(zip, 'uccas.csv', data.uccas, this.uccaToCSVRow);
    this.exportEntitiesToCSV(zip, 'requirements.csv', data.requirements, this.requirementToCSVRow);

    // Add metadata if requested
    if (options.includeMetadata) {
      const metadata = `Project: ${data.metadata?.projectName || 'Unnamed'}
Export Date: ${new Date().toISOString()}
Version: ${options.version || '1.0.0'}
Tool: STAMP Web Tool v1.0`;
      zip.file('metadata.txt', metadata);
    }

    return zip.generateAsync({ type: 'blob' });
  }

  /**
   * Export to STPA-ML (XML) format
   */
  private exportToSTPAML(data: STAPAnalysisData, options: ExportOptions): string {
    const xmlDoc = document.implementation.createDocument('', '', null);
    const root = xmlDoc.createElement('STAPAnalysis');
    root.setAttribute('version', options.version || '1.0');
    
    if (options.includeMetadata && data.metadata) {
      const metadataEl = xmlDoc.createElement('Metadata');
      Object.entries(data.metadata).forEach(([key, value]) => {
        const el = xmlDoc.createElement(key);
        el.textContent = String(value);
        metadataEl.appendChild(el);
      });
      root.appendChild(metadataEl);
    }

    // Add losses
    const lossesEl = xmlDoc.createElement('Losses');
    data.losses.forEach(loss => {
      const lossEl = xmlDoc.createElement('Loss');
      lossEl.setAttribute('id', loss.id);
      lossEl.setAttribute('code', loss.code);
      
      const titleEl = xmlDoc.createElement('Title');
      titleEl.textContent = loss.title;
      lossEl.appendChild(titleEl);
      
      const descEl = xmlDoc.createElement('Description');
      descEl.textContent = loss.description;
      lossEl.appendChild(descEl);
      
      lossesEl.appendChild(lossEl);
    });
    root.appendChild(lossesEl);

    // Add hazards
    const hazardsEl = xmlDoc.createElement('Hazards');
    data.hazards.forEach(hazard => {
      const hazardEl = xmlDoc.createElement('Hazard');
      hazardEl.setAttribute('id', hazard.id);
      hazardEl.setAttribute('code', hazard.code);
      
      const titleEl = xmlDoc.createElement('Title');
      titleEl.textContent = hazard.title;
      hazardEl.appendChild(titleEl);
      
      const systemCondEl = xmlDoc.createElement('SystemCondition');
      systemCondEl.textContent = hazard.systemCondition || '';
      hazardEl.appendChild(systemCondEl);
      
      const envCondEl = xmlDoc.createElement('EnvironmentalCondition');
      envCondEl.textContent = hazard.environmentalCondition || '';
      hazardEl.appendChild(envCondEl);
      
      // Add loss links
      hazard.linkedLossIds?.forEach(lossId => {
        const linkEl = xmlDoc.createElement('LossLink');
        linkEl.setAttribute('lossId', lossId);
        hazardEl.appendChild(linkEl);
      });
      
      hazardsEl.appendChild(hazardEl);
    });
    root.appendChild(hazardsEl);

    // Continue with other entities...
    // (Simplified for brevity - would include all entity types)

    xmlDoc.appendChild(root);
    
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
  }

  /**
   * Import from JSON format
   */
  private async importFromJSON(content: string, options: ImportOptions): Promise<ImportResult> {
    try {
      const data = JSON.parse(content) as STAPAnalysisData;
      
      if (options.validateSchema) {
        const validation = this.validateSTAPAnalysisData(data);
        if (!validation.isValid) {
          return {
            success: false,
            errors: validation.errors,
            warnings: [],
            statistics: {
              totalItems: 0,
              importedItems: 0,
              skippedItems: 0,
              failedItems: 0
            }
          };
        }
      }

      const totalItems = this.countTotalItems(data);
      
      return {
        success: true,
        data,
        errors: [],
        warnings: [],
        statistics: {
          totalItems,
          importedItems: totalItems,
          skippedItems: 0,
          failedItems: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: ['Invalid JSON format'],
        warnings: [],
        statistics: {
          totalItems: 0,
          importedItems: 0,
          skippedItems: 0,
          failedItems: 0
        }
      };
    }
  }

  /**
   * Import from CSV format
   */
  private async importFromCSV(_content: string, _options: ImportOptions): Promise<ImportResult> {
    // CSV import would require parsing multiple CSV files
    // This is a simplified implementation
    return {
      success: false,
      errors: ['CSV import requires multiple files - use ZIP upload'],
      warnings: [],
      statistics: {
        totalItems: 0,
        importedItems: 0,
        skippedItems: 0,
        failedItems: 0
      }
    };
  }

  /**
   * Import from STPA-ML format
   */
  private async importFromSTPAML(content: string, _options: ImportOptions): Promise<ImportResult> {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid XML format');
      }

      const data: STAPAnalysisData = {
        losses: this.parseLossesFromXML(xmlDoc),
        hazards: this.parseHazardsFromXML(xmlDoc),
        controllers: this.parseControllersFromXML(xmlDoc),
        controlActions: this.parseControlActionsFromXML(xmlDoc),
        feedbackPaths: [],
        controlPaths: [],
        communicationPaths: [],
        systemComponents: [],
        ucas: this.parseUCAsFromXML(xmlDoc),
        uccas: this.parseUCCAsFromXML(xmlDoc),
        requirements: this.parseRequirementsFromXML(xmlDoc)
      };

      const totalItems = this.countTotalItems(data);

      return {
        success: true,
        data,
        errors: [],
        warnings: [],
        statistics: {
          totalItems,
          importedItems: totalItems,
          skippedItems: 0,
          failedItems: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'XML parsing failed'],
        warnings: [],
        statistics: {
          totalItems: 0,
          importedItems: 0,
          skippedItems: 0,
          failedItems: 0
        }
      };
    }
  }

  /**
   * Helper methods for CSV export
   */
  private exportEntitiesToCSV<T>(
    zip: any,
    filename: string,
    entities: T[],
    rowMapper: (entity: T) => string[]
  ): void {
    if (entities.length === 0) return;
    
    const headers = this.getCSVHeaders(filename);
    const rows = [headers, ...entities.map(rowMapper)];
    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    zip.file(filename, csv);
  }

  private getCSVHeaders(filename: string): string[] {
    const headerMap: Record<string, string[]> = {
      'losses.csv': ['ID', 'Code', 'Title', 'Description'],
      'hazards.csv': ['ID', 'Code', 'Title', 'System Condition', 'Environmental Condition', 'Loss IDs'],
      'controllers.csv': ['ID', 'Name', 'Type', 'Description'],
      'control_actions.csv': ['ID', 'Controller ID', 'Verb', 'Object', 'Description'],
      'ucas.csv': ['ID', 'Code', 'Controller ID', 'Control Action ID', 'Type', 'Description', 'Context', 'Hazard IDs'],
      'uccas.csv': ['ID', 'Code', 'Type', 'Description', 'Context', 'Controller IDs', 'Hazard IDs'],
      'requirements.csv': ['ID', 'Code', 'Type', 'Description', 'UCA IDs']
    };
    
    return headerMap[filename] || [];
  }

  private lossToCSVRow(loss: Loss): string[] {
    return [loss.id, loss.code, loss.title, loss.description];
  }

  private hazardToCSVRow(hazard: Hazard): string[] {
    return [
      hazard.id,
      hazard.code,
      hazard.title,
      hazard.systemCondition || '',
      hazard.environmentalCondition || '',
      hazard.linkedLossIds?.join(';') || ''
    ];
  }

  private controllerToCSVRow(controller: Controller): string[] {
    return [
      controller.id,
      controller.name,
      controller.ctrlType,
      controller.description || ''
    ];
  }

  private controlActionToCSVRow(action: ControlAction): string[] {
    return [
      action.id,
      action.controllerId,
      action.verb,
      action.object,
      action.description || ''
    ];
  }

  private ucaToCSVRow(uca: UnsafeControlAction): string[] {
    return [
      uca.id,
      uca.code || '',
      uca.controllerId,
      uca.controlActionId,
      uca.ucaType,
      uca.description || '',
      uca.context || '',
      uca.hazardIds.join(';')
    ];
  }

  private uccaToCSVRow(ucca: UCCA): string[] {
    return [
      ucca.id,
      ucca.code || '',
      ucca.uccaType,
      ucca.description,
      ucca.context || '',
      ucca.involvedControllerIds.join(';'),
      ucca.hazardIds.join(';')
    ];
  }


  private requirementToCSVRow(requirement: Requirement): string[] {
    return [
      requirement.id,
      requirement.code || '',
      requirement.type,
      requirement.text || '',
      requirement.ucaIds?.join(';') || ''
    ];
  }

  /**
   * XML parsing helpers
   */
  private parseLossesFromXML(xmlDoc: Document): Loss[] {
    const losses: Loss[] = [];
    const lossElements = xmlDoc.getElementsByTagName('Loss');
    
    for (let i = 0; i < lossElements.length; i++) {
      const el = lossElements[i];
      losses.push({
        id: el.getAttribute('id') || '',
        code: el.getAttribute('code') || '',
        title: el.querySelector('Title')?.textContent || '',
        description: el.querySelector('Description')?.textContent || ''
      });
    }
    
    return losses;
  }

  private parseHazardsFromXML(xmlDoc: Document): Hazard[] {
    const hazards: Hazard[] = [];
    const hazardElements = xmlDoc.getElementsByTagName('Hazard');
    
    for (let i = 0; i < hazardElements.length; i++) {
      const el = hazardElements[i];
      const lossLinks = el.getElementsByTagName('LossLink');
      const lossIds: string[] = [];
      
      for (let j = 0; j < lossLinks.length; j++) {
        const lossId = lossLinks[j].getAttribute('lossId');
        if (lossId) lossIds.push(lossId);
      }
      
      hazards.push({
        id: el.getAttribute('id') || '',
        code: el.getAttribute('code') || '',
        title: el.querySelector('Title')?.textContent || '',
        systemComponent: '', // Add required field
        systemState: '', // Add required field
        systemCondition: el.querySelector('SystemCondition')?.textContent || '',
        environmentalCondition: el.querySelector('EnvironmentalCondition')?.textContent || '',
        linkedLossIds: lossIds
      });
    }
    
    return hazards;
  }

  // Similar parsing methods for other entity types...
  private parseControllersFromXML(_xmlDoc: Document): Controller[] {
    // Implementation would follow similar pattern
    return [];
  }

  private parseControlActionsFromXML(_xmlDoc: Document): ControlAction[] {
    return [];
  }

  private parseUCAsFromXML(_xmlDoc: Document): UnsafeControlAction[] {
    return [];
  }

  private parseUCCAsFromXML(_xmlDoc: Document): UCCA[] {
    return [];
  }


  private parseRequirementsFromXML(_xmlDoc: Document): Requirement[] {
    return [];
  }

  /**
   * Utility methods
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private validateSTAPAnalysisData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Invalid data structure');
      return { isValid: false, errors };
    }

    // Check required arrays
    const requiredArrays = [
      'losses', 'hazards', 'controllers', 'controlActions',
      'ucas', 'uccas', 'requirements',
      'feedbackPaths', 'controlPaths', 'communicationPaths', 'systemComponents'
    ];

    requiredArrays.forEach(key => {
      if (!Array.isArray(data[key])) {
        errors.push(`Missing or invalid ${key} array`);
      }
    });

    // Additional validation could check IDs, references, etc.

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private countTotalItems(data: STAPAnalysisData): number {
    return (
      data.losses.length +
      data.hazards.length +
      data.controllers.length +
      data.controlActions.length +
      data.feedbackPaths.length +
      data.controlPaths.length +
      data.communicationPaths.length +
      data.systemComponents.length +
      data.ucas.length +
      data.uccas.length +
      data.requirements.length
    );
  }

  /**
   * Generate export filename
   */
  generateFilename(projectName: string, format: string): string {
    const sanitized = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    return `${sanitized}_stpa_export_${date}.${format}`;
  }
}

// Export singleton instance
export const importExportManager = new ImportExportManager();