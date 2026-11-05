// Factual values transcribed from the linked references; descriptions are original.
export const assassinations = [
  {
    id: "hotel",
    title: "The Hotel Assassination",
    required: true,
    before: ["Betta Pharmaceuticals", "BET", "BAWSAQ"],
    rebound: ["Bilkinton Research", "BIL", "LCN"],
    note: "The one assassination you must do to advance the story. Buy BET before starting; sell after its rise. Then buy BIL after its drop and sell after recovery.",
    sources: ["stocks"],
  },
  {
    id: "multi",
    title: "The Multi Target Assassination",
    before: ["Debonaire", "DEB", "LCN"],
    rebound: ["Redwood", "RWC", "LCN"],
    note: "Keep this for after the main story. Sell DEB after the mission-driven rise; buy the depressed RWC shares for the rebound.",
    sources: ["stocks"],
  },
  {
    id: "vice",
    title: "The Vice Assassination",
    before: ["Fruit", "FRT", "BAWSAQ"],
    rebound: ["Facade", "FAC", "BAWSAQ"],
    note: "Keep this for after the main story. Sell FRT after the rise, then buy FAC after its decline and wait for recovery.",
    sources: ["stocks"],
  },
  {
    id: "bus",
    title: "The Bus Assassination",
    after: ["Vapid", "VAP", "BAWSAQ"],
    note: "Do the mission first. Buy VAP only after completion, then sell after its recovery. There is no pre-mission stock purchase for this strategy.",
    sources: ["stocks"],
  },
  {
    id: "construction",
    title: "The Construction Assassination",
    before: ["Gold Coast", "GCD", "LCN"],
    note: "Keep this for after the main story. Buy GCD before starting, then sell after the rise. No rebound purchase in this strategy.",
    sources: ["stocks"],
  },
];
export function tradeSteps(m) {
  const steps = [
    { id: "save", text: "Make a fresh manual save", character: false },
  ];
  if (m.before)
    steps.push({
      id: "buy",
      text: "Before the mission · Buy",
      stock: m.before,
      character: true,
    });
  else
    steps.push({
      id: "no-buy",
      text: "Before the mission · No stock purchase",
      character: false,
      info: true,
    });
  steps.push({
    id: "mission",
    text: "Complete the assassination",
    character: false,
  });
  if (m.after)
    steps.push({
      id: "after-buy",
      text: "After the mission · Buy",
      stock: m.after,
      character: true,
    });
  steps.push({
    id: "sell",
    text: m.after ? "After recovery · Sell" : "After the rise · Sell",
    stock: m.before || m.after,
    character: true,
  });
  if (m.rebound)
    steps.push(
      {
        id: "rebound-buy",
        text: "After the drop · Buy the rebound",
        stock: m.rebound,
        character: true,
      },
      {
        id: "rebound-sell",
        text: "After recovery · Sell the rebound",
        stock: m.rebound,
        character: true,
      },
    );
  return steps;
}
export const crews = [
  {
    id: "jewel",
    title: "The Jewel Store Job",
    approach: "Smart approach",
    rows: [
      ["Driver", "Karim Denz", "8%"],
      ["Gunman", "Packie McReary", "12%"],
      ["Hacker", "Rickie Lukens", "4%"],
    ],
    note: "Recruit Packie in the Getaway Driver random event first. Gustavo Mota (14%) is a capable fallback. Rickie gives you less time in the store: move quickly.",
    sources: ["jewel", "random"],
  },
  {
    id: "paleto",
    title: "The Paleto Score",
    approach: "Cost versus survival",
    rows: [["Lower crew expense", "Norm Richards · dies", "10.5%"], ["Surviving gunman", "Packie McReary or Chef", "12%"]],
    note: "GTA Base recommends Norm’s 10.5% casualty expense and saving Daryl for The Big Score. Packie or Chef costs 1.5 percentage points more and survives to help in the firefight. Gustavo Mota is another surviving option at 14%.",
    sources: ["paleto"],
  },
  {
    id: "bureau",
    title: "The Bureau Raid",
    approach: "Roof Entry",
    rows: [
      ["Driver", "Taliana Martinez", "5%"],
      ["Gunman", "Daryl Johns", "6%"],
      ["Hacker", "Rickie Lukens", "4%"],
    ],
    note: "Recruit Taliana through Crash Rescue. Karim Denz (8%) is a fallback; he needs earlier heist experience to arrive promptly. Crew availability depends on your earlier choices.",
    sources: ["bureau", "random"],
  },
  {
    id: "finale",
    title: "The Big Score",
    approach: "Obvious approach",
    rows: [
      ["Driver 1 · helicopter", "Taliana Martinez", "5%"],
      ["Driver 2 · train", "Karim Denz", "8%"],
      ["Gunmen", "Daryl + Norm or Hugh", "6% + 7%"],
    ],
    note: "Keep an inexperienced Karim on the train. Taliana handles the helicopter. Use available low-cut gunmen; put the more experienced one in the second gunman role.",
    sources: ["finale", "random"],
  },
];
export const properties = [
  ["hen-house", "The Hen House", 80000, "Any", "Paleto Bay"],
  ["mckenzie", "McKenzie Field Hangar", 150000, "Trevor", "Grapeseed"],
  ["towing", "Towing Impound", 150000, "Franklin", "Davis · Innocence Boulevard"],
  ["cab", "Downtown Cab Co.", 200000, "Franklin", "Downtown"],
  ["smoke", "Smoke on the Water", 204000, "Franklin", "Vespucci Beach"],
  ["sonar", "Sonar Collections Dock", 250000, "Any", "Paleto Bay"],
  ["scrapyard", "Car Scrapyard", 275000, "Any", "El Burro Heights"],
  ["customs", "Los Santos Customs", 349000, "Franklin", "Route 68"],
  ["hookies", "Hookies", 600000, "Michael / Trevor", "North Chumash"],
  ["pitchers", "Pitchers", 750000, "Any", "Downtown Vinewood"],
  ["tequila", "Tequi-la-la", 2000000, "Any", "West Vinewood"],
  ["doppler", "Cinema Doppler", 10000000, "Michael", "Downtown Vinewood"],
  ["ten-cent", "Ten Cent Theater", 20000000, "Michael", "Textile City"],
  ["tivoli", "Tivoli Cinema", 30000000, "Michael", "Morningwood"],
  ["golf", "Los Santos Golf Club", 150000000, "Any", "Richman"],
].map(([id, title, price, owner, area]) => ({
  id,
  title,
  price,
  owner,
  area,
  sources: ["powerpyx"],
}));
export const completionCategories = [
  {
    id: "story",
    title: "Story missions",
    total: 69,
    weight: 55,
    note: "Includes all five assassinations. Alternative heist approaches and endings are not all required.",
  },
  {
    id: "strangers",
    title: "Strangers & Freaks",
    total: 20,
    weight: 10,
    note: "Franklin’s list has 24 required steps; four do not increment the game’s 20-mission counter.",
  },
  {
    id: "hobbies",
    title: "Hobbies & pastimes",
    total: 42,
    weight: 10,
    note: "Bronze or better where a medal is required. Each shooting weapon category and each parachute group counts once.",
  },
  {
    id: "random",
    title: "Random events",
    total: 14,
    weight: 5,
    note: "Complete any 14 qualifying random events. More exist than you need.",
  },
  {
    id: "misc",
    title: "Miscellaneous",
    total: 16,
    weight: 20,
    note: "A mix of collectibles, purchases and leisure activities.",
  },
];
export const hobbies = [
  [
    "Shooting range",
    "Earn bronze in all three challenges for each weapon type.",
    [
      "Handguns",
      "Submachine guns",
      "Assault rifles",
      "Shotguns",
      "Light machine guns",
      "Heavy weapons",
    ],
  ],
  [
    "Flight school",
    "Bronze or better. LSIA; opens after Friends Reunited.",
    [
      "Training Take Off",
      "Runway Landing",
      "Inverted Flight",
      "Knife Flight",
      "Flat Hatting",
      "Touch Down",
      "Loop the Loop",
      "Helicopter Course",
      "Helicopter Speed Run",
      "Skydiving",
      "Drop Zone",
      "Earn Your Wings",
    ],
  ],
  [
    "Street races",
    "Franklin, after Shift Work; 20:00–05:00. Bronze or better.",
    [
      "South Los Santos / Shift Work",
      "City Circuit",
      "Airport",
      "Freeway",
      "Vespucci Canals",
    ],
  ],
  [
    "Off-road races",
    "Bronze or better.",
    [
      "Canyon Cliffs",
      "Ridge Run",
      "Mineward Spiral",
      "Valley Trail",
      "Lakeside",
      "Eco Friendly",
    ],
  ],
  [
    "Sea races",
    "After Hood Safari. Bronze or better.",
    ["East Coast", "North East Coast", "Raton Canyon", "Los Santos"],
  ],
  [
    "Triathlons",
    "Bronze or better.",
    ["Vespucci Canals", "Alamo Sea", "Coyote Cross Country"],
  ],
  [
    "Other activities",
    "These six entries finish the 42-item hobbies list.",
    [
      "Win a tennis match",
      "Win a darts game",
      "Nine holes of golf at par or under",
      "Get a private dance",
      "Complete all five base jumps",
      "Complete all eight helicopter jumps",
    ],
  ],
].map(([title, note, items], g) => ({
  title,
  note,
  items: items.map((title, i) => ({ id: `hobby-${g}-${i}`, title })),
  sources: ["completion", "powerpyx"],
}));
export const miscellaneous = [
  "Buy five income-producing properties",
  "Buy a vehicle through an in-game website",
  "Walk Chop and play fetch",
  "Complete a booty call",
  "Use a prostitute’s service",
  "Hold up one store",
  "Visit the cinema alone",
  "Go to the cinema with a friend",
  "Visit a bar with a friend",
  "Visit the strip club with a friend",
  "Play darts with a friend",
  "Collect all 50 spaceship parts",
  "Collect all 50 letter scraps",
  "Complete 25 of 50 stunt jumps",
  "Fly under 25 of 50 bridges",
  "Complete 8 of 15 knife flights",
].map((title, i) => ({
  id: `misc-${i}`,
  title,
  sources: ["completion", "powerpyx"],
}));
export const collectibles = [
  [
    "spaceship",
    "Spaceship parts",
    50,
    50,
    "Start Far Out after Fame or Shame. Return to Omega after collecting the parts.",
    "https://www.powerpyx.com/gta-v-all-spaceship-parts-locations/",
  ],
  [
    "letters",
    "Letter scraps",
    50,
    50,
    "All 50 lead to Franklin’s A Starlet in Vinewood mission.",
    "https://www.powerpyx.com/gta-v-all-letter-scraps-locations/",
  ],
  [
    "stunts",
    "Stunt jumps",
    50,
    25,
    "25 count toward 100%; all 50 are needed for the separate stunt-jump trophy.",
    "https://www.powerpyx.com/gta-v-all-monster-stunt-jump-locations/",
  ],
  [
    "bridges",
    "Under the bridge",
    50,
    25,
    "25 count toward 100%; the full set is a separate flying challenge.",
    "https://www.powerpyx.com/gta-v-all-under-the-bridge-locations/",
  ],
  [
    "knife",
    "Knife flights",
    15,
    8,
    "8 count toward 100%; fly sideways through the gaps shown in the location guide.",
    "https://www.powerpyx.com/gta-v-all-knife-flight-locations/",
  ],
].map(([id, title, total, required, note, url]) => ({
  id,
  title,
  total,
  required,
  note,
  url,
  sources: ["completion", "powerpyx"],
}));
export const playbook = [
  {
    id: "save",
    title: "Keep a clean save",
    group: "Essentials",
    body: "Use the in-game phone’s Quick Save before a cheat session or a major investment. Cheats suspend trophies for that session; restart the game and load your clean save before a trophy run.",
    sources: ["features", "rockstar"],
  },
  {
    id: "ability",
    title: "Use your character’s advantage",
    group: "Essentials",
    body: "Press L3 + R3: Michael slows shootouts, Franklin slows driving, and Trevor enters rage mode. The Recharge special ability cheat refills the meter.",
    link: "#/cheat/special-ability",
    label: "Recharge code",
    sources: ["features", "gtabase"],
  },
  {
    id: "taxi",
    title: "Cross the map by taxi",
    group: "Travel & vehicles",
    body: "Set a waypoint, call Downtown Cab Co. from Contacts, choose your destination and use the on-screen Skip Trip option. It also helps restart a disrupted mission after you move away from its marker.",
    sources: ["taxi", "features"],
  },
  {
    id: "impound",
    title: "Find an abandoned car",
    group: "Travel & vehicles",
    body: "Check the police impound for a recoverable abandoned vehicle; retrieval costs $250. A destroyed custom car is a different case—Story Mode has no Online-style insurance replacement.",
    sources: ["impound"],
  },
  {
    id: "menu",
    title: "Find things without opening the map",
    group: "Essentials",
    body: "Hold the touchpad for the Interaction Menu. Quick GPS can route you to useful locations; the same menu holds inventory and objective shortcuts.",
    sources: ["features"],
  },
  {
    id: "sleep",
    title: "Advance time deliberately",
    group: "Money & time",
    body: "Sleeping advances time by 6 hours as Michael, 8 as Franklin or 12 as Trevor. Check your portfolio between sleeps when watching an assassination investment.",
    sources: ["sleep", "stocks"],
  },
  {
    id: "packie",
    title: "Recruit Packie",
    group: "People & unlocks",
    body: "Help the robbers escape at Strawberry Avenue and Forum Drive in the Getaway Driver random event. Packie becomes a heist gunman option.",
    url: "https://www.gtabase.com/grand-theft-auto-v/side-missions/random-events#section-30-getaway-driver",
    sources: ["random"],
  },
  {
    id: "taliana",
    title: "Recruit Taliana",
    group: "People & unlocks",
    body: "After The Jewel Store Job, look for Crash Rescue on Great Ocean Highway near Mount Chiliad. Get the injured driver to safety promptly to unlock a skilled 5% heist driver.",
    url: "https://www.gtabase.com/grand-theft-auto-v/side-missions/random-events#section-22-crash-rescue",
    sources: ["random"],
  },
  {
    id: "bike",
    title: "Return a stolen bicycle",
    group: "Money & time",
    body: "The Bike Thief City 1 event is on Little Bighorn Avenue in Rancho. Return the bike and the grateful owner later sends $100,000 in Animal Ark shares.",
    url: "https://www.gtabase.com/grand-theft-auto-v/side-missions/random-events#section-6-bike-thief-city-1",
    sources: ["random"],
  },
  {
    id: "duke",
    title: "Unlock Duke O’Death",
    group: "People & unlocks",
    body: "Find Duel near the gas station west of Los Santos Customs on Route 68. Take the Duke and survive the ambush to unlock the car and its spawn cheat.",
    link: "#/cheat/duke-odeath",
    label: "Duke code",
    sources: ["random", "gtabase"],
  },
  {
    id: "dodo",
    title: "Unlock the Dodo",
    group: "People & unlocks",
    body: "After Nervous Ron, find Sea Plane in the cove east of RON Alternates Wind Farm. Deal with the guards and take the Dodo to unlock its spawn cheat.",
    link: "#/cheat/dodo",
    label: "Dodo code",
    sources: ["random", "gtabase"],
  },
  {
    id: "kraken",
    title: "Unlock the Kraken",
    group: "People & unlocks",
    body: "After Franklin’s first Paparazzo mission, look for the Tourist Board email. Photograph all 20 animals to earn the Kraken at the Cape Catfish pier.",
    link: "#/wildlife",
    label: "Animal checklist",
    sources: ["wildlife", "gtabase"],
  },
];
