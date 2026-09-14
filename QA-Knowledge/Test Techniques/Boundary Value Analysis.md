# QA Test Technique: Boundary Value Analysis (BVA)

## Core Concept
Boundary Value Analysis (BVA) is a software testing technique in which tests are designed to include values at the boundaries of valid and invalid input domains. Experience shows that maximum errors occur at the boundaries of input values.

## Rules & Standard Testing Boundaries
For any numeric range `[MIN, MAX]`:
1. **Minimum Boundary**:
   - `MIN - 1` (Invalid Below Minimum)
   - `MIN` (Valid Minimum)
   - `MIN + 1` (Valid Just Above Minimum)
2. **Maximum Boundary**:
   - `MAX - 1` (Valid Just Below Maximum)
   - `MAX` (Valid Maximum)
   - `MAX + 1` (Invalid Above Maximum)

## Real-World Example: Quantity Field (Range: 1 to 10)
When testing a Checkout Quantity input specified as `1 to 10`:
- **Test Case 1 (0)**: Expect Validation Error ("Quantity must be at least 1")
- **Test Case 2 (1)**: Expect Pass (Minimum valid quantity)
- **Test Case 3 (2)**: Expect Pass (Normal lower bound)
- **Test Case 4 (9)**: Expect Pass (Normal upper bound)
- **Test Case 5 (10)**: Expect Pass (Maximum valid quantity)
- **Test Case 6 (11)**: Expect Validation Error ("Quantity cannot exceed 10 items per order")
- **Test Case 7 (Negative / -1)**: Expect Validation Error ("Invalid quantity")
- **Test Case 8 (Decimal / 1.5)**: Expect Validation Error ("Quantity must be a whole integer")

## Automated QA Agent Heuristics
When inspecting any feature requirement containing numeric range constraints, the QA Agent MUST automatically synthesize the full BVA matrix (0, 1, 2, MAX-1, MAX, MAX+1) without requiring explicit user instructions.
