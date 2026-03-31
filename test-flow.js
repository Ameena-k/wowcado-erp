const baseURL = 'http://localhost:3001/api/v1';

let currentToken = '';

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
  const res = await fetch(`${baseURL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.text();
  let json;
  try { json = JSON.parse(data); } catch(e) { json = data; }
  if (!res.ok) {
     console.error(`ERROR on ${method} ${path}:`, res.status, json);
     throw new Error(`Failed: ${method} ${path}`);
  }
  return json;
}

async function run() {
  try {
    console.log("=== 0. Login as Admin ===");
    const login = await req('POST', '/auth/login', { email: 'admin@wowcado.com', password: 'password123' });
    currentToken = login.access_token;
    console.log("Logged in!");

    console.log("=== 1. Get an active society ===");
    const societies = await req('GET', '/societies?active=true');
    if (!societies || societies.length === 0) {
       console.log("No active societies, creating one...");
       await req('POST', '/societies', { name: 'Test Society ' + Date.now() });
    }
    const soc = (await req('GET', '/societies?active=true'))[0];
    const societyId = soc.id;

    console.log("=== 2. Create customer + address ===");
    const phone = '9' + Math.floor(100000000 + Math.random() * 900000000);
    const customer = await req('POST', '/customers', {
      name: 'Smoke Test Customer',
      phone,
      defaultAddress: {
        societyId,
        blockOrStreet: 'Block X',
        doorNo: '99',
        recipientName: 'Smoke Test Recipient',
        phone
      }
    });
    console.log("Customer created:", customer.id);

    console.log("=== 3. Verify in customer list ===");
    const custList = await req('GET', '/customers');
    const found = custList.data.find(c => c.id === customer.id);
    if (!found) throw new Error("Customer not in list");
    console.log("Customer found in list!");

    console.log("=== 4. Verify address is linked ===");
    const addrs = await req('GET', `/customer-addresses?customerId=${customer.id}`);
    if (addrs.length === 0 || !addrs[0].isDefault) {
      throw new Error("Address not found or not default");
    }
    const addressId = addrs[0].id;
    console.log("Address verified:", addressId);

    console.log("=== 5. Create product if needed ===");
    let products = await req('GET', '/products?active=true');
    let product;
    if (!products.data || products.data.length === 0) {
       console.log("Creating category, tax rate, and product...");
       // Need category
       const cats = await req('GET', '/categories');
       let catId = cats[0]?.id;
       if(!catId) {
          const cat = await req('POST', '/categories', { name: "Test Cat " + Date.now(), description: "" });
          catId = cat.id;
       }
       // Need tax rate
       const taxes = await req('GET', '/tax-rates');
       let taxId = taxes[0]?.id;
       if(!taxId) {
          const tax = await req('POST', '/tax-rates', { name: "Test Tax " + Date.now(), rate: 5.0 });
          taxId = tax.id;
       }
       product = await req('POST', '/products', {
         sku: 'SKU' + Date.now(),
         name: 'Test Product',
         categoryId: catId,
         unit: 'KG',
         sellingPrice: 100,
         taxRateId: taxId
       });
    } else {
       product = products.data[0];
    }
    const productId = product.id;
    console.log("Product to order:", productId);

    console.log("=== 6. Create Order === ");
    const order = await req('POST', '/orders', {
      customerId: customer.id,
      customerAddressId: addressId,
      orderDate: new Date().toISOString(),
      deliveryDate: new Date().toISOString(),
      items: [
        { productId, quantity: 2 }
      ]
    });
    console.log("Order created:", order.id, "Total:", order.grandTotal);

    console.log("=== 6.5 Confirm Order ===");
    const confirmed = await req('PATCH', `/orders/${order.id}/status`, { status: 'CONFIRMED' });
    console.log("Order confirmed:", confirmed.status);

    console.log("=== 7. Generate Invoice ===");
    const invoice = await req('POST', `/invoices/from-order/${order.id}`);
    console.log("Draft Invoice generated:", invoice.id, invoice.status);

    console.log("=== 8. Issue Invoice ===");
    const issued = await req('PATCH', `/invoices/${invoice.id}`, { status: 'ISSUED' });
    console.log("Invoice Issued:", issued.status);

    console.log("=== 9. Record Payment ===");
    const payment = await req('POST', '/customer-payments', {
      customerId: customer.id,
      paymentDate: new Date().toISOString(),
      paymentMethod: 'CASH',
      amount: Number(issued.grandTotal),
      allocations: [
        { invoiceId: invoice.id, allocatedAmount: Number(issued.grandTotal) }
      ]
    });
    console.log("Payment recorded:", payment.id, payment.status);

    console.log("ALL TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test execution failed:", err.message);
  }
}

run();
