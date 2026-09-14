# Project Requirements: E-Commerce Checkout Module

## Specification Document v2.4

### 1. Item Selection & Quantity Rules
- **Product**: Premium QA Automation Toolkit (Base Price: $49.00 USD).
- **Quantity Constraints**:
  - Minimum allowed per order: **1 item**
  - Maximum allowed per order: **10 items**
  - Quantity input field must be a whole integer.

### 2. Promo Code Rules
- `SAVE10`: Gives 10% discount on cart subtotal.
- `FREESHIP`: Reduces shipping cost from $5.00 to $0.00.
- Any other promo code should display an inline alert: "Invalid or expired promo code".

### 3. Payment Method & Validation
- **Credit Card Number**:
  - Must be 16 digits (e.g., `4532111122223333` for Visa testing, `5105111122223333` for Mastercard).
  - Short or invalid card numbers must trigger error: "Please enter a valid 16-digit card number".
- **Expiry Date**:
  - Format `MM/YY`. Future date required.
- **CVC**:
  - 3 digits (e.g. `123`).

### 4. Shipping Address & Business Rules
- Recipient Name, Address, and Email are required fields.
- Email must pass basic RFC email regex validation.
- Standard Shipping Fee: $5.00 USD (free if total > $200 or `FREESHIP` coupon used).
