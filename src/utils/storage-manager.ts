import { Project } from '@/context/ProjectsContext';

interface StorageMetrics {
  used: number;
  available: number;
  total: number;
  usagePercentage: number;
  projectSizes: { [projectId: string]: number };
  analysisSizes: { [analysisId: string]: number };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class StorageManager {
  private static instance: StorageManager;
  private readonly WARNING_THRESHOLD = 0.8; // 80% usage warning
  private readonly CRITICAL_THRESHOLD = 0.95; // 95% usage critical

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  /**
   * Get current storage usage metrics
   */
  async getStorageMetrics(): Promise<StorageMetrics> {
    try {
      // Try to use navigator.storage.estimate() if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const total = estimate.quota || 10 * 1024 * 1024; // Default 10MB if not available

        // Calculate per-project and per-analysis sizes
        const { projectSizes, analysisSizes } = this.calculateDetailedSizes();

        return {
          used,
          available: total - used,
          total,
          usagePercentage: (used / total) * 100,
          projectSizes,
          analysisSizes,
        };
      }
    } catch (error) {
      // Storage estimate API not available, falling back to localStorage size calculation
    }

    // Fallback: Calculate localStorage size manually
    const localStorageSize = this.calculateLocalStorageSize();
    const estimatedQuota = 10 * 1024 * 1024; // 10MB typical limit

    const { projectSizes, analysisSizes } = this.calculateDetailedSizes();

    return {
      used: localStorageSize,
      available: estimatedQuota - localStorageSize,
      total: estimatedQuota,
      usagePercentage: (localStorageSize / estimatedQuota) * 100,
      projectSizes,
      analysisSizes,
    };
  }

  /**
   * Check if there's enough storage for a new operation
   */
  async checkStorageAvailable(estimatedSize: number): Promise<boolean> {
    const metrics = await this.getStorageMetrics();
    return metrics.available > estimatedSize;
  }

  /**
   * Get storage health status
   */
  async getStorageHealth(): Promise<'healthy' | 'warning' | 'critical'> {
    const metrics = await this.getStorageMetrics();
    const usageRatio = metrics.usagePercentage / 100;

    if (usageRatio >= this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (usageRatio >= this.WARNING_THRESHOLD) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Validate data integrity
   */
  validateData(key: string, data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Basic validation
      if (!data) {
        errors.push(`Data for key "${key}" is empty or null`);
        return { isValid: false, errors, warnings };
      }

      // Check if data can be serialized
      const serialized = JSON.stringify(data);
      const parsed = JSON.parse(serialized);

      // Check data size
      const dataSize = new Blob([serialized]).size;
      if (dataSize > 1024 * 1024) {
        // 1MB warning for single item
        warnings.push(`Data for key "${key}" is large (${(dataSize / 1024).toFixed(2)}KB)`);
      }

      // Type-specific validation
      if (key.startsWith('stamp-projects')) {
        this.validateProjects(parsed, errors, warnings);
      } else if (key.includes('-')) {
        // Analysis-specific data
        this.validateAnalysisData(key, parsed, errors, warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Failed to validate data for key "${key}": ${error}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Save with validation and checksum
   */
  saveWithValidation(key: string, data: any): { success: boolean; error?: string } {
    try {
      // Validate data
      const validation = this.validateData(key, data);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join('; ') };
      }

      // Calculate checksum
      const checksum = this.calculateChecksum(data);
      const wrappedData = {
        data,
        checksum,
        timestamp: Date.now(),
      };

      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(wrappedData));

      // Also save checksum separately for quick validation
      localStorage.setItem(`${key}-checksum`, checksum);

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to save: ${error}` };
    }
  }

  /**
   * Load with validation
   */
  loadWithValidation<T>(key: string): { data?: T; isValid: boolean; error?: string } {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        return { isValid: false, error: 'No data found' };
      }

      const wrappedData = JSON.parse(stored);

      // Check if it's wrapped data with checksum
      if (wrappedData.checksum && wrappedData.data) {
        const calculatedChecksum = this.calculateChecksum(wrappedData.data);
        if (calculatedChecksum !== wrappedData.checksum) {
          return { isValid: false, error: 'Data integrity check failed' };
        }
        return { data: wrappedData.data as T, isValid: true };
      }

      // Fallback for non-wrapped data (backward compatibility)
      return { data: wrappedData as T, isValid: true };
    } catch (error) {
      return { isValid: false, error: `Failed to load: ${error}` };
    }
  }

  /**
   * Clean up orphaned data
   */
  cleanupOrphanedData(projects: Project[]): number {
    const validAnalysisIds = new Set<string>();
    projects.forEach(project => {
      project.analyses.forEach(analysis => {
        validAnalysisIds.add(analysis.id);
      });
    });

    let cleanedCount = 0;
    const keysToCheck = Object.keys(localStorage);

    keysToCheck.forEach(key => {
      // Check if it's an analysis-specific key
      const match = key.match(/^(.+)-([a-f0-9-]+)$/);
      if (match && !key.endsWith('-checksum')) {
        const analysisId = match[2];
        if (!validAnalysisIds.has(analysisId) && this.isUUID(analysisId)) {
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}-checksum`);
          cleanedCount++;
        }
      }
    });

    return cleanedCount;
  }

  // Private helper methods
  private calculateLocalStorageSize(): number {
    let totalSize = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      }
    }
    return totalSize * 2; // UTF-16 encoding
  }

  private calculateDetailedSizes(): {
    projectSizes: { [key: string]: number };
    analysisSizes: { [key: string]: number };
  } {
    const projectSizes: { [key: string]: number } = {};
    const analysisSizes: { [key: string]: number } = {};

    // Get projects data
    try {
      const projectsStr = localStorage.getItem('stamp-projects');
      if (projectsStr) {
        const projects: Project[] = JSON.parse(projectsStr);

        projects.forEach(project => {
          let projectSize = 0;

          // Calculate project metadata size
          projectSize += new Blob([JSON.stringify(project)]).size;

          // Calculate analysis data sizes
          project.analyses.forEach(analysis => {
            let analysisSize = 0;

            // Check all possible analysis-related keys
            const analysisKeys = Object.keys(localStorage).filter(key =>
              key.includes(`-${analysis.id}`)
            );

            analysisKeys.forEach(key => {
              const value = localStorage.getItem(key) || '';
              analysisSize += new Blob([value]).size;
            });

            analysisSizes[analysis.id] = analysisSize;
            projectSize += analysisSize;
          });

          projectSizes[project.id] = projectSize;
        });
      }
    } catch (error) {
      // Error calculating detailed sizes
    }

    return { projectSizes, analysisSizes };
  }

  private validateProjects(data: any, errors: string[], _warnings: string[]): void {
    if (!Array.isArray(data)) {
      errors.push('Projects data must be an array');
      return;
    }

    data.forEach((project: any, index: number) => {
      if (!project.id || !project.name) {
        errors.push(`Project at index ${index} missing required fields`);
      }
      if (!Array.isArray(project.analyses)) {
        errors.push(`Project "${project.name}" has invalid analyses array`);
      }
    });
  }

  private validateAnalysisData(key: string, data: any, errors: string[], warnings: string[]): void {
    // Extract data type from key
    const dataType = key.split('-')[0];

    switch (dataType) {
      case 'losses':
      case 'hazards':
      case 'systemConstraints':
        if (!Array.isArray(data)) {
          errors.push(`${dataType} must be an array`);
        }
        break;
      case 'controllers':
      case 'systemComponents':
        if (!Array.isArray(data)) {
          errors.push(`${dataType} must be an array`);
        } else if (data.length > 100) {
          warnings.push(`Large number of ${dataType}: ${data.length}`);
        }
        break;
    }
  }

  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance();
