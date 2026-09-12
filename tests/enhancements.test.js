'use strict';

const assert=require('node:assert/strict');
const Enhancements=require('../enhancements.js');

assert.equal(Enhancements.normalizeFocalPoint('25% 70%'),'25% 70%');
assert.equal(Enhancements.normalizeFocalPoint({x:120,y:-5}),'100% 0%');
assert.equal(Enhancements.normalizeFocalPoint('nope'),'50% 50%');

const accents=Enhancements.accentMapForSystems([
  {id:'aedraco'},
  {id:'custom',accent:'#abcdef'}
]);
assert.equal(accents.get('aedraco'),'#94d7ed');
assert.equal(accents.get('custom'),'#abcdef');

const track=Enhancements.rankTrack({ranks:[
  {id:'guardian',name:'Guardian',threshold:250},
  {id:'ancient',name:'Ancient',threshold:750}
]},375);
assert.equal(track.max,750);
assert.equal(track.percentage,50);
assert.deepEqual(track.ticks.map(tick=>tick.left),[250/750*100,100]);

assert.equal(Enhancements.itemIconKind('Silk Thread'),'thread');
assert.equal(Enhancements.itemIconKind('Bilberries'),'plant');
assert.equal(Enhancements.itemIconKind('Oak Stick'),'wood');
assert.equal(Enhancements.itemIconKind('Moon Crystal'),'gem');

const seed={
  systems:[{id:'a',name:'Aedraco',xpName:'GP',levelName:'Rank',ranks:[{name:'Guardian',threshold:250}]}],
  characters:[{id:'n',name:'Nerissa',systemId:'a',tags:['Sphinx'],notes:'mist walker'}],
  art:[{id:'art',characterId:'n',title:'Forest Hunt',credit:'Finch',notes:'stag chase',itemRewards:'Thread'}],
  crafting:[{id:'r',name:'Travel Satchel',category:'Gear',notes:'field kit',requirements:[{item:'Thread'}]}],
  rewards:[{id:'reward',characterId:'n',title:'Blue Token',notes:'rank prize'}]
};
const index=Enhancements.buildSearchIndex(seed);
assert.ok(index.some(entry=>entry.kind==='Artwork'&&entry.haystack.includes('stag chase')));
assert.ok(index.some(entry=>entry.kind==='Recipe'&&entry.haystack.includes('thread')));
assert.ok(index.some(entry=>entry.kind==='Character'&&entry.href==='#character/n'));

console.log('Character Ledger v1.01 enhancement helper checks passed.');
