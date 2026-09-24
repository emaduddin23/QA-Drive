import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import Fuse from 'fuse.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const KNOWLEDGE_DIR = path.resolve(process.cwd(), 'QA-Knowledge');

export class KnowledgeIndexer {
  constructor() {
    this.documents = [];
    this.fuseIndex = null;
    this.isIndexed = false;
  }

  // Scan and parse local QA-Knowledge folder
  async loadLocalDocuments(dirPath = KNOWLEDGE_DIR, subCategory = '') {
    if (!fs.existsSync(dirPath)) return [];
    
    const docs = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const nested = await this.loadLocalDocuments(fullPath, entry.name);
        docs.push(...nested);
      } else {
        let content = '';
        const ext = path.extname(entry.name).toLowerCase();

        try {
          if (ext === '.pdf' || entry.name.endsWith('.pdf')) {
            const dataBuffer = fs.readFileSync(fullPath);
            const pdf = new PDFParse({ data: dataBuffer });
            const result = await pdf.getText();
            content = result.text || '';
          } else if (ext === '.md' || ext === '.txt' || ext === '.json') {
            content = fs.readFileSync(fullPath, 'utf8');
          }

          if (content.trim()) {
            docs.push({
              id: entry.name,
              name: entry.name,
              title: entry.name.replace(/\.(md|txt|pdf|docx|pptx|gdoc).*$/, ''),
              category: subCategory || 'General QA',
              filename: entry.name,
              path: path.relative(process.cwd(), fullPath),
              content: content
            });
          }
        } catch (err) {
          console.error(`[KnowledgeIndexer] Error parsing local file ${entry.name}:`, err.message);
        }
      }
    }
    return docs;
  }

  // Initialize with an optional array of documents, or scan local QA-Knowledge folder
  async initialize(docs = []) {
    if (docs && docs.length > 0) {
      this.documents = docs;
    } else {
      const localDocs = await this.loadLocalDocuments();
      if (localDocs.length > 0) {
        this.documents = localDocs;
      }
    }
    
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
