(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {
    root.LedgerEnhancements=api;
    if(root.document)api.boot(root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const PALETTE=['#94d7ed','#dcb7f2','#f0bf8f','#9ed9b9','#f0a9b7','#b9c7f4'];
  const clamp=value=>Math.max(0,Math.min(100,Number(value)));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function normalizeFocalPoint(value){
    let x=50,y=50;
    if(Array.isArray(value)&&value.length>=2){x=Number.parseFloat(value[0]);y=Number.parseFloat(value[1]);}
    else if(value&&typeof value==='object'){x=Number.parseFloat(value.x);y=Number.parseFloat(value.y);}
    else if(typeof value==='string'){
      const parts=value.trim().split(/[\s,]+/).filter(Boolean);
      if(parts.length>=2){x=Number.parseFloat(parts[0]);y=Number.parseFloat(parts[1]);}
    }
    if(!Number.isFinite(x)||!Number.isFinite(y))return '50% 50%';
    return clamp(x)+'% '+clamp(y)+'%';
  }

  function accentMapForSystems(systems=[]){
    return new Map(systems.map((system,index)=>[system.id,typeof system.accent==='string'&&system.accent.trim()?system.accent.trim():PALETTE[index%PALETTE.length]]));
  }

  function rankTrack(system,xp){
    const ranks=[...(system?.ranks||[])].sort((a,b)=>a.threshold-b.threshold);
    const max=ranks.at(-1)?.threshold||0;
    if(!max)return {max:0,percentage:0,ticks:[]};
    return {
      max,
      percentage:Math.max(0,Math.min(100,Number(xp||0)/max*100)),
      ticks:ranks.map(rank=>({id:rank.id,name:rank.name,threshold:rank.threshold,left:Math.max(0,Math.min(100,rank.threshold/max*100))}))
    };
  }

  function itemIconKind(item){
    const value=String(item||'').toLocaleLowerCase();
    if(/thread|string|yarn|cloth|fabric|silk|fiber/.test(value))return 'thread';
    if(/berry|herb|flower|plant|leaf|moss|root|seed|bilber/.test(value))return 'plant';
    if(/stick|twig|wood|log|branch|bark/.test(value))return 'wood';
    if(/stone|rock|ore|gem|crystal|mineral/.test(value))return 'gem';
    if(/feather|bone|horn|scale|fur|hide/.test(value))return 'feather';
    if(/water|oil|potion|ink|sap|liquid/.test(value))return 'flask';
    return 'item';
  }

  function buildSearchIndex(seed,core,state){
    const characters=new Map((seed.characters||[]).map(character=>[character.id,character]));
    const systems=new Map((seed.systems||[]).map(system=>[system.id,system]));
    const entries=[];
    for(const character of seed.characters||[]){
      const system=systems.get(character.systemId);
      entries.push({kind:'Character',title:character.name,meta:[system?.name,...(character.tags||[]),character.notes].filter(Boolean).join(' · '),href:'#character/'+character.id});
    }
    for(const art of seed.art||[]){
      const character=characters.get(art.characterId);
      entries.push({kind:'Artwork',title:art.title,meta:[character?.name,art.credit,art.notes,art.itemRewards].filter(Boolean).join(' · '),href:'#character/'+art.characterId+'/art/'+art.id});
    }
    for(const recipe of seed.crafting||[]){
      entries.push({kind:'Recipe',title:recipe.name,meta:[recipe.category,recipe.notes,...(recipe.requirements||[]).map(item=>item.item)].filter(Boolean).join(' · '),href:'#crafting'});
    }
    for(const system of seed.systems||[]){
      entries.push({kind:'Species',title:system.name,meta:[system.xpName,system.levelName,...(system.ranks||[]).map(rank=>rank.name+' '+rank.threshold)].filter(Boolean).join(' · '),href:'#species'});
    }
    if(core&&state&&typeof core.rewardRows==='function'){
      for(const reward of core.rewardRows(state)){
        const character=characters.get(reward.characterId);
        entries.push({kind:'Reward',title:reward.title,meta:[character?.name,reward.kind,reward.notes].filter(Boolean).join(' · '),href:reward.artId?'#character/'+reward.characterId+'/art/'+reward.artId:'#rewards'});
      }
    } else {
      for(const reward of seed.rewards||[]){
        entries.push({kind:'Reward',title:reward.title,meta:[characters.get(reward.characterId)?.name,reward.notes].filter(Boolean).join(' · '),href:'#rewards'});
      }
    }
    return entries.map(entry=>({...entry,haystack:(entry.title+' '+entry.meta+' '+entry.kind).toLocaleLowerCase()}));
  }

  function boot(win){
    const doc=win.document,seed=win.CHARACTER_LEDGER_SEED,core=win.LedgerCore;
    if(!seed||!core)return;
    let state;
    try{state=core.validate(seed);}catch(error){return;}

    const characters=new Map(state.characters.map(character=>[character.id,character]));
    const rawArt=new Map((seed.art||[]).map(art=>[art.id,art]));
    const systemAccents=accentMapForSystems(seed.systems||[]);
    const explicitItemIcons=new Map();
    for(const recipe of seed.crafting||[])for(const requirement of recipe.requirements||[])if(requirement.icon&&!explicitItemIcons.has(requirement.item))explicitItemIcons.set(requirement.item,requirement.icon);
    const searchIndex=buildSearchIndex(seed,core,state);
    const multi={species:new Set(),status:new Set(),rank:new Set()};
    let enhancedSort=route()==='progress'?'progress':'name';
    let decorateQueued=false,currentLightboxId='';

    function route(){return (win.location.hash.slice(1)||'characters').split('/')[0];}
    function routeCharacterId(){const parts=(win.location.hash.slice(1)||'').split('/');return parts[0]==='character'?parts[1]||'':'';}
    function characterIdFrom(element){
      const href=element?.querySelector?.('a[href^="#character/"]')?.getAttribute('href');
      return href?href.split('/')[1]:routeCharacterId();
    }
    function progressFor(characterId){const character=characters.get(characterId);return character?core.progress(state,character):null;}
    function applyAccent(element,characterId){
      const character=characters.get(characterId),systemId=character?.systemId;
      if(!systemId||!systemAccents.has(systemId))return;
      element.classList.add('system-accent');element.dataset.systemId=systemId;element.style.setProperty('--system-accent',systemAccents.get(systemId));
    }

    function decorateSystemAccents(){
      doc.querySelectorAll('#results > .card,#results > .progress-row,.art-card,.journal-character').forEach(element=>applyAccent(element,characterIdFrom(element)));
      const profile=doc.querySelector('#main .split > .card');if(profile)applyAccent(profile,routeCharacterId());
      doc.querySelectorAll('.species-card').forEach(element=>{
        const name=element.querySelector('h2')?.textContent?.trim(),system=(state.systems||[]).find(item=>item.name===name);
        if(system&&systemAccents.has(system.id)){element.classList.add('system-accent');element.dataset.systemId=system.id;element.style.setProperty('--system-accent',systemAccents.get(system.id));}
      });
    }

    function decorateFocalPoints(){
      doc.querySelectorAll('img[data-ledger-image-id]').forEach(image=>{
        const raw=rawArt.get(image.dataset.ledgerImageId);if(!raw||raw.focalPoint===undefined)return;
        image.style.objectPosition=normalizeFocalPoint(raw.focalPoint);image.dataset.focalPoint='true';
      });
    }

    function enhanceMeter(meter,characterId){
      if(!meter||meter.classList.contains('rank-meter-enhanced'))return;
      const p=progressFor(characterId),track=rankTrack(p?.system,p?.xp);if(!p?.configured||!track.max)return;
      meter.classList.add('rank-meter-enhanced');
      const fill=meter.querySelector(':scope > span');if(fill)fill.style.width=track.percentage+'%';
      meter.setAttribute('aria-label','Lifetime progress through '+p.system.name+' ranks');meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax',String(track.max));meter.setAttribute('aria-valuenow',String(Math.min(track.max,Math.max(0,p.xp))));meter.setAttribute('aria-valuetext',p.xp+' '+p.system.xpName+' of '+track.max+' to the highest configured '+p.system.levelName.toLocaleLowerCase());
      for(const tick of track.ticks){
        const mark=doc.createElement('span');mark.className='rank-tick';mark.style.left=tick.left+'%';mark.title=tick.name+' · '+tick.threshold+' '+p.system.xpName;mark.setAttribute('aria-hidden','true');meter.append(mark);
      }
      const caption=meter.parentElement?.querySelector('.progress-caption');
      const last=caption?.lastElementChild;if(last&&/%\s*$/.test(last.textContent||''))last.textContent=Math.round(track.percentage)+'% of rank track';
    }

    function decorateMeters(){
      doc.querySelectorAll('#results > .card,#results > .progress-row').forEach(element=>{
        const id=characterIdFrom(element);element.querySelectorAll('.meter:not(.crafting-meter):not(.goal-meter)').forEach(meter=>enhanceMeter(meter,id));
      });
      const profile=doc.querySelector('#main .split > .card');if(profile)profile.querySelectorAll('.meter:not(.crafting-meter):not(.goal-meter)').forEach(meter=>enhanceMeter(meter,routeCharacterId()));
    }

    function iconSvg(kind){
      const paths={
        thread:'<path d="M8 8c0-2 1.8-3.5 4-3.5S16 6 16 8s-1.8 3.5-4 3.5S8 10 8 8Zm0 0v8m8-8v8M7 16h10"/>',
        plant:'<path d="M12 19v-7m0 1c-4 0-6-2-6-6 4 0 6 2 6 6Zm0 2c4 0 6-2 6-6-4 0-6 2-6 6Z"/>',
        wood:'<path d="M6 17 17 6m-8 1 8 8M5 19l3-1-2-2-1 3Zm14-14-3 1 2 2 1-3Z"/>',
        gem:'<path d="m12 4 6 5-6 11L6 9l6-5Zm-6 5h12m-6-5v16"/>',
        feather:'<path d="M18 5c-7 0-11 4-11 11l-2 3 3-2c7 0 11-5 10-12ZM8 16l7-7"/>',
        flask:'<path d="M9 4h6m-5 0v5l-4 7c-.8 1.5.2 3 2 3h8c1.8 0 2.8-1.5 2-3l-4-7V4m-6 9h8"/>',
        item:'<path d="m12 4 7 4v8l-7 4-7-4V8l7-4Zm-7 4 7 4 7-4m-7 4v8"/>'
      };
      return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths[kind]+'</svg>';
    }

    function itemToken(item){
      const token=doc.createElement('span');token.className='item-token';token.title=item;
      const explicit=explicitItemIcons.get(item);
      if(explicit){const image=doc.createElement('img');image.src=explicit;image.alt='';image.loading='lazy';token.append(image);}
      else token.innerHTML=iconSvg(itemIconKind(item));
      return token;
    }

    function decorateCraftingIcons(){
      doc.querySelectorAll('.crafting-item').forEach(row=>{
        const label=row.querySelector('span:nth-of-type(2)');if(!label||label.querySelector('.item-token'))return;
        const item=label.childNodes[0]?.textContent?.trim()||label.textContent.trim().replace(/\s*\(.*/, '');label.prepend(itemToken(item));
      });
      doc.querySelectorAll('.inventory-row > div:first-child > strong').forEach(label=>{if(label.previousElementSibling?.classList.contains('item-token'))return;label.before(itemToken(label.textContent.trim()));});
      doc.querySelectorAll('.shopping-list > div > span:first-child').forEach(label=>{if(label.querySelector('.item-token'))return;label.prepend(itemToken(label.textContent.trim()));});
    }

    function injectGlobalSearch(){
      if(doc.querySelector('#global-ledger-search'))return;
      const sidebar=doc.querySelector('.sidebar'),nav=sidebar?.querySelector('nav');if(!sidebar||!nav)return;
      const wrap=doc.createElement('div');wrap.className='global-search';wrap.innerHTML='<label for="global-ledger-search" class="sr-only">Search the whole ledger</label><div class="global-search-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path></svg><input id="global-ledger-search" type="search" autocomplete="off" placeholder="Search everything…" aria-label="Search characters, art, rewards, recipes, and notes" aria-expanded="false" aria-controls="global-search-results"><kbd>⌘K</kbd></div><div id="global-search-results" class="global-search-results" role="listbox" hidden></div>';
      nav.before(wrap);
      const input=wrap.querySelector('input'),results=wrap.querySelector('#global-search-results');
      const close=()=>{results.hidden=true;input.setAttribute('aria-expanded','false');};
      input.addEventListener('input',()=>{
        const q=input.value.trim().toLocaleLowerCase();if(!q){close();return;}
        const words=q.split(/\s+/).filter(Boolean);
        const matches=searchIndex.filter(entry=>words.every(word=>entry.haystack.includes(word))).sort((a,b)=>{
          const at=a.title.toLocaleLowerCase(),bt=b.title.toLocaleLowerCase();return Number(bt.startsWith(q))-Number(at.startsWith(q))||a.kind.localeCompare(b.kind)||a.title.localeCompare(b.title);
        }).slice(0,12);
        results.innerHTML=matches.map(entry=>'<a role="option" href="'+esc(entry.href)+'"><span class="global-result-kind">'+esc(entry.kind)+'</span><strong>'+esc(entry.title)+'</strong><small>'+esc(entry.meta||'')+'</small></a>').join('')||'<p>No matches in the ledger.</p>';
        results.hidden=false;input.setAttribute('aria-expanded','true');
      });
      results.addEventListener('click',event=>{if(event.target.closest('a')){input.value='';close();}});
      doc.addEventListener('pointerdown',event=>{if(!wrap.contains(event.target))close();});
      doc.addEventListener('keydown',event=>{
        const active=doc.activeElement,typing=active&&(/INPUT|TEXTAREA|SELECT/.test(active.tagName)||active.isContentEditable);
        if((event.key.toLocaleLowerCase()==='k'&&(event.metaKey||event.ctrlKey))||(event.key==='/'&&!typing)){
          event.preventDefault();input.focus();input.select();
        }
        if(event.key==='Escape'&&doc.activeElement===input){input.value='';close();input.blur();}
      });
    }

    function optionLabel(kind,value){
      if(kind==='species')return value==='unassigned'?'Unassigned':state.systems.find(system=>system.id===value)?.name||value;
      if(kind==='rank'){
        const [systemId,rankId]=value.split(':'),system=state.systems.find(item=>item.id===systemId),rank=rankId==='base'?{name:system?.baseName}:system?.ranks.find(item=>item.id===rankId);return [system?.name,rank?.name].filter(Boolean).join(' · ')||value;
      }
      return {close:'Within 20%',max:'Highest rank',setup:'Needs setup',available:'Ready to redeem',redeemed:'Redeemed',locked:'Locked'}[value]||value;
    }

    function makeMultiControl(kind,label,values){
      const details=doc.createElement('details');details.className='multi-filter';details.dataset.multiKind=kind;
      details.innerHTML='<summary>'+esc(label)+'</summary><div class="multi-filter-menu"><fieldset><legend class="sr-only">'+esc(label)+'</legend>'+values.map(value=>'<label><input type="checkbox" value="'+esc(value)+'"> <span>'+esc(optionLabel(kind,value))+'</span></label>').join('')+'</fieldset><button type="button" class="small text" data-multi-clear="'+kind+'">Clear '+esc(label.toLocaleLowerCase())+'</button></div>';
      details.addEventListener('change',()=>{
        multi[kind]=new Set([...details.querySelectorAll('input:checked')].map(input=>input.value));syncMultiSummary(details,label);applyAdvancedFilters();
      });
      syncMultiSummary(details,label);return details;
    }

    function syncMultiSummary(details,label){const count=multi[details.dataset.multiKind].size;details.querySelector('summary').textContent=label+(count?' · '+count:'');}

    function injectAdvancedFilters(){
      const toolbar=doc.querySelector('#main .toolbar:not(.art-filters)');if(!toolbar||toolbar.dataset.enhancedFilters==='true')return;
      const species=toolbar.querySelector('#filter-species'),status=toolbar.querySelector('#filter-status'),rank=toolbar.querySelector('#filter-rank'),sort=toolbar.querySelector('#filter-sort');
      if(!species&&!status)return;toolbar.dataset.enhancedFilters='true';
      if(species){species.closest('label').classList.add('enhanced-native-hidden');species.value='';const values=[...state.systems.map(system=>system.id),'unassigned'];toolbar.insertBefore(makeMultiControl('species','Species',values),species.closest('label').nextSibling);}
      if(status){status.closest('label').classList.add('enhanced-native-hidden');status.value='';const values=route()==='rewards'?['available','redeemed','locked']:['close','max','setup'];toolbar.insertBefore(makeMultiControl('status',route()==='rewards'?'Redemption':'Progress',values),status.closest('label').nextSibling);}
      if(rank){rank.closest('label').classList.add('enhanced-native-hidden');rank.value='';const values=state.systems.flatMap(system=>[{id:'base'},...system.ranks].map(item=>system.id+':'+item.id));toolbar.insertBefore(makeMultiControl('rank','Current rank',values),rank.closest('label').nextSibling);}
      if(sort){
        sort.closest('label').classList.add('enhanced-native-hidden');
        const label=doc.createElement('label');label.className='enhanced-sort';label.innerHTML='Sort<select id="enhanced-sort"><option value="name">Name A–Z</option><option value="progress">Closest to next rank</option><option value="points-desc">Total points · high to low</option><option value="points-asc">Total points · low to high</option></select>';
        label.querySelector('select').value=enhancedSort;label.querySelector('select').addEventListener('change',event=>{enhancedSort=event.target.value;applyAdvancedFilters();});toolbar.insertBefore(label,sort.closest('label').nextSibling);
      }
      applyAdvancedFilters();
    }

    function rowStatus(row,characterId){
      if(route()==='rewards')return row.classList.contains('redeemed')?'redeemed':row.classList.contains('locked')?'locked':'available';
      const p=progressFor(characterId);if(!p?.configured)return 'setup';if(p.maxed)return 'max';if(p.percentage>=80)return 'close';return '';
    }

    function rowRank(characterId){const p=progressFor(characterId),character=characters.get(characterId);return character?.systemId+':'+(p?.current?.id||'base');}

    function sortRows(container,rows){
      if(route()==='rewards')return;
      const scoreProgress=p=>!p?.configured?-2:p.maxed?-1:p.percentage;
      rows.sort((a,b)=>{
        const aid=characterIdFrom(a),bid=characterIdFrom(b),ac=characters.get(aid),bc=characters.get(bid),ap=progressFor(aid),bp=progressFor(bid);
        if(enhancedSort==='points-desc')return (bp?.xp||0)-(ap?.xp||0)||ac.name.localeCompare(bc.name);
        if(enhancedSort==='points-asc')return (ap?.xp||0)-(bp?.xp||0)||ac.name.localeCompare(bc.name);
        if(enhancedSort==='progress')return scoreProgress(bp)-scoreProgress(ap)||ac.name.localeCompare(bc.name);
        return ac.name.localeCompare(bc.name);
      });
      rows.forEach(row=>container.append(row));
    }

    function applyAdvancedFilters(){
      const container=doc.querySelector('#results');if(!container)return;
      const rows=[...container.children].filter(row=>!row.classList.contains('empty'));sortRows(container,rows);
      let visible=0;
      for(const row of rows){
        const id=characterIdFrom(row),character=characters.get(id),speciesId=character?.systemId||'unassigned';
        const show=(!multi.species.size||multi.species.has(speciesId))&&(!multi.status.size||multi.status.has(rowStatus(row,id)))&&(!multi.rank.size||route()==='rewards'||multi.rank.has(rowRank(id)));
        row.hidden=!show;if(show)visible++;
      }
      const count=doc.querySelector('#results-count');if(count){const noun=route()==='rewards'?'rewards':'characters';count.textContent=visible+' '+noun+' shown'+(rows.length!==visible?' · '+rows.length+' page matches':'');}
    }

    function showLightboxArt(id){
      const art=state.art.find(item=>item.id===id);if(!art?.image)return;currentLightboxId=id;
      const dialog=doc.querySelector('#lightbox'),image=dialog?.querySelector('img'),caption=dialog?.querySelector('p');if(!dialog||!image||!caption)return;
      image.src=art.image;image.alt=art.title;const raw=rawArt.get(id);if(raw?.focalPoint!==undefined)image.style.objectPosition=normalizeFocalPoint(raw.focalPoint);else image.style.removeProperty('object-position');caption.textContent=art.title+(art.credit?' · '+art.credit:'');
      updateLightboxButtons();if(!dialog.open)dialog.showModal();
    }

    function lightboxSequence(){
      const current=state.art.find(item=>item.id===currentLightboxId),characterId=current?.characterId||routeCharacterId();return state.art.filter(item=>item.characterId===characterId&&item.image).map(item=>item.id);
    }
    function updateLightboxButtons(){const ids=lightboxSequence(),index=ids.indexOf(currentLightboxId);doc.querySelectorAll('[data-lightbox-nav]').forEach(button=>{button.disabled=ids.length<2;button.setAttribute('aria-label',(Number(button.dataset.lightboxNav)<0?'Previous':'Next')+' artwork · '+(index+1)+' of '+ids.length);});}
    function stepLightbox(direction){const ids=lightboxSequence();if(ids.length<2)return;let index=ids.indexOf(currentLightboxId);index=(index+direction+ids.length)%ids.length;showLightboxArt(ids[index]);}

    function scheduleDecorate(){if(decorateQueued)return;decorateQueued=true;win.requestAnimationFrame(()=>{decorateQueued=false;decorate();});}
    function decorate(){decorateSystemAccents();decorateFocalPoints();decorateMeters();decorateCraftingIcons();injectAdvancedFilters();applyAdvancedFilters();}

    injectGlobalSearch();
    const observer=new MutationObserver(scheduleDecorate);observer.observe(doc.querySelector('#main'),{childList:true,subtree:true});scheduleDecorate();

    doc.addEventListener('click',event=>{
      const artButton=event.target.closest('[data-action="view-art"]');if(artButton){currentLightboxId=artButton.dataset.id;win.setTimeout(updateLightboxButtons,0);}
      const nav=event.target.closest('[data-lightbox-nav]');if(nav){event.preventDefault();stepLightbox(Number(nav.dataset.lightboxNav));}
      const clear=event.target.closest('[data-multi-clear]');if(clear){event.preventDefault();multi[clear.dataset.multiClear].clear();scheduleDecorate();}
      if(event.target.closest('[data-action="clear-filters"]')){multi.species.clear();multi.status.clear();multi.rank.clear();enhancedSort=route()==='progress'?'progress':'name';scheduleDecorate();}
    });
    doc.addEventListener('keydown',event=>{
      const dialog=doc.querySelector('#lightbox');if(!dialog?.open)return;
      if(event.key==='ArrowLeft'){event.preventDefault();stepLightbox(-1);}else if(event.key==='ArrowRight'){event.preventDefault();stepLightbox(1);}
    });
    win.addEventListener('hashchange',()=>{multi.species.clear();multi.status.clear();multi.rank.clear();enhancedSort=route()==='progress'?'progress':'name';currentLightboxId='';scheduleDecorate();});
  }

  return {normalizeFocalPoint,accentMapForSystems,rankTrack,itemIconKind,buildSearchIndex,boot};
});
