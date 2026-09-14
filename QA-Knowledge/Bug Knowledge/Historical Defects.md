# Historical Defect Database & Regressions

## Past Bugs & High-Risk Areas in Checkout

### Defect #BUG-104: Quantity Zero Allowed Cart Checkout
- **Severity**: High
- **Description**: Users were able to type `0` into the quantity input field and hit "Place Order", resulting in a $0 order invoice generated without items shipped.
- **Root Cause**: Backend missed non-zero validation check on POST `/api/checkout`.
- **Regression Mitigation Directive**: Agent MUST test `0` quantity scenario and verify button stays disabled or displays error alert.

### Defect #BUG-219: Negative Quantity Glitch Subtracts Cart Price
- **Severity**: Critical
- **Description**: Entering `-2` as quantity caused cart total to display negative balance, granting user store credit.
- **Regression Mitigation Directive**: Test negative integer inputs `-1`, `-5` on quantity fields.

### Defect #BUG-305: Unhandled Card CVC Text Input
- **Severity**: Medium
- **Description**: Entering alphabetic characters in CVC field crashed client-side JS checkout handler.
- **Regression Mitigation Directive**: Verify non-numeric input filtering on CVC/Card fields.
