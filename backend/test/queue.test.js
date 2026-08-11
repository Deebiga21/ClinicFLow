/**
 * Integration test for the queue routes, using fake in-memory models
 * in place of real MongoDB (which isn't reachable in this sandbox).
 *
 * Strategy: pre-populate require.cache for '../models/Token' and
 * '../models/ClinicSettings' with fake implementations BEFORE
 * routes/queue.js (and utils/queueHelpers.js) require them. Since Node
 * caches modules by resolved path, this makes every downstream require()
 * of those two files return our fakes instead of touching Mongoose.
 */
const path = require('path');
const assert = require('assert');
const express = require('express');
const http = require('http');

const { createFakeModel } = require('./fakeModel');

const tokenModelPath = path.resolve(__dirname, '../models/Token.js');
const settingsModelPath = path.resolve(__dirname, '../models/ClinicSettings.js');
const visitRecordModelPath = path.resolve(__dirname, '../models/VisitRecord.js');

const fakeToken = createFakeModel([], { status: 'waiting' });
const fakeSettings = createFakeModel([], {
  avgConsultationTime: 10,
  lastIssuedToken: 0,
  currentlyServingToken: null
});
const fakeVisitRecord = createFakeModel([]);

require.cache[tokenModelPath] = { id: tokenModelPath, filename: tokenModelPath, loaded: true, exports: fakeToken };
require.cache[settingsModelPath] = { id: settingsModelPath, filename: settingsModelPath, loaded: true, exports: fakeSettings };
require.cache[visitRecordModelPath] = { id: visitRecordModelPath, filename: visitRecordModelPath, loaded: true, exports: fakeVisitRecord };

const { signToken } = require('../middleware/auth');
const staffToken = signToken({ _id: '507f1f77bcf86cd799439011', role: 'staff', username: 'test-staff' });

// Now require the real route logic — it will pick up our fakes via require.cache
const queueRoutes = require('../routes/queue');

const app = express();
app.use(express.json());

// Minimal fake io — just records emitted events instead of broadcasting over a socket
const emittedEvents = [];
app.use((req, res, next) => {
  req.io = {
    emit: (event, payload) => emittedEvents.push({ event, payload }),
    to: () => ({ emit: (event, payload) => emittedEvents.push({ event, payload }) })
  };
  next();
});
app.use('/api', queueRoutes);

const server = http.createServer(app);

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      }
    };
    const req = http.request(opts, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: chunks ? JSON.parse(chunks) : null });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function check(label, condition) {
    if (condition) {
      console.log(`  PASS - ${label}`);
      passed++;
    } else {
      console.log(`  FAIL - ${label}`);
      failed++;
    }
  }

  console.log('\n=== Test 1: Empty queue state on fresh load ===');
  let res = await request('GET', '/api/queue');
  check('status 200', res.status === 200);
  check('no current token', res.body.currentToken === null);
  check('empty waiting queue', Array.isArray(res.body.waitingQueue) && res.body.waitingQueue.length === 0);
  check('default avg consultation time is 10', res.body.avgConsultationTime === 10);

  console.log('\n=== Test 2: Add a patient assigns token #1 ===');
  res = await request('POST', '/api/queue/add', { patientName: 'Asha Kumar' });
  check('status 201', res.status === 201);
  check('token number is 1', res.body.token.tokenNumber === 1);
  check('status is waiting', res.body.token.status === 'waiting');
  check('queueUpdated event was emitted', emittedEvents.some((e) => e.event === 'queueUpdated'));

  console.log('\n=== Test 3: Add second patient gets token #2 (atomic increment) ===');
  res = await request('POST', '/api/queue/add', { patientName: 'Ravi Shah' });
  check('token number is 2', res.body.token.tokenNumber === 2);

  console.log('\n=== Test 4: Reject empty patient name ===');
  res = await request('POST', '/api/queue/add', { patientName: '   ' });
  check('status 400 on blank name', res.status === 400);

  console.log('\n=== Test 5: Call next promotes token #1 to in_consultation ===');
  res = await request('POST', '/api/queue/call-next');
  check('status 200', res.status === 200);
  check('current token is #1', res.body.state.currentToken.tokenNumber === 1);
  check('current token name matches', res.body.state.currentToken.patientName === 'Asha Kumar');
  check('one patient still waiting', res.body.state.waitingQueue.length === 1);
  check('waiting patient is #2', res.body.state.waitingQueue[0].tokenNumber === 2);

  console.log('\n=== Test 6: Wait time for waiting patient reflects real queue position ===');
  const waitingPatient = res.body.state.waitingQueue[0];
  // peopleAhead = 0 (no one else waiting ahead of them), but someone is
  // currently in consultation, so their wait should be > 0 (remaining time
  // of current consult, since avgConsultationTime=10 and just started -> ~10 min)
  check('estimated wait is a number', typeof waitingPatient.estimatedWaitMinutes === 'number');
  check('estimated wait is roughly avgConsultationTime (~10, just started)', waitingPatient.estimatedWaitMinutes >= 9 && waitingPatient.estimatedWaitMinutes <= 10);

  console.log('\n=== Test 7: Call next again completes #1, promotes #2 ===');
  res = await request('POST', '/api/queue/call-next');
  check('current token is now #2', res.body.state.currentToken.tokenNumber === 2);
  check('no one waiting now', res.body.state.waitingQueue.length === 0);

  console.log('\n=== Test 8: Call next with nobody left -> completes #2, current becomes null ===');
  res = await request('POST', '/api/queue/call-next');
  check('status 200 (no crash on empty queue)', res.status === 200);
  check('current token is null', res.body.state.currentToken === null);

  console.log('\n=== Test 9: Update avg consultation time ===');
  res = await request('PUT', '/api/queue/settings', { avgConsultationTime: 15 });
  check('status 200', res.status === 200);
  check('avg time updated to 15', res.body.state.avgConsultationTime === 15);

  console.log('\n=== Test 10: Reject invalid avg consultation time ===');
  res = await request('PUT', '/api/queue/settings', { avgConsultationTime: -5 });
  check('status 400 on negative value', res.status === 400);

  console.log('\n=== Test 11: Multiple waiting patients get increasing wait times ===');
  await request('POST', '/api/queue/add', { patientName: 'Priya' });
  await request('POST', '/api/queue/add', { patientName: 'Kabir' });
  await request('POST', '/api/queue/add', { patientName: 'Meera' });
  res = await request('POST', '/api/queue/call-next'); // promotes Priya to current
  const queueState = res.body.state;
  const [p1, p2] = queueState.waitingQueue; // Kabir, Meera
  check('Kabir wait < Meera wait (queue order respected)', p1.estimatedWaitMinutes < p2.estimatedWaitMinutes);
  check('wait gap roughly equals avgConsultationTime (15)', (p2.estimatedWaitMinutes - p1.estimatedWaitMinutes) === 15);

  console.log('\n=== Test 12: Skip marks current as skipped, not done, and promotes next ===');
  res = await request('POST', '/api/queue/skip');
  check('status 200', res.status === 200);
  check('current token is now Kabir', res.body.state.currentToken.patientName === 'Kabir');

  console.log('\n=== Test 13: Reset clears everything ===');
  res = await request('POST', '/api/queue/reset');
  check('status 200', res.status === 200);
  check('no current token after reset', res.body.state.currentToken === null);
  check('no waiting patients after reset', res.body.state.waitingQueue.length === 0);
  check('lastIssuedToken reset to 0', res.body.state.lastIssuedToken === 0);

  console.log('\n=== Test 14: Token numbering restarts correctly after reset ===');
  res = await request('POST', '/api/queue/add', { patientName: 'New Patient' });
  check('token number restarts at 1', res.body.token.tokenNumber === 1);

  console.log(`\n\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

server.listen(0, () => {
  runTests().catch((err) => {
    console.error('Test run crashed:', err);
    server.close();
    process.exit(1);
  });
});
