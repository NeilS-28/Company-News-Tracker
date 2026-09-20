import { describe, it } from 'node:test';
import assert from 'node:assert';
import equities from '../src/db/equities_master.json';
import { db } from '../src/db';
describe('Exchange coverage metadata', () => {
 it('contains full NSE/BSE master coverage',()=>{ const x=equities as any[]; assert.ok(x.length>=5000); assert.ok(x.filter(r=>r.bseCode).length>=5000); });
 it('marks exactly 50 NIFTY constituents',()=>assert.strictEqual(db.getNifty50Companies().length,50));
 it('preserves BSE codes and exchange routing metadata',()=>{ const c=db.getCompanies().find(c=>c.bseCode); assert.ok(c); assert.ok(c!.exchanges.includes('BSE')); });
});
