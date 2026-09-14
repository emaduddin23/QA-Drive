# QA Fundamentals: Functional & Regression Testing Guidelines

## Functional Testing Strategy
Functional testing verifies that each function of the software application operates in conformance with the requirement specification.

### 5-Step QA Verification Standard:
1. **Positive Flow Verification**: Verify standard user happy path (e.g. standard checkout with valid inputs).
2. **Negative & Edge Path Verification**: Verify invalid inputs, missing fields, out-of-range parameters trigger graceful user-friendly validation messages.
3. **State Consistency**: Ensure cart subtotals, tax math, and final totals calculate accurately across quantity changes.
4. **UI Behavior & Interactive Feedback**: Verify buttons state changes (disabled during request loading, enabled when form valid).
5. **Defect Verification**: Check known past bug vectors to prevent regressions.
