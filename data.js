/* OWNER-EDITED SITE DATA — v0.09
   Edit this file in GitHub or a text editor, then commit it to the repository.
   This is the only source of character records. Visitors cannot submit edits.
   See README.txt for copy/paste examples for characters, artwork, and rewards.
   Git keeps earlier versions, but local backups are still wise. Do not put secrets in public files. */
window.CHARACTER_LEDGER_SEED = {
  format: 'character-ledger', version: 1,
  systems: [{id:'aedraco', name:'Aedraco', xpName:'GP', levelName:'Rank', baseName:'Below Guardian', ranks:[
    {id:'guardian',name:'Guardian',threshold:250,reward:''},
    {id:'ancient',name:'Ancient',threshold:750,reward:''}
  ]},
  {
    id: 'kuda-pariso', name: 'Kuda Pariso',
    xpName: 'KudaPoints', levelName: 'Tier', baseName: 'Green Kuda',
    ranks: [
      {id: 'Rookie-Kuda', name: 'Rookie Kuda', threshold: 40, reward: ''},
      {id: 'Elite-Kuda', name: 'Elite Kuda', threshold: 80, reward: ''},
      {id: 'Supreme-Kuda', name: 'Supreme Kuda',threshold: 200, reward:''},
      {id: 'Epic-Kuda', name: 'Epic Kuda',threshold: 400, reward:''},
      {id: 'Legendary-Kuda', name: 'Legendary Kuda',threshold: 800, reward:''},
      {id: 'Mythical-Kuda', name: 'Mythical Kuda',threshold: 1500, reward:''}
    ]
  }
  ],
  characters: [
    {id:'nerissa',name:'Nerissa',systemId:'aedraco',openingXP:0,coverId:'nerissa-ref',tags:['Sphinx'],notes:''},
    {
    id: 'isolde',
    name: 'Isolde',
    systemId: 'kuda-pariso',
    openingXP: 0,
    coverId: '',
    tags: ['Swan'],
    notes: ''
  },
  {
    id: 'iskaria',
    name: 'Iskaria',
    systemId: 'kuda-pariso',
    openingXP: 0,
    coverId: '',
    tags: ['Swan'],
    notes: ''
  },
  {
    id: 'lazarus',
    name: 'Lazarus',
    systemId: 'kuda-pariso',
    openingXP: 0,
    coverId: '',
    tags: ['Phoenix'],
    notes: ''
  },
  {
    id: 'red-run',
    name: 'Red Run',
    systemId: 'kuda-pariso',
    openingXP: 0,
    coverId: '',
    tags: ['Pariso'],
    notes: ''
  },
  {
    id: 'tidecaller',
    name: 'Tidecaller',
    systemId: 'kuda-pariso',
    openingXP: 0,
    coverId: '',
    tags: ['Swan'],
    notes: ''
  },
  {
    id: 'viorica',
    name: 'Viorica',
    systemId: 'kuda-pariso',
    openingXP: 0,
    coverId: '',
    tags: ['Pariso'],
    notes: ''
  }
  ],
  art: [
    {id:'nerissa-ref',characterId:'nerissa',title:'Aedraco reference',image:'images/IMG_0950.png',xp:4,status:'approved', rolled:true, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',credit:'',source:'',date:'',notes:'2 (fullbody) x2'},
    {id:'nerissa-forest',characterId:'nerissa',title:'Through the forest',image:'images/nerissa-forest.jpg',xp:21,status:'approved', rolled:true, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',credit:'',source:'',date:'',notes:'3 (Fullbody Colored + Shaded) +2 (Background) +2 (Activity) x3'},
    {id:'nerissa-chase',characterId:'nerissa',title:'The stag chase',image:'images/nerissa-chase.jpg',xp:7,status:'approved', rolled:true, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',credit:'',source:'',date:'',notes:'3 (Fullbody Colored + Shaded) +2 (Background) +2 (Activity)'},
    {id: 'nerissa-digging', characterId: 'nerissa',title:'Diggin a Hole',image:'images/_ad_diggin_a_hole_by_sky_limits_dmsj1mg-pre.jpg',xp:7,status:'approved', rolled:true, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',credit:'',source:'',date:'',notes:'3 (Fullbody Colored + Shaded) +2 (Background) +2 (Activity)'},
    {
    id: 'nerissa-hunt2',
    characterId: 'nerissa',
    title: 'Stag Hunt pt2',
    image: 'images/IMG_0949.png',
    xp: 7,
    status:'approved', rolled:true, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: '3 (Fullbody Colored + Shaded) +2 (Background) +2 (Activity)'
  },
  {
    id: 'nerissa-desert',
    characterId: 'nerissa',
    title: 'Desert Explores',
    image: 'images/IMG_0953.png',
    xp: 21,
    status:'approved', rolled:true, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: ''
  },
  {
    id: 'nerissa-pixel',
    characterId: 'nerissa',
    title: 'nerissa pixel',
    image: 'images/Untitled_Artwork.png',
    xp: 5,
    status:'approved', rolled:false, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: ''
  },
  {
    id: 'isolde-ref',
    characterId: 'isolde',
    title: 'reference',
    image: 'images/_kp_mbs_isolde_by_sky_limits_dmr9ic5-pre.jpg',
    xp: 10,
    status:'approved', rolled:false, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: ''
  },
  {
    id: 'iskaria-ref',
    characterId: 'iskaria',
    title: 'reference',
    image: 'images/iskaria.png',
    xp: 10,
    status:'approved', rolled:false, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: ''
  },
  {
    id: 'lazarus-ref',
    characterId: 'lazarus',
    title: 'reference',
    image: 'images/lazarus.jpg',
    xp: 10,
    status:'approved', rolled:false, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: ''
  },
  {
    id: 'red-run-ref',
    characterId: 'red-run',
    title: 'reference',
    image: 'images/red.jpg',
    xp: 10,
    status:'approved', rolled:false, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: ''
  },
  {
    id: 'tide-ref',
    characterId: 'tidecaller',
    title: 'reference',
    image: 'images/tide.jpg',
    xp: 10,
    status:'approved', rolled:false, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: ''
  },
  {
    id: 'vi-ref',
    characterId: 'viorica',
    title: 'reference',
    image: 'images/viorica.jpg',
    xp: 10,
    status:'approved', rolled:false, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: ''
  },
  {
    id: 'nerissa-heal',
    characterId: 'nerissa',
    title: 'healing',
    image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/c9d1bc0a-c506-4656-8621-9a9e6ca1371a/dmsymzs-a72ff4de-86bb-46fc-a96a-b917e8917376.png/v1/fill/w_1072,h_745,q_70,strp/_ad_resting_by_sky_limits_dmsymzs-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9ODkwIiwicGF0aCI6Ii9mL2M5ZDFiYzBhLWM1MDYtNDY1Ni04NjIxLTlhOWU2Y2ExMzcxYS9kbXN5bXpzLWE3MmZmNGRlLTg2YmItNDZmYy1hOTZhLWI5MTdlODkxNzM3Ni5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.u3eB0vbx3E-DQV-TTALePJo0oYsYq3mC-61dt1tLuzc',
    xp: 7,
    status:'approved', rolled:false, itemRewards:'', rewardsRedeemed:false, redemptionLink:'',
    credit: 'sky-limits',
    source: '',
    date: '2026-09-09',
    notes: '3 (Fullbody Colored + Shaded) +2 (Background) +2 (Mending Injury)'
  },
  {
    id: 'nerissa-stalking', characterId: 'nerissa',
    title: 'stalking', image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/c9d1bc0a-c506-4656-8621-9a9e6ca1371a/dmt1yxm-8fcd1e0f-da59-4f5e-a07b-7be2d6def8b5.png/v1/fill/w_1072,h_745,q_70,strp/_ad_stalking_by_sky_limits_dmt1yxm-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9ODkwIiwicGF0aCI6Ii9mL2M5ZDFiYzBhLWM1MDYtNDY1Ni04NjIxLTlhOWU2Y2ExMzcxYS9kbXQxeXhtLThmY2QxZTBmLWRhNTktNGY1ZS1hMDdiLTdiZTJkNmRlZjhiNS5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.svwPi5LEyRb4UAmQxz6Hnb88-GRu5X8oJMzJ8fySH9Q',
    xp: 7, status: 'approved', rolled: true,
    itemRewards: 'Nerissa 064 found x1 Stick, x1 Thread, x1 Bilberries', rewardsRedeemed: true, redemptionLink: 'https://www.deviantart.com/comments/1/1369142317/5309933066',
    credit: 'sky-limits', source: '', date: '2026-09-10', notes: '3 (Fullbody Colored + Shaded) +2 (Background) +2 (Activity)'
  },
  {
    id: 'nerissa-roh1', characterId: 'nerissa',
    title: 'ROH 1', image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/c9d1bc0a-c506-4656-8621-9a9e6ca1371a/dmta4is-87ce3774-8ca0-43bb-8bad-06669922855f.png/v1/fill/w_1181,h_676,q_70,strp/_ad_roh_i_see_myself__by_sky_limits_dmta4is-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NzMzIiwicGF0aCI6Ii9mL2M5ZDFiYzBhLWM1MDYtNDY1Ni04NjIxLTlhOWU2Y2ExMzcxYS9kbXRhNGlzLTg3Y2UzNzc0LThjYTAtNDNiYi04YmFkLTA2NjY5OTIyODU1Zi5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.TCvqJ8WzD00mH_wMNxdzrScn3lJIXBTuaj1uzIZ5dHw',
    xp: 7, status: 'approved', rolled: false,
    itemRewards: '', rewardsRedeemed: false, redemptionLink: '',
    credit: 'sky-limits', source: '', date: '', notes: '3 (Fullbody Colored + Shaded) +2 (Background) +2 (Rite)'
  },
  {
    id: 'roh2', characterId: 'nerissa',
    title: 'ROH 2', image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/c9d1bc0a-c506-4656-8621-9a9e6ca1371a/dmtavan-522a797d-2437-4ff5-bdf0-45f668bb17ed.png/v1/fill/w_1032,h_774,q_70,strp/_ad_roh_a_nap_by_sky_limits_dmtavan-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9OTYwIiwicGF0aCI6Ii9mL2M5ZDFiYzBhLWM1MDYtNDY1Ni04NjIxLTlhOWU2Y2ExMzcxYS9kbXRhdmFuLTUyMmE3OTdkLTI0MzctNGZmNS1iZGYwLTQ1ZjY2OGJiMTdlZC5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.UBKjIX9KqD4ktYlycA6fuJC00ankPuDmxgvJcPlOntE',
    xp: 7, status: 'approved', rolled: false,
    itemRewards: '', rewardsRedeemed: false, redemptionLink: '',
    credit: 'sky-limits', source: '', date: '', notes: '3 (Fullbody Colored + Shaded) +2 (Background) +2 (Rite)'
  },
  {
    id: 'roh3', characterId: 'nerissa',
    title: 'ROH 3', image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/c9d1bc0a-c506-4656-8621-9a9e6ca1371a/dmtbmnk-8c7ebdf9-354a-4109-b18a-5fd4a111cb62.png/v1/fill/w_1032,h_774,q_70,strp/_ad_roh_through_the_mist_i_wander_by_sky_limits_dmtbmnk-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9OTYwIiwicGF0aCI6Ii9mL2M5ZDFiYzBhLWM1MDYtNDY1Ni04NjIxLTlhOWU2Y2ExMzcxYS9kbXRibW5rLThjN2ViZGY5LTM1NGEtNDEwOS1iMThhLTVmZDRhMTExY2I2Mi5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.F4s3dyDO-P65CWNpocKBSGDQA2_8HqPcq016KZN4DPg',
    xp: 7, status: 'approved', rolled: false,
    itemRewards: '', rewardsRedeemed: false, redemptionLink: '',
    credit: 'sky-limits', source: '', date: '', notes: '3 (Fullbody Colored + Shaded) +2 (Background) +2 (Rite)'
  },
  {
    id: 'pumpkin-picking', characterId: 'nerissa',
    title: 'pumpkin picking', image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/c9d1bc0a-c506-4656-8621-9a9e6ca1371a/dmta50p-f853797e-66ce-4c42-9dde-03ce8d848ae5.png/v1/fill/w_1181,h_676,q_70,strp/_ad_pumpkin_picking_by_sky_limits_dmta50p-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NzMzIiwicGF0aCI6Ii9mL2M5ZDFiYzBhLWM1MDYtNDY1Ni04NjIxLTlhOWU2Y2ExMzcxYS9kbXRhNTBwLWY4NTM3OTdlLTY2Y2UtNGM0Mi05ZGRlLTAzY2U4ZDg0OGFlNS5wbmciLCJ3aWR0aCI6Ijw9MTI4MCJ9XV0sImF1ZCI6WyJ1cm46c2VydmljZTppbWFnZS5vcGVyYXRpb25zIl19.hn_HTspevjXa9VJSSZvtOwIWHfJxEQOJSADJmwIzbjc',
    xp: 7, status: 'approved', rolled: false,
    itemRewards: '', rewardsRedeemed: false, redemptionLink: '',
    credit: 'sky-limits', source: '', date: '', notes: '3 (Fullbody Colored + Shaded) +2 (Background) +2 (Monthly Quest)'
  }
  ],
  // Calculator rules are owner-editable. Presets may target one species or
  // use systemId: '' to appear for every character. Manual points remain
  // available for systems that do not yet have a preset.
  scoringPresets: [
    {
      id: 'aedraco-art',
      name: 'Aedraco artwork',
      systemId: 'aedraco',
      rules: [
        {id: 'fullbody', name: 'Fullbody colored + shaded', points: 3},
        {id: 'background', name: 'Background', points: 2},
        {id: 'activity', name: 'Activity / prompt bonus', points: 2}
      ]
    }
  ],
  adjustments: [],
  rewards: [],
  redemptions: {},

  // One shared inventory powers every crafting recipe. The website can adjust
  // these numbers in this browser; edit these defaults to change them for
  // everyone on the next deployment.
  inventory: {
    Stick: 1,
    Thread: 1,
    Arrowhead: 0,
    Bilberries: 1
  },

  crafting: [
    {
      id: 'spear',
      name: 'Spear',
      category: 'Weapons',
      notes: '',
      reference: '',
      requirements: [
        {item: 'Stick', required: 20},
        {item: 'Thread', required: 5},
        {item: 'Arrowhead', required: 2}
      ]
    }
  ]
};
