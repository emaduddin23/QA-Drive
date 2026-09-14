export function getSandboxHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Target App: QA Sandbox Checkout</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f8fafc; }
  </style>
</head>
<body class="p-6 max-w-xl mx-auto">
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6">
    <div class="flex justify-between items-center border-b border-slate-800 pb-4">
      <div>
        <span class="bg-indigo-500/20 text-indigo-400 text-xs font-semibold px-2.5 py-1 rounded">Target Application Sandbox</span>
        <h1 class="text-2xl font-bold mt-1 text-white">E-Commerce Checkout</h1>
      </div>
      <div class="text-right">
        <span class="text-xs text-slate-400">Environment</span>
        <div class="text-emerald-400 font-mono text-xs flex items-center gap-1 justify-end">
          <span class="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          Ready for QA Test
        </div>
      </div>
    </div>

    <!-- Product Details -->
    <div class="bg-slate-850 bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
      <div>
        <h3 class="font-semibold text-slate-200">Premium QA Automation Suite</h3>
        <p class="text-xs text-slate-400">Single License • Standard Rate</p>
      </div>
      <div class="text-right">
        <span class="text-lg font-bold text-indigo-400" id="unit-price">$49.00</span>
      </div>
    </div>

    <!-- Quantity Selector (Requirement: 1 to 10) -->
    <div>
      <label class="block text-xs font-medium text-slate-300 mb-1">Item Quantity <span class="text-indigo-400">(Allowed: 1 - 10)</span></label>
      <div class="flex gap-2">
        <input type="number" id="quantity-input" value="1" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono" placeholder="Enter qty (1-10)">
        <button id="update-qty-btn" onclick="recalculateCart()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 rounded-lg transition">Update</button>
      </div>
    </div>

    <!-- Validation Error Alert -->
    <div id="validation-error" class="hidden bg-rose-950/80 border border-rose-500/50 text-rose-300 p-3 rounded-lg text-xs font-mono">
      <!-- Dynamic Error Message -->
    </div>

    <!-- Promo Code Section -->
    <div>
      <label class="block text-xs font-medium text-slate-300 mb-1">Promo Code</label>
      <div class="flex gap-2">
        <input type="text" id="coupon-input" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white uppercase focus:outline-none focus:border-indigo-500 font-mono" placeholder="e.g. SAVE10">
        <button id="apply-coupon-btn" onclick="applyCoupon()" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 rounded-lg transition">Apply</button>
      </div>
      <div id="coupon-feedback" class="mt-1 text-xs hidden"></div>
    </div>

    <!-- Payment Section -->
    <div class="border-t border-slate-800 pt-4 space-y-3">
      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Information</h4>
      <div>
        <label class="block text-xs text-slate-300 mb-1">Card Number (16 Digits)</label>
        <input type="text" id="card-number" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500" placeholder="4532 1111 2222 3333" value="4532111122223333">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs text-slate-300 mb-1">Expiry (MM/YY)</label>
          <input type="text" id="card-expiry" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" placeholder="12/28" value="12/28">
        </div>
        <div>
          <label class="block text-xs text-slate-300 mb-1">CVC (3 Digits)</label>
          <input type="text" id="card-cvc" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" placeholder="123" value="123">
        </div>
      </div>
    </div>

    <!-- Order Summary -->
    <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
      <div class="flex justify-between text-slate-400">
        <span>Subtotal</span>
        <span id="cart-subtotal">$49.00</span>
      </div>
      <div class="flex justify-between text-slate-400">
        <span>Discount</span>
        <span id="discount-amount" class="text-emerald-400">-$0.00</span>
      </div>
      <div class="flex justify-between text-slate-400">
        <span>Shipping</span>
        <span id="shipping-cost">$5.00</span>
      </div>
      <div class="flex justify-between text-base font-bold text-white border-t border-slate-800 pt-2">
        <span>Total Amount</span>
        <span id="cart-total" class="text-indigo-400">$54.00</span>
      </div>
    </div>

    <!-- Action Button -->
    <button id="place-order-btn" onclick="submitOrder()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2">
      <span>Place Order</span>
    </button>

    <!-- Success Modal -->
    <div id="order-success" class="hidden bg-emerald-950/90 border border-emerald-500 text-emerald-200 p-4 rounded-lg text-center space-y-2">
      <div class="text-2xl">🎉</div>
      <div class="font-bold">Order Confirmed Successfully!</div>
      <div class="text-xs text-emerald-300">Transaction ID: <span id="trans-id" class="font-mono">TXN-94021</span></div>
    </div>
  </div>

  <script>
    const UNIT_PRICE = 49.00;
    let appliedDiscountPercent = 0;

    function recalculateCart() {
      const qtyInput = document.getElementById('quantity-input');
      const valErr = document.getElementById('validation-error');
      const qty = parseInt(qtyInput.value);

      valErr.classList.add('hidden');
      valErr.innerText = '';

      if (isNaN(qty) || qtyInput.value.trim() === '') {
        showError('Validation Error: Quantity cannot be empty.');
        return false;
      }

      if (qty < 1) {
        showError('Validation Error: Quantity must be at least 1 item.');
        return false;
      }

      if (qty > 10) {
        showError('Validation Error: Quantity cannot exceed 10 items per order.');
        return false;
      }

      const subtotal = qty * UNIT_PRICE;
      const discount = subtotal * (appliedDiscountPercent / 100);
      const shipping = subtotal > 200 ? 0 : 5.00;
      const total = subtotal - discount + shipping;

      document.getElementById('cart-subtotal').innerText = '$' + subtotal.toFixed(2);
      document.getElementById('discount-amount').innerText = '-$' + discount.toFixed(2);
      document.getElementById('shipping-cost').innerText = shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2);
      document.getElementById('cart-total').innerText = '$' + total.toFixed(2);
      return true;
    }

    function showError(msg) {
      const valErr = document.getElementById('validation-error');
      valErr.innerText = msg;
      valErr.classList.remove('hidden');
    }

    function applyCoupon() {
      const code = document.getElementById('coupon-input').value.trim().toUpperCase();
      const feedback = document.getElementById('coupon-feedback');
      feedback.classList.remove('hidden');

      if (code === 'SAVE10') {
        appliedDiscountPercent = 10;
        feedback.className = 'mt-1 text-xs text-emerald-400 font-semibold';
        feedback.innerText = '✓ Promo code SAVE10 applied (10% OFF)';
      } else if (code === 'FREESHIP') {
        appliedDiscountPercent = 0;
        document.getElementById('shipping-cost').innerText = 'FREE';
        feedback.className = 'mt-1 text-xs text-emerald-400 font-semibold';
        feedback.innerText = '✓ Promo code FREESHIP applied (Free Shipping)';
      } else {
        appliedDiscountPercent = 0;
        feedback.className = 'mt-1 text-xs text-rose-400 font-semibold';
        feedback.innerText = '✗ Invalid promo code: ' + code;
      }

      recalculateCart();
    }

    function submitOrder() {
      if (!recalculateCart()) return;

      const card = document.getElementById('card-number').value.replace(/\\s+/g, '');
      const cvc = document.getElementById('card-cvc').value.trim();

      if (card.length !== 16 || isNaN(card)) {
        showError('Payment Error: Card number must be exactly 16 digits.');
        return;
      }

      if (cvc.length !== 3 || isNaN(cvc)) {
        showError('Payment Error: CVC must be 3 numeric digits.');
        return;
      }

      document.getElementById('order-success').classList.remove('hidden');
      document.getElementById('trans-id').innerText = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
    }

    // Run on load
    document.getElementById('quantity-input').addEventListener('input', recalculateCart);
  </script>
</body>
</html>`;
}
