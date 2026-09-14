import fs from 'fs';
import path from 'path';
import Fuse from 'fuse.js';

const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'QA-Knowledge');

export class KnowledgeIndexer {
  constructor() {
    this.documents = [];
    this.fuseIndex = null;
    this.isIndexed = false;
  }

  async initialize() {
    this.documents = [];
    this.scanDirectory(KNOWLEDGE_DIR);
    
    // Setup Fuse.js for fuzzy keyword and semantic match
    this.fuseIndex = new Fuse(this.documents, {
      keys: ['title', 'content', 'category', 'path'],
      threshold: 0.4,
      ignoreLocation: true,
      includeMatches: true,
    });

    this.isIndexed = true;
    console.log(`[KnowledgeIndexer] Successfully indexed ${this.documents.length} QA Knowledge documents.`);
    return this.documents.length;
  }

  scanDirectory(dirPath, categoryName = '') {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      return;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, item);
      } else if (stat.isFile() && (item.endsWith('.md') || item.endsWith('.txt') || item.endsWith('.pdf'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const category = categoryName || 'General QA';
        
        this.documents.push({
          id: fullPath.replace(KNOWLEDGE_DIR, ''),
          title: item.replace(/\.(md|txt|pdf)$/, ''),
          category: category,
          filename: item,
          path: fullPath,
          content: content,
          size: stat.size,
          lastModified: stat.mtime
        });
      }
    }
  }

  search(query, categoryFilter = null) {
    if (!this.isIndexed) this.initialize();

    let docs = this.documents;
    if (categoryFilter && categoryFilter !== 'All') {
      docs = docs.filter(doc => doc.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (!query || query.trim() === '') {
      return docs.map(d => ({ doc: d, score: 1.0, matches: [] }));
    }

    const results = this.fuseIndex.search(query);
    return results.map(r => ({
      doc: r.item,
      score: r.score,
      matches: r.matches
    }));
  }

  getStats() {
    const categories = {};
    for (const doc of this.documents) {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
    }
    return {
      totalDocs: this.documents.length,
      categories
    };
  }
}

export const knowledgeBase = new KnowledgeIndexer();
