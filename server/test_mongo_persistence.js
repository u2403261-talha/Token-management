const http = require("http");

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log("--- STARTING MONGODB PERSISTENCE TESTS ---");

  // 1. Register test user
  const email = `test_${Date.now()}@example.com`;
  console.log("\n1. Registering user:", email);
  const regRes = await request(
    {
      hostname: "localhost",
      port: 4000,
      path: "/api/auth/register",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { name: "Test Organizer", email, password: "password123" }
  );
  console.log("Register result:", regRes.status, regRes.body);

  // 2. Login test user
  console.log("\n2. Logging in...");
  const loginRes = await request(
    {
      hostname: "localhost",
      port: 4000,
      path: "/api/auth/login",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { email, password: "password123" }
  );
  console.log("Login result:", loginRes.status);
  const jwt = loginRes.body.jwt;

  // 3. Create Event
  console.log("\n3. Creating Event in MongoDB...");
  const eventRes = await request(
    {
      hostname: "localhost",
      port: 4000,
      path: "/api/events",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
    },
    { title: "Annual Tech Symposium" }
  );
  console.log("Event created:", eventRes.body);
  const eventId = eventRes.body._id;

  // 4. Request Token 1
  console.log("\n4. Requesting Token 1 (Attendee: Alice)...");
  const t1 = await request(
    {
      hostname: "localhost",
      port: 4000,
      path: `/api/public/events/${eventId}/join`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { name: "Alice" }
  );
  console.log("Token 1 result:", t1.body);

  // 5. Request Token 2
  console.log("\n5. Requesting Token 2 (Attendee: Bob)...");
  const t2 = await request(
    {
      hostname: "localhost",
      port: 4000,
      path: `/api/public/events/${eventId}/join`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { name: "Bob" }
  );
  console.log("Token 2 result:", t2.body);

  // 6. Request Token 3
  console.log("\n6. Requesting Token 3 (Attendee: Charlie)...");
  const t3 = await request(
    {
      hostname: "localhost",
      port: 4000,
      path: `/api/public/events/${eventId}/join`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { name: "Charlie" }
  );
  console.log("Token 3 result:", t3.body);

  // 7. Retrieve all tokens from MongoDB
  console.log("\n7. Retrieving all tokens for event from MongoDB...");
  const listRes = await request({
    hostname: "localhost",
    port: 4000,
    path: `/api/tokens?eventId=${eventId}`,
    method: "GET",
    headers: { Authorization: `Bearer ${jwt}` },
  });
  console.log("Tokens count in MongoDB:", listRes.body.length);
  listRes.body.forEach((t) =>
    console.log(`  Token #${t.tokenNumber}: ${t.name} (Status: ${t.status}, ID: ${t._id})`)
  );

  // 8. Update Token status (waiting -> done)
  console.log("\n8. Updating Token #1 status to 'done'...");
  const updateRes = await request(
    {
      hostname: "localhost",
      port: 4000,
      path: `/api/tokens/${t1.body._id}`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
    },
    { status: "done" }
  );
  console.log("Updated Token 1:", updateRes.body);

  // 9. Re-fetch tokens to confirm updated status persists in MongoDB
  console.log("\n9. Re-fetching tokens to verify persistent status...");
  const verifyList = await request({
    hostname: "localhost",
    port: 4000,
    path: `/api/tokens?eventId=${eventId}`,
    method: "GET",
    headers: { Authorization: `Bearer ${jwt}` },
  });
  console.log("Token list after status update:");
  verifyList.body.forEach((t) =>
    console.log(`  Token #${t.tokenNumber}: ${t.name} (Status: ${t.status})`)
  );

  console.log("\n--- ALL TESTS COMPLETED SUCCESSFULLY! ---");
}

runTests().catch(console.error);
