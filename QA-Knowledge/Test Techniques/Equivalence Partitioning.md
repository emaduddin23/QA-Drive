# QA Test Technique: Equivalence Partitioning (EP)

## Core Concept
Equivalence Partitioning divides the input data of a software unit into partitions of equivalent data from which test cases can be derived. In principle, test cases are designed to cover each partition at least once.

## Application Rules
1. Identify Valid Partitions (Data that should be accepted).
2. Identify Invalid Partitions (Data that should be rejected with clear error messages).
3. Test representative sample values from each partition rather than testing every single possible value.

## Real-World Example: Coupon & Promo Code Field
- **Valid Partition**: Code matching active format (e.g. `SAVE10`, `PROMO20`). Expect discount applied.
- **Invalid Partition 1 (Expired Code)**: Code `EXPIRED50`. Expect error "Coupon expired".
- **Invalid Partition 2 (Non-existent Code)**: Code `INVALID99`. Expect error "Coupon code does not exist".
- **Invalid Partition 3 (Empty Input)**: Submitting blank coupon. Expect field reset or subtle hint.
- **Invalid Partition 4 (Special Characters)**: Code `<script>alert(1)</script>` or `$$$`. Expect input sanitized or rejected smoothly.
