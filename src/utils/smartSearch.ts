// Smart search utility with fuzzy matching and intelligent ranking

export interface SearchableItem {
  id: string;
  searchableText: string;
  category?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: SearchMatch[];
}

export interface SearchMatch {
  field: string;
  value: string;
  indices: [number, number][];
}

export interface SearchOptions {
  threshold?: number; // Minimum score threshold (0-1)
  maxResults?: number;
  includeMatches?: boolean;
  caseSensitive?: boolean;
  fieldWeights?: Record<string, number>;
  fuzzyDistance?: number;
}

/**
 * Smart search engine with fuzzy matching, ranking, and highlighting
 */
export class SmartSearchEngine<T extends SearchableItem> {
  private items: T[] = [];
  private searchIndex: Map<string, T[]> = new Map();

  constructor(items: T[] = []) {
    this.setItems(items);
  }

  setItems(items: T[]): void {
    this.items = items;
    this.buildIndex();
  }

  addItem(item: T): void {
    this.items.push(item);
    this.indexItem(item);
  }

  removeItem(id: string): void {
    this.items = this.items.filter(item => item.id !== id);
    this.buildIndex();
  }

  search(query: string, options: SearchOptions = {}): SearchResult<T>[] {
    const {
      threshold = 0.3,
      maxResults = 50,
      includeMatches = true,
      caseSensitive = false,
      fuzzyDistance = 2
    } = options;

    if (!query.trim()) {
      return this.items.map(item => ({
        item,
        score: 1,
        matches: []
      }));
    }

    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const results: SearchResult<T>[] = [];

    for (const item of this.items) {
      const searchText = caseSensitive ? item.searchableText : item.searchableText.toLowerCase();
      const score = this.calculateScore(normalizedQuery, searchText, fuzzyDistance);
      
      if (score >= threshold) {
        const matches = includeMatches ? this.findMatches(normalizedQuery, searchText) : [];
        results.push({
          item,
          score,
          matches
        });
      }
    }

    // Sort by score (highest first), then by priority if available
    results.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) {
        return (b.item.priority || 0) - (a.item.priority || 0);
      }
      return b.score - a.score;
    });

    return results.slice(0, maxResults);
  }

  searchByCategory(query: string, category: string, options: SearchOptions = {}): SearchResult<T>[] {
    const categoryItems = this.items.filter(item => item.category === category);
    const tempEngine = new SmartSearchEngine(categoryItems);
    return tempEngine.search(query, options);
  }

  getTopCategories(query: string, limit: number = 5): { category: string; count: number; avgScore: number }[] {
    const results = this.search(query, { maxResults: 1000 });
    const categoryStats = new Map<string, { count: number; totalScore: number }>();

    results.forEach(result => {
      const category = result.item.category || 'Uncategorized';
      const stats = categoryStats.get(category) || { count: 0, totalScore: 0 };
      stats.count++;
      stats.totalScore += result.score;
      categoryStats.set(category, stats);
    });

    return Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        avgScore: stats.totalScore / stats.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, limit);
  }

  private buildIndex(): void {
    this.searchIndex.clear();
    this.items.forEach(item => this.indexItem(item));
  }

  private indexItem(item: T): void {
    const words = this.tokenize(item.searchableText);
    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, []);
      }
      this.searchIndex.get(word)!.push(item);
    });
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  private calculateScore(query: string, text: string, maxDistance: number): number {
    // Exact match gets highest score
    if (text === query) return 1.0;
    if (text.includes(query)) return 0.9;

    // Word-level matching
    const queryWords = this.tokenize(query);
    const textWords = this.tokenize(text);
    
    let wordMatches = 0;
    let fuzzyMatches = 0;

    for (const queryWord of queryWords) {
      let bestMatch = 0;
      
      for (const textWord of textWords) {
        // Exact word match
        if (textWord === queryWord) {
          bestMatch = 1;
          break;
        }
        
        // Fuzzy word match
        const distance = this.levenshteinDistance(queryWord, textWord);
        if (distance <= maxDistance) {
          const fuzzyScore = 1 - (distance / Math.max(queryWord.length, textWord.length));
          bestMatch = Math.max(bestMatch, fuzzyScore * 0.8);
        }
        
        // Partial word match
        if (textWord.includes(queryWord) || queryWord.includes(textWord)) {
          const partialScore = Math.min(queryWord.length, textWord.length) / 
                              Math.max(queryWord.length, textWord.length);
          bestMatch = Math.max(bestMatch, partialScore * 0.6);
        }
      }
      
      if (bestMatch > 0.5) wordMatches++;
      fuzzyMatches += bestMatch;
    }

    // Calculate final score
    const wordMatchScore = wordMatches / queryWords.length;
    const fuzzyScore = fuzzyMatches / queryWords.length;
    
    return Math.max(wordMatchScore, fuzzyScore * 0.8);
  }

  private findMatches(query: string, text: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const queryWords = this.tokenize(query);
    
    for (const word of queryWords) {
      const indices: [number, number][] = [];
      let searchIndex = 0;
      
      while (true) {
        const index = text.indexOf(word, searchIndex);
        if (index === -1) break;
        
        indices.push([index, index + word.length]);
        searchIndex = index + 1;
      }
      
      if (indices.length > 0) {
        matches.push({
          field: 'searchableText',
          value: word,
          indices
        });
      }
    }
    
    return matches;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

/**
 * Highlight search matches in text
 */
export function highlightMatches(
  text: string, 
  matches: SearchMatch[], 
  className: string = 'bg-yellow-200 dark:bg-yellow-800'
): string {
  if (!matches.length) return text;
  
  const allIndices: [number, number][] = [];
  matches.forEach(match => allIndices.push(...match.indices));
  
  // Sort by start index
  allIndices.sort((a, b) => a[0] - b[0]);
  
  // Merge overlapping ranges
  const merged: [number, number][] = [];
  for (const [start, end] of allIndices) {
    if (merged.length === 0 || merged[merged.length - 1][1] < start) {
      merged.push([start, end]);
    } else {
      merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
    }
  }
  
  // Build highlighted text
  let result = '';
  let lastIndex = 0;
  
  for (const [start, end] of merged) {
    result += text.slice(lastIndex, start);
    result += `<mark class="${className}">${text.slice(start, end)}</mark>`;
    lastIndex = end;
  }
  
  result += text.slice(lastIndex);
  return result;
}

/**
 * Factory function to create search engines for common STPA entities
 */
export function createUCASearchEngine(ucas: any[]): SmartSearchEngine<any> {
  const searchableUCAs = ucas.map(uca => ({
    ...uca,
    searchableText: `${uca.code} ${uca.description} ${uca.context} ${uca.hazardLinks?.join(' ') || ''}`,
    category: uca.ucaType,
    priority: uca.severity === 'Critical' ? 10 : uca.severity === 'High' ? 8 : 5
  }));
  
  return new SmartSearchEngine(searchableUCAs);
}


export function createHardwareSearchEngine(components: any[]): SmartSearchEngine<any> {
  const searchableComponents = components.map(component => ({
    ...component,
    searchableText: `${component.name} ${component.type} ${component.description || ''}`,
    category: component.type,
    priority: 5
  }));
  
  return new SmartSearchEngine(searchableComponents);
}