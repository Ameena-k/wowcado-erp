const https = require('http');

async function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  // Login
  const login = await request('POST', '/auth/login', { email: 'admin@wowcado.com', password: 'wowcado123' });
  console.log('Login status:', login.status);
  const token = login.body.token;
  
  if (!token) { console.error('No token!', login.body); return; }
  console.log('Token prefix:', token.substring(0, 30));
  
  // Test customer create
  const custResp = await request('POST', '/customers', { name: 'API Test 2', phone: '9111000002' }, token);
  console.log('Customer create:', custResp.status, JSON.stringify(custResp.body).substring(0, 100));
  
  // Test payment create  
  const custId = custResp.body.id || '1fe54912-def4-4e56-8166-0fae81cd55a2';
  const payResp = await request('POST', '/customer-payments', {
    customerId: custId,
    paymentDate: new Date().toISOString(),
    amount: 500,
    paymentMethod: 'BANK',
  }, token);
  console.log('Payment create:', payResp.status, JSON.stringify(payResp.body).substring(0, 150));
}

main().catch(console.error);
