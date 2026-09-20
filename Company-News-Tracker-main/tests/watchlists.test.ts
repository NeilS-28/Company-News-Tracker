import { describe, it } from 'node:test';
import assert from 'node:assert';
import { db } from '../src/db';

describe('Watchlist CRUD Operations', () => {
  it('retrieves watchlists array from database', () => {
    const watchlists = db.getWatchlists();
    assert.ok(Array.isArray(watchlists));
  });

  it('can create a new watchlist', () => {
    const newWatchlist = db.createWatchlist('Test Portfolio');
    assert.ok(newWatchlist.id);
    assert.strictEqual(newWatchlist.name, 'Test Portfolio');

    const fetched = db.getWatchlistById(newWatchlist.id);
    assert.ok(fetched);
    assert.strictEqual(fetched?.name, 'Test Portfolio');

    // Clean up
    db.deleteWatchlist(newWatchlist.id);
  });

  it('handles company addition and duplicate prevention', () => {
    const watchlist = db.createWatchlist('Duplicates Test');
    const company = db.getCompanies()[0];

    if (company) {
      const addedFirst = db.addCompanyToWatchlist(watchlist.id, company.id);
      assert.strictEqual(addedFirst, true);

      const addedSecond = db.addCompanyToWatchlist(watchlist.id, company.id);
      assert.strictEqual(addedSecond, false);

      const inList = db.isCompanyInWatchlist(watchlist.id, company.id);
      assert.strictEqual(inList, true);
    }

    // Clean up
    db.deleteWatchlist(watchlist.id);
  });
});
