import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterOrders } from '../src/orderFilters.js';

const statuses = ['submitted', 'in-review', 'in-progress', 'awaiting-info', 'awaiting-payment', 'completed', 'declined', 'cancelled', 'archived'];
const orders = statuses.map(status => ({ id: status, data: () => ({ status }) }));
const ids = (view, team = false) => filterOrders(orders, view, team).map(order => order.id);

test('customer past and current orders partition the full history', () => {
    assert.deepEqual(ids('past'), ['completed', 'declined', 'cancelled', 'archived']);
    assert.deepEqual(ids('current'), ['submitted', 'in-review', 'in-progress', 'awaiting-info', 'awaiting-payment']);
    assert.equal(new Set([...ids('past'), ...ids('current')]).size, statuses.length);
});

test('requested information stays active and is listed for customers and team', () => {
    for (const team of [false, true]) {
        assert.deepEqual(ids('requested', team), ['awaiting-info']);
        assert.ok(ids('current', team).includes('awaiting-info'));
    }
});

test('team retains all-orders view while past and new views remain filtered', () => {
    assert.deepEqual(ids('current', true), statuses);
    assert.deepEqual(ids('past', true), ids('past'));
    assert.deepEqual(ids('new', true), ['submitted']);
    assert.equal(orders[0].id, 'submitted');
});

test('empty and legacy orders remain usable', () => {
    assert.deepEqual(filterOrders([], 'past', false), []);
    const legacy = [{data: () => ({})}];
    assert.equal(filterOrders(legacy, 'current', false).length, 1);
    assert.equal(filterOrders(legacy, 'requested', false).length, 0);
    assert.equal(filterOrders(legacy, 'past', false).length, 0);
});
