import assert from 'node:assert/strict';
import { it } from 'node:test';
import { acquireSubmission } from '../src/services/wallet/submission-lock.ts';

it('blocks concurrent screens before journal reads and allows retry after release', () => {
  const release = acquireSubmission('wallet:market');
  assert.equal(typeof release, 'function');
  assert.equal(acquireSubmission('wallet:market'), null);
  const unrelated = acquireSubmission('other:market');
  assert.equal(typeof unrelated, 'function');
  unrelated();
  release();
  const next = acquireSubmission('wallet:market');
  assert.equal(typeof next, 'function');
  release(); // A repeated old cleanup must not unlock the new submission.
  assert.equal(acquireSubmission('wallet:market'), null);
  next();
});
