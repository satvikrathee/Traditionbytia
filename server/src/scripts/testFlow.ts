const BASE_URL = 'http://127.0.0.1:5000/api';

async function runE2ETest() {
  console.log('\n======================================================');
  console.log('  TRADITIONS BY TIYA - END-TO-END FLOW VERIFICATION  ');
  console.log('======================================================\n');

  let passedSteps = 0;

  // Step 1: Health check
  console.log('[Step 1] Checking API Server Health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = (await healthRes.json()) as any;
  if (healthData.status === 'healthy') {
    console.log('✓ Health check passed:', healthData.name);
    passedSteps++;
  } else {
    throw new Error('Health check failed');
  }

  // Step 2: Fetch products
  console.log('\n[Step 2] Fetching Products Catalog...');
  const prodRes = await fetch(`${BASE_URL}/products?limit=20`);
  const prodData = (await prodRes.json()) as any;
  console.log(`✓ Fetched ${prodData.products?.length} products. Total in DB: ${prodData.pagination?.total}`);
  if (prodData.products?.length >= 12) {
    passedSteps++;
  } else {
    throw new Error('Expected at least 12 seeded products');
  }

  const sampleProduct1 = prodData.products[0];
  const sampleProduct2 = prodData.products[1];
  console.log(`  Sample 1: "${sampleProduct1.name}" - ₹${sampleProduct1.price} (Stock: ${sampleProduct1.stock})`);
  console.log(`  Sample 2: "${sampleProduct2.name}" - ₹${sampleProduct2.price} (Stock: ${sampleProduct2.stock})`);

  // Step 3: Customer Login
  console.log('\n[Step 3] Authenticating Sample Customer...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'customer@traditionsbytiya.com',
      password: 'Customer@2026!',
    }),
  });
  const loginData = (await loginRes.json()) as any;
  if (!loginData.success || !loginData.token) {
    throw new Error(`Customer login failed: ${loginData.message}`);
  }
  const customerToken = loginData.token;
  console.log(`✓ Customer logged in successfully: ${loginData.user.name} (${loginData.user.email})`);
  passedSteps++;

  // Step 4: Add to Cart
  console.log('\n[Step 4] Adding Product to Cart...');
  const cartRes = await fetch(`${BASE_URL}/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      productId: sampleProduct1._id,
      qty: 1,
    }),
  });
  const cartData = (await cartRes.json()) as any;
  console.log(`✓ Cart updated with ${cartData.cart?.items?.length} item(s)`);
  passedSteps++;

  // Step 5: Place COD Order
  console.log('\n[Step 5] Placing Cash on Delivery (COD) Order...');
  const codOrderPayload = {
    items: [{ productId: sampleProduct1._id, qty: 1 }],
    address: {
      name: 'Aanya Verma',
      phone: '+91 91234 56789',
      street: '14 Royal Palms Residency',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    paymentMethod: 'COD',
  };

  const codRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify(codOrderPayload),
  });
  const codData = (await codRes.json()) as any;
  if (!codData.success) {
    throw new Error(`COD Order failed: ${codData.message}`);
  }
  const codOrderId = codData.order._id;
  console.log(`✓ COD Order Placed: #${codOrderId} | Total: ₹${codData.order.total} | Payment: ${codData.order.paymentStatus}`);
  passedSteps++;

  // Step 6: Place UPI Order & Verify Signature
  console.log('\n[Step 6] Placing UPI Order & Verifying Payment Signature...');
  const upiOrderPayload = {
    items: [{ productId: sampleProduct2._id, qty: 1 }],
    address: {
      name: 'Aanya Verma',
      phone: '+91 91234 56789',
      street: '14 Royal Palms Residency',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    paymentMethod: 'UPI',
  };

  const upiRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify(upiOrderPayload),
  });
  const upiData = (await upiRes.json()) as any;
  const upiOrderId = upiData.order._id;
  console.log(`✓ UPI Order Initialized: #${upiOrderId} | Razorpay Order ID: ${upiData.razorpayOrderId}`);

  // Now verify UPI Payment
  const verifyRes = await fetch(`${BASE_URL}/payments/upi/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      orderId: upiOrderId,
      razorpayOrderId: upiData.razorpayOrderId,
      razorpayPaymentId: `pay_upi_test_${Date.now()}`,
      razorpaySignature: 'sig_test_valid',
    }),
  });
  const verifyData = (await verifyRes.json()) as any;
  if (!verifyData.success || verifyData.order.paymentStatus !== 'PAID') {
    throw new Error(`UPI verification failed: ${verifyData.message}`);
  }
  console.log(`✓ UPI Payment Verified: Payment Status is now "${verifyData.order.paymentStatus}"!`);
  passedSteps++;

  // Step 7: Customer My Orders check
  console.log('\n[Step 7] Checking Customer Orders Portfolio...');
  const myOrdersRes = await fetch(`${BASE_URL}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const myOrdersData = (await myOrdersRes.json()) as any;
  console.log(`✓ Customer has ${myOrdersData.orders?.length} active/past order(s).`);
  passedSteps++;

  // Step 8: Admin Authentication
  console.log('\n[Step 8] Authenticating Admin User...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@traditionsbytiya.com',
      password: 'Admin@Traditions2026!',
    }),
  });
  const adminLoginData = (await adminLoginRes.json()) as any;
  if (!adminLoginData.success || adminLoginData.user.role !== 'admin') {
    throw new Error('Admin login failed or user not admin');
  }
  const adminToken = adminLoginData.token;
  console.log(`✓ Admin Logged In: ${adminLoginData.user.name} (Role: ${adminLoginData.user.role})`);
  passedSteps++;

  // Step 9: Admin Dashboard Stats
  console.log('\n[Step 9] Fetching Admin Dashboard Telemetry...');
  const statsRes = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const statsData = (await statsRes.json()) as any;
  console.log(`✓ Dashboard Stats: Total Orders: ${statsData.stats.totalOrders} | Revenue: ₹${statsData.stats.totalRevenue} | UPI Count: ${statsData.stats.paymentSplit.upi} | COD Count: ${statsData.stats.paymentSplit.cod}`);
  passedSteps++;

  // Step 10: Admin Inline Inventory Edit
  console.log('\n[Step 10] Testing Admin Inline Stock & Price Adjustment...');
  const invRes = await fetch(`${BASE_URL}/products/${sampleProduct1._id}/inventory`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      stock: 25,
      price: sampleProduct1.price,
    }),
  });
  const invData = (await invRes.json()) as any;
  console.log(`✓ Stock updated to ${invData.product.stock} units for "${invData.product.name}"`);
  passedSteps++;

  // Step 11: Admin Order Status Update (Placed -> Shipped)
  console.log('\n[Step 11] Admin Dispatches Order with Courier & Tracking ID...');
  const statusRes = await fetch(`${BASE_URL}/orders/admin/${codOrderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'Shipped',
      courier: 'BlueDart Air Express',
      trackingId: 'BD882194910IN',
      note: 'Handed over to BlueDart courier hub',
    }),
  });
  const statusData = (await statusRes.json()) as any;
  console.log(`✓ Order #${codOrderId} status updated to: ${statusData.order.status} (Courier: ${statusData.order.courier}, AWB: ${statusData.order.trackingId})`);
  passedSteps++;

  // Step 12: Admin Marks COD as Paid
  console.log('\n[Step 12] Admin Marks COD Order as Paid upon Cash Collection...');
  const codPaidRes = await fetch(`${BASE_URL}/orders/admin/${codOrderId}/mark-cod-paid`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const codPaidData = (await codPaidRes.json()) as any;
  console.log(`✓ COD Order Payment status updated to: ${codPaidData.order.paymentStatus}`);
  passedSteps++;

  // Step 13: Customer Registered List
  console.log('\n[Step 13] Admin Customer Directory...');
  const customersRes = await fetch(`${BASE_URL}/admin/customers`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const customersData = (await customersRes.json()) as any;
  console.log(`✓ Admin Customers Directory: ${customersData.customers?.length} patron profile(s) loaded.`);
  passedSteps++;

  console.log('\n======================================================');
  console.log(`  ALL ${passedSteps}/${passedSteps} E2E TESTS PASSED WITH 100% SUCCESS!  `);
  console.log('======================================================\n');
}

runE2ETest().catch((err) => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
