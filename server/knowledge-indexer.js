import Fuse from 'fuse.js';

export class KnowledgeIndexer {
  constructor() {
    this.documents = [];
    this.fuseIndex = null;
    this.isIndexed = false;
  }

  // Initialize with an optional array of documents
  async initialize(docs = []) {
    if (docs && docs.length > 0) {
      this.documents = docs;
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
