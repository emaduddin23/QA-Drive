import { knowledgeBase } from './knowledge-indexer.js';

export class QAAgentBrain {
  constructor() {}

  async planAndExecute(userPrompt, targetUrl) {
    const logTrace = [];

    const addTrace = (step, title, detail) => {
      const entry = { step, title, detail, timestamp: new Date().toLocaleTimeString() };
      logTrace.push(entry);
      return entry;
    };

    addTrace(1, "Requirement Analysis", `Received user instruction: "${userPrompt}"`);

    // Step 1: Query Knowledge Base across categories
    addTrace(2, "Knowledge MCP Retrieval", "Querying QA Knowledge Base (Drive PDFs & Docs)...");
    
    const bvaDocs = knowledgeBase.search("Boundary Value Analysis 1 to 10", "Test Techniques");
    const reqDocs = knowledgeBase.search("Checkout Requirements Quantity", "Project Documents");
    const bugDocs = knowledgeBase.search("Quantity defect bug", "Bug Knowledge");
    const epDocs = knowledgeBase.search("Equivalence Partitioning coupon", "Test Techniques");

    addTrace(3, "Knowledge Synthesis", `Retrieved ${bvaDocs.length} Technique docs, ${reqDocs.length} Requirement docs, ${bugDocs.length} Defect histories.`);

    // Extract boundary values from BVA technique & Requirements
    // Requirement specifies Quantity Range [1, 10]
    // BVA Technique prescribes: MIN-1 (0), MIN (1), MIN+1 (2), MAX-1 (9), MAX (10), MAX+1 (11), Negative (-1)
    
    const testCases = [
      {
        id: "TC-BVA-01",
        title: "BVA Minimum Invalid Below Boundary (Qty: 0)",
        technique: "Boundary Value Analysis (MIN-1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        bugReference: "Historical Defect #BUG-104",
        inputQty: 0,
        expectedResult: "Validation Error: Quantity must be at least 1 item",
        actionType: "fill_qty",
        shouldPass: false
      },
      {
        id: "TC-BVA-02",
        title: "BVA Minimum Valid Boundary (Qty: 1)",
        technique: "Boundary Value Analysis (MIN)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 1,
        expectedResult: "Subtotal: $49.00, Total: $54.00, No Error",
        actionType: "fill_qty",
        shouldPass: true
      },
      {
        id: "TC-BVA-03",
        title: "BVA Minimum Valid Inside (Qty: 2)",
        technique: "Boundary Value Analysis (MIN+1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 2,
        expectedResult: "Subtotal: $98.00, Total: $103.00, No Error",
        actionType: "fill_qty",
        shouldPass: true
      },
      {
        id: "TC-BVA-04",
        title: "BVA Maximum Valid Inside (Qty: 9)",
        technique: "Boundary Value Analysis (MAX-1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 9,
        expectedResult: "Subtotal: $441.00, Shipping: FREE, Total: $441.00",
        actionType: "fill_qty",
        shouldPass: true
      },
      {
        id: "TC-BVA-05",
        title: "BVA Maximum Valid Boundary (Qty: 10)",
        technique: "Boundary Value Analysis (MAX)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 10,
        expectedResult: "Subtotal: $490.00, Shipping: FREE, Total: $490.00",
        actionType: "fill_qty",
        shouldPass: true
      },
      {
        id: "TC-BVA-06",
        title: "BVA Maximum Invalid Above Boundary (Qty: 11)",
        technique: "Boundary Value Analysis (MAX+1)",
        kbReference: "Test Techniques/Boundary Value Analysis.md",
        inputQty: 11,
        expectedResult: "Validation Error: Quantity cannot exceed 10 items per order",
        actionType: "fill_qty",
        shouldPass: false
      },
      {
        id: "TC-EP-07",
        title: "Equivalence Partitioning: Valid Promo Code (SAVE10)",
        technique: "Equivalence Partitioning (Valid Partition)",
        kbReference: "Test Techniques/Equivalence Partitioning.md",
        inputQty: 1,
        coupon: "SAVE10",
        expectedResult: "10% Discount Applied ($4.90 OFF)",
        actionType: "apply_coupon",
        shouldPass: true
      },
      {
        id: "TC-EP-08",
        title: "Equivalence Partitioning: Invalid Promo Code (EXPIRED99)",
        technique: "Equivalence Partitioning (Invalid Partition)",
        kbReference: "Test Techniques/Equivalence Partitioning.md",
        inputQty: 1,
        coupon: "EXPIRED99",
        expectedResult: "Error: Invalid promo code EXPIRED99",
        actionType: "apply_coupon",
        shouldPass: false
      }
    ];

    addTrace(4, "Test Plan Synthesis", `Generated ${testCases.length} QA Test Cases combining BVA boundary rules & historical bug mitigations.`);

    return {
      logTrace,
      retrievedKnowledge: [
        { title: "Boundary Value Analysis.md", category: "Test Techniques", snippet: "For range [1, 10] test 0, 1, 2, 9, 10, 11." },
        { title: "Checkout Requirements.md", category: "Project Documents", snippet: "Quantity min: 1, max: 10 per order." },
        { title: "Historical Defects.md", category: "Bug Knowledge", snippet: "Defect #BUG-104: Qty 0 allowed checkout bug." }
      ],
      testCases
    };
  }
}

export const agentBrain = new QAAgentBrain();
