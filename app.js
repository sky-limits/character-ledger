/* Character Ledger v0.07.2 — workshop import, sync, and interaction polish. */
(function(){
'use strict';
const C=window.LedgerCore, $=s=>document.querySelector(s), E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(n);
const selected=(a,b)=>a===b?' selected':'';
const INVENTORY_KEY='character-ledger-inventory-v1';
const INVENTORY_SAVED_KEY='character-ledger-inventory-saved-at-v1';
let state,inventory={},inventorySavedAt='',craftingOnlyMissing=false,toastTimer,filter={q:'',species:'',status:'',sort:location.hash==='#progress'?'progress':'name',rank:''};
const main=$('#main');
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
function character(id){return state.characters.find(c=>c.id===id);}
function species(id){return state.systems.find(s=>s.id===id);}
function cover(c){return state.art.find(a=>a.id===c.coverId)||state.art.find(a=>a.characterId===c.id&&a.image);}
function imageHTML(a,cls='',alt=''){return a?.image?`<img class="${cls}" src="${E(a.image)}" alt="${E(alt||a.title)}" loading="lazy">`:`<span class="no-image" aria-hidden="true">◇</span>`;}
function blank(title,text,action=''){return `<div class="empty"><h2>${E(title)}</h2><p>${E(text)}</p>${action}</div>`;}
function meter(p){return `<div class="meter" role="progressbar" aria-label="Progress to ${E(p.next?.name||'highest rank')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p.percentage)}"><span style="width:${p.percentage}%"></span></div>`;}
function rankLabel(p){return p.current?.name||p.system?.baseName||'No rank configured';}
function progressHTML(c){const p=C.progress(state,c);if(!p.configured)return `<div class="notice">${p.system?'Rank thresholds not published.':'Leveling system not configured.'}</div>`;return `<div class="xp-line"><strong>${fmt(p.xp)} <small>${E(p.system.xpName)}</small></strong><span class="badge">${E(rankLabel(p))}</span></div>${meter(p)}<div class="progress-caption"><span>${p.next?`${fmt(p.remaining)} ${E(p.system.xpName)} to ${E(p.next.name)}`:'Highest configured '+E(p.system.levelName.toLowerCase())+' reached'}</span><span>${fmt(p.percentage)}%</span></div>`;}
function head(title,text,actions='',eyebrow='THE COLLECTION'){return `<div class="page-head"><div><p class="eyebrow">${E(eyebrow)}</p><h1>${E(title)}</h1>${text?`<p>${E(text)}</p>`:''}</div><div class="actions">${actions}</div></div>`;}
function toolbar(kind){const statuses=kind==='rewards'?[['','All rewards'],['available','Ready to redeem'],['redeemed','Redeemed'],['locked','Locked']]:[['','All progress'],['close','Within 20%'],['max','Highest rank'],['setup','Needs setup']];return `<div class="toolbar"><label class="search">Search<input id="search" type="search" placeholder="${kind==='rewards'?'Reward, character, notes…':'Name, species, tags…'}" value="${E(filter.q)}"></label><label>Species<select id="filter-species"><option value="">All species</option>${state.systems.map(s=>`<option value="${s.id}"${selected(filter.species,s.id)}>${E(s.name)}</option>`).join('')}<option value="unassigned"${selected(filter.species,'unassigned')}>Unassigned</option></select></label><label>${kind==='rewards'?'Redemption':'Progress'}<select id="filter-status">${statuses.map(([v,t])=>`<option value="${v}"${selected(filter.status,v)}>${t}</option>`).join('')}</select></label>${['characters','progress'].includes(kind)?`<label>Current rank<select id="filter-rank"><option value="">All ranks</option>${state.systems.flatMap(s=>[{id:'base',name:s.baseName},...s.ranks].map(r=>`<option value="${s.id}:${r.id}"${selected(filter.rank,s.id+':'+r.id)}>${E(s.name+' · '+r.name)}</option>`)).join('')}</select></label><label>Sort<select id="filter-sort"><option value="name"${selected(filter.sort,'name')}>Name A–Z</option><option value="progress"${selected(filter.sort,'progress')}>Closest to next rank</option></select></label>`:''}<button class="text" data-action="clear-filters">Clear</button></div>`;}
function matches(c,extra=''){const p=C.progress(state,c),q=filter.q.toLocaleLowerCase().trim();return (!q||[c.name,p.system?.name,...c.tags,rankLabel(p),extra].join(' ').toLocaleLowerCase().includes(q))&&(!filter.species||(filter.species==='unassigned'?!c.systemId:c.systemId===filter.species));}
function characterRows(){let rows=state.characters.filter(c=>{const p=C.progress(state,c);return matches(c)&&(!filter.rank||filter.rank===c.systemId+':'+(p.current?.id||'base'))&&(!filter.status||(filter.status==='close'&&p.configured&&!p.maxed&&p.percentage>=80)||(filter.status==='max'&&p.maxed)||(filter.status==='setup'&&!p.configured));});return rows.sort((a,b)=>{if(filter.sort==='progress'){const pa=C.progress(state,a),pb=C.progress(state,b),score=p=>!p.configured?-2:p.maxed?-1:p.percentage;return score(pb)-score(pa)||a.name.localeCompare(b.name);}return a.name.localeCompare(b.name);});}
function characterCard(c){const p=C.progress(state,c),arts=state.art.filter(a=>a.characterId===c.id),available=C.rewardRows(state).filter(r=>r.characterId===c.id&&r.eligible&&!r.redemption).length;return `<article class="card"><a class="card-image" style="display:block" href="#character/${c.id}" aria-label="Open ${E(c.name)}">${imageHTML(cover(c),'',c.name)}<span class="badge">${E(p.system?.name||'Species not set')}</span></a><div class="card-body"><div class="card-title"><a href="#character/${c.id}">${E(c.name)}</a><div class="tags">${c.tags.slice(0,2).map(t=>`<span class="badge purple">${E(t)}</span>`).join('')}</div></div>${progressHTML(c)}<div class="card-bottom"><span>${arts.length} art pieces</span><span>${available} rewards ready</span></div></div></article>`;}
function progressRow(c){const p=C.progress(state,c);return `<article class="progress-row"><a href="#character/${c.id}" aria-label="Open ${E(c.name)}">${imageHTML(cover(c),'portrait',c.name)}</a><div><h3><a href="#character/${c.id}">${E(c.name)}</a></h3><small>${E(p.system?.name||'Unassigned')} · ${E(rankLabel(p))}</small></div><div class="progress-detail">${p.configured?`${meter(p)}<div class="progress-caption"><span>${fmt(p.xp)} ${E(p.system.xpName)} total</span><span>${p.next?`${E(p.next.name)} at ${fmt(p.next.threshold)}`:'All configured ranks reached'}</span></div>`:'<span class="muted">Leveling system not configured</span>'}</div><div class="remaining">${!p.configured?'—':p.maxed?'Complete':fmt(p.remaining)}<small>${p.next?E(p.system.xpName)+' remaining':p.maxed?'Highest rank':'Needs setup'}</small></div></article>`;}
function results(kind){const target=$('#results');if(!target)return;let rows;if(kind==='characters'||kind==='progress'){rows=characterRows();target.className=kind==='characters'?'grid':'progress-list';target.innerHTML=rows.map(kind==='characters'?characterCard:progressRow).join('');}else{rows=C.rewardRows(state).filter(r=>matches(character(r.characterId),r.title+' '+r.notes)&&(!filter.status||(filter.status==='available'&&r.eligible&&!r.redemption)||(filter.status==='redeemed'&&r.redemption)||(filter.status==='locked'&&!r.eligible&&!r.redemption)));target.className='reward-list';target.innerHTML=rows.map(rewardCard).join('');}$('#results-count').textContent=rows.length+' '+(kind==='characters'||kind==='progress'?'characters':'rewards')+' shown';if(!rows.length)target.innerHTML=blank(kind==='rewards'&&!C.rewardRows(state).length?'No rewards yet':'Nothing matches yet',kind==='rewards'?'Nothing’s been added here yet.':'Try clearing your filters.');}
function bindFilters(kind){for(const [id,key]of[['search','q'],['filter-species','species'],['filter-status','status'],['filter-sort','sort'],['filter-rank','rank']]){const el=$('#'+id);if(el)el.addEventListener(key==='q'?'input':'change',()=>{filter[key]=el.value;results(kind);});}}
function artRewardsHTML(a) {
  return `<div class="art-rewards"><h4>Item rewards</h4>${a.itemRewards.trim()?`<p class="notes">${E(a.itemRewards)}</p><span class="badge ${a.rewardsRedeemed?'good':'purple'}">${a.rewardsRedeemed?'Redeemed':'To redeem'}</span>${a.redemptionLink?`<p><a href="${E(a.redemptionLink)}" target="_blank" rel="noopener noreferrer">${a.rewardsRedeemed?'Redemption link':'Claim link'} ↗</a></p>`:''}`:'<p class="muted">No items recorded.</p>'}</div>`;
}
function bindArtFilters(arts) {
  const search=$('#art-search'),xp=$('#art-xp'),roll=$('#art-roll'),reward=$('#art-reward');
  const update=()=>{
    const q=search.value.trim().toLocaleLowerCase();
    const rows=arts.filter(a=>(!q||[a.title,a.credit,a.notes,a.itemRewards].join(' ').toLocaleLowerCase().includes(q))&&(!xp.value||a.status===xp.value)&&(!roll.value||a.rolled===(roll.value==='yes'))&&(!reward.value||(reward.value==='ready'&&a.itemRewards.trim()&&!a.rewardsRedeemed)||(reward.value==='redeemed'&&a.itemRewards.trim()&&a.rewardsRedeemed)||(reward.value==='none'&&!a.itemRewards.trim())));
    $('#art-count').textContent=rows.length+' of '+arts.length+' art pieces';
    $('#character-art').innerHTML=rows.map(artCard).join('')||blank(arts.length?'No matching art':'No artwork yet',arts.length?'Try clearing your filters.':'Nothing’s been posted here.');
  };
  search.addEventListener('input',update);
  for(const el of [xp,roll,reward])el.addEventListener('change',update);
  $('#art-clear').addEventListener('click',()=>{for(const el of [search,xp,roll,reward])el.value='';update();});
  update();
}
function artCard(a) {
  const c=character(a.characterId),s=species(c.systemId);
  return `<article id="art-${a.id}" class="card art-card"><button class="art-image" data-action="view-art" data-id="${a.id}" aria-label="View ${E(a.title)}">${imageHTML(a)}</button><div class="card-body"><h3>${E(a.title)}</h3><a href="#character/${c.id}">${E(c.name)}</a><div class="art-meta"><span>${fmt(a.xp)} ${E(s?.xpName||'XP')}</span><span class="badge ${a.status}">${a.status==='approved'?'Counted':a.status==='pending'?'Pending':'Not counted'}</span><span class="badge ${a.rolled?'good':'pending'}">${a.rolled?'Rolled':'Not rolled'}</span></div><small>${E(a.credit||'No credit listed')}${a.date?' · '+E(a.date):''}</small>${a.source?`<p><a href="${E(a.source)}" target="_blank" rel="noopener noreferrer">Source / submission ↗</a></p>`:''}${a.notes?`<p class="notes inline-help">${E(a.notes)}</p>`:''}${c.coverId===a.id?'<p><span class="badge purple">Main reference</span></p>':''}${artRewardsHTML(a)}</div></article>`;
}
function rewardCard(r) {
  const c=character(r.characterId),art=state.art.find(a=>a.id===r.artId);
  return `<article class="reward ${r.redemption?'redeemed':!r.eligible?'locked':''}"><div><span class="badge ${r.redemption?'good':r.eligible?'purple':''}">${r.redemption?'Redeemed':r.eligible?'Ready to redeem':'Locked'} · ${r.kind}</span><h3>${E(r.title)}</h3><p><a href="#character/${c.id}">${E(c.name)}</a>${art?' · <a href="#character/'+c.id+'/art/'+art.id+'">'+E(art.title)+'</a>':''}</p>${r.notes?`<p class="notes inline-help">${E(r.notes)}</p>`:''}${r.redemption?`<small>Redeemed ${r.redemption.date?E(new Date(r.redemption.date).toLocaleDateString()):''}${r.redemption.note?' · '+E(r.redemption.note):''}${!r.eligible?' · current XP is below this threshold':''}</small>${r.redemption.link?`<p><a href="${E(r.redemption.link)}" target="_blank" rel="noopener noreferrer">Redemption link ↗</a></p>`:''}`:''}</div></article>`;
}
function withRecipeItems(values) {
  const next={...values};
  for(const recipe of state.crafting)for(const requirement of recipe.requirements)if(!(requirement.item in next))next[requirement.item]=0;
  return next;
}
function loadInventory(seed) {
  let next={...seed};
  try {
    const raw=localStorage.getItem(INVENTORY_KEY);
    if(raw){const saved=C.validateInventoryExport({format:'character-ledger-inventory',version:1,inventory:JSON.parse(raw)});next={...next,...saved};}
    inventorySavedAt=localStorage.getItem(INVENTORY_SAVED_KEY)||'';
  } catch(error) {console.warn('Could not load saved crafting inventory.',error);}
  return withRecipeItems(next);
}
function saveInventory() {
  try {
    const savedAt=new Date().toISOString();localStorage.setItem(INVENTORY_KEY,JSON.stringify(inventory));inventorySavedAt=savedAt;
    try {localStorage.setItem(INVENTORY_SAVED_KEY,savedAt);}catch(timestampError){console.warn('Inventory saved without a timestamp.',timestampError);}
    return true;
  }
  catch(error){console.warn('Could not save crafting inventory.',error);toast('This browser could not save the inventory.');return false;}
}
function savedLabel() {
  if(!inventorySavedAt)return 'Using published defaults';
  const date=new Date(inventorySavedAt);
  return Number.isFinite(date.getTime())?'Saved '+date.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Saved in this browser';
}
function restoreInventoryFocus(item,delta) {
  const target=[...document.querySelectorAll('[data-action="inventory-adjust"]')].find(button=>button.dataset.item===item&&button.dataset.delta===delta);
  target?.focus();
}
function setInventory(item,value,focusDelta='') {
  if(!(item in inventory))return;
  const numeric=Number(value),amount=Math.round(numeric*100)/100;
  if(value===''||!Number.isFinite(amount)||amount<0||amount>1000000000||Math.abs(numeric*100-Math.round(numeric*100))>.0001){toast('Use an amount from 0 to 1,000,000,000 with up to two decimal places.');renderCrafting();return;}
  if(amount>1000000&&amount!==inventory[item]&&!window.confirm('That is an unusually large inventory amount. Save it anyway?')){renderCrafting();return;}
  const previous=inventory[item];inventory[item]=amount;
  if(saveInventory())toast(item+' updated.');else inventory[item]=previous;
  renderCrafting();
  if(focusDelta)restoreInventoryFocus(item,focusDelta);
}
function inventoryEditor(item,recipes) {
  const amount=C.inventoryAmount(inventory,item);
  const neededBy=recipes.filter(recipe=>recipe.requirements.some(requirement=>requirement.item===item));
  const totalRequired=neededBy.reduce((sum,recipe)=>sum+recipe.requirements.find(requirement=>requirement.item===item).required,0);
  const missing=Math.max(0,totalRequired-amount);
  if(craftingOnlyMissing&&missing<=0)return '';
  return `<div class="inventory-row"><div><strong>${E(item)}</strong><small>${neededBy.length?'Needed by: '+E(neededBy.map(recipe=>recipe.name).join(', ')):'Not used by a current recipe'}${totalRequired?` · ${fmt(missing)} missing`:''}</small></div><div class="quantity-control">
    <button class="small" data-action="inventory-adjust" data-item="${E(item)}" data-delta="-1" aria-label="Remove one ${E(item)}">−</button>
    <label><span class="sr-only">${E(item)} owned</span><input type="number" min="0" max="1000000000" step="0.01" value="${amount}" data-inventory-item="${E(item)}"></label>
    <button class="small" data-action="inventory-adjust" data-item="${E(item)}" data-delta="1" aria-label="Add one ${E(item)}">+</button>
  </div></div>`;
}
function craftingMeter(recipe,p) {
  return `<div class="meter crafting-meter" role="progressbar" aria-label="${E(recipe.name)} crafting progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p.percentage)}"><span style="width:${p.percentage}%"></span></div>`;
}
function craftingCard(recipe) {
  const p=C.craftingProgress(recipe,inventory);
  return `<article class="panel crafting-card">
    <div class="crafting-card-head"><div><span class="badge ${p.complete?'good':'purple'}">${p.complete?'Ready to craft':'Gathering items'}</span><h2>${E(recipe.name)}</h2></div><strong>${fmt(p.percentage)}%</strong></div>
    ${craftingMeter(recipe,p)}
    <div class="crafting-summary"><span>${fmt(p.have)} of ${fmt(p.required)} total items ready</span><span>${recipe.requirements.filter(item=>C.inventoryAmount(inventory,item.item)>=item.required).length} of ${recipe.requirements.length} requirements complete</span></div>
    <div class="crafting-items" role="list" aria-label="Requirements for ${E(recipe.name)}">
      ${recipe.requirements.map(item=>{const have=C.inventoryAmount(inventory,item.item),done=have>=item.required;return `<div class="crafting-item ${done?'complete':''}" role="listitem"><span class="crafting-check" aria-hidden="true">${done?'✓':'○'}</span><span>${E(item.item)}</span><strong>${fmt(have)} / ${fmt(item.required)}</strong></div>`;}).join('')}
    </div>
  </article>`;
}
function renderCrafting() {
  const recipes=[...state.crafting].sort((a,b)=>C.craftingProgress(a,inventory).complete-C.craftingProgress(b,inventory).complete||a.name.localeCompare(b.name));
  const ready=recipes.filter(recipe=>C.craftingProgress(recipe,inventory).complete).length;
  const items=[...new Set([...Object.keys(inventory),...recipes.flatMap(recipe=>recipe.requirements.map(item=>item.item))])].sort((a,b)=>a.localeCompare(b));
  const missing=C.shoppingList(recipes,inventory);
  const warnings=state.craftingWarnings.map(warning=>`<li>${E(warning)}</li>`).join('');
  const inventoryRows=items.map(item=>inventoryEditor(item,recipes)).join('');
  main.innerHTML=head('Crafting plans','Shared inventory, live recipe progress, and one combined gathering list.','<button class="small" data-action="import-inventory">Import inventory</button><button class="small" data-action="export-inventory">Export inventory</button><button class="small text" data-action="reset-inventory">Reset local changes</button>','THE WORKBENCH')+
    (warnings?`<div class="notice error" role="alert"><strong>Crafting data needs attention</strong><ul>${warnings}</ul></div>`:'')+
    `<div class="crafting-overview"><div><strong>${recipes.length}</strong><span>${recipes.length===1?'recipe':'recipes'} planned</span></div><div><strong>${ready}</strong><span>ready to craft</span></div><div><strong>${fmt(missing.reduce((sum,row)=>sum+row.missing,0))}</strong><span>items still needed</span></div></div>
    <div class="workbench-layout">
      <section class="panel inventory-panel" aria-labelledby="inventory-heading"><div class="section-head"><div><h2 id="inventory-heading">My inventory</h2><small id="inventory-save-status" aria-live="polite">${E(savedLabel())}</small></div><label class="missing-toggle"><input type="checkbox" data-crafting-missing${craftingOnlyMissing?' checked':''}> Only show missing</label></div><div class="inventory-list">${inventoryRows||(craftingOnlyMissing?'<p class="muted">Nothing is missing from the current recipes.</p>':'<p class="muted">Add inventory items in data.js.</p>')}</div></section>
      <section class="panel shopping-panel" aria-labelledby="shopping-heading"><div class="section-head"><div><h2 id="shopping-heading">Still to gather</h2><small>Combined across every planned recipe.</small></div></div>${missing.length?`<div class="shopping-list">${missing.map(row=>`<div><span>${E(row.item)}</span><strong>${fmt(row.missing)} more</strong><small>${fmt(row.have)} owned · ${fmt(row.required)} total needed</small></div>`).join('')}</div>`:recipes.length?'<div class="all-ready"><span aria-hidden="true">✦</span><strong>Everything is ready.</strong><small>The workbench approves.</small></div>':'<p class="muted">Add a valid recipe to start a gathering list.</p>'}</section>
    </div>
    <div class="section-head crafting-heading"><div><h2>Recipes</h2><small>Each card reads from the shared inventory above.</small></div></div>
    <div class="crafting-grid">${recipes.map(craftingCard).join('')||blank('No crafting plans yet','Add your first recipe to the crafting list in data.js.')}</div>`;
}
function renderCharacter(id) {
  const c=character(id);
  if(!c){main.innerHTML=blank('Character not found','Back to the collection.','<a class="button" href="#characters">Characters</a>');return;}
  const p=C.progress(state,c),arts=state.art.filter(a=>a.characterId===id),rewards=C.rewardRows(state).filter(r=>r.characterId===id);
  main.innerHTML='<a href="#characters">← All characters</a>'+head(c.name,p.system?.name||'Species not configured','','CHARACTER RECORD')+`
    <div class="split">
      <div class="card"><div class="profile-image">${cover(c)?`<button class="art-image" style="height:auto;min-height:200px" data-action="view-art" data-id="${cover(c).id}">${imageHTML(cover(c),'',c.name)}</button>`:'<div class="no-image">◇</div>'}</div>
        <div class="profile-stats">${progressHTML(c)}<div class="rank-timeline">${(p.system?.ranks||[]).map(r=>`<span class="badge ${p.xp>=r.threshold?'achieved':''}">${E(r.name)} · ${fmt(r.threshold)} ${E(p.system.xpName)}</span>`).join('')}</div></div>
      </div>
      <div class="panel"><div class="section-head"><h2>Field notes</h2></div><div class="tags">${c.tags.map(t=>`<span class="badge purple">${E(t)}</span>`).join('')}</div><p class="notes">${E(c.notes||'No notes yet.')}</p><hr><h3>Experience ledger</h3>
        <div class="log-row"><span>Starting balance</span><strong>${fmt(c.openingXP)} ${E(p.system?.xpName||'XP')}</strong></div>
        <div class="log-row"><span>Counted artwork</span><strong>+${fmt(arts.filter(a=>a.status==='approved').reduce((s,a)=>s+a.xp,0))} ${E(p.system?.xpName||'XP')}</strong></div>
        ${state.adjustments.filter(a=>a.characterId===id).map(a=>`<div class="log-row"><div>${E(a.reason)}<br><small>${E(a.date.slice(0,10))}</small></div><strong>${a.amount>0?'+':''}${fmt(a.amount)}</strong></div>`).join('')}
        <p class="inline-help">Pending: ${fmt(arts.filter(a=>a.status==='pending').reduce((s,a)=>s+a.xp,0))} ${E(p.system?.xpName||'XP')} not counted yet. Claiming a reward doesn’t spend XP.</p>
      </div>
    </div>
    <section aria-labelledby="art-heading"><div class="section-head"><h2 id="art-heading">Art <small>(${arts.length})</small></h2></div>
    <div class="toolbar art-filters">
      <label class="search">Search art<input id="art-search" type="search" placeholder="Title, artist, item rewards…"></label>
      <label>XP status<select id="art-xp"><option value="">All XP statuses</option><option value="approved">Counted</option><option value="pending">Pending</option><option value="rejected">Not counted</option></select></label>
      <label>Roll status<select id="art-roll"><option value="">All roll statuses</option><option value="yes">Rolled</option><option value="no">Not rolled</option></select></label>
      <label>Item rewards<select id="art-reward"><option value="">All rewards</option><option value="ready">To redeem</option><option value="redeemed">Redeemed</option><option value="none">No items recorded</option></select></label>
      <button class="text" id="art-clear">Clear</button>
    </div><p id="art-count" class="results-note" aria-live="polite"></p><div id="character-art" class="art-grid"></div></section>
    <div class="section-head"><h2>Rewards</h2></div><div class="reward-list">${rewards.map(rewardCard).join('')||blank('No rewards yet','Nothing recorded for this character.')}</div>`;
  bindArtFilters(arts);
}
function renderSpecies() {
  main.innerHTML=head('Species & ranks','Each species has its own point system and milestones.','','THE RULEBOOK')+
  '<div class="notice">Thresholds are cumulative — “Below Guardian” is just a placeholder label, not an official Aedraco rank.</div>'+
  (state.systems.map(s=>`<article class="panel species-card"><div class="section-head"><div><h2>${E(s.name)}</h2><small>${E(s.xpName)} · ${E(s.levelName)} · ${state.characters.filter(c=>c.systemId===s.id).length} characters</small></div></div><table class="rank-table"><thead><tr><th>${E(s.levelName)}</th><th>Total ${E(s.xpName)}</th><th>Unlock reward</th></tr></thead><tbody><tr><td>${E(s.baseName||'Unranked')}</td><td>Starting label</td><td>—</td></tr>${s.ranks.map(r=>`<tr><td>${E(r.name)}</td><td>${fmt(r.threshold)}</td><td>${E(r.reward||'Not set')}</td></tr>`).join('')}</tbody></table></article>`).join('')||blank('No species set up','No leveling rules yet.'));
}
function render() {
  if(!state)return;
  const path=(location.hash.slice(1)||'characters').split('/'),route=path[0];
  if(!['characters','progress','rewards','crafting','species','character'].includes(route)){location.hash='characters';return;}
  document.querySelectorAll('[data-nav]').forEach(a=>{const on=a.dataset.nav===(route==='character'?'characters':route);a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('#reward-count').textContent=C.rewardRows(state).filter(r=>r.eligible&&!r.redemption).length||'';
  document.title=(route==='character'?character(path[1])?.name||'Character':{characters:'Characters',progress:'Rank progress',rewards:'Rewards',crafting:'Crafting plans',species:'Species & ranks'}[route])+' · Character Ledger';
  if(['characters','progress','rewards'].includes(route)){
    const config={characters:['Characters','Everyone I’m keeping track of.'],progress:['The next milestone','How close everyone is to their next rank.'],rewards:['Rewards','What’s been earned, and what’s already claimed.']}[route];
    main.innerHTML=(route==='characters'?'<h1 class="sr-only">Characters</h1>':head(...config))+
      (route==='progress'?'<div class="notice">Different species use different point systems, so “closest” sorts by percent to next rank, not raw numbers. Maxed-out and unassigned characters sink to the bottom.</div>':'')+
      toolbar(route)+'<p id="results-count" class="results-note"></p><div id="results"></div>';
    bindFilters(route);results(route);
  } else if(route==='character') {renderCharacter(path[1]);if(path[2]==='art')document.getElementById('art-'+path[3])?.scrollIntoView({block:'start'});} else if(route==='crafting'){renderCrafting();} else renderSpecies();
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  if(button.dataset.action==='clear-filters'){
    filter={q:'',species:'',status:'',sort:location.hash==='#progress'?'progress':'name',rank:''};render();
  } else if(button.dataset.action==='view-art'){
    const a=state.art.find(a=>a.id===button.dataset.id);
    if(!a?.image){toast('No image on this one.');return;}
    $('#lightbox img').src=a.image;$('#lightbox img').alt=a.title;
    $('#lightbox p').textContent=a.title+(a.credit?' · '+a.credit:'');$('#lightbox').showModal();
  } else if(button.dataset.action==='inventory-adjust'){
    setInventory(button.dataset.item,C.inventoryAmount(inventory,button.dataset.item)+Number(button.dataset.delta),button.dataset.delta);
  } else if(button.dataset.action==='reset-inventory'){
    if(window.confirm('Reset this browser’s inventory to the amounts in data.js?')){
      try {localStorage.removeItem(INVENTORY_KEY);localStorage.removeItem(INVENTORY_SAVED_KEY);}catch(error){console.warn('Could not clear saved crafting inventory.',error);}
      inventory=withRecipeItems(state.inventory);inventorySavedAt='';renderCrafting();toast('Inventory reset to published defaults.');
    }
  } else if(button.dataset.action==='import-inventory'){
    $('#inventory-import-error').textContent='';$('#inventory-import-file').value='';$('#inventory-import-dialog').showModal();
  } else if(button.dataset.action==='close-inventory-import'){
    $('#inventory-import-dialog').close();
  } else if(button.dataset.action==='export-inventory'){
    const payload={format:'character-ledger-inventory',version:1,exportedAt:new Date().toISOString(),inventory};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='character-ledger-inventory.json';link.click();URL.revokeObjectURL(url);toast('Inventory exported.');
  }
});
document.addEventListener('change',event=>{
  const input=event.target.closest('[data-inventory-item]');
  const missingToggle=event.target.closest('[data-crafting-missing]');
  if(input)setInventory(input.dataset.inventoryItem,input.value);
  else if(missingToggle){craftingOnlyMissing=missingToggle.checked;renderCrafting();}
});
$('#inventory-import-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const error=$('#inventory-import-error'),file=$('#inventory-import-file').files?.[0];error.textContent='';
  try {
    if(!file)throw new Error('Choose an inventory JSON file first.');
    if(file.size>1000000)throw new Error('That file is too large. Inventory exports must be under 1 MB.');
    let payload;
    try {payload=JSON.parse(await file.text());}catch(parseError){throw new Error('That file is not valid JSON.');}
    const imported=C.validateInventoryExport(payload);
    const mode=document.querySelector('input[name="inventory-import-mode"]:checked')?.value||'merge';
    const previous=inventory;
    inventory=withRecipeItems(mode==='replace'?imported:{...inventory,...imported});
    if(!saveInventory()){inventory=previous;throw new Error('The inventory was valid, but this browser could not save it.');}
    $('#inventory-import-dialog').close();renderCrafting();toast(Object.keys(imported).length+' inventory items imported.');
  } catch(importError) {error.textContent=importError.message;}
});
$('#lightbox .lightbox-close').onclick=()=>$('#lightbox').close();
window.addEventListener('hashchange',()=>{filter={q:'',species:'',status:'',sort:location.hash==='#progress'?'progress':'name',rank:''};window.scrollTo(0,0);render();});
window.addEventListener('storage',event=>{
  if(!state||event.key!==INVENTORY_KEY)return;
  try {
    const synced=event.newValue===null?state.inventory:C.validateInventoryExport({format:'character-ledger-inventory',version:1,inventory:JSON.parse(event.newValue)});
    inventory=withRecipeItems(synced);inventorySavedAt=event.newValue===null?'':localStorage.getItem(INVENTORY_SAVED_KEY)||new Date().toISOString();
    if((location.hash.slice(1)||'characters').split('/')[0]==='crafting')renderCrafting();
    toast('Inventory synced from another tab.');
  } catch(error) {console.warn('Ignored invalid inventory from another tab.',error);}
});
function freeze(value){Object.values(value).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(value);}
try {
  // Always reads data.js directly — never the old v0.01 browser-saved records.
  state=freeze(C.validate(window.CHARACTER_LEDGER_SEED));
  inventory=loadInventory(state.inventory);
  render();
} catch(error) {
  main.innerHTML=blank('Could not load the ledger','Something’s wrong with the data: '+error.message);
  console.error(error);
}

})();
