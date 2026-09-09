'use strict';
class LocalStorageMock {
  constructor(){ this.map = new Map(); }
  getItem(k){ return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k,v){ this.map.set(k,String(v)); }
  removeItem(k){ this.map.delete(k); }
  clear(){ this.map.clear(); }
}
global.localStorage = new LocalStorageMock();
const commerce = require('./scripts/commerce-core.js');
const products = [
  {id:'navy-two-piece-set'},
  {id:'green-two-piece-set'},
  {id:'yellow-floral-kurti'}
];
let passed = 0;
function check(condition, name){ if(!condition) throw new Error(`FAIL: ${name}`); passed++; console.log(`PASS ${String(passed).padStart(2,'0')} ${name}`); }

commerce.resetState();
commerce.ensureProducts(products);
let state = commerce.snapshot();
check(state.products['navy-two-piece-set'].price === null, 'fresh products have no fake price');
check(state.products['navy-two-piece-set'].onHand === 0, 'fresh products have zero fake stock');
check(state.products['navy-two-piece-set'].enabled === false, 'fresh products are not checkout-enabled');

commerce.demoScenario(products);
state = commerce.snapshot();
check(state.products['navy-two-piece-set'].onHand === 60, 'demo Navy starts with 60 on hand');
check(state.products['navy-two-piece-set'].price === 700, 'demo Navy test price is K700');
check(commerce.availableStock('navy-two-piece-set', state) === 60, 'demo Navy starts with 60 available');

const reservation = commerce.createReservation([{productId:'navy-two-piece-set',quantity:2,size:'M'}], {name:'Test'});
state = commerce.snapshot();
check(state.products['navy-two-piece-set'].onHand === 60, 'reservation does not reduce on-hand stock');
check(state.products['navy-two-piece-set'].reserved === 2, 'reservation adds 2 reserved');
check(commerce.availableStock('navy-two-piece-set', state) === 58, 'reservation makes 58 available');

const order = commerce.commitReservation(reservation.id, {provider:'test',reference:'abc'});
state = commerce.snapshot();
check(order.status === 'paid', 'successful simulated payment creates paid order');
check(state.products['navy-two-piece-set'].onHand === 58, 'successful payment permanently reduces 60 to 58');
check(state.products['navy-two-piece-set'].reserved === 0, 'successful payment clears reserved stock');
check(commerce.availableStock('navy-two-piece-set', state) === 58, 'available remains 58 after commit');
check(state.orders.length === 1, 'one paid order recorded');
check(state.orders[0].total === 1400, '2 × K700 = K1,400 order total');

const sameOrder = commerce.commitReservation(reservation.id, {provider:'test',reference:'duplicate'});
state = commerce.snapshot();
check(sameOrder.id === order.id, 'duplicate success returns existing order');
check(state.products['navy-two-piece-set'].onHand === 58, 'duplicate success does not decrement stock twice');
check(state.orders.length === 1, 'duplicate success does not create duplicate order');

const failedRes = commerce.createReservation([{productId:'green-two-piece-set',quantity:3,size:'L'}], {name:'Test'});
state = commerce.snapshot();
check(state.products['green-two-piece-set'].onHand === 24 && state.products['green-two-piece-set'].reserved === 3, 'failed-payment test reserves without selling');
commerce.releaseReservation(failedRes.id, 'test failure');
state = commerce.snapshot();
check(state.products['green-two-piece-set'].onHand === 24, 'failed payment keeps on-hand stock unchanged');
check(state.products['green-two-piece-set'].reserved === 0, 'failed payment releases reservation');
check(commerce.availableStock('green-two-piece-set', state) === 24, 'failed payment restores available stock');

let oversellBlocked = false;
try { commerce.createReservation([{productId:'yellow-floral-kurti',quantity:9,size:'S'}]); } catch (_) { oversellBlocked = true; }
check(oversellBlocked, 'overselling more than available stock is blocked');

commerce.adjustStock('navy-two-piece-set', 2, 'restock');
state = commerce.snapshot();
check(state.products['navy-two-piece-set'].onHand === 60, 'manual restock adjustment is recorded');

const res2 = commerce.createReservation([{productId:'navy-two-piece-set',quantity:5,size:'M'}]);
let belowReservedBlocked = false;
try { commerce.adjustStock('navy-two-piece-set', -60, 'invalid'); } catch (_) { belowReservedBlocked = true; }
check(belowReservedBlocked, 'manual adjustment cannot drop on-hand below reserved');
commerce.releaseReservation(res2.id);

console.log(`\nV26 CORE: ${passed} checks, 0 failures.`);
