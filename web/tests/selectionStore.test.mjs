import test from 'node:test';
import assert from 'node:assert/strict';
import { createSelectionStore } from '../src/lib/selectionStore.ts';

function fixture(initial = null) {
  const values = new Map(initial === null ? [] : [['selected', initial]]);
  const events = new EventTarget();
  let writes = 0;
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { writes++; values.set(key, value); },
    removeItem: (key) => { writes++; values.delete(key); },
  };
  const environment = { storage: () => storage, events: () => events };
  const store = createSelectionStore('selected', 'selectedUpdated', environment);
  return { values, events, storage, environment, store, writes: () => writes };
}

for (const raw of ['null', '{}', '42', '"course"', '["course",2]', '{broken']) {
  test(`preserves unsupported saved data: ${raw}`, () => {
    const f = fixture(raw);
    const unsubscribe = f.store.subscribe(() => {});
    assert.equal(f.store.getSnapshot().issue, 'format');
    assert.deepEqual(f.store.getSnapshot().ids, []);
    assert.equal(f.store.toggle('new'), 'unavailable');
    assert.equal(f.store.clear(), false);
    assert.equal(f.values.get('selected'), raw);
    assert.equal(f.writes(), 0);
    unsubscribe();
  });
}

test('subscription reads without rewriting, retaining unknown and duplicate IDs', () => {
  const raw = '["known","unknown","known"]';
  const f = fixture(raw);
  const first = f.store.getServerSnapshot();
  assert.equal(f.store.getServerSnapshot(), first);
  const unsubscribe = f.store.subscribe(() => {});
  assert.deepEqual(f.store.getSnapshot().ids, ['known', 'unknown', 'known']);
  assert.equal(f.values.get('selected'), raw);
  assert.equal(f.writes(), 0);
  const snapshot = f.store.getSnapshot();
  f.store.refresh();
  assert.equal(f.store.getSnapshot(), snapshot);
  unsubscribe();
});

test('sequential updates from separate consumers preserve the latest stored selection', () => {
  const f = fixture('["existing"]');
  const second = createSelectionStore('selected', 'selectedUpdated', f.environment);
  f.store.subscribe(() => {}); second.subscribe(() => {});
  assert.equal(f.store.toggle('first'), 'saved');
  assert.equal(second.toggle('second'), 'saved');
  assert.deepEqual(f.store.getSnapshot().ids, ['existing', 'first', 'second']);
  assert.deepEqual(second.getSnapshot().ids, f.store.getSnapshot().ids);
});

test('limit blocks only additions and preserves unavailable selections until explicit removal', () => {
  const f = fixture('["one","two","unavailable"]');
  assert.equal(f.store.toggle('four', 3), 'limit');
  assert.equal(f.writes(), 0);
  assert.equal(f.store.toggle('unavailable', 3), 'saved');
  assert.equal(f.store.toggle('four', 3), 'saved');
  assert.deepEqual(f.store.getSnapshot().ids, ['one', 'two', 'four']);
});

test('read denial never attempts a write and recovers when access returns', () => {
  const f = fixture('["existing"]');
  const read = f.storage.getItem;
  f.storage.getItem = () => { throw new Error('denied'); };
  assert.equal(f.store.toggle('new'), 'unavailable');
  assert.equal(f.store.getSnapshot().issue, 'read');
  assert.equal(f.writes(), 0);
  f.storage.getItem = read;
  assert.equal(f.store.toggle('new'), 'saved');
  assert.deepEqual(f.store.getSnapshot().ids, ['existing', 'new']);
});

test('quota failure leaves both stored and displayed selections unchanged', () => {
  const f = fixture('["existing"]');
  const write = f.storage.setItem;
  f.storage.setItem = () => { throw new Error('quota'); };
  assert.equal(f.store.toggle('new'), 'unavailable');
  assert.equal(f.values.get('selected'), '["existing"]');
  assert.deepEqual(f.store.getSnapshot().ids, ['existing']);
  assert.equal(f.store.getSnapshot().issue, 'write');
  f.storage.setItem = write;
  assert.equal(f.store.toggle('new'), 'saved');
});

test('failed explicit clear preserves the previous selection', () => {
  const f = fixture('["existing"]');
  f.storage.removeItem = () => { throw new Error('denied'); };
  assert.equal(f.store.clear(), false);
  assert.equal(f.values.get('selected'), '["existing"]');
  assert.deepEqual(f.store.getSnapshot().ids, ['existing']);
});

test('storage events update subscribers without writing or retaining listeners after cleanup', () => {
  const f = fixture('["old"]');
  let notifications = 0;
  const stop = f.store.subscribe(() => notifications++);
  f.values.set('selected', '["other-tab"]');
  const event = new Event('storage');
  Object.defineProperty(event, 'key', { value: 'selected' });
  f.events.dispatchEvent(event);
  assert.deepEqual(f.store.getSnapshot().ids, ['other-tab']);
  assert.equal(notifications, 2);
  assert.equal(f.writes(), 0);
  stop();
  f.values.set('selected', '[]');
  f.events.dispatchEvent(event);
  assert.equal(notifications, 2);
});

test('namespaces remain independent and clear is an explicit mutation', () => {
  const f = fixture('["course"]');
  f.values.set('professors', '["professor"]');
  const professors = createSelectionStore('professors', 'professorsUpdated', f.environment);
  f.store.subscribe(() => {}); professors.subscribe(() => {});
  assert.equal(f.store.clear(), true);
  assert.deepEqual(f.store.getSnapshot().ids, []);
  assert.deepEqual(professors.getSnapshot().ids, ['professor']);
  assert.equal(f.values.get('professors'), '["professor"]');
});

test('backup preserves raw formatting and distinguishes blocked reads from absent values', () => {
  const raw = ' { "unsupported": true } ';
  const f = fixture(raw);
  assert.deepEqual(f.store.readRaw(), { readable: true, raw });
  f.storage.getItem = () => { throw new Error('denied'); };
  assert.deepEqual(f.store.readRaw(), { readable: false });
  assert.equal(f.writes(), 0);
});
