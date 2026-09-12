/* Character Ledger v0.09 — character goals, point history, and scoring tools. */
(function(){
'use strict';
const C=window.LedgerCore, $=s=>document.querySelector(s), E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(n);
const selected=(a,b)=>a===b?' selected':'';
const WORKSHOP_KEY='character-ledger-workshop-v2';
const INVENTORY_KEY='character-ledger-inventory-v1';
const INVENTORY_SAVED_KEY='character-ledger-inventory-saved-at-v1';
let state,inventory={},inventorySavedAt='',craftingPlan={order:[],desired:{},currentGoalId:''},craftHistory=[],craftingOnlyMissing=false,craftingStatusFilter='',historyCounter=0,toastTimer,filter={q:'',species:'',status:'',sort:location.hash==='#progress'?'progress':'name',rank:''},scoreDraft={characterId:'',presetId:'',title:'',image:'',status:'pending',date:new Date().toISOString().slice(0,10),credit:'sky-limits',source:'',multiplier:1,custom:0,quantities:{}};
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
function goalMeter(goal){return `<div class="meter goal-meter" role="progressbar" aria-label="Progress to ${E(goal.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(goal.percentage)}"><span style="width:${goal.percentage}%"></span></div>`;}
function signed(value){return (value>0?'+':'')+fmt(value);}
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
function loadWorkshop(seed) {
  let next={inventory:{...seed},plan:C.normalizeCraftingPlan(state.crafting,{}),history:[]};
  try {
    const workshopRaw=localStorage.getItem(WORKSHOP_KEY);
    if(workshopRaw){
      const parsed=JSON.parse(workshopRaw),saved=C.validateWorkshopExport(parsed,state.crafting);
      next={inventory:saved.inventory,plan:saved.plan,history:saved.history};inventorySavedAt=typeof parsed.savedAt==='string'?parsed.savedAt:'';
    } else {
      const legacyRaw=localStorage.getItem(INVENTORY_KEY);
      if(legacyRaw)next.inventory={...next.inventory,...C.validateInventoryExport({format:'character-ledger-inventory',version:1,inventory:JSON.parse(legacyRaw)})};
      inventorySavedAt=localStorage.getItem(INVENTORY_SAVED_KEY)||'';
    }
  } catch(error) {console.warn('Could not load saved workshop data.',error);}
  inventory=withRecipeItems(next.inventory);craftingPlan=C.normalizeCraftingPlan(state.crafting,next.plan);craftHistory=next.history;
}
function saveWorkshop() {
  try {
    const savedAt=new Date().toISOString();localStorage.setItem(WORKSHOP_KEY,JSON.stringify({format:'character-ledger-workshop',version:2,savedAt,inventory,plan:craftingPlan,history:craftHistory}));inventorySavedAt=savedAt;
    return true;
  }
  catch(error){console.warn('Could not save workshop data.',error);toast('This browser could not save the workshop.');return false;}
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
  if(saveWorkshop())toast(item+' updated.');else inventory[item]=previous;
  renderCrafting();
  if(focusDelta)restoreInventoryFocus(item,focusDelta);
}
function inventoryEditor(item,planRows) {
  const amount=C.inventoryAmount(inventory,item);
  const neededBy=planRows.filter(row=>row.requirements.some(requirement=>requirement.item===item));
  const totalRequired=neededBy.reduce((sum,row)=>sum+row.requirements.find(requirement=>requirement.item===item).required,0);
  const missing=Math.max(0,totalRequired-amount);
  if(craftingOnlyMissing&&missing<=0)return '';
  return `<div class="inventory-row"><div><strong>${E(item)}</strong><small>${neededBy.length?'Needed by: '+E(neededBy.map(row=>row.recipe.name+(row.quantity>1?' ×'+row.quantity:'')).join(', ')):'Not used by a current recipe'}${totalRequired?` · ${fmt(missing)} missing`:''}</small></div><div class="quantity-control">
    <button class="small" data-action="inventory-adjust" data-item="${E(item)}" data-delta="-1" aria-label="Remove one ${E(item)}">−</button>
    <label><span class="sr-only">${E(item)} owned</span><input type="number" min="0" max="1000000000" step="0.01" value="${amount}" data-inventory-item="${E(item)}"></label>
    <button class="small" data-action="inventory-adjust" data-item="${E(item)}" data-delta="1" aria-label="Add one ${E(item)}">+</button>
  </div></div>`;
}
function craftingMeter(recipe,p) {
  return `<div class="meter crafting-meter" role="progressbar" aria-label="${E(recipe.name)} crafting progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p.percentage)}"><span style="width:${p.percentage}%"></span></div>`;
}
function craftingCard(row,totalRows) {
  const required=row.requirements.reduce((sum,item)=>sum+item.required,0),allocated=row.requirements.reduce((sum,item)=>sum+item.allocated,0),percentage=required?Math.round(allocated/required*10000)/100:0;
  const p={percentage},goal=craftingPlan.currentGoalId===row.recipe.id;
  const status={ready:['good','Ready to forge'],blocked:['pending','Reserved above'],gathering:['purple','Gathering items']}[row.status];
  return `<article class="panel crafting-card ${goal?'current-goal':''}">
    <div class="crafting-card-head"><div><div class="tags"><span class="badge ${status[0]}">${status[1]}</span>${goal?'<span class="badge good">★ Current goal</span>':''}${row.recipe.category?`<span class="badge">${E(row.recipe.category)}</span>`:''}</div><h2>${E(row.recipe.name)}</h2></div><strong>${fmt(percentage)}%</strong></div>
    ${row.recipe.notes?`<p class="notes inline-help">${E(row.recipe.notes)}</p>`:''}${row.recipe.reference?`<p><a href="${E(row.recipe.reference)}" target="_blank" rel="noopener noreferrer">Recipe reference ↗</a></p>`:''}
    ${craftingMeter(row.recipe,p)}
    <div class="crafting-summary"><span>${fmt(allocated)} of ${fmt(required)} items reserved</span><span>${row.craftableCopies} ${row.craftableCopies===1?'copy':'copies'} craftable from raw inventory</span></div>
    <div class="crafting-items" role="list" aria-label="Requirements for ${E(row.recipe.name)}">
      ${row.requirements.map(item=>{const done=item.allocated>=item.required;return `<div class="crafting-item ${done?'complete':''}" role="listitem"><span class="crafting-check" aria-hidden="true">${done?'✓':'○'}</span><span>${E(item.item)}${row.quantity>1?` <small>(${fmt(item.perCraft)} each)</small>`:''}</span><strong>${fmt(item.allocated)} / ${fmt(item.required)}</strong></div>`;}).join('')}
    </div>
    <div class="recipe-plan-controls"><div><span class="muted">Priority ${row.index+1}</span><div class="priority-actions"><button class="small" data-action="recipe-move" data-id="${row.recipe.id}" data-direction="-1" aria-label="Move ${E(row.recipe.name)} earlier"${row.index===0?' disabled':''}>↑</button><button class="small" data-action="recipe-move" data-id="${row.recipe.id}" data-direction="1" aria-label="Move ${E(row.recipe.name)} later"${row.index===totalRows-1?' disabled':''}>↓</button><button class="small text" data-action="recipe-goal" data-id="${row.recipe.id}">${goal?'Unpin goal':'Make current goal'}</button></div></div><label>Planned quantity<input type="number" min="1" max="1000000" step="1" value="${row.quantity}" data-plan-quantity="${row.recipe.id}"></label></div>
    <button class="primary craft-button" data-action="craft-recipe" data-id="${row.recipe.id}"${row.ready?'':' disabled'}>Craft ${fmt(row.quantity)} ${E(row.recipe.name)}</button>
  </article>`;
}
function historyCard(record) {
  const consumed=Object.entries(record.consumed).map(([item,amount])=>`${fmt(amount)} ${E(item)}`).join(' · ');
  return `<article class="craft-history-row ${record.undone?'undone':''}"><div><span class="badge ${record.undone?'':'good'}">${record.undone?'Undone':'Crafted'}</span><h3>${fmt(record.quantity)} × ${E(record.recipeName)}</h3><small>${E(new Date(record.craftedAt).toLocaleString())}</small><p>${consumed}</p></div>${record.undone?'':`<button class="small" data-action="undo-craft" data-id="${record.id}">Undo</button>`}</article>`;
}
function updateCraftingPlan(next,message='Crafting plan updated.') {
  const previous=craftingPlan;craftingPlan=C.normalizeCraftingPlan(state.crafting,next);
  if(saveWorkshop())toast(message);else craftingPlan=previous;
  renderCrafting();
}
function moveRecipe(id,direction) {
  const order=[...craftingPlan.order],index=order.indexOf(id),target=index+direction;if(index<0||target<0||target>=order.length)return;
  [order[index],order[target]]=[order[target],order[index]];updateCraftingPlan({...craftingPlan,order},'Recipe priority updated.');
}
function setDesiredQuantity(id,value) {
  const amount=Number(value);
  if(!Number.isInteger(amount)||amount<1||amount>1000000){toast('Planned quantity must be a whole number from 1 to 1,000,000.');renderCrafting();return;}
  updateCraftingPlan({...craftingPlan,desired:{...craftingPlan.desired,[id]:amount}},'Planned quantity updated.');
}
function craftRecipe(id) {
  const row=C.planCrafting(state.crafting,inventory,craftingPlan).rows.find(entry=>entry.recipe.id===id);
  if(!row?.ready){toast('That recipe is not ready at its current priority.');renderCrafting();return;}
  const consumed=Object.fromEntries(row.requirements.map(item=>[item.item,item.required]));
  const summary=Object.entries(consumed).map(([item,amount])=>fmt(amount)+' '+item).join(', ');
  if(!window.confirm(`Craft ${row.quantity} × ${row.recipe.name}? This will consume ${summary}.`))return;
  const previousInventory={...inventory},previousHistory=craftHistory;
  for(const [item,amount] of Object.entries(consumed))inventory[item]=Math.round((C.inventoryAmount(inventory,item)-amount)*100)/100;
  historyCounter+=1;craftHistory=[{id:'craft-'+Date.now().toString(36)+'-'+historyCounter.toString(36),recipeId:row.recipe.id,recipeName:row.recipe.name,quantity:row.quantity,craftedAt:new Date().toISOString(),consumed,undone:false},...craftHistory];
  if(saveWorkshop()){renderCrafting();main.classList.add('forge-celebrate');setTimeout(()=>main.classList.remove('forge-celebrate'),900);toast(row.recipe.name+' crafted. ✦');}else{inventory=previousInventory;craftHistory=previousHistory;renderCrafting();}
}
function undoCraft(id) {
  const index=craftHistory.findIndex(record=>record.id===id&&!record.undone);if(index<0)return;
  const previousInventory={...inventory},previousHistory=craftHistory;
  const record=craftHistory[index];
  if(Object.entries(record.consumed).some(([item,amount])=>C.inventoryAmount(inventory,item)+amount>1000000000)){toast('Undo would exceed the maximum inventory amount. Reduce that item first.');return;}
  for(const [item,amount] of Object.entries(record.consumed))inventory[item]=Math.round((C.inventoryAmount(inventory,item)+amount)*100)/100;
  craftHistory=craftHistory.map((entry,entryIndex)=>entryIndex===index?{...entry,undone:true}:entry);
  if(saveWorkshop()){renderCrafting();toast('Craft undone; materials restored.');}else{inventory=previousInventory;craftHistory=previousHistory;renderCrafting();}
}
function renderCrafting() {
  const planned=C.planCrafting(state.crafting,inventory,craftingPlan);craftingPlan=planned.plan;
  const rows=planned.rows,recipes=rows.map(row=>row.recipe),visibleRows=craftingStatusFilter?rows.filter(row=>row.status===craftingStatusFilter):rows;
  const ready=rows.filter(row=>row.ready).length;
  const items=[...new Set([...Object.keys(inventory),...recipes.flatMap(recipe=>recipe.requirements.map(item=>item.item))])].sort((a,b)=>a.localeCompare(b));
  const missing=C.shoppingList(recipes,inventory,craftingPlan.desired);
  const warnings=state.craftingWarnings.map(warning=>`<li>${E(warning)}</li>`).join('');
  const inventoryRows=items.map(item=>inventoryEditor(item,rows)).join('');
  main.innerHTML=head('The Forge','Prioritize plans, reserve shared materials, and record what gets made.','<button class="small" data-action="import-inventory">Import backup</button><button class="small" data-action="export-inventory">Export backup</button><button class="small text" data-action="reset-inventory">Reset local workshop</button>','THE WORKBENCH')+
    (warnings?`<div class="notice error" role="alert"><strong>Crafting data needs attention</strong><ul>${warnings}</ul></div>`:'')+
    `<div class="crafting-overview"><div><strong>${recipes.length}</strong><span>${recipes.length===1?'recipe':'recipes'} planned</span></div><div><strong>${ready}</strong><span>ready at current priority</span></div><div><strong>${fmt(missing.reduce((sum,row)=>sum+row.missing,0))}</strong><span>items still needed</span></div><div><strong>${craftHistory.filter(record=>!record.undone).length}</strong><span>crafts recorded</span></div></div>
    <div class="workbench-layout">
      <section class="panel inventory-panel" aria-labelledby="inventory-heading"><div class="section-head"><div><h2 id="inventory-heading">My inventory</h2><small id="inventory-save-status" aria-live="polite">${E(savedLabel())}</small></div><label class="missing-toggle"><input type="checkbox" data-crafting-missing${craftingOnlyMissing?' checked':''}> Only show missing</label></div><div class="inventory-list">${inventoryRows||(craftingOnlyMissing?'<p class="muted">Nothing is missing from the current recipes.</p>':'<p class="muted">Add inventory items in data.js.</p>')}</div></section>
      <section class="panel shopping-panel" aria-labelledby="shopping-heading"><div class="section-head"><div><h2 id="shopping-heading">Still to gather</h2><small>Combined across planned quantities.</small></div></div>${missing.length?`<div class="shopping-list">${missing.map(row=>`<div><span>${E(row.item)}</span><strong>${fmt(row.missing)} more</strong><small>${fmt(row.have)} owned · ${fmt(row.required)} planned</small></div>`).join('')}</div>`:recipes.length?'<div class="all-ready"><span aria-hidden="true">✦</span><strong>Everything is ready.</strong><small>The forge awaits.</small></div>':'<p class="muted">Add a valid recipe to start a gathering list.</p>'}</section>
    </div>
    <div class="section-head crafting-heading"><div><h2>Priority queue</h2><small>Higher recipes reserve materials before lower recipes.</small></div><label>Show<select data-crafting-status><option value="">All plans</option><option value="ready"${selected(craftingStatusFilter,'ready')}>Ready</option><option value="gathering"${selected(craftingStatusFilter,'gathering')}>Gathering</option><option value="blocked"${selected(craftingStatusFilter,'blocked')}>Blocked by priority</option></select></label></div>
    <div class="crafting-grid">${visibleRows.map(row=>craftingCard(row,rows.length)).join('')||blank(rows.length?'No plans match this filter':'No crafting plans yet',rows.length?'Choose another status.':'Add your first recipe to the crafting list in data.js.')}</div>
    <div class="section-head history-heading"><div><h2>Crafting history</h2><small>Undo restores the exact materials consumed.</small></div></div>
    <div class="craft-history">${craftHistory.map(historyCard).join('')||blank('Nothing forged yet','Completed crafts will appear here with an undo option.')}</div>`;
}
function goalCard(c) {
  const goal=C.characterGoal(state,c),forecast=C.pointForecast(state,c),p=C.progress(state,c),unit=p.system?.xpName||'XP';
  if(!goal.configured)return `<article class="panel journal-character"><div><h3><a href="#character/${c.id}">${E(c.name)}</a></h3><small>${E(p.system?.name||'No point system')}</small></div><p class="muted">Add a point system and rank thresholds to begin tracking a goal.</p></article>`;
  const forecastText=goal.complete?'Goal reached':forecast.artworks===null?'Add approved artwork to unlock a forecast':`About ${forecast.artworks} ${forecast.artworks===1?'artwork':'artworks'} at the usual ${fmt(forecast.typicalXP)} ${E(unit)}`;
  return `<article class="panel journal-character"><div class="journal-character-head"><div><h3><a href="#character/${c.id}">${E(c.name)}</a></h3><small>${E(p.system.name)} · ${E(rankLabel(p))}</small></div><span class="badge ${goal.complete?'good':'purple'}">${goal.complete?'Reached':'Goal'}</span></div><div class="goal-numbers"><strong>${fmt(goal.xp)} / ${fmt(goal.target)} <small>${E(unit)}</small></strong><span>${fmt(goal.percentage)}%</span></div>${goalMeter(goal)}<div class="progress-caption"><span>${goal.complete?E(goal.label):`${fmt(goal.remaining)} ${E(unit)} to ${E(goal.label)}`}</span></div><p class="forecast">${forecastText}</p></article>`;
}
function pointHistoryHTML(c,limit=0) {
  const p=C.progress(state,c),unit=p.system?.xpName||'XP',rows=C.pointTimeline(state,c),visible=limit?rows.slice(0,limit):rows;
  if(!visible.length)return blank('No point history yet','Artwork and manual adjustments will appear here.');
  return `<div class="point-history">${visible.map(row=>`<article class="point-event ${row.counts?'':'not-counted'}"><span class="point-event-mark" aria-hidden="true">${row.kind==='art'?'◇':row.kind==='adjustment'?'±':'●'}</span><div><h3>${row.kind==='art'?`<a href="#character/${c.id}/art/${row.id}">${E(row.title)}</a>`:E(row.title)}</h3><small>${row.date?E(new Date(row.date+'T00:00:00').toLocaleDateString()):'Date not recorded'} · ${row.kind==='art'?'Artwork':row.kind==='adjustment'?'Adjustment':'Opening balance'}</small></div><div class="point-event-value"><strong>${signed(row.amount)} ${E(unit)}</strong><span class="badge ${row.status}">${row.counts?'Counted':row.status==='pending'?'Pending':'Not counted'}</span></div></article>`).join('')}</div>`;
}
function slug(value) {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'new-art';
}
function scorePresetsFor(c) {return state.scoringPresets.filter(preset=>!preset.systemId||preset.systemId===c?.systemId);}
function ensureScoreDraft() {
  if(!character(scoreDraft.characterId))scoreDraft.characterId=state.characters[0]?.id||'';
  const available=scorePresetsFor(character(scoreDraft.characterId));
  if(scoreDraft.presetId!=='manual'&&!available.some(preset=>preset.id===scoreDraft.presetId)){scoreDraft.presetId=available[0]?.id||'manual';scoreDraft.quantities={};}
}
function activeScorePreset() {return scoreDraft.presetId==='manual'?{id:'manual',name:'Manual points only',systemId:'',rules:[]}:state.scoringPresets.find(preset=>preset.id===scoreDraft.presetId);}
function scoreRecord(result) {
  const c=character(scoreDraft.characterId),title=scoreDraft.title.trim()||'Artwork title';
  let id=slug(c.id+'-'+title);if(state.art.some(art=>art.id===id))id=(id+'-new').slice(0,100);
  const parts=result.breakdown.map(row=>`${fmt(row.subtotal)} (${row.name}${row.quantity>1?' ×'+row.quantity:''})`);
  if(result.custom)parts.push(fmt(result.custom)+' (manual points)');
  let notes=parts.join(' + ');if(result.multiplier!==1)notes+=(notes?' ':'')+'×'+fmt(result.multiplier);
  const fields={id,characterId:c.id,title,image:scoreDraft.image.trim(),xp:result.total,status:scoreDraft.status,rolled:false,itemRewards:'',rewardsRedeemed:false,redemptionLink:'',credit:scoreDraft.credit.trim(),source:scoreDraft.source.trim(),date:scoreDraft.date,notes};
  const lines=Object.entries(fields).map(([key,value])=>'    '+key+': '+JSON.stringify(value));
  return '  {\n'+lines.join(',\n')+'\n  },';
}
function updateScorePreview() {
  const preset=activeScorePreset(),error=$('#score-error'),total=$('#score-total'),output=$('#score-output'),unit=$('#score-unit');
  if(!preset||!error||!total||!output)return;
  try {
    const result=C.scoreArtwork(preset,scoreDraft.quantities,scoreDraft.multiplier,scoreDraft.custom),system=species(character(scoreDraft.characterId)?.systemId);
    error.textContent='';total.textContent=fmt(result.total);unit.textContent=system?.xpName||'XP';output.value=scoreRecord(result);
  } catch(scoreError){error.textContent=scoreError.message;total.textContent='—';output.value='';}
}
function renderJournal() {
  ensureScoreDraft();
  const pending=C.pendingReview(state),warnings=C.pointWarnings(state),reached=state.characters.reduce((sum,c)=>sum+C.rankMilestones(state,c).filter(row=>row.reached).length,0),c=character(scoreDraft.characterId),presets=scorePresetsFor(c),preset=activeScorePreset();
  const pendingRows=pending.map(row=>`<article class="review-row"><div><span class="badge pending">Pending</span><h3><a href="#character/${row.character.id}/art/${row.art.id}">${E(row.art.title)}</a></h3><small><a href="#character/${row.character.id}">${E(row.character.name)}</a>${row.art.date?' · '+E(row.art.date):' · No date recorded'}</small></div><strong>+${fmt(row.art.xp)} ${E(row.system?.xpName||'XP')}</strong></article>`).join('');
  const warningRows=warnings.map(warning=>`<li><a href="#character/${warning.characterId}">${E(warning.message)}</a></li>`).join('');
  const rules=preset.rules.map(rule=>`<div class="score-rule"><div><strong>${E(rule.name)}</strong><small>${fmt(rule.points)} points each</small></div><label>Quantity<input type="number" min="0" max="100" step="1" value="${scoreDraft.quantities[rule.id]||0}" data-score-rule="${rule.id}"></label></div>`).join('');
  main.innerHTML=head('The Field Journal','Track every point, plan the next milestone, and prepare new artwork records.','','POINTS & PROGRESS')+`
    <div class="journal-stats"><div><strong>${state.characters.length}</strong><span>character goals</span></div><div><strong>${pending.length}</strong><span>pending review</span></div><div><strong>${reached}</strong><span>ranks reached</span></div><div><strong>${warnings.length}</strong><span>data notes</span></div></div>
    <div class="section-head"><div><h2>Next goals</h2><small>Defaults to the next rank; optional overrides live on each character in data.js.</small></div></div>
    <div class="journal-goals">${state.characters.map(goalCard).join('')||blank('No characters yet','Add a character to start a goal.')}</div>
    <div class="journal-columns">
      <section class="panel"><div class="section-head"><div><h2>Pending review</h2><small>These points are visible but not included in totals.</small></div><span class="badge pending">${pending.length}</span></div><div class="review-list">${pendingRows||'<div class="all-clear"><span aria-hidden="true">✓</span><strong>Review queue clear</strong><small>No artwork is waiting on approval.</small></div>'}</div></section>
      <section class="panel"><div class="section-head"><div><h2>Point health</h2><small>Helpful checks; nothing here changes your totals.</small></div><span class="badge ${warnings.length?'pending':'good'}">${warnings.length}</span></div>${warnings.length?`<ul class="health-list">${warningRows}</ul>`:'<div class="all-clear"><span aria-hidden="true">✓</span><strong>Everything looks tidy</strong><small>No point-tracking warnings found.</small></div>'}</section>
    </div>
    <section class="panel score-panel" aria-labelledby="score-heading"><div class="section-head"><div><h2 id="score-heading">Artwork scoring calculator</h2><small>Calculate a total, then copy a complete record into the art array in data.js.</small></div><div class="score-total"><strong id="score-total">0</strong><span id="score-unit">XP</span></div></div>
      <div class="score-form-grid">
        <label>Character<select data-score-field="characterId">${state.characters.map(item=>`<option value="${item.id}"${selected(scoreDraft.characterId,item.id)}>${E(item.name)}</option>`).join('')}</select></label>
        <label>Scoring preset<select data-score-field="presetId">${presets.map(item=>`<option value="${item.id}"${selected(scoreDraft.presetId,item.id)}>${E(item.name)}</option>`).join('')}<option value="manual"${selected(scoreDraft.presetId,'manual')}>Manual points only</option></select></label>
        <label>Artwork title<input type="text" maxlength="200" value="${E(scoreDraft.title)}" placeholder="Artwork title" data-score-field="title"></label>
        <label>Date<input type="date" value="${E(scoreDraft.date)}" data-score-field="date"></label>
        <label>XP status<select data-score-field="status"><option value="pending"${selected(scoreDraft.status,'pending')}>Pending</option><option value="approved"${selected(scoreDraft.status,'approved')}>Counted</option><option value="rejected"${selected(scoreDraft.status,'rejected')}>Not counted</option></select></label>
        <label>Credit<input type="text" maxlength="1000" value="${E(scoreDraft.credit)}" data-score-field="credit"></label>
        <label class="full">Image path or URL<input type="text" value="${E(scoreDraft.image)}" placeholder="images/your-art.jpg" data-score-field="image"></label>
        <label class="full">Source URL<input type="url" value="${E(scoreDraft.source)}" placeholder="https://…" data-score-field="source"></label>
      </div>
      <div class="score-rules">${rules||'<p class="muted">Use manual points below for this character.</p>'}</div>
      <div class="score-extras"><label>Manual points<input type="number" min="0" max="1000000000" step="0.01" value="${scoreDraft.custom}" data-score-field="custom"></label><label>Multiplier<input type="number" min="1" max="100" step="0.01" value="${scoreDraft.multiplier}" data-score-field="multiplier"></label></div>
      <p id="score-error" class="form-error" role="alert"></p><label>Ready-to-paste artwork record<textarea id="score-output" rows="16" readonly spellcheck="false"></textarea></label><div class="modal-actions"><button class="primary" data-action="copy-score-record">Copy artwork record</button></div>
      <p class="inline-help">This helper does not edit the live site. Review the record, paste it inside <code>art: [ ]</code>, and commit data.js as usual.</p>
    </section>`;
  updateScorePreview();
}
function renderCharacter(id) {
  const c=character(id);
  if(!c){main.innerHTML=blank('Character not found','Back to the collection.','<a class="button" href="#characters">Characters</a>');return;}
  const p=C.progress(state,c),arts=state.art.filter(a=>a.characterId===id),rewards=C.rewardRows(state).filter(r=>r.characterId===id),breakdown=C.pointBreakdown(state,c),goal=C.characterGoal(state,c),forecast=C.pointForecast(state,c),milestones=C.rankMilestones(state,c),unit=p.system?.xpName||'XP';
  main.innerHTML='<a href="#characters">← All characters</a>'+head(c.name,p.system?.name||'Species not configured','','CHARACTER RECORD')+`
    <div class="split">
      <div class="card"><div class="profile-image">${cover(c)?`<button class="art-image" style="height:auto;min-height:200px" data-action="view-art" data-id="${cover(c).id}">${imageHTML(cover(c),'',c.name)}</button>`:'<div class="no-image">◇</div>'}</div>
        <div class="profile-stats">${progressHTML(c)}<div class="rank-timeline">${(p.system?.ranks||[]).map(r=>`<span class="badge ${p.xp>=r.threshold?'achieved':''}">${E(r.name)} · ${fmt(r.threshold)} ${E(p.system.xpName)}</span>`).join('')}</div></div>
      </div>
      <div class="panel"><div class="section-head"><h2>Field notes</h2></div><div class="tags">${c.tags.map(t=>`<span class="badge purple">${E(t)}</span>`).join('')}</div><p class="notes">${E(c.notes||'No notes yet.')}</p><hr><h3>Point breakdown</h3>
        <div class="point-breakdown"><div><span>Starting</span><strong>${fmt(breakdown.opening)}</strong></div><div><span>Counted art</span><strong>+${fmt(breakdown.approved)}</strong></div><div><span>Adjustments</span><strong>${signed(breakdown.adjustments)}</strong></div><div><span>Pending</span><strong>${fmt(breakdown.pending)}</strong></div></div>
        <p class="inline-help">Total: ${fmt(breakdown.total)} ${E(unit)}. Pending and rejected artwork do not count. Claiming a reward doesn’t spend points.</p><hr>
        <div class="goal-callout"><div><span class="eyebrow">CURRENT GOAL</span><h3>${E(goal.label)}</h3></div><strong>${goal.configured?goal.complete?'Reached':fmt(goal.remaining)+' '+E(unit)+' left':'Not configured'}</strong></div>
        ${goal.configured?goalMeter(goal):''}<div class="progress-caption"><span>${goal.configured?`${fmt(goal.xp)} of ${fmt(goal.target)} ${E(unit)}`:'Add rank thresholds to the species.'}</span><span>${goal.configured?fmt(goal.percentage)+'%':''}</span></div>
        ${goal.configured&&!goal.complete?`<p class="forecast">${forecast.artworks===null?'Add approved artwork to estimate the pace.':`At the usual ${fmt(forecast.typicalXP)} ${E(unit)} per artwork, that is about ${forecast.artworks} more ${forecast.artworks===1?'piece':'pieces'}.`}</p>`:''}
      </div>
    </div>
    <section aria-labelledby="milestone-heading"><div class="section-head"><div><h2 id="milestone-heading">Rank milestones</h2><small>Dates appear when the dated point history can prove the crossing.</small></div></div><div class="milestone-list">${milestones.map(row=>`<div class="milestone ${row.reached?'reached':''}"><span aria-hidden="true">${row.reached?'✓':'○'}</span><div><strong>${E(row.rank.name)}</strong><small>${fmt(row.rank.threshold)} ${E(unit)}${row.reached?' · '+E(row.date?new Date(row.date+'T00:00:00').toLocaleDateString():row.source):''}</small></div></div>`).join('')||'<p class="muted">No rank milestones configured.</p>'}</div></section>
    <section aria-labelledby="history-heading"><div class="section-head"><div><h2 id="history-heading">Point history</h2><small>Artwork and adjustments in one chronological ledger.</small></div></div>${pointHistoryHTML(c)}</section>
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
  if(!['characters','progress','journal','rewards','crafting','species','character'].includes(route)){location.hash='characters';return;}
  document.querySelectorAll('[data-nav]').forEach(a=>{const on=a.dataset.nav===(route==='character'?'characters':route);a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $('#reward-count').textContent=C.rewardRows(state).filter(r=>r.eligible&&!r.redemption).length||'';
  document.title=(route==='character'?character(path[1])?.name||'Character':{characters:'Characters',progress:'Rank progress',journal:'Field journal',rewards:'Rewards',crafting:'Crafting plans',species:'Species & ranks'}[route])+' · Character Ledger';
  if(['characters','progress','rewards'].includes(route)){
    const config={characters:['Characters','Everyone I’m keeping track of.'],progress:['The next milestone','How close everyone is to their next rank.'],rewards:['Rewards','What’s been earned, and what’s already claimed.']}[route];
    main.innerHTML=(route==='characters'?'<h1 class="sr-only">Characters</h1>':head(...config))+
      (route==='progress'?'<div class="notice">Different species use different point systems, so “closest” sorts by percent to next rank, not raw numbers. Maxed-out and unassigned characters sink to the bottom.</div>':'')+
      toolbar(route)+'<p id="results-count" class="results-note"></p><div id="results"></div>';
    bindFilters(route);results(route);
  } else if(route==='character') {renderCharacter(path[1]);if(path[2]==='art')document.getElementById('art-'+path[3])?.scrollIntoView({block:'start'});} else if(route==='journal'){renderJournal();} else if(route==='crafting'){renderCrafting();} else renderSpecies();
}
function syncScoreDraft(event) {
  const rule=event.target.closest('[data-score-rule]'),field=event.target.closest('[data-score-field]');
  if(!rule&&!field)return false;
  if(rule)scoreDraft.quantities[rule.dataset.scoreRule]=rule.value;
  else {
    const key=field.dataset.scoreField;scoreDraft[key]=field.value;
    if(key==='characterId'||key==='presetId'){
      if(key==='characterId')scoreDraft.presetId='';scoreDraft.quantities={};renderJournal();return true;
    }
  }
  updateScorePreview();return true;
}
async function copyScoreRecord() {
  const output=$('#score-output');if(!output?.value){toast('Add valid scoring details first.');return;}
  try {
    if(window.navigator?.clipboard?.writeText)await window.navigator.clipboard.writeText(output.value);
    else {output.select();if(!document.execCommand?.('copy'))throw new Error('Copy is unavailable.');}
    toast('Artwork record copied. Paste it into data.js.');
  } catch(error){output.select?.();toast('Could not copy automatically. The record is selected for you.');}
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
    if(window.confirm('Reset this browser’s inventory, recipe plan, and crafting history?')){
      try {localStorage.removeItem(WORKSHOP_KEY);localStorage.removeItem(INVENTORY_KEY);localStorage.removeItem(INVENTORY_SAVED_KEY);}catch(error){console.warn('Could not clear saved workshop data.',error);}
      inventory=withRecipeItems(state.inventory);craftingPlan=C.normalizeCraftingPlan(state.crafting,{});craftHistory=[];inventorySavedAt='';renderCrafting();toast('Workshop reset to published defaults.');
    }
  } else if(button.dataset.action==='import-inventory'){
    $('#inventory-import-error').textContent='';$('#inventory-import-file').value='';$('#inventory-import-dialog').showModal();
  } else if(button.dataset.action==='close-inventory-import'){
    $('#inventory-import-dialog').close();
  } else if(button.dataset.action==='export-inventory'){
    const payload={format:'character-ledger-workshop',version:2,exportedAt:new Date().toISOString(),inventory,plan:craftingPlan,history:craftHistory};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='character-ledger-workshop.json';link.click();URL.revokeObjectURL(url);toast('Workshop backup exported.');
  } else if(button.dataset.action==='recipe-move'){
    moveRecipe(button.dataset.id,Number(button.dataset.direction));
  } else if(button.dataset.action==='recipe-goal'){
    const id=button.dataset.id,on=craftingPlan.currentGoalId!==id;
    updateCraftingPlan({...craftingPlan,currentGoalId:on?id:'',order:on?[id,...craftingPlan.order.filter(recipeId=>recipeId!==id)]:craftingPlan.order},on?'Current goal pinned.':'Current goal unpinned.');
  } else if(button.dataset.action==='craft-recipe'){
    craftRecipe(button.dataset.id);
  } else if(button.dataset.action==='undo-craft'){
    undoCraft(button.dataset.id);
  } else if(button.dataset.action==='copy-score-record'){
    copyScoreRecord();
  }
});
document.addEventListener('input',syncScoreDraft);
document.addEventListener('change',event=>{
  if(syncScoreDraft(event))return;
  const input=event.target.closest('[data-inventory-item]');
  const missingToggle=event.target.closest('[data-crafting-missing]');
  const planQuantity=event.target.closest('[data-plan-quantity]');
  const statusFilter=event.target.closest('[data-crafting-status]');
  if(input)setInventory(input.dataset.inventoryItem,input.value);
  else if(missingToggle){craftingOnlyMissing=missingToggle.checked;renderCrafting();}
  else if(planQuantity)setDesiredQuantity(planQuantity.dataset.planQuantity,planQuantity.value);
  else if(statusFilter){craftingStatusFilter=statusFilter.value;renderCrafting();}
});
$('#inventory-import-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const error=$('#inventory-import-error'),file=$('#inventory-import-file').files?.[0];error.textContent='';
  try {
    if(!file)throw new Error('Choose an inventory JSON file first.');
    if(file.size>5000000)throw new Error('That file is too large. Workshop backups must be under 5 MB.');
    let payload;
    try {payload=JSON.parse(await file.text());}catch(parseError){throw new Error('That file is not valid JSON.');}
    const imported=C.validateWorkshopExport(payload,state.crafting);
    const mode=document.querySelector('input[name="inventory-import-mode"]:checked')?.value||'merge';
    const previous={inventory,craftingPlan,craftHistory};
    if(mode==='replace'){
      inventory=withRecipeItems(imported.inventory);craftingPlan=imported.plan;craftHistory=imported.history;
    } else {
      inventory=withRecipeItems({...inventory,...imported.inventory});
      if(!imported.legacy){
        craftingPlan=C.normalizeCraftingPlan(state.crafting,{order:[...imported.plan.order,...craftingPlan.order],desired:{...craftingPlan.desired,...imported.plan.desired},currentGoalId:imported.plan.currentGoalId||craftingPlan.currentGoalId});
        const importedIds=new Set(imported.history.map(record=>record.id));craftHistory=[...imported.history,...craftHistory.filter(record=>!importedIds.has(record.id))].sort((a,b)=>Date.parse(b.craftedAt)-Date.parse(a.craftedAt));
      }
    }
    if(!saveWorkshop()){inventory=previous.inventory;craftingPlan=previous.craftingPlan;craftHistory=previous.craftHistory;throw new Error('The backup was valid, but this browser could not save it.');}
    $('#inventory-import-dialog').close();renderCrafting();toast((imported.legacy?'Legacy inventory':'Workshop backup')+' imported.');
  } catch(importError) {error.textContent=importError.message;}
});
$('#lightbox .lightbox-close').onclick=()=>$('#lightbox').close();
window.addEventListener('hashchange',()=>{filter={q:'',species:'',status:'',sort:location.hash==='#progress'?'progress':'name',rank:''};window.scrollTo(0,0);render();});
window.addEventListener('storage',event=>{
  if(!state||event.key!==WORKSHOP_KEY)return;
  try {
    const parsed=event.newValue===null?null:JSON.parse(event.newValue),synced=parsed?C.validateWorkshopExport(parsed,state.crafting):{inventory:state.inventory,plan:C.normalizeCraftingPlan(state.crafting,{}),history:[]};
    inventory=withRecipeItems(synced.inventory);craftingPlan=synced.plan;craftHistory=synced.history;inventorySavedAt=parsed&&typeof parsed.savedAt==='string'?parsed.savedAt:'';
    if((location.hash.slice(1)||'characters').split('/')[0]==='crafting')renderCrafting();
    toast('Workshop synced from another tab.');
  } catch(error) {console.warn('Ignored invalid workshop data from another tab.',error);}
});
function freeze(value){Object.values(value).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(value);}
try {
  // Always reads data.js directly — never the old v0.01 browser-saved records.
  state=freeze(C.validate(window.CHARACTER_LEDGER_SEED));
  loadWorkshop(state.inventory);
  render();
} catch(error) {
  main.innerHTML=blank('Could not load the ledger','Something’s wrong with the data: '+error.message);
  console.error(error);
}

})();
