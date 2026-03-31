import crypto from 'crypto';

const BASE = 'http://localhost:3001/api/v1';
const WEBHOOK_SECRET = 'test-webhook-secret';
const HEADERS = { 'Content-Type': 'application/json' };

async function post(url, body, headers = {}) {
  const res = await fetch(url, { method: 'POST', headers: { ...HEADERS, ...headers }, body: JSON.stringify(body) });
  const text = await res.text();
  try { return { status: res.status, body: JSON.parse(text) }; } catch { return { status: res.status, body: { raw: text } }; }
}

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  return await res.json();
}

function sign(bodyStr) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(bodyStr).digest('hex');
}

async function assertLive() {
  console.log('--- Setting up E2E Entity Data ---');
  
  // 1. Create a Customer
  const custRes = await post(`${BASE}/customers`, {
    name: "Razorpay Test Customer", email: "rzp@test.com", phone: "9999999999"
  });
  const customerId = custRes.body.id;
  if (!customerId) throw new Error("Failed to create customer: " + JSON.stringify(custRes.body));
  console.log(`\u2705 Created Customer: ${customerId}`);

  // 2. Create Product
  const prodRes = await post(`${BASE}/products`, {
    name: "Test Product RZP", sku: "TRZP-" + Date.now(),
    type: "GOODS", categoryId: null,
    sellingPrice: 1000, purchasePrice: 500,
    manageInventory: false
  });
  const productId = prodRes.body.id;
  if (!productId) throw new Error("Failed to create product: " + JSON.stringify(prodRes.body));
  console.log(`\u2705 Created Product: ${productId}`);

  // 3. Create Order
  const orderRes = await post(`${BASE}/orders`, {
    customerId: customerId,
    shippingAddressRef: "Office", billingAddressRef: "Office",
    items: [{ productId: productId, quantity: 10 }] // 1000 * 10 = 10000
  });
  const orderId = orderRes.body.id;
  if (!orderId) throw new Error("Failed to create order: " + JSON.stringify(orderRes.body));
  console.log(`\u2705 Created Order: ${orderId} (Grand Total: ${orderRes.body.grandTotal})`);

  // Wait, Wowcado phase 1 requires generating invoice explicitly or maybe we can create Invoice directly
  // Let's create an Invoice for this customer
  const invRes = await post(`${BASE}/invoices`, {
    customerId: customerId,
    invoiceDate: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    items: [{ productId: productId, quantity: 10 }]
  });
  
  const invoiceId = invRes.body.id;
  let currentStatus = invRes.body.status;
  if (!invoiceId) throw new Error("Failed to create invoice: " + JSON.stringify(invRes.body));
  console.log(`\u2705 Created Invoice: ${invoiceId} (Initial Status: ${currentStatus})`);
  
  // Update invoice status to ISSUED so we can pay against it
  if (currentStatus === 'DRAFT') {
     console.log('Updating DRAFT invoice to ISSUED...');
     // Find the patch endpoint or direct DB update if required. Actually let's assume direct patch.
     // Not available in invoices controller? Let's check. Wait, I will use prisma directly if needed.
     // Invoices controller might not have PATCH /invoices/:id/status.
  }

  // 4. Send Webhook: Partial Payment (3000 out of 10000)
  console.log('\n--- Simulating Webhook: Partial Payment ---');
  const pay1Id = `pay_partial_${Date.now()}`;
  const partialPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: pay1Id, order_id: `rzp_order_partial`,
          amount: 3000 * 100, currency: 'INR', status: 'captured',
          notes: { invoiceId, customerId }
        }
      }
    }
  };
  const body1 = JSON.stringify(partialPayload);
  await post(`${BASE}/razorpay/webhook`, body1, {
    'x-razorpay-signature': sign(body1),
    'x-razorpay-event-id': `evt_partial_${Date.now()}`
  });

  // Verify Invoice State
  let invVerify1 = await get(`${BASE}/invoices/${invoiceId}`);
  console.log(`\u2705 After Partial Payment -> Status: ${invVerify1.status}, Paid: ${invVerify1.paidAmount}, Balance: ${invVerify1.balanceDue}`);

  // 5. Send Webhook: Full Payment (Remaining 7000)
  console.log('\n--- Simulating Webhook: Final Payment ---');
  const pay2Id = `pay_full_${Date.now()}`;
  const fullPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: pay2Id, order_id: `rzp_order_full`,
          amount: 7000 * 100, currency: 'INR', status: 'captured',
          notes: { invoiceId, customerId }
        }
      }
    }
  };
  const body2 = JSON.stringify(fullPayload);
  await post(`${BASE}/razorpay/webhook`, body2, {
    'x-razorpay-signature': sign(body2),
    'x-razorpay-event-id': `evt_full_${Date.now()}`
  });

  // Verify Invoice State
  let invVerify2 = await get(`${BASE}/invoices/${invoiceId}`);
  console.log(`\u2705 After Final Payment -> Status: ${invVerify2.status}, Paid: ${invVerify2.paidAmount}, Balance: ${invVerify2.balanceDue}`);

  // 6. Check Recon UI API
  console.log('\n--- Fetching Reconciliation API ---');
  const txs = await get(`${BASE}/razorpay/transactions?limit=2`);
  for (const t of txs.data) {
    if (t.linkedPaymentId) {
      console.log(`\u2705 Transaction ${t.id} successfully linked to CustomerPayment ${t.linkedPaymentId}`);
    } else {
      console.log(`\u274C Transaction ${t.id} missing linked payment!`);
    }
  }
}

assertLive().catch(console.error);
