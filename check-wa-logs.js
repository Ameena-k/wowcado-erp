const base = 'http://localhost:3001/api/v1';

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (global.__token) headers['Authorization'] = `Bearer ${global.__token}`;
  const res = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return res.json();
}

async function run() {
  const login = await req('POST', '/auth/login', { email: 'admin@wowcado.com', password: 'password123' });
  global.__token = login.access_token;
  console.log('Logged in:', !!global.__token);

  const logs = await req('GET', '/whatsapp/logs');
  console.log('WA logs endpoint response:', JSON.stringify(logs).slice(0, 500));
}

run().catch(console.error);
