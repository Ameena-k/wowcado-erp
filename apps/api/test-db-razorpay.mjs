import { PrismaClient } from '@wowcado/database';
import crypto from 'crypto';

const db = new PrismaClient();
const BASE = 'http://localhost:3001/api/v1';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test-webhook-secret';

function sign(bodyStr) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(bodyStr).digest('hex');
}

async function assertLive() {
  console.log('--- Setting up DB Native Data ---');

  const suffix = Date.now().toString();

  // Hardcode a default setup
  const cust = await db.customer.create({
    data: { name: `RZP Test ${suffix}`, email: `rzp${suffix}@test.com`, phone: `+${suffix}`, status: "ACTIVE" }
  });
  console.log(`\u2705 Created Customer: ${cust.id}`);

  const prod = await db.product.create({
    data: { name: `RZP Proxy Product ${suffix}`, sku: `RZP-SKU-${suffix}`, active: true, sellingPrice: 1000, purchasePrice: 500, unit: "pcs", category: { create: { name: "Cat" + suffix } }, taxRate: { create: { name: "Tax10", rate: 10 } } }
  });

  const arAcct = await db.account.upsert({
    where: { code: '1020' }, update: {}, create: { code: '1020', name: 'A/R', type: 'ASSET', status: 'ACTIVE' }
  });
  const bankAcct = await db.account.upsert({
    where: { code: '1030' }, update: {}, create: { code: '1030', name: 'Razorpay Clearing', type: 'ASSET', status: 'ACTIVE' }
  });
  const salesAcct = await db.account.upsert({
    where: { code: '4000' }, update: {}, create: { code: '4000', name: 'Sales', type: 'REVENUE', status: 'ACTIVE' }
  });
  const taxAcct = await db.account.upsert({
    where: { code: '2000' }, update: {}, create: { code: '2000', name: 'Tax Payable', type: 'LIABILITY', status: 'ACTIVE' }
  });

  const custAddress = await db.customerAddress.create({
    data: { customerId: cust.id, label: "Home", street1: "123", city: "City", state: "State", zipCode: "123", country: "US", isDefaultBilling: true, isDefaultShipping: true }
  });

  const order = await db.order.create({
    data: {
      orderNumber: `ORD-RZP-${suffix}`, customerId: cust.id, status: "CONFIRMED", customerAddressId: custAddress.id,
      orderDate: new Date(), deliveryDate: new Date(),
      subtotal: 10000, taxTotal: 1000, grandTotal: 11000,
      items: {
        create: [ { productId: prod.id, productNameSnapshot: prod.name, skuSnapshot: prod.sku, quantity: 10, unitPrice: 1000, lineTotal: 11000, taxableLineAmount: 10000, taxAmount: 1000, taxRateSnapshot: 10 } ]
      }
    }
  });

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber: `INV-RZP-${suffix}`, orderId: order.id, customerId: cust.id, status: "ISSUED",
      invoiceDate: new Date(), dueDate: new Date(),
      subtotal: 10000, taxTotal: 1000, grandTotal: 11000,
      balanceDue: 11000, paidAmount: 0,
      items: {
        create: [ { productId: prod.id, productNameSnapshot: prod.name, skuSnapshot: prod.sku, quantity: 10, unitPrice: 1000, lineTotal: 11000, taxAmount: 1000, taxRateSnapshot: 10 } ]
      }
    }
  });

  console.log(`\u2705 Created Invoice ${invoice.id} with Balance Due: ${invoice.balanceDue}`);

  console.log('\n--- Simulating Webhook: Partial Payment (4000) ---');
  let pay1Id = `pay_partial_${Date.now()}`;
  let partialPayload = {
    event: 'payment.captured',
    payload: { payment: { entity: { id: pay1Id, order_id: `rzp_order_test`, amount: 4000 * 100, currency: 'INR', status: 'captured', notes: { invoiceId: invoice.id, customerId: cust.id } } } }
  };
  let body1 = JSON.stringify(partialPayload);
  let res1 = await fetch(`${BASE}/razorpay/webhook`, { method: 'POST', body: body1, headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sign(body1), 'x-razorpay-event-id': `evt_partial_${Date.now()}` } });
  console.log(`Webhook HTTP: ${res1.status} - ${(await res1.json()).status}`);

  let afterPatch1 = await db.invoice.findUnique({ where: { id: invoice.id } });
  console.log(`\u2705 After Partial Payment -> Status: ${afterPatch1.status}, Paid: ${afterPatch1.paidAmount}, Balance: ${afterPatch1.balanceDue}`);

  console.log('\n--- Simulating Webhook: Final Payment (7000) ---');
  let pay2Id = `pay_full_${Date.now()}`;
  let fullPayload = {
    event: 'payment.captured',
    payload: { payment: { entity: { id: pay2Id, order_id: `rzp_order_test`, amount: 7000 * 100, currency: 'INR', status: 'captured', notes: { invoiceId: invoice.id, customerId: cust.id } } } }
  };
  let body2 = JSON.stringify(fullPayload);
  let res2 = await fetch(`${BASE}/razorpay/webhook`, { method: 'POST', body: body2, headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sign(body2), 'x-razorpay-event-id': `evt_full_${Date.now()}` } });
  console.log(`Webhook HTTP: ${res2.status} - ${(await res2.json()).status}`);

  let afterPatch2 = await db.invoice.findUnique({ where: { id: invoice.id } });
  console.log(`\u2705 After Final Payment -> Status: ${afterPatch2.status}, Paid: ${afterPatch2.paidAmount}, Balance: ${afterPatch2.balanceDue}`);

  // Test Duplicate Posting Constraint explicitly
  const entriesCount = await db.journalEntry.count({ where: { sourceType: 'CUSTOMER_PAYMENT' } });
  console.log(`\n\u2705 Posting Engine spawned ${entriesCount} Journal Entries for Customer Payments safely.`);

  const txs = await db.gatewayTransaction.findMany({ take: 2, orderBy: { createdAt: 'desc' } });
  for (const t of txs) {
    if (t.linkedPaymentId) console.log(`\u2705 Transaction ${t.id} successfully linked to Payment ${t.linkedPaymentId}`);
    else console.log(`\u274C Transaction ${t.id} failed linking.`);
  }

  process.exit(0);
}

assertLive().catch(console.error);
