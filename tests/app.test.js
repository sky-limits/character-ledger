'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../core.js');

const root = path.resolve(__dirname,'..');
const listeners = {};
const windowListeners = {};
const elements = new Map();
const makeElement = () => {
  const handlers={};
  return {
    innerHTML:'',textContent:'',value:'',files:[],classList:{add(){},remove(){},toggle(){}},
    setAttribute(){},removeAttribute(){},addEventListener:(type,handler)=>{handlers[type]=handler;},close(){},showModal(){},
    querySelector(){return null;},focus(){},click(){},_handlers:handlers
  };
};
for (const selector of ['#main','#toast','#reward-count','#lightbox img','#lightbox p','#lightbox','#lightbox .lightbox-close','#inventory-import-form','#inventory-import-error','#inventory-import-file','#inventory-import-dialog']) elements.set(selector,makeElement());

const storage = new Map([['character-ledger-inventory-v1',JSON.stringify({Thread:5})]]);
const sandbox = {
  console,
  Intl,
  Date,
  Blob,
  URL,
  setTimeout:()=>0,
  clearTimeout(){},
  location:{hash:'#crafting'},
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  document:{
    title:'',
    querySelector:selector=>selector==='input[name="inventory-import-mode"]:checked'?{value:'replace'}:elements.get(selector)||null,
    querySelectorAll:()=>[],
    addEventListener:(type,handler)=>{listeners[type]=handler;},
    createElement:()=>makeElement()
  },
  window:{
    LedgerCore:Core,
    addEventListener:(type,handler)=>{windowListeners[type]=handler;},
    scrollTo(){},
    confirm:()=>true
  }
};
sandbox.window.window=sandbox.window;
sandbox.window.document=sandbox.document;
sandbox.window.location=sandbox.location;
sandbox.window.localStorage=sandbox.localStorage;
sandbox.window.setTimeout=sandbox.setTimeout;
sandbox.window.clearTimeout=sandbox.clearTimeout;

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),sandbox);

const main=elements.get('#main');
assert.match(main.innerHTML,/My inventory/);
assert.match(main.innerHTML,/Still to gather/);
assert.match(main.innerHTML,/Needed by: Spear/);
assert.match(main.innerHTML,/Only show missing/);
assert.match(main.innerHTML,/Priority 1/);
assert.match(main.innerHTML,/Planned quantity/);
assert.match(main.innerHTML,/22\.22%/,'Saved inventory should update recipe progress.');
assert.match(main.innerHTML,/19 more/);
assert.match(main.innerHTML,/2 more/);

listeners.click({target:{closest:()=>({dataset:{action:'inventory-adjust',item:'Stick',delta:'1'}})}});
assert.match(main.innerHTML,/25\.93%/,'Plus control should update shared recipe progress.');
assert.equal(JSON.parse(storage.get('character-ledger-workshop-v2')).inventory.Stick,2,'Adjusted inventory should save inside the workshop record.');

listeners.change({target:{closest:selector=>selector==='[data-plan-quantity]'?{dataset:{planQuantity:'spear'},value:'2'}:null}});
assert.match(main.innerHTML,/12\.96%/,'Planned quantity should multiply recipe requirements.');
assert.equal(JSON.parse(storage.get('character-ledger-workshop-v2')).plan.desired.spear,2);

windowListeners.storage({key:'character-ledger-workshop-v2',newValue:JSON.stringify({format:'character-ledger-workshop',version:2,savedAt:'2026-09-12T10:00:00.000Z',inventory:{Stick:20,Thread:5,Arrowhead:2,Bilberries:1},plan:{order:['spear'],desired:{spear:1},currentGoalId:'spear'},history:[]})});
assert.match(main.innerHTML,/100%/,'Inventory updates from another tab should re-render recipe progress.');
assert.match(main.innerHTML,/Ready to forge/);

listeners.click({target:{closest:()=>({dataset:{action:'craft-recipe',id:'spear'}})}});
let savedWorkshop=JSON.parse(storage.get('character-ledger-workshop-v2'));
assert.equal(savedWorkshop.inventory.Stick,0,'Crafting should consume required materials.');
assert.equal(savedWorkshop.inventory.Thread,0);
assert.equal(savedWorkshop.inventory.Arrowhead,0);
assert.equal(savedWorkshop.history.length,1,'Crafting should add a history record.');
assert.match(main.innerHTML,/Crafting history/);
assert.match(main.innerHTML,/1 × Spear/);

listeners.click({target:{closest:()=>({dataset:{action:'undo-craft',id:savedWorkshop.history[0].id}})}});
savedWorkshop=JSON.parse(storage.get('character-ledger-workshop-v2'));
assert.equal(savedWorkshop.inventory.Stick,20,'Undo should restore the exact consumed materials.');
assert.equal(savedWorkshop.history[0].undone,true);

async function testImport() {
  elements.get('#inventory-import-file').files=[{
    size:120,
    text:async()=>JSON.stringify({format:'character-ledger-inventory',version:1,inventory:{Stick:4}})
  }];
  await elements.get('#inventory-import-form')._handlers.submit({preventDefault(){}});
  assert.match(main.innerHTML,/14\.81%/,'Replace import should reset absent recipe materials to zero.');
  const importedWorkshop=JSON.parse(storage.get('character-ledger-workshop-v2'));
  assert.deepEqual(importedWorkshop.inventory,{Stick:4,Thread:0,Arrowhead:0});
  assert.equal(importedWorkshop.history.length,0,'Replacing with a legacy inventory should clear workshop history.');

  elements.get('#inventory-import-file').files=[{size:12,text:async()=>'{not json'}];
  await elements.get('#inventory-import-form')._handlers.submit({preventDefault(){}});
  assert.match(elements.get('#inventory-import-error').textContent,/not valid JSON/);
}

testImport().then(()=>console.log('Character Ledger app interaction tests passed.')).catch(error=>{console.error(error);process.exitCode=1;});
