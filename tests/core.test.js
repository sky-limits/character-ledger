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

const conflictRecipes=[
  {id:'first',name:'First',category:'',notes:'',reference:'',requirements:[{item:'Thread',required:5}]},
  {id:'second',name:'Second',category:'',notes:'',reference:'',requirements:[{item:'Thread',required:2}]}
];
const priority=Core.planCrafting(conflictRecipes,{Thread:5},{order:['first','second'],desired:{first:1,second:1}});
assert.equal(priority.rows[0].status,'ready');
assert.equal(priority.rows[1].status,'blocked','A lower recipe should report stock reserved by a higher-priority recipe.');
assert.equal(priority.rows[1].craftableCopies,2,'Raw craftable count should remain visible when priority blocks a recipe.');
const multiplied=Core.planCrafting(conflictRecipes,{Thread:12},{order:['first','second'],desired:{first:2,second:1},currentGoalId:'first'});
assert.equal(multiplied.rows[0].requirements[0].required,10,'Desired quantities should multiply requirements.');
assert.equal(multiplied.rows[1].status,'ready');
assert.deepEqual(Core.shoppingList(conflictRecipes,{Thread:5},{first:2,second:1}).map(row=>[row.item,row.missing]),[['Thread',7]]);

const workshopBackup={
  format:'character-ledger-workshop',version:2,
  inventory:{Stick:4,Thread:2},
  plan:{order:['spear'],desired:{spear:2},currentGoalId:'spear'},
  history:[{id:'craft-test-1',recipeId:'spear',recipeName:'Spear',quantity:1,craftedAt:'2026-09-12T10:00:00.000Z',consumed:{Stick:20,Thread:5,Arrowhead:2},undone:false}]
};
const restoredWorkshop=Core.validateWorkshopExport(workshopBackup,state.crafting);
assert.equal(restoredWorkshop.plan.desired.spear,2);
assert.equal(restoredWorkshop.history.length,1);
assert.throws(()=>Core.validateWorkshopExport({...workshopBackup,history:[...workshopBackup.history,...workshopBackup.history]},state.crafting),/duplicate crafting history ID/);
const legacyWorkshop=Core.validateWorkshopExport({format:'character-ledger-inventory',version:1,inventory:{Stick:3}},state.crafting);
assert.equal(legacyWorkshop.legacy,true,'v0.07 inventory exports should remain importable.');

const nerissa=state.characters.find(character=>character.id==='nerissa');
assert.deepEqual(Core.pointBreakdown(state,nerissa),{
  opening:0,approved:114,pending:0,rejected:0,positive:0,negative:0,adjustments:0,total:114
});
const nerissaGoal=Core.characterGoal(state,nerissa);
assert.equal(nerissaGoal.label,'Guardian');
assert.equal(nerissaGoal.remaining,136);
assert.equal(nerissaGoal.percentage,45.6);
assert.deepEqual(Core.pointForecast(state,nerissa),{typicalXP:7,remaining:136,artworks:20,sampleSize:13});
assert.equal(Core.pointTimeline(state,nerissa)[0].date,'2026-09-10','Dated point events should sort newest first.');
assert.match(Core.pointWarnings(state)[0].message,/8 counted entries without a date/);

const pointFixture=JSON.parse(JSON.stringify(state));
pointFixture.characters[0].goalXP=150;
pointFixture.art.push({id:'pending-test',characterId:'nerissa',title:'Awaiting review',image:'',xp:9,status:'pending',rolled:false,itemRewards:'',rewardsRedeemed:false,redemptionLink:'',credit:'',source:'',date:'2026-09-12',notes:''});
pointFixture.adjustments.push({id:'bonus-test',characterId:'nerissa',amount:6,reason:'Event bonus',date:'2026-09-11'});
const customGoal=Core.characterGoal(pointFixture,pointFixture.characters[0]);
assert.equal(customGoal.label,'Custom point goal');
assert.equal(customGoal.remaining,30);
assert.equal(Core.pointBreakdown(pointFixture,pointFixture.characters[0]).pending,9,'Pending artwork should remain outside the total.');
assert.equal(Core.pendingReview(pointFixture)[0].art.id,'pending-test');

const aedracoPreset=state.scoringPresets.find(preset=>preset.id==='aedraco-art');
const score=Core.scoreArtwork(aedracoPreset,{fullbody:1,background:1,activity:1},3,0);
assert.equal(score.subtotal,7);
assert.equal(score.total,21);
assert.throws(()=>Core.scoreArtwork(aedracoPreset,{fullbody:101},1,0),/whole numbers from 0 to 100/);

const invalidGoal=JSON.parse(JSON.stringify(sandbox.window.CHARACTER_LEDGER_SEED));
invalidGoal.characters[0].goalRankId='missing-rank';
assert.throws(()=>Core.validate(invalidGoal),/goal references a missing rank/);

console.log('Character Ledger core tests passed.');
