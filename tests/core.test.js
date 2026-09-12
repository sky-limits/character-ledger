'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../core.js');

const root = path.resolve(__dirname,'..');
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),sandbox);

const state = Core.validate(sandbox.window.CHARACTER_LEDGER_SEED);
const spear = state.crafting.find(recipe=>recipe.id==='spear');
assert.ok(spear,'Spear recipe should load.');
assert.deepEqual(Core.craftingProgress(spear,state.inventory),{
  required:27,
  have:2,
  percentage:7.41,
  complete:false
});
assert.deepEqual(Core.shoppingList(state.crafting,state.inventory).map(row=>[row.item,row.missing]),[
  ['Arrowhead',2],
  ['Stick',19],
  ['Thread',4]
]);

const malformed = JSON.parse(JSON.stringify(sandbox.window.CHARACTER_LEDGER_SEED));
malformed.crafting.push({id:'broken',name:'Broken recipe',requirements:[{item:'Mist',required:0}]});
const recovered = Core.validate(malformed);
assert.equal(recovered.crafting.length,state.crafting.length,'Invalid recipes should be skipped.');
assert.equal(recovered.craftingWarnings.length,1,'Invalid recipes should produce a warning.');
assert.equal(recovered.characters.length,state.characters.length,'Crafting errors should not remove character data.');

const legacy = JSON.parse(JSON.stringify(sandbox.window.CHARACTER_LEDGER_SEED));
delete legacy.inventory;
legacy.crafting[0].requirements[0].have=3;
legacy.crafting[0].requirements[1].have=2;
legacy.crafting[0].requirements[2].have=1;
const migrated = Core.validate(legacy);
assert.equal(migrated.inventory.Stick,3,'Legacy recipe amounts should migrate when shared inventory is absent.');
assert.equal(Core.craftingProgress(migrated.crafting[0],migrated.inventory).have,6);

assert.deepEqual(Core.validateInventoryExport({
  format:'character-ledger-inventory',version:1,inventory:{Stick:12,Thread:2.5}
}),{Stick:12,Thread:2.5});
assert.throws(()=>Core.validateInventoryExport({
  format:'character-ledger-inventory',version:1,inventory:{Stick:'many'}
}),/Invalid amount/,'Corrupted inventory amounts should be rejected.');
assert.throws(()=>Core.validateInventoryExport({
  format:'character-ledger-inventory',version:1,inventory:{constructor:1}
}),/reserved/,'Reserved object keys should be rejected.');

console.log('Character Ledger core tests passed.');
