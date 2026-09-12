(function(root) {
  'use strict';
  const MAX_XP = 1000000000;
  const RESERVED_INVENTORY_KEYS = new Set(['__proto__','constructor','prototype']);
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const copy = data => JSON.parse(JSON.stringify(data));
  const safeInventoryKey = value => typeof value==='string' && value.length<=200 && value.trim() && !RESERVED_INVENTORY_KEYS.has(value);
  const safeInventoryAmount = value => Number.isFinite(value)&&value>=0&&value<=MAX_XP&&Math.abs(value*100-Math.round(value*100))<0.0001;
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
  const rounded = value => Math.round(value*100)/100;
  function pointBreakdown(state, character) {
    const rows=state.art.filter(art=>art.characterId===character.id),adjustments=state.adjustments.filter(item=>item.characterId===character.id);
    const approved=rounded(rows.filter(art=>art.status==='approved').reduce((sum,art)=>sum+art.xp,0));
    const pending=rounded(rows.filter(art=>art.status==='pending').reduce((sum,art)=>sum+art.xp,0));
    const rejected=rounded(rows.filter(art=>art.status==='rejected').reduce((sum,art)=>sum+art.xp,0));
    const positive=rounded(adjustments.filter(item=>item.amount>0).reduce((sum,item)=>sum+item.amount,0));
    const negative=rounded(adjustments.filter(item=>item.amount<0).reduce((sum,item)=>sum+item.amount,0));
    return {opening:character.openingXP,approved,pending,rejected,positive,negative,adjustments:rounded(positive+negative),total:totalXP(state,character)};
  }
  function pointTimeline(state, character) {
    const rows=[];
    if(character.openingXP)rows.push({id:'opening-'+character.id,kind:'opening',title:'Starting balance',date:'',amount:character.openingXP,status:'approved',counts:true});
    state.art.forEach((art,index)=>{if(art.characterId===character.id)rows.push({id:art.id,kind:'art',title:art.title,date:art.date,amount:art.xp,status:art.status,counts:art.status==='approved',sourceIndex:index});});
    state.adjustments.forEach((item,index)=>{if(item.characterId===character.id)rows.push({id:item.id,kind:'adjustment',title:item.reason||'Manual adjustment',date:item.date?item.date.slice(0,10):'',amount:item.amount,status:'approved',counts:true,sourceIndex:index});});
    return rows.sort((a,b)=>{
      const dated=Number(Boolean(b.date))-Number(Boolean(a.date));
      if(dated)return dated;
      if(a.date!==b.date)return b.date.localeCompare(a.date);
      return (b.sourceIndex||0)-(a.sourceIndex||0);
    });
  }
  function characterGoal(state, character) {
    const p=progress(state,character),system=p.system;
    if(!system)return {configured:false,label:'No point system',target:null,remaining:null,percentage:0,complete:false,custom:false,rank:null};
    const rank=character.goalRankId?system.ranks.find(item=>item.id===character.goalRankId)||null:null;
    const custom=character.goalXP>0;
    const target=custom?character.goalXP:rank?.threshold??p.next?.threshold??p.current?.threshold??null;
    const label=custom?'Custom point goal':rank?.name||p.next?.name||p.current?.name||'No goal configured';
    const remaining=target===null?null:rounded(Math.max(0,target-p.xp));
    return {configured:target!==null,label,target,remaining,percentage:target?Math.max(0,Math.min(100,rounded(p.xp/target*100))):100,complete:target!==null&&p.xp>=target,custom,rank:rank||(!custom?p.next||p.current:null),system,xp:p.xp};
  }
  function pointForecast(state, character, targetXP) {
    const approved=state.art.filter(art=>art.characterId===character.id&&art.status==='approved'&&art.xp>0).map(art=>art.xp).sort((a,b)=>a-b);
    const middle=Math.floor(approved.length/2);
    const typical=approved.length?(approved.length%2?approved[middle]:(approved[middle-1]+approved[middle])/2):0;
    const goal=characterGoal(state,character),target=Number.isFinite(targetXP)?targetXP:goal.target;
    const remaining=target===null?null:rounded(Math.max(0,target-totalXP(state,character)));
    return {typicalXP:rounded(typical),remaining,artworks:remaining===null||!typical?null:Math.ceil(remaining/typical),sampleSize:approved.length};
  }
  function rankMilestones(state, character) {
    const p=progress(state,character);if(!p.system)return [];
    const events=pointTimeline(state,character).filter(row=>row.counts&&row.kind!=='opening'&&row.date).sort((a,b)=>a.date.localeCompare(b.date));
    return p.system.ranks.map(rank=>{
      if(p.xp<rank.threshold)return {rank,reached:false,date:''};
      if(character.openingXP>=rank.threshold)return {rank,reached:true,date:'',source:'Starting balance'};
      let running=character.openingXP,date='';
      for(const event of events){running=rounded(running+event.amount);if(running>=rank.threshold){date=event.date;break;}}
      return {rank,reached:true,date,source:date?'Point history':'Date unavailable'};
    });
  }
  function pendingReview(state) {
    return state.art.filter(art=>art.status==='pending').map(art=>({art,character:state.characters.find(character=>character.id===art.characterId),system:state.systems.find(system=>system.id===state.characters.find(character=>character.id===art.characterId)?.systemId)})).sort((a,b)=>(b.art.date||'').localeCompare(a.art.date||'')||a.art.title.localeCompare(b.art.title));
  }
  function pointWarnings(state) {
    const warnings=[];
    for(const character of state.characters){
      const approved=state.art.filter(art=>art.characterId===character.id&&art.status==='approved');
      const undated=approved.filter(art=>!art.date).length+state.adjustments.filter(item=>item.characterId===character.id&&!item.date).length;
      if(undated)warnings.push({type:'missing-date',characterId:character.id,message:character.name+' has '+undated+' counted '+(undated===1?'entry':'entries')+' without a date.'});
      if(totalXP(state,character)<0)warnings.push({type:'negative-total',characterId:character.id,message:character.name+' has a negative point total.'});
      if(approved.some(art=>art.xp===0))warnings.push({type:'zero-points',characterId:character.id,message:character.name+' has counted artwork worth 0 points.'});
      const groups=new Map();
      for(const art of state.art.filter(item=>item.characterId===character.id)){
        const key=[art.title.trim().toLocaleLowerCase(),art.date,art.xp].join('|');groups.set(key,[...(groups.get(key)||[]),art]);
      }
      for(const duplicates of groups.values())if(duplicates.length>1)warnings.push({type:'possible-duplicate',characterId:character.id,message:character.name+' may have duplicate artwork records: '+duplicates.map(art=>art.id).join(', ')+'.'});
    }
    return warnings;
  }
  function dataSummary(state) {
    const localImages=state.art.filter(art=>art.image.startsWith('images/')).length;
    const externalImages=state.art.filter(art=>/^https?:\/\//i.test(art.image)).length;
    const links=state.art.reduce((sum,art)=>sum+Number(Boolean(art.source))+Number(Boolean(art.redemptionLink)),0)+state.crafting.filter(recipe=>recipe.reference).length;
    const dated=state.art.filter(art=>art.date).length,undated=state.art.length-dated;
    return {characters:state.characters.length,art:state.art.length,localImages,externalImages,withoutImages:state.art.length-localImages-externalImages,links,dated,undated,systems:state.systems.length,recipes:state.crafting.length,scoringPresets:state.scoringPresets.length};
  }
  function scoreArtwork(preset, quantities={}, multiplier=1, custom=0) {
    const safeMultiplier=Number(multiplier),safeCustom=Number(custom);
    assert(preset&&Array.isArray(preset.rules),'Choose a valid scoring preset.');
    assert(Number.isFinite(safeMultiplier)&&safeMultiplier>=1&&safeMultiplier<=100,'Multiplier must be from 1 to 100.');
    assert(Number.isFinite(safeCustom)&&safeCustom>=0&&safeCustom<=MAX_XP,'Manual points must be from 0 to 1,000,000,000.');
    const breakdown=preset.rules.map(rule=>{
      const quantity=Number(quantities[rule.id]||0);assert(Number.isInteger(quantity)&&quantity>=0&&quantity<=100,'Rule quantities must be whole numbers from 0 to 100.');
      return {id:rule.id,name:rule.name,points:rule.points,quantity,subtotal:rounded(rule.points*quantity)};
    }).filter(row=>row.quantity>0);
    const subtotal=rounded(breakdown.reduce((sum,row)=>sum+row.subtotal,0)+safeCustom);
    return {breakdown,custom:rounded(safeCustom),multiplier:safeMultiplier,subtotal,total:rounded(subtotal*safeMultiplier)};
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
  function craftingProgress(recipe, inventory={}, quantity=1) {
    const count=Number.isInteger(quantity)&&quantity>0?quantity:1;
    const required = recipe.requirements.reduce((sum,item) => sum + item.required*count, 0);
    const have = recipe.requirements.reduce((sum,item) => sum + Math.min(inventoryAmount(inventory,item.item),item.required*count), 0);
    const percentage = required ? Math.round((have / required) * 10000) / 100 : 0;
    return {required,have,percentage,complete:required > 0 && have >= required};
  }
  function normalizeCraftingPlan(recipes, input={}) {
    const ids=recipes.map(recipe=>recipe.id),known=new Set(ids),source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
    const requestedOrder=Array.isArray(source.order)?source.order.filter(id=>typeof id==='string'&&known.has(id)):[];
    const order=[...new Set([...requestedOrder,...ids])];
    const desired={};
    for(const id of ids){const value=source.desired&&source.desired[id];desired[id]=Number.isInteger(value)&&value>=1&&value<=1000000?value:1;}
    const currentGoalId=typeof source.currentGoalId==='string'&&known.has(source.currentGoalId)?source.currentGoalId:'';
    return {order,desired,currentGoalId};
  }
  function planCrafting(recipes, inventory={}, inputPlan={}) {
    const plan=normalizeCraftingPlan(recipes,inputPlan),byId=new Map(recipes.map(recipe=>[recipe.id,recipe]));
    const remaining={...inventory};
    const rows=plan.order.map((id,index)=>{
      const recipe=byId.get(id),quantity=plan.desired[id];
      const requirements=recipe.requirements.map(requirement=>{
        const required=requirement.required*quantity,available=inventoryAmount(inventory,requirement.item),availableAfterPriority=inventoryAmount(remaining,requirement.item),allocated=Math.min(required,availableAfterPriority);
        remaining[requirement.item]=availableAfterPriority-allocated;
        return {item:requirement.item,perCraft:requirement.required,required,available,availableAfterPriority,allocated,missing:required-allocated};
      });
      const ready=requirements.every(requirement=>requirement.missing===0),independentlyReady=requirements.every(requirement=>requirement.available>=requirement.required);
      const craftableCopies=Math.max(0,Math.min(...recipe.requirements.map(requirement=>Math.floor(inventoryAmount(inventory,requirement.item)/requirement.required))));
      return {recipe,quantity,index,requirements,ready,independentlyReady,blocked:!ready&&independentlyReady,status:ready?'ready':independentlyReady?'blocked':'gathering',craftableCopies};
    });
    return {plan,rows,remainingInventory:remaining};
  }
  function shoppingList(recipes, inventory={}, desired={}) {
    const totals = new Map();
    for (const recipe of recipes) for (const requirement of recipe.requirements) {
      const quantity=Number.isInteger(desired[recipe.id])&&desired[recipe.id]>0?desired[recipe.id]:1;
      totals.set(requirement.item,(totals.get(requirement.item)||0)+requirement.required*quantity);
    }
    return [...totals].map(([item,required])=>{
      const have=inventoryAmount(inventory,item);
      return {item,required,have,missing:Math.max(0,required-have)};
    }).filter(row=>row.missing>0).sort((a,b)=>a.item.localeCompare(b.item));
  }
  function validateInventoryExport(input) {
    assert(input&&typeof input==='object'&&!Array.isArray(input),'The import must contain a JSON object.');
    assert(input.format==='character-ledger-inventory'&&input.version===1,'This is not a supported Character Ledger inventory export.');
    assert(input.inventory&&typeof input.inventory==='object'&&!Array.isArray(input.inventory),'The import does not contain a valid inventory object.');
    const entries=Object.entries(input.inventory);
    assert(entries.length<=5000,'The inventory contains too many items.');
    const inventory={};
    for(const [item,amount] of entries){
      assert(safeInventoryKey(item),'Invalid or reserved inventory item name.');
      assert(safeInventoryAmount(amount),'Invalid amount for "'+item+'". Use a number from 0 to 1,000,000,000 with up to two decimal places.');
      inventory[item]=amount;
    }
    return inventory;
  }
  function validateWorkshopExport(input, recipes=[]) {
    if(input&&input.format==='character-ledger-inventory'&&input.version===1)return {inventory:validateInventoryExport(input),plan:normalizeCraftingPlan(recipes,{}),history:[],legacy:true};
    assert(input&&typeof input==='object'&&!Array.isArray(input),'The import must contain a JSON object.');
    assert(input.format==='character-ledger-workshop'&&input.version===2,'This is not a supported Character Ledger workshop backup.');
    const inventory=validateInventoryExport({format:'character-ledger-inventory',version:1,inventory:input.inventory});
    const plan=normalizeCraftingPlan(recipes,input.plan);
    assert(Array.isArray(input.history)&&input.history.length<=5000,'The workshop history is invalid or too large.');
    const history=[],historyIds=new Set();
    for(const record of input.history){
      assert(record&&typeof record==='object'&&!Array.isArray(record),'Invalid crafting history record.');
      assert(typeof record.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(record.id)&&!historyIds.has(record.id),'Invalid or duplicate crafting history ID.');
      assert(typeof record.recipeId==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(record.recipeId),'Invalid history recipe ID.');
      assert(typeof record.recipeName==='string'&&record.recipeName.trim()&&record.recipeName.length<=200,'Invalid history recipe name.');
      assert(Number.isInteger(record.quantity)&&record.quantity>=1&&record.quantity<=1000000,'Invalid crafted quantity.');
      assert(typeof record.craftedAt==='string'&&Number.isFinite(Date.parse(record.craftedAt)),'Invalid crafting history date.');
      assert(typeof record.undone==='boolean','History undo state must be true or false.');
      const consumed=validateInventoryExport({format:'character-ledger-inventory',version:1,inventory:record.consumed});
      historyIds.add(record.id);history.push({id:record.id,recipeId:record.recipeId,recipeName:record.recipeName,quantity:record.quantity,craftedAt:record.craftedAt,consumed,undone:record.undone});
    }
    return {inventory,plan,history,legacy:false};
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
    if(d.scoringPresets===undefined)d.scoringPresets=[];
    const systems=records('systems',300),chars=records('characters',5000),arts=records('art',20000);
    records('adjustments',50000);records('rewards',20000);
    for(const s of d.systems){try{if(s.pointMode===undefined)s.pointMode='cumulative';str(s.name,'species name',160);str(s.xpName,'XP name',40);str(s.levelName,'level name',40);str(s.baseName,'starting rank',160);assert(s.name.trim()&&s.xpName.trim()&&s.levelName.trim(),'Species and unit labels cannot be empty.');assert(s.pointMode==='cumulative','pointMode must be "cumulative"; spendable currency needs a separate balance.');assert(Array.isArray(s.ranks)&&s.ranks.length<=200,'Invalid ranks.');const ri=new Set();let prev=-1;for(const r of s.ranks){id(r.id);assert(!ri.has(r.id),'Duplicate rank ID.');ri.add(r.id);str(r.name,'rank name',160);assert(r.name.trim(),'A rank needs a name.');num(r.threshold,'rank threshold');assert(r.threshold>prev,'Rank thresholds must be unique and increasing.');prev=r.threshold;str(r.reward,'rank reward',1000);}}catch(error){throw new Error('Species "'+s.id+'": '+error.message);}}
    for(const c of d.characters){try{if(c.goalRankId===undefined)c.goalRankId='';if(c.goalXP===undefined)c.goalXP=0;str(c.name,'character name',160);assert(c.name.trim(),'A character needs a name.');assert(c.systemId===''||systems.has(c.systemId),'A character references a missing species.');num(c.openingXP,'starting XP');str(c.notes,'notes');assert(Array.isArray(c.tags)&&c.tags.length<=30,'Invalid tags.');c.tags.forEach(t=>str(t,'tag',80));assert(c.coverId===''||arts.has(c.coverId),'Missing reference image.');str(c.goalRankId,'goal rank ID',100);num(c.goalXP,'custom point goal');const system=d.systems.find(s=>s.id===c.systemId);assert(!c.goalRankId||system?.ranks.some(r=>r.id===c.goalRankId),'A character goal references a missing rank.');}catch(error){throw new Error('Character "'+c.id+'": '+error.message);}}
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
    for(const a of d.adjustments){try{assert(chars.has(a.characterId),'XP adjustment references a missing character.');num(a.amount,'XP adjustment',true);str(a.reason,'adjustment reason',1000);str(a.date,'adjustment date',40);}catch(error){throw new Error('Adjustment "'+a.id+'": '+error.message);}}
    for(const r of d.rewards){try{assert(chars.has(r.characterId),'Reward references a missing character.');str(r.title,'reward',1000);assert(r.title.trim(),'A reward needs a title.');str(r.notes,'reward notes');assert(!r.artId||d.art.some(a=>a.id===r.artId&&a.characterId===r.characterId),'Reward art belongs to another character or is missing.');}catch(error){throw new Error('Reward "'+r.id+'": '+error.message);}}
    assert(Array.isArray(d.scoringPresets)&&d.scoringPresets.length<=200,'Invalid scoring preset list.');
    const scoringPresets=[],presetIds=new Set();
    for(const preset of d.scoringPresets){try{id(preset.id);assert(!presetIds.has(preset.id),'Duplicate scoring preset ID.');presetIds.add(preset.id);str(preset.name,'scoring preset name',160);assert(preset.name.trim(),'A scoring preset needs a name.');assert(preset.systemId===''||systems.has(preset.systemId),'A scoring preset references a missing species.');assert(Array.isArray(preset.rules)&&preset.rules.length>0&&preset.rules.length<=30,'A scoring preset needs 1–30 rules.');const ruleIds=new Set(),rules=[];for(const rule of preset.rules){id(rule.id);assert(!ruleIds.has(rule.id),'Duplicate scoring rule ID.');ruleIds.add(rule.id);str(rule.name,'scoring rule name',160);assert(rule.name.trim(),'A scoring rule needs a name.');num(rule.points,'scoring rule points');rules.push({id:rule.id,name:rule.name,points:rule.points});}scoringPresets.push({id:preset.id,name:preset.name,systemId:preset.systemId,rules});}catch(error){throw new Error('Scoring preset "'+preset.id+'": '+error.message);}}
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
        for(const key of ['category','notes','reference'])if(recipe[key]===undefined)recipe[key]='';
        str(recipe.category,'recipe category',100);str(recipe.notes,'recipe notes',2000);str(recipe.reference,'recipe reference',2000);assert(safeURL(recipe.reference),'Recipe reference must start with https:// or http://.');
        assert(Array.isArray(recipe.requirements)&&recipe.requirements.length>0&&recipe.requirements.length<=200,'A recipe needs 1–200 requirements.');
        const requirements=[],itemNames=new Set();
        for(const item of recipe.requirements){
          assert(item&&typeof item==='object','Invalid crafting requirement.');
          str(item.item,'item name',200);assert(item.item.trim(),'A crafting item needs a name.');assert(safeInventoryKey(item.item),'Reserved crafting item name.');
          assert(!itemNames.has(item.item),'A recipe cannot list the same item twice.');itemNames.add(item.item);
          num(item.required,'required amount');assert(item.required>0,'Required amount must be greater than zero.');
          if(item.have!==undefined){num(item.have,'owned amount');legacyInventory[item.item]=Math.max(legacyInventory[item.item]||0,item.have);}
          requirements.push({item:item.item,required:item.required});
        }
        craftingIds.add(recipe.id);crafting.push({id:recipe.id,name:recipe.name,category:recipe.category,notes:recipe.notes,reference:recipe.reference,requirements});
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
        try {str(item,'inventory item',200);assert(item.trim(),'An inventory item needs a name.');assert(safeInventoryKey(item),'Reserved inventory item name.');num(amount,'inventory amount');inventory[item]=amount;}
        catch(error){craftingWarnings.push('Inventory item "'+item+'" was skipped: '+error.message);}
      }
    }
    for(const recipe of crafting)for(const item of recipe.requirements)if(inventory[item.item]===undefined)inventory[item.item]=0;
    assert(d.redemptions && typeof d.redemptions==='object'&&!Array.isArray(d.redemptions),'Invalid redemption records.');
    const validKeys=new Set(d.rewards.map(r=>'manual:'+r.id));
    for(const c of d.characters)for(const r of d.systems.find(s=>s.id===c.systemId)?.ranks||[])validKeys.add('rank:'+c.id+':'+r.id);
    for(const [key,value] of Object.entries(d.redemptions)){assert(validKeys.has(key),'Redemption references a missing reward.');assert(value&&typeof value==='object','Invalid redemption.');str(value.date,'redemption date',40);assert(Number.isFinite(Date.parse(value.date)),'Invalid redemption date.');str(value.note,'redemption note',2000);}
    return {format:d.format,version:d.version,systems:d.systems,characters:d.characters,art:d.art,adjustments:d.adjustments,rewards:d.rewards,redemptions:d.redemptions,scoringPresets,inventory,crafting,craftingWarnings};
  }
  root.LedgerCore={totalXP,progress,pointBreakdown,pointTimeline,characterGoal,pointForecast,rankMilestones,pendingReview,pointWarnings,dataSummary,scoreArtwork,rewardRows,inventoryAmount,craftingProgress,normalizeCraftingPlan,planCrafting,shoppingList,validateInventoryExport,validateWorkshopExport,validate,safeURL,copy};
  if(typeof module!=='undefined')module.exports=root.LedgerCore;
})(typeof window!=='undefined'?window:globalThis);
