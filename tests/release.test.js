'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Core=require('../core.js');

const root=path.resolve(__dirname,'..');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),sandbox);
const state=Core.validate(sandbox.window.CHARACTER_LEDGER_SEED);

for(const art of state.art){
  if(!art.image.startsWith('images/'))continue;
  const imagePath=path.resolve(root,art.image);
  assert.ok(imagePath.startsWith(path.join(root,'images')+path.sep),'Local image escaped the images directory: '+art.id);
  assert.ok(fs.existsSync(imagePath),'Missing local image for '+art.id+': '+art.image);
}

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const versions=[...html.matchAll(/[?&]v=([^"']+)/g)].map(match=>match[1]);
assert.deepEqual(versions,['1.00','1.00','1.00','1.00'],'Every browser asset must use the v1.00 cache key.');
for(const route of ['characters','progress','journal','rewards','crafting','species'])assert.match(html,new RegExp('href="#'+route+'"'),'Navigation is missing '+route+'.');
assert.match(html,/name="color-scheme" content="dark"/);
assert.match(html,/class="skip" href="#main"/);

const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
assert.doesNotMatch(app,/\sonclick=/i,'Use delegated event handlers instead of inline JavaScript.');
assert.match(app,/DATA CHECK STOPPED THE LOAD/);
assert.match(app,/aria-live="polite"/);
assert.match(css,/prefers-contrast:more/);
assert.match(css,/forced-colors:active/);
assert.ok(state.systems.every(system=>system.pointMode==='cumulative'));

for(const file of ['README.md','README.txt','OWNER-GUIDE.md','CHANGELOG.md'])assert.ok(fs.existsSync(path.join(root,file)),file+' is required for a stable release.');

console.log('Character Ledger stable-release checks passed.');
