'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Core=require('../core.js');

const root=path.resolve(__dirname,'..'),listeners={},windowListeners={},elements=new Map();
const makeElement=()=>{
  const handlers={};
  return {innerHTML:'',textContent:'',value:'',files:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},removeAttribute(){},addEventListener:(type,handler)=>{handlers[type]=handler;},close(){},showModal(){},querySelector(){return null;},focus(){},select(){},click(){},_handlers:handlers};
};
for(const selector of ['#main','#toast','#reward-count','#lightbox img','#lightbox p','#lightbox','#lightbox .lightbox-close','#inventory-import-form','#inventory-import-error','#inventory-import-file','#inventory-import-dialog','#score-error','#score-total','#score-output','#score-unit'])elements.set(selector,makeElement());

const sandbox={
  console,Intl,Date,Blob,URL,setTimeout:()=>0,clearTimeout(){},location:{hash:'#journal'},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  document:{
    title:'',querySelector:selector=>elements.get(selector)||null,querySelectorAll:()=>[],
    addEventListener:(type,handler)=>{listeners[type]=handler;},createElement:()=>makeElement(),execCommand:()=>true
  },
  window:{LedgerCore:Core,addEventListener:(type,handler)=>{windowListeners[type]=handler;},scrollTo(){},confirm:()=>true,navigator:{clipboard:{writeText:async()=>{}}}}
};
sandbox.window.window=sandbox.window;sandbox.window.document=sandbox.document;sandbox.window.location=sandbox.location;sandbox.window.localStorage=sandbox.localStorage;sandbox.window.setTimeout=sandbox.setTimeout;sandbox.window.clearTimeout=sandbox.clearTimeout;

vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(path.join(root,'app.js'),'utf8'),sandbox);

const main=elements.get('#main');
assert.match(main.innerHTML,/The Field Journal/);
assert.match(main.innerHTML,/Next goals/);
assert.match(main.innerHTML,/Pending review/);
assert.match(main.innerHTML,/Point health/);
assert.match(main.innerHTML,/Artwork scoring calculator/);
assert.match(main.innerHTML,/136 GP to Guardian/);
assert.match(main.innerHTML,/About 20 artworks/);
assert.match(main.innerHTML,/Review queue clear/);
assert.match(elements.get('#score-output').value,/characterId: "nerissa"/);

const eventTarget=(selector,element)=>({closest:query=>query===selector?element:null});
listeners.input({target:eventTarget('[data-score-field]',{dataset:{scoreField:'title'},value:'Forest Trial'})});
for(const id of ['fullbody','background','activity'])listeners.input({target:eventTarget('[data-score-rule]',{dataset:{scoreRule:id},value:'1'})});
listeners.input({target:eventTarget('[data-score-field]',{dataset:{scoreField:'multiplier'},value:'3'})});
assert.equal(elements.get('#score-total').textContent,'21');
assert.equal(elements.get('#score-unit').textContent,'GP');
assert.match(elements.get('#score-output').value,/title: "Forest Trial"/);
assert.match(elements.get('#score-output').value,/xp: 21/);
assert.match(elements.get('#score-output').value,/×3/);

listeners.change({target:eventTarget('[data-score-field]',{dataset:{scoreField:'characterId'},value:'isolde'})});
assert.match(main.innerHTML,/Manual points only/);
listeners.input({target:eventTarget('[data-score-field]',{dataset:{scoreField:'custom'},value:'12'})});
listeners.input({target:eventTarget('[data-score-field]',{dataset:{scoreField:'multiplier'},value:'1'})});
assert.equal(elements.get('#score-total').textContent,'12');
assert.equal(elements.get('#score-unit').textContent,'KudaPoints');
assert.match(elements.get('#score-output').value,/characterId: "isolde"/);

console.log('Character Ledger Field Journal tests passed.');
