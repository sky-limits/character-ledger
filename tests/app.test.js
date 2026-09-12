'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../core.js');

const root = path.resolve(__dirname,'..');
const listeners = {};
const elements = new Map();
const makeElement = () => ({
  innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},
  setAttribute(){},removeAttribute(){},addEventListener(){},close(){},showModal(){},
  querySelector(){return null;}
});
for (const selector of ['#main','#toast','#reward-count','#lightbox img','#lightbox p','#lightbox','#lightbox .lightbox-close']) elements.set(selector,makeElement());

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
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
  document:{
    title:'',
    querySelector:selector=>elements.get(selector)||null,
    querySelectorAll:()=>[],
    addEventListener:(type,handler)=>{listeners[type]=handler;},
    createElement:()=>makeElement()
  },
  window:{
    LedgerCore:Core,
    addEventListener(){},
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
assert.match(main.innerHTML,/22\.22%/,'Saved inventory should update recipe progress.');
assert.match(main.innerHTML,/19 more/);
assert.match(main.innerHTML,/2 more/);

listeners.click({target:{closest:()=>({dataset:{action:'inventory-adjust',item:'Stick',delta:'1'}})}});
assert.match(main.innerHTML,/25\.93%/,'Plus control should update shared recipe progress.');
assert.equal(JSON.parse(storage.get('character-ledger-inventory-v1')).Stick,2,'Adjusted inventory should save locally.');

console.log('Character Ledger app interaction tests passed.');
