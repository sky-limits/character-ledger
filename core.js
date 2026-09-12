(function(root) {
  'use strict';
  const MAX_XP = 1000000000;
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const copy = data => JSON.parse(JSON.stringify(data));
  function totalXP(state, character) {
    return Math.round((character.openingXP + state.art.filter(a => a.characterId === character.id && a.status === 'approved').reduce((sum,a) => sum + a.xp, 0) + state.adjustments.filter(a => a.characterId === character.id).reduce((sum,a) => sum + a.amount, 0))*100)/100;
  }
  function progress(state, character) {
    const system = state.systems.find(s => s.id === character.systemId);
    const xp = totalXP(state, character);
    if (!system || !system.ranks.length) return {system, xp, current:null,next:null,percentage:0,remaining:null,maxed:false,configured:false};
    const ranks = [...system.ranks].sort((a,b) => a.threshold-b.threshold);
    const current = ranks.filter(r => xp >= r.threshold).at(-1) || null;
    const next = ranks.find(r => r.threshold > xp) || null;
    const floor = current ? current.threshold : 0;
    return {system, xp, current, next, percentage:next ? Math.max(0,Math.min(100,100*(xp-floor)/(next.threshold-floor))) : 100, remaining:next ? next.threshold-xp : 0,maxed:!next,configured:true};
  }
  function rewardRows(state) {
    const rows = state.rewards.map(r => ({...r,key:'manual:'+r.id,kind:'Manual',eligible:true}));
    for (const c of state.characters) {
      const p = progress(state,c);
      for (const rank of p.system?.ranks || []) {
        const key = 'rank:'+c.id+':'+rank.id;
        if (rank.reward.trim() || state.redemptions[key]) rows.push({key, id:rank.id,characterId:c.id,title:rank.reward||rank.name+' reward (description removed)',notes:rank.name+' · '+rank.threshold+' '+p.system.xpName,artId:'',kind:'Rank',eligible:p.xp>=rank.threshold});
      }
    }
    for (const a of state.art) {
      if (a.itemRewards?.trim()) rows.push({key:'art:'+a.id,id:a.id,characterId:a.characterId,title:a.itemRewards,notes:'',artId:a.id,kind:'Artwork',eligible:true,redemption:a.rewardsRedeemed?{date:'',note:'',link:a.redemptionLink}:null});
    }
    return rows.map(r => ({...r,redemption:r.kind==='Artwork'?r.redemption:state.redemptions[r.key] || null}));
  }
  function inventoryAmount(inventory, item) {
    const amount = inventory && inventory[item];
    return Number.isFinite(amount) && amount >= 0 ? amount : 0;
  }
  function craftingProgress(recipe, inventory={}) {
    const required = recipe.requirements.reduce((sum,item) => sum + item.required, 0);
    const have = recipe.requirements.reduce((sum,item) => sum + Math.min(inventoryAmount(inventory,item.item),item.required), 0);
    const percentage = required ? Math.round((have / required) * 10000) / 100 : 0;
    return {required,have,percentage,complete:required > 0 && have >= required};
  }
  function shoppingList(recipes, inventory={}) {
    const totals = new Map();
    for (const recipe of recipes) for (const requirement of recipe.requirements) {
      totals.set(requirement.item,(totals.get(requirement.item)||0)+requirement.required);
    }
    return [...totals].map(([item,required])=>{
      const have=inventoryAmount(inventory,item);
      return {item,required,have,missing:Math.max(0,required-have)};
    }).filter(row=>row.missing>0).sort((a,b)=>a.item.localeCompare(b.item));
  }
  function safeURL(value, image=false) {
    if (!value) return true;
    if (image && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(value)) return true;
    if (/^https?:\/\/[^\s]+$/i.test(value)) return true;
    return image && /^images\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|gif)$/i.test(value) && !value.includes('..');
  }
  function validate(input) {
    assert(input && typeof input==='object' && !Array.isArray(input), 'Invalid backup.');
    const d = copy(input);
    assert(d.format==='character-ledger' && d.version===1,'This is not a supported Character Ledger backup.');
    const str=(v,label,max=20000)=>assert(typeof v==='string' && v.length<=max,'Invalid '+label+'.');
    const id=v=>assert(typeof v==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v),'Invalid record ID.');
    const num=(v,label,negative=false)=>assert(Number.isFinite(v)&&Math.abs(v)<=MAX_XP&&(negative||v>=0)&&Math.abs(v*100-Math.round(v*100))<0.0001,'Invalid '+label+' (use up to two decimal places).');
    const records=(key,max)=>{assert(Array.isArray(d[key])&&d[key].length<=max,'Invalid '+key+' list.');const ids=new Set();for(const r of d[key]){assert(r&&typeof r==='object','Invalid record.');id(r.id);assert(!ids.has(r.id),'Duplicate '+key+' ID.');ids.add(r.id);}return ids;};
    if(d.crafting===undefined)d.crafting=[];
    const systems=records('systems',300),chars=records('characters',5000),arts=records('art',20000);
    records('adjustments',50000);records('rewards',20000);
    for(const s of d.systems){str(s.name,'species name',160);str(s.xpName,'XP name',40);str(s.levelName,'level name',40);str(s.baseName,'starting rank',160);assert(s.name.trim()&&s.xpName.trim()&&s.levelName.trim(),'Species and unit labels cannot be empty.');assert(Array.isArray(s.ranks)&&s.ranks.length<=200,'Invalid ranks.');const ri=new Set();let prev=-1;for(const r of s.ranks){id(r.id);assert(!ri.has(r.id),'Duplicate rank ID.');ri.add(r.id);str(r.name,'rank name',160);assert(r.name.trim(),'A rank needs a name.');num(r.threshold,'rank threshold');assert(r.threshold>prev,'Rank thresholds must be unique and increasing.');prev=r.threshold;str(r.reward,'rank reward',1000);}}
    for(const c of d.characters){str(c.name,'character name',160);assert(c.name.trim(),'A character needs a name.');assert(c.systemId===''||systems.has(c.systemId),'A character references a missing species.');num(c.openingXP,'starting XP');str(c.notes,'notes');assert(Array.isArray(c.tags)&&c.tags.length<=30,'Invalid tags.');c.tags.forEach(t=>str(t,'tag',80));assert(c.coverId===''||arts.has(c.coverId),'Missing reference image.');}
    for(const a of d.art){
      try {
        for(const key of ['credit','source','date','notes','itemRewards','redemptionLink']) if(a[key]===undefined)a[key]='';
        if(a.rolled===undefined)a.rolled=false;
        if(a.rewardsRedeemed===undefined)a.rewardsRedeemed=false;
        assert(chars.has(a.characterId),'Artwork references a missing character.');
        str(a.title,'art title',200);assert(a.title.trim(),'Artwork needs a title.');num(a.xp,'art XP');
        assert(['approved','pending','rejected'].includes(a.status),'Invalid XP status. Use approved, pending, or rejected; track rolls with rolled: true.');
        str(a.credit,'credit',1000);str(a.source,'source',2000);assert(safeURL(a.source),'Use an https:// or http:// source link.');
        str(a.image,'image',12000000);assert(safeURL(a.image,true),'Invalid image URL or data.');str(a.notes,'art notes');str(a.date,'art date',10);assert(!a.date||/^\d{4}-\d{2}-\d{2}$/.test(a.date),'Invalid artwork date.');
        assert(typeof a.rolled==='boolean','rolled must be true or false.');
        str(a.itemRewards,'itemRewards');assert(typeof a.rewardsRedeemed==='boolean','rewardsRedeemed must be true or false.');
        str(a.redemptionLink,'redemptionLink',2000);assert(safeURL(a.redemptionLink),'redemptionLink must start with https:// or http://.');
        assert(!a.rewardsRedeemed||a.itemRewards.trim(),'Add itemRewards before marking them redeemed.');
      } catch(error) {throw new Error('Artwork "'+a.id+'": '+error.message);}
    }
    for(const c of d.characters){assert(!c.coverId||d.art.some(a=>a.id===c.coverId&&a.characterId===c.id),'Main reference belongs to another character.');num(totalXP(d,c),'total XP');}
    for(const a of d.adjustments){assert(chars.has(a.characterId),'XP adjustment references a missing character.');num(a.amount,'XP adjustment',true);str(a.reason,'adjustment reason',1000);str(a.date,'adjustment date',40);}
    for(const r of d.rewards){assert(chars.has(r.characterId),'Reward references a missing character.');str(r.title,'reward',1000);assert(r.title.trim(),'A reward needs a title.');str(r.notes,'reward notes');assert(!r.artId||d.art.some(a=>a.id===r.artId&&a.characterId===r.characterId),'Reward art belongs to another character or is missing.');}
    const craftingWarnings=[],crafting=[],craftingIds=new Set(),legacyInventory={};
    if(!Array.isArray(d.crafting)){
      craftingWarnings.push('The crafting list is not an array, so no recipes were loaded.');
      d.crafting=[];
    }
    if(d.crafting.length>5000)craftingWarnings.push('Only the first 5,000 crafting recipes were checked.');
    for(const [index,recipe] of d.crafting.slice(0,5000).entries()){
      try {
        assert(recipe&&typeof recipe==='object'&&!Array.isArray(recipe),'Invalid recipe record.');
        id(recipe.id);assert(!craftingIds.has(recipe.id),'Duplicate crafting recipe ID.');
        str(recipe.name,'recipe name',200);assert(recipe.name.trim(),'A recipe needs a name.');
        assert(Array.isArray(recipe.requirements)&&recipe.requirements.length>0&&recipe.requirements.length<=200,'A recipe needs 1–200 requirements.');
        const requirements=[],itemNames=new Set();
        for(const item of recipe.requirements){
          assert(item&&typeof item==='object','Invalid crafting requirement.');
          str(item.item,'item name',200);assert(item.item.trim(),'A crafting item needs a name.');
          assert(!itemNames.has(item.item),'A recipe cannot list the same item twice.');itemNames.add(item.item);
          num(item.required,'required amount');assert(item.required>0,'Required amount must be greater than zero.');
          if(item.have!==undefined){num(item.have,'owned amount');legacyInventory[item.item]=Math.max(legacyInventory[item.item]||0,item.have);}
          requirements.push({item:item.item,required:item.required});
        }
        craftingIds.add(recipe.id);crafting.push({id:recipe.id,name:recipe.name,requirements});
      } catch(error) {
        const label=recipe&&typeof recipe.id==='string'&&recipe.id?recipe.id:'#'+(index+1);
        craftingWarnings.push('Recipe "'+label+'" was skipped: '+error.message);
      }
    }
    const inventory={};
    if(d.inventory===undefined){Object.assign(inventory,legacyInventory);}
    else if(!d.inventory||typeof d.inventory!=='object'||Array.isArray(d.inventory)){craftingWarnings.push('Inventory is not an object, so all owned amounts start at zero.');}
    else {
      const entries=Object.entries(d.inventory);
      if(entries.length>5000)craftingWarnings.push('Only the first 5,000 inventory items were loaded.');
      for(const [item,amount] of entries.slice(0,5000)){
        try {str(item,'inventory item',200);assert(item.trim(),'An inventory item needs a name.');num(amount,'inventory amount');inventory[item]=amount;}
        catch(error){craftingWarnings.push('Inventory item "'+item+'" was skipped: '+error.message);}
      }
    }
    for(const recipe of crafting)for(const item of recipe.requirements)if(inventory[item.item]===undefined)inventory[item.item]=0;
    assert(d.redemptions && typeof d.redemptions==='object'&&!Array.isArray(d.redemptions),'Invalid redemption records.');
    const validKeys=new Set(d.rewards.map(r=>'manual:'+r.id));
    for(const c of d.characters)for(const r of d.systems.find(s=>s.id===c.systemId)?.ranks||[])validKeys.add('rank:'+c.id+':'+r.id);
    for(const [key,value] of Object.entries(d.redemptions)){assert(validKeys.has(key),'Redemption references a missing reward.');assert(value&&typeof value==='object','Invalid redemption.');str(value.date,'redemption date',40);assert(Number.isFinite(Date.parse(value.date)),'Invalid redemption date.');str(value.note,'redemption note',2000);}
    return {format:d.format,version:d.version,systems:d.systems,characters:d.characters,art:d.art,adjustments:d.adjustments,rewards:d.rewards,redemptions:d.redemptions,inventory,crafting,craftingWarnings};
  }
  root.LedgerCore={totalXP,progress,rewardRows,inventoryAmount,craftingProgress,shoppingList,validate,safeURL,copy};
  if(typeof module!=='undefined')module.exports=root.LedgerCore;
})(typeof window!=='undefined'?window:globalThis);
