import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateSalt, hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../src/lib/auth';
import { db } from '../src/db';

describe('Authentication & Cryptography Layer', () => {
  test('generates valid cryptographically secure salt', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    assert.strictEqual(typeof salt1, 'string');
    assert.strictEqual(salt1.length, 32); // 16 bytes hex
    assert.notStrictEqual(salt1, salt2);
  });

  test('hashes password and verifies matching password correctly', () => {
    const password = 'StrongPassword@123';
    const salt = generateSalt();
    const hash = hashPassword(password, salt);

    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 128); // 64 bytes sha512 hex
    assert.strictEqual(verifyPassword(password, hash, salt), true);
  });

  test('rejects incorrect password or altered salt', () => {
    const password = 'CorrectPassword@123';
    const salt = generateSalt();
    const hash = hashPassword(password, salt);

    assert.strictEqual(verifyPassword('WrongPassword', hash, salt), false);
    assert.strictEqual(verifyPassword(password, hash, 'tampered_salt_123'), false);
  });

  test('creates and verifies signed JWT session tokens', () => {
    const user = { id: 'usr_test_999', name: 'Rohan Gupta', email: 'rohan@example.com' };
    const token = createSessionToken(user, 7);

    assert.strictEqual(typeof token, 'string');
    const parts = token.split('.');
    assert.strictEqual(parts.length, 3);

    const payload = verifySessionToken(token);
    assert.ok(payload);
    assert.strictEqual(payload?.id, user.id);
    assert.strictEqual(payload?.name, user.name);
    assert.strictEqual(payload?.email, user.email);
    assert.ok(payload?.exp && payload.exp > Math.floor(Date.now() / 1000));
  });

  test('detects and rejects tampered tokens', () => {
    const user = { id: 'usr_test_999', name: 'Rohan Gupta', email: 'rohan@example.com' };
    const token = createSessionToken(user, 7);
    const parts = token.split('.');

    // Tamper with payload (e.g. change user ID)
    const tamperedPayload = Buffer.from(JSON.stringify({ ...user, id: 'usr_attacker' })).toString('base64');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    assert.strictEqual(verifySessionToken(tamperedToken), null);

    // Tamper with signature
    const invalidSigToken = `${parts[0]}.${parts[1]}.invalidsignature`;
    assert.strictEqual(verifySessionToken(invalidSigToken), null);
  });
});

describe('Personalized Per-User Watchlists Isolation', () => {
  const userA = {
    id: `usr_test_A_${Date.now()}`,
    name: 'Alice Sharma',
    email: `alice_${Date.now()}@example.com`,
    passwordHash: 'dummyhash',
    salt: 'dummysalt',
    createdAt: new Date().toISOString(),
  };

  const userB = {
    id: `usr_test_B_${Date.now()}`,
    name: 'Bob Verma',
    email: `bob_${Date.now()}@example.com`,
    passwordHash: 'dummyhash',
    salt: 'dummysalt',
    createdAt: new Date().toISOString(),
  };

  test('registers and retrieves users from database', () => {
    const createdA = db.createUser(userA);
    const createdB = db.createUser(userB);

    assert.strictEqual(createdA.email, userA.email.toLowerCase());
    assert.strictEqual(createdB.email, userB.email.toLowerCase());

    const retrievedA = db.getUserById(createdA.id);
    assert.ok(retrievedA);
    assert.strictEqual(retrievedA?.name, userA.name);
  });

  test('isolates watchlists between User A and User B', () => {
    // Create watchlist for User A
    const wlA = db.createWatchlist("Alice's Green Energy", userA.id);
    // Create watchlist for User B
    const wlB = db.createWatchlist("Bob's High Beta", userB.id);

    // Check Alice's watchlists
    const aliceWatchlists = db.getWatchlists(userA.id);
    assert.ok(aliceWatchlists.some(w => w.id === wlA.id));
    assert.ok(!aliceWatchlists.some(w => w.id === wlB.id));

    // Check Bob's watchlists
    const bobWatchlists = db.getWatchlists(userB.id);
    assert.ok(bobWatchlists.some(w => w.id === wlB.id));
    assert.ok(!bobWatchlists.some(w => w.id === wlA.id));
  });

  test('prevents User B from updating or deleting User A watchlist', () => {
    const wlA = db.createWatchlist("Alice's Secret Picks", userA.id);

    // Bob attempts to rename Alice's watchlist
    const hacked = db.updateWatchlist(wlA.id, 'Hacked Name', userB.id);
    assert.strictEqual(hacked, null);

    // Bob attempts to delete Alice's watchlist
    const deleted = db.deleteWatchlist(wlA.id, userB.id);
    assert.strictEqual(deleted, false);

    // Alice successfully updates her own watchlist
    const updated = db.updateWatchlist(wlA.id, 'Alice Updated Picks', userA.id);
    assert.ok(updated);
    assert.strictEqual(updated?.name, 'Alice Updated Picks');

    // Alice successfully deletes her own watchlist
    const aliceDeleted = db.deleteWatchlist(wlA.id, userA.id);
    assert.strictEqual(aliceDeleted, true);
  });
});
