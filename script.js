/* ================= STATIC DATA ================= */
const ALL_SKILLS = [
  "Astrogation","Athletics","Brawl","Computers","Coordination","Cool","Deception","Discipline",
  "Leadership","Mechanics","Medicine","Negotiation","Perception","Piloting (Planetary)","Piloting (Space)",
  "Resilience","Skulduggery","Stealth","Streetwise","Survival","Vigilance","Lightsaber"
];

// Full skill -> attribute mapping (covers every skill above)
const skillAttributes = {
  "Brawn": ["Athletics","Brawl","Resilience","Lightsaber"],
  "Agility": ["Piloting (Planetary)","Piloting (Space)","Coordination","Stealth"],
  "Intellect": ["Computers","Mechanics","Medicine","Astrogation","Perception"],
  "Cunning": ["Deception","Skulduggery","Streetwise","Survival"],
  "Willpower": ["Discipline","Vigilance"],
  "Presence": ["Cool","Negotiation","Leadership"]
};

/* Dice face filenames - these should exist in a 'dice/' folder next to the HTML */ 
const diceFaces = { 
  ability: ["green_blank.jpg","green_success.jpg","green_success.jpg","green_success_success.jpg","green_success_adv.jpg","green_advantage.jpg","green_advantage.jpg","green_advantage_advantage.jpg"], 
  proficiency: ["yellow_blank.jpg","yellow_success.jpg","yellow_success.jpg","yellow_success_adv.jpg","yellow_success_adv.jpg","yellow_success_adv.jpg","yellow_success_success.jpg","yellow_success_success.jpg","yellow_advantage.jpg","yellow_advantage_adv.jpg","yellow_advantage_adv.jpg","yellow_triumph.jpg"], 
  boost: ["blue_blank.jpg","blue_blank.jpg","blue_success.jpg","blue_success_adv.jpg","blue_advantage.jpg","blue_advantage_adv.jpg"], 
  difficulty: ["purple_blank.jpg","purple_failure.jpg","purple_failure_failure.jpg","purple_failure_threat.jpg","purple_threat.jpg","purple_threat.jpg","purple_threat.jpg","purple_threat_threat.jpg"], 
  challenge: ["red_blank.jpg","red_failure.jpg","red_failure.jpg","red_failure_failure.jpg","red_failure_failure.jpg","red_failure_threat.jpg","red_failure_threat.jpg","red_threat.jpg","red_threat.jpg","red_threat_threat.jpg","red_threat_threat.jpg","red_despair.jpg"], 
  setback: ["black_blank.jpg","black_blank.jpg","black_failure.jpg","black_failure.jpg","black_threat.jpg","black_threat.jpg"], 
  force: ["white_light.jpg","white_light.jpg","white_dark.jpg","white_dark.jpg","white_dark.jpg","white_dark.jpg","white_dark.jpg","white_dark.jpg","white_dark_dark.jpg","white_light_light.jpg","white_light_light.jpg","white_light_light.jpg"] 
};

/* ================= STATE ================= */
let characters = [];
let selectedIndex = null;
let destiny = { light: 0, dark: 0 };

/* ================= STORAGE ================= */
function saveToStorage() {
  localStorage.setItem("ffgChars", JSON.stringify(characters));
}
function loadFromStorage() {
  const d = localStorage.getItem("ffgChars");
  if (d) characters = JSON.parse(d);
}

function saveDestiny() {
  localStorage.setItem("ffgDestiny", JSON.stringify(destiny));
}
function loadDestiny() {
  const d = localStorage.getItem("ffgDestiny");
  if (!d) return;
  try {
    const parsed = JSON.parse(d);
    destiny.light = parsed.light || 0;
    destiny.dark  = parsed.dark  || 0;
  } catch {
    destiny = { light:0, dark:0 };
  }
}

/* ================= HELPERS TO ENSURE NEW FIELDS EXIST ================= */
function ensureShipShape(c) {
  if (!c.ship) {
    c.ship = {
      name:"", model:"",
      silhouette:0, speed:0, handling:0, armor:0,
      hullTraumaThreshold:0, hullTraumaCurrent:0,
      systemStrainThreshold:0, systemStrainCurrent:0,
      defenseFore:0, defenseAft:0, defensePort:0, defenseStarboard:0,
      notes:"",
      weapons:[]
    };
  } else {
    if (!Array.isArray(c.ship.weapons)) c.ship.weapons = [];
    c.ship.silhouette = c.ship.silhouette || 0;
    c.ship.speed      = c.ship.speed      || 0;
    c.ship.handling   = c.ship.handling   || 0;
    c.ship.armor      = c.ship.armor      || 0;
    c.ship.hullTraumaThreshold   = c.ship.hullTraumaThreshold   || 0;
    c.ship.hullTraumaCurrent     = c.ship.hullTraumaCurrent     || 0;
    c.ship.systemStrainThreshold = c.ship.systemStrainThreshold || 0;
    c.ship.systemStrainCurrent   = c.ship.systemStrainCurrent   || 0;
    c.ship.defenseFore      = c.ship.defenseFore      || 0;
    c.ship.defenseAft       = c.ship.defenseAft       || 0;
    c.ship.defensePort      = c.ship.defensePort      || 0;
    c.ship.defenseStarboard = c.ship.defenseStarboard || 0;
    c.ship.notes = c.ship.notes || "";
  }
}

function ensureCharacterShape(c) {
  if (!c.stats) c.stats = {};
  ["Brawn","Agility","Intellect","Cunning","Willpower","Presence"].forEach(k => {
    if (typeof c.stats[k] !== 'number') c.stats[k] = 0;
  });

  if (!c.skills) c.skills = {};

  if (!c.xp) {
    c.xp = { starting: 0, earned: 0, spent: 0 };
  } else {
    c.xp.starting = c.xp.starting || 0;
    c.xp.earned   = c.xp.earned   || 0;
    c.xp.spent    = c.xp.spent    || 0;
  }

  if (!Array.isArray(c.specializations)) c.specializations = [];
  if (!Array.isArray(c.talents))         c.talents         = [];
  if (!Array.isArray(c.weapons))         c.weapons         = [];
  if (!Array.isArray(c.armor))           c.armor           = [];
  if (!Array.isArray(c.criticalInjuries)) c.criticalInjuries = [];

  if (typeof c.woundThreshold !== 'number') c.woundThreshold = 0;
  if (typeof c.strainThreshold !== 'number') c.strainThreshold = 0;

  if (!c.portrait) c.portrait = ""; // NEW: portrait URL/data

  ensureShipShape(c);
}

/* ================= RENDERING ================= */
function refreshCharList() {
  const list = document.getElementById("charList");
  list.innerHTML = "";
  characters.forEach((c,i) => {
    const div = document.createElement("div");
    div.className = "char-item" + (i === selectedIndex ? " active" : "");
    div.textContent = c.name || "(Unnamed)";
    div.onclick = () => openCharacter(i);
    list.appendChild(div);
  });
}

function renderStats(stats) {
  const statGrid = document.getElementById("stats");
  statGrid.innerHTML = "";
  ["Brawn","Agility","Intellect","Cunning","Willpower","Presence"].forEach(s => {
    const wrapper = document.createElement("div");
    wrapper.className = "stat";
    wrapper.innerHTML = `
      <div>${s}</div>
      <input type="number" min="0" value="${stats?.[s] || 0}" data-stat="${s}" />
    `;
    statGrid.appendChild(wrapper);
  });
}

function renderSkills(skills) {
  const skillList = document.getElementById("skillList");
  skillList.innerHTML = "";

  ALL_SKILLS.forEach(skill => {
    if (!skills[skill]) skills[skill] = { rank: 0 };
    const rank = skills[skill].rank || 0;

    // find attribute for this skill
    const attr = Object.keys(skillAttributes).find(a => skillAttributes[a].includes(skill));
    const attrValue = (selectedIndex !== null &&
                       characters[selectedIndex] &&
                       characters[selectedIndex].stats &&
                       characters[selectedIndex].stats[attr])
                       ? characters[selectedIndex].stats[attr]
                       : 0;

    const container = document.createElement("div");
    container.className = "skill";

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;min-width:220px;">
        <strong style="font-size:13px; cursor:pointer">${skill}</strong>
        <span style="font-size:11px;color:var(--muted)">
          ${attr || "—"}: ${attrValue} + Rank: ${rank}
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <input type="number" min="0" max="5" value="${rank}" data-skill="${skill}" style="width:52px"/>
        <div class="skillDice" title="Click to load dice pool"></div>
      </div>
    `;

    // CLICK ON SKILL NAME TO AUTO-FILL DICE POOL
    const nameDiv = container.querySelector("strong");
    nameDiv.onclick = () => {
      const proficiencyDice = Math.min(attrValue, rank);
      const abilityDice = Math.max(attrValue, rank) - proficiencyDice;

      document.getElementById("diceAbility").value = abilityDice;
      document.getElementById("diceProficiency").value = proficiencyDice;

      container.style.boxShadow = "0 0 8px 2px rgba(68,215,255,0.18)";
      setTimeout(() => container.style.boxShadow = "", 300);
    };

    // rank input handling
    const input = container.querySelector('input[data-skill]');
    input.oninput = (e) => {
      const v = parseInt(e.target.value) || 0;
      skills[skill].rank = v;
      saveToStorage();
      renderSkills(skills);
    };

    // dice dot visualization
    const diceDiv = container.querySelector(".skillDice");
    let total = Math.max(rank, attrValue);
    let upgrades = Math.min(rank, attrValue);
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("span");
      dot.className = "dice-dot " + (upgrades > 0 ? "proficiency" : "ability");
      upgrades--;
      diceDiv.appendChild(dot);
    }

    diceDiv.onclick = () => {
      const proficiencyDice = Math.min(attrValue, rank);
      const abilityDice = Math.max(attrValue, rank) - proficiencyDice;

      document.getElementById("diceAbility").value = abilityDice;
      document.getElementById("diceProficiency").value = proficiencyDice;

      diceDiv.style.boxShadow = "0 0 8px rgba(68,215,255,0.18)";
      setTimeout(() => diceDiv.style.boxShadow = "", 300);
    };

    skillList.appendChild(container);
  });
}

/* === XP RENDER/UPDATE === */
function renderXP(c) {
  const xp = c.xp || { starting: 0, earned: 0, spent: 0 };
  document.getElementById("xpStarting").value = xp.starting || 0;
  document.getElementById("xpEarned").value   = xp.earned   || 0;
  document.getElementById("xpSpent").value    = xp.spent    || 0;
  updateAvailableXP();
}

function updateAvailableXP() {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  c.xp = c.xp || { starting: 0, earned: 0, spent: 0 };

  c.xp.starting = +document.getElementById("xpStarting").value || 0;
  c.xp.earned   = +document.getElementById("xpEarned").value   || 0;
  c.xp.spent    = +document.getElementById("xpSpent").value    || 0;

  const available = c.xp.starting + c.xp.earned - c.xp.spent;
  document.getElementById("xpAvailable").textContent = available;

  saveToStorage();
}

/* === DESTINY POOL RENDER === */
function renderDestiny() {
  const lightDots = document.getElementById("destinyLightDots");
  const darkDots  = document.getElementById("destinyDarkDots");
  if (!lightDots || !darkDots) return;

  lightDots.innerHTML = "";
  darkDots.innerHTML  = "";

  for (let i = 0; i < destiny.light; i++) {
    const dot = document.createElement("span");
    dot.className = "destiny-dot light";
    lightDots.appendChild(dot);
  }
  for (let i = 0; i < destiny.dark; i++) {
    const dot = document.createElement("span");
    dot.className = "destiny-dot dark";
    darkDots.appendChild(dot);
  }
}

/* === SPECIALIZATIONS === */
function renderSpecializations(c) {
  const container = document.getElementById("specList");
  container.innerHTML = "";
  c.specializations.forEach((spec, idx) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <input type="text" placeholder="Name" value="${spec.name || ""}" data-field="name" data-index="${idx}">
      <input type="text" placeholder="Source (book/page)" value="${spec.source || ""}" data-field="source" data-index="${idx}">
      <input type="text" placeholder="Notes" value="${spec.notes || ""}" data-field="notes" data-index="${idx}">
      <button type="button" class="mini-btn danger" data-remove="${idx}">✕</button>
    `;
    row.querySelectorAll("input").forEach(input => {
      input.oninput = (e) => {
        const i = parseInt(e.target.dataset.index,10);
        const field = e.target.dataset.field;
        c.specializations[i][field] = e.target.value;
        saveToStorage();
      };
    });
    row.querySelector("button[data-remove]").onclick = () => {
      c.specializations.splice(idx,1);
      saveToStorage();
      renderSpecializations(c);
    };
    container.appendChild(row);
  });
}

/* === TALENTS === */
function renderTalents(c) {
  const container = document.getElementById("talentList");
  container.innerHTML = "";
  c.talents.forEach((tal, idx) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <input type="text" placeholder="Talent name" value="${tal.name || ""}" data-field="name" data-index="${idx}">
      <input type="number" min="0" class="tiny" placeholder="Rank" value="${tal.rank || 0}" data-field="rank" data-index="${idx}">
      <input type="text" class="short" placeholder="Activation" value="${tal.activation || ""}" data-field="activation" data-index="${idx}">
      <input type="text" placeholder="Effect summary" value="${tal.summary || ""}" data-field="summary" data-index="${idx}">
      <input type="text" class="short" placeholder="Source" value="${tal.source || ""}" data-field="source" data-index="${idx}">
      <button type="button" class="mini-btn danger" data-remove="${idx}">✕</button>
    `;

    row.querySelectorAll("input").forEach(input => {
      input.oninput = (e) => {
        const i = parseInt(e.target.dataset.index,10);
        const field = e.target.dataset.field;
        if (field === "rank") {
          c.talents[i][field] = +e.target.value || 0;
        } else {
          c.talents[i][field] = e.target.value;
        }
        saveToStorage();
      };
    });

    row.querySelector("button[data-remove]").onclick = () => {
      c.talents.splice(idx,1);
      saveToStorage();
      renderTalents(c);
    };

    container.appendChild(row);
  });
}

/* === WEAPONS === */
function renderWeapons(c) {
  const container = document.getElementById("weaponList");
  container.innerHTML = "";
  c.weapons.forEach((w, idx) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <input type="text" placeholder="Name" value="${w.name || ""}" data-field="name" data-index="${idx}">
      <input type="text" placeholder="Skill" value="${w.skill || ""}" data-field="skill" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Dmg" value="${w.damage || ""}" data-field="damage" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Crit" value="${w.crit || ""}" data-field="crit" data-index="${idx}">
      <input type="text" class="short" placeholder="Range" value="${w.range || ""}" data-field="range" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Enc" value="${w.encumbrance || ""}" data-field="encumbrance" data-index="${idx}">
      <input type="number" class="tiny" placeholder="HP" value="${w.hp || ""}" data-field="hp" data-index="${idx}">
      <input type="text" placeholder="Qualities" value="${w.qualities || ""}" data-field="qualities" data-index="${idx}">
      <button type="button" class="mini-btn danger" data-remove="${idx}">✕</button>
    `;

    row.querySelectorAll("input").forEach(input => {
      input.oninput = (e) => {
        const i = parseInt(e.target.dataset.index,10);
        const field = e.target.dataset.field;
        if (["damage","crit","encumbrance","hp"].includes(field)) {
          c.weapons[i][field] = +e.target.value || 0;
        } else {
          c.weapons[i][field] = e.target.value;
        }
        saveToStorage();
      };
    });

    row.querySelector("button[data-remove]").onclick = () => {
      c.weapons.splice(idx,1);
      saveToStorage();
      renderWeapons(c);
    };

    container.appendChild(row);
  });
}

/* === ARMOR === */
function renderArmor(c) {
  const container = document.getElementById("armorList");
  container.innerHTML = "";
  c.armor.forEach((a, idx) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <input type="text" placeholder="Armor name" value="${a.name || ""}" data-field="name" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Soak" value="${a.soak || ""}" data-field="soak" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Def" value="${a.defense || ""}" data-field="defense" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Enc" value="${a.encumbrance || ""}" data-field="encumbrance" data-index="${idx}">
      <input type="text" placeholder="Qualities" value="${a.qualities || ""}" data-field="qualities" data-index="${idx}">
      <button type="button" class="mini-btn danger" data-remove="${idx}">✕</button>
    `;

    row.querySelectorAll("input").forEach(input => {
      input.oninput = (e) => {
        const i = parseInt(e.target.dataset.index,10);
        const field = e.target.dataset.field;
        if (["soak","defense","encumbrance"].includes(field)) {
          c.armor[i][field] = +e.target.value || 0;
        } else {
          c.armor[i][field] = e.target.value;
        }
        saveToStorage();
      };
    });

    row.querySelector("button[data-remove]").onclick = () => {
      c.armor.splice(idx,1);
      saveToStorage();
      renderArmor(c);
    };

    container.appendChild(row);
  });
}

/* === CRITICAL INJURIES === */
function renderCriticalInjuries(c) {
  const container = document.getElementById("critList");
  container.innerHTML = "";
  c.criticalInjuries.forEach((ci, idx) => {
    const row = document.createElement("div");
    row.className = "list-row crit-row" + (ci.healed ? " healed" : "");
    row.innerHTML = `
      <input type="text" placeholder="Injury name" value="${ci.name || ""}" data-field="name" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Severity" value="${ci.severity || ""}" data-field="severity" data-index="${idx}">
      <input type="text" placeholder="Effect" value="${ci.effect || ""}" data-field="effect" data-index="${idx}">
      <label style="display:flex;align-items:center;gap:4px;font-size:11px;">
        <input type="checkbox" data-field="healed" data-index="${idx}" ${ci.healed ? "checked" : ""}> Healed
      </label>
      <button type="button" class="mini-btn danger" data-remove="${idx}">✕</button>
    `;

    // Inputs for fields
    row.querySelectorAll("input[type=text], input[type=number]").forEach(input => {
      input.oninput = (e) => {
        const i = parseInt(e.target.dataset.index,10);
        const field = e.target.dataset.field;
        if (field === "severity") {
          c.criticalInjuries[i][field] = +e.target.value || 0;
        } else {
          c.criticalInjuries[i][field] = e.target.value;
        }
        saveToStorage();
      };
    });

    // Checkbox for healed
    const healedBox = row.querySelector('input[type=checkbox][data-field="healed"]');
    healedBox.onchange = (e) => {
      const i = parseInt(e.target.dataset.index,10);
      c.criticalInjuries[i].healed = !!e.target.checked;
      if (c.criticalInjuries[i].healed) {
        row.classList.add("healed");
      } else {
        row.classList.remove("healed");
      }
      saveToStorage();
    };

    row.querySelector("button[data-remove]").onclick = () => {
      c.criticalInjuries.splice(idx,1);
      saveToStorage();
      renderCriticalInjuries(c);
    };

    container.appendChild(row);
  });
}

/* === SHIP === */
function renderShipWeapons(c) {
  const ship = c.ship;
  const container = document.getElementById("shipWeaponList");
  container.innerHTML = "";
  ship.weapons.forEach((w, idx) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <input type="text" placeholder="Weapon name" value="${w.name || ""}" data-field="name" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Dmg" value="${w.damage || ""}" data-field="damage" data-index="${idx}">
      <input type="number" class="tiny" placeholder="Crit" value="${w.crit || ""}" data-field="crit" data-index="${idx}">
      <input type="text" class="short" placeholder="Range" value="${w.range || ""}" data-field="range" data-index="${idx}">
      <input type="text" class="short" placeholder="Arc" value="${w.arc || ""}" data-field="arc" data-index="${idx}">
      <input type="text" placeholder="Qualities" value="${w.qualities || ""}" data-field="qualities" data-index="${idx}">
      <button type="button" class="mini-btn danger" data-remove="${idx}">✕</button>
    `;

    row.querySelectorAll("input").forEach(input => {
      input.oninput = (e) => {
        const i = parseInt(e.target.dataset.index,10);
        const field = e.target.dataset.field;
        if (["damage","crit"].includes(field)) {
          ship.weapons[i][field] = +e.target.value || 0;
        } else {
          ship.weapons[i][field] = e.target.value;
        }
        saveToStorage();
      };
    });

    row.querySelector("button[data-remove]").onclick = () => {
      ship.weapons.splice(idx,1);
      saveToStorage();
      renderShipWeapons(c);
    };

    container.appendChild(row);
  });
}

function renderShip(c) {
  ensureShipShape(c);
  const ship = c.ship;

  const map = [
    ["shipName","name","text"],
    ["shipModel","model","text"],
    ["shipSilhouette","silhouette","number"],
    ["shipSpeed","speed","number"],
    ["shipHandling","handling","number"],
    ["shipArmor","armor","number"],
    ["shipHullThreshold","hullTraumaThreshold","number"],
    ["shipHullCurrent","hullTraumaCurrent","number"],
    ["shipStrainThreshold","systemStrainThreshold","number"],
    ["shipStrainCurrent","systemStrainCurrent","number"],
    ["shipDefenseFore","defenseFore","number"],
    ["shipDefenseAft","defenseAft","number"],
    ["shipDefensePort","defensePort","number"],
    ["shipDefenseStarboard","defenseStarboard","number"],
    ["shipNotes","notes","text"]
  ];

  map.forEach(([id, field, type]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = type === "number" ? (ship[field] ?? 0) : (ship[field] || "");
    el.oninput = (e) => {
      if (type === "number") {
        ship[field] = +e.target.value || 0;
      } else {
        ship[field] = e.target.value;
      }
      saveToStorage();
    };
  });

  renderShipWeapons(c);
}

/* === WOUND / STRAIN UI HIGHLIGHT === */
function updateWoundStrainUI() {
  if (selectedIndex === null) return;
  const woundInput  = document.getElementById("wounds");
  const strainInput = document.getElementById("strain");
  const woundThrEl  = document.getElementById("woundThreshold");
  const strainThrEl = document.getElementById("strainThreshold");
  if (!woundInput || !strainInput || !woundThrEl || !strainThrEl) return;

  const w  = +woundInput.value  || 0;
  const wt = +woundThrEl.value  || 0;
  const s  = +strainInput.value || 0;
  const st = +strainThrEl.value || 0;

  woundInput.classList.toggle("danger", wt > 0 && w >= wt);
  strainInput.classList.toggle("danger", st > 0 && s >= st);
}

/* === PORTRAIT RENDER === */
function renderPortrait(c) {
  const img = document.getElementById("portraitPreview");
  const placeholder = document.getElementById("portraitPlaceholder");
  if (!img || !placeholder) return;

  if (c.portrait) {
    img.src = c.portrait;
    img.style.display = "block";
    placeholder.style.display = "none";
  } else {
    img.src = "";
    img.style.display = "none";
    placeholder.style.display = "block";
  }
}

/* ================= CHARACTER EDIT / OPEN ================= */
function openCharacter(index) {
  selectedIndex = index;
  const c = characters[index];
  ensureCharacterShape(c);

  document.getElementById("editorForm").style.display = "block";
  document.getElementById("charNameDisplay").textContent = c.name || "(Unnamed)";
  document.getElementById("name").value = c.name || "";
  document.getElementById("species").value = c.species || "";
  document.getElementById("career").value = c.career || "";
  document.getElementById("notes").value = c.notes || "";
  document.getElementById("wounds").value = c.wounds || 0;
  document.getElementById("strain").value = c.strain || 0;
  document.getElementById("soak").value = c.soak || 0;
  document.getElementById("defense").value = c.defense || 0;
  document.getElementById("gear").value = c.gear || "";
  document.getElementById("woundThreshold").value = c.woundThreshold || 0;
  document.getElementById("strainThreshold").value = c.strainThreshold || 0;

  renderPortrait(c);
  renderStats(c.stats);
  renderSkills(c.skills);
  renderXP(c);
  renderSpecializations(c);
  renderTalents(c);
  renderWeapons(c);
  renderArmor(c);
  renderCriticalInjuries(c);
  renderShip(c);
  updateWoundStrainUI();
  refreshCharList();
}

/* ================= SAVE (BASIC FIELDS) ================= */
document.getElementById("saveBtn").onclick = () => {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  c.name = document.getElementById("name").value;
  c.species = document.getElementById("species").value;
  c.career = document.getElementById("career").value;
  c.notes = document.getElementById("notes").value;
  c.wounds = +document.getElementById("wounds").value || 0;
  c.strain = +document.getElementById("strain").value || 0;
  c.soak = +document.getElementById("soak").value || 0;
  c.defense = +document.getElementById("defense").value || 0;
  c.gear = document.getElementById("gear").value;
  c.woundThreshold = +document.getElementById("woundThreshold").value || 0;
  c.strainThreshold = +document.getElementById("strainThreshold").value || 0;

  // stats
  c.stats = {};
  document.querySelectorAll("#stats input").forEach(i => {
    c.stats[i.dataset.stat] = +i.value || 0;
  });

  saveToStorage();
  refreshCharList();
  updateWoundStrainUI();
};

/* Bind XP inputs once */
["xpStarting","xpEarned","xpSpent"].forEach(id => {
  const el = document.getElementById(id);
  el.oninput = updateAvailableXP;
});

/* Bind threshold inputs for live saving & highlight */
["woundThreshold","strainThreshold"].forEach(id => {
  const el = document.getElementById(id);
  el.oninput = () => {
    if (selectedIndex === null) return;
    const c = characters[selectedIndex];
    if (id === "woundThreshold") c.woundThreshold = +el.value || 0;
    if (id === "strainThreshold") c.strainThreshold = +el.value || 0;
    saveToStorage();
    updateWoundStrainUI();
  };
});

/* Bind tracker +/- buttons */
document.querySelectorAll(".tracker-btn").forEach(btn => {
  btn.onclick = () => {
    if (selectedIndex === null) return;
    const field = btn.dataset.track;
    const delta = parseInt(btn.dataset.delta, 10) || 0;
    const input = document.getElementById(field);
    let val = +input.value || 0;
    val += delta;
    if (val < 0) val = 0;
    input.value = val;
    const c = characters[selectedIndex];
    c[field] = val;
    saveToStorage();
    updateWoundStrainUI();
  };
});

/* === PORTRAIT UPLOAD/CLEAR === */
const portraitUploadBtn = document.getElementById("portraitUploadBtn");
const portraitClearBtn  = document.getElementById("portraitClearBtn");
const portraitFileInput = document.getElementById("portraitFile");

portraitUploadBtn.onclick = () => {
  if (selectedIndex === null) return;
  portraitFileInput.click();
};

portraitFileInput.onchange = (e) => {
  if (selectedIndex === null) return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const c = characters[selectedIndex];
    c.portrait = reader.result; // data URL
    saveToStorage();
    renderPortrait(c);
    // reset input so same file can be chosen again later if needed
    portraitFileInput.value = "";
  };
  reader.readAsDataURL(file);
};

portraitClearBtn.onclick = () => {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  c.portrait = "";
  saveToStorage();
  renderPortrait(c);
};

/* ================= DICE ROLLER ================= */
function rollDice() {
  const counts = {
    ability: +document.getElementById("diceAbility").value || 0,
    proficiency: +document.getElementById("diceProficiency").value || 0,
    boost: +document.getElementById("diceBoost").value || 0,
    difficulty: +document.getElementById("diceDifficulty").value || 0,
    challenge: +document.getElementById("diceChallenge").value || 0,
    setback: +document.getElementById("diceSetback").value || 0,
    force: +document.getElementById("diceForce").value || 0
  };

  const result = {
    success: 0, advantage: 0, failure: 0, threat: 0,
    triumph: 0, despair: 0, forceLight: 0, forceDark: 0
  };

  const resultDiv = document.getElementById("diceResult");
  resultDiv.innerHTML = "";

  function showFace(fname) {
    const img = document.createElement("img");
    img.src = "dice/" + fname;
    img.style.width = "36px";
    img.style.height = "36px";
    img.style.margin = "2px";
    img.dataset.face = fname;
    img.onerror = function () {
      const name = (this.dataset.face || "").toLowerCase();
      const prefix = name.split("_")[0] || "";
      const map = {
        green: "🟢", yellow: "🟡", purple: "🟣",
        red: "🔴", blue: "🔵", black: "⚫", white: "⚪"
      };
      const span = document.createElement("span");
      span.textContent = map[prefix] || "🎲";
      span.style.fontSize = "20px";
      span.style.margin = "6px";
      this.replaceWith(span);
    };
    resultDiv.appendChild(img);
  }

  function pickFace(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  Object.keys(counts).forEach(type => {
    const num = counts[type];
    if (!num) return;
    for (let i = 0; i < num; i++) {
      const face = pickFace(diceFaces[type]);
      showFace(face);
      const f = face.toLowerCase();

      if (type === "ability") {
        if (f.includes("success_success")) result.success += 2;
        else if (f.includes("success_adv")) {
          result.success += 1;
          result.advantage += 1;
        } else if (f.includes("success")) {
          result.success += 1;
        }

        if (f.includes("advantage_advantage")) result.advantage += 2;
        else if (f.includes("advantage")) result.advantage += 1;
      }
      else if (type === "proficiency") {
        if (f.includes("triumph")) {
          result.triumph += 1;
          result.success += 1;
        }
        if (f.includes("success_success")) result.success += 2;
        else if (f.includes("success_adv")) {
          result.success += 1;
          result.advantage += 1;
        } else if (f.includes("success")) {
          result.success += 1;
        }

        if (f.includes("advantage_advantage")) result.advantage += 2;
        else if (f.includes("advantage")) result.advantage += 1;
      }
      else if (type === "boost") {
        if (f.includes("success_adv")) {
          result.success += 1;
          result.advantage += 1;
        } else if (f.includes("success")) {
          result.success += 1;
        }

        if (f.includes("advantage_advantage")) result.advantage += 2;
        else if (f.includes("advantage")) result.advantage += 1;
      }
      else if (type === "difficulty") {
        if (f.includes("failure_failure")) result.failure += 2;
        else if (f.includes("failure")) result.failure += 1;

        if (f.includes("threat_threat")) result.threat += 2;
        else if (f.includes("threat")) result.threat += 1;
      }
      else if (type === "challenge") {
        if (f.includes("despair")) {
          result.despair += 1;
          result.failure += 1;
        }
        if (f.includes("triumph")) {
          result.triumph += 1;
          result.success += 1;
        }

        if (f.includes("failure_failure")) result.failure += 2;
        else if (f.includes("failure")) result.failure += 1;

        if (f.includes("threat_threat")) result.threat += 2;
        else if (f.includes("threat")) result.threat += 1;
      }
      else if (type === "setback") {
        if (f.includes("failure")) result.failure += 1;
        if (f.includes("threat")) result.threat += 1;
      }
      else if (type === "force") {
        if (f.includes("light")) result.forceLight += 1;
        if (f.includes("dark")) result.forceDark += 1;
      }
    }
  });

  const netSuccess = result.success - result.failure;
  const netAdv = result.advantage - result.threat;
  const outcome = netSuccess > 0 ? "Success" : "Fail";

  const netDiv = document.getElementById("netResult");
  netDiv.innerHTML = `
    <span class="${netSuccess>0?'net-positive':netSuccess<0?'net-negative':'net-neutral'}">
      Success: ${netSuccess}
    </span> &nbsp;
    <span class="${netAdv>0?'net-positive':netAdv<0?'net-negative':'net-neutral'}">
      Advantage: ${netAdv}
    </span> &nbsp;
    <span class="net-neutral">Triumph: ${result.triumph}</span> &nbsp;
    <span class="net-neutral">Despair: ${result.despair}</span> &nbsp;
    <span class="net-neutral">Force ▶︎ Light: ${result.forceLight} / Dark: ${result.forceDark}</span> <br/>
    <strong class="${netSuccess>0?'net-positive':'net-negative'}" style="margin-top:4px; display:block;">
      Outcome: ${outcome}
    </strong>
  `;
}

/* ================= BUTTONS / UTILITIES ================= */
document.getElementById("rollDiceBtn").onclick = rollDice;

document.getElementById("clearDiceBtn").onclick = () => {
  document.getElementById("diceResult").innerHTML = "";
  document.getElementById("netResult").innerHTML = "";
  ["diceAbility","diceProficiency","diceBoost","diceDifficulty","diceChallenge","diceSetback","diceForce"]
    .forEach(id => document.getElementById(id).value = 0);
};

// Increment negative dice buttons
document.querySelectorAll(".negativeDiceBtn").forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.type;
    const input = document.getElementById(
      "dice" + type.charAt(0).toUpperCase() + type.slice(1)
    );
    input.value = (+input.value || 0) + 1;
  };
});

document.getElementById("newBtn").onclick = () => {
  const baseStats = {Brawn:0,Agility:0,Intellect:0,Cunning:0,Willpower:0,Presence:0};
  const c = {
    name:"New Character", species:"", career:"", notes:"",
    wounds:0, strain:0, soak:0, defense:0, gear:"",
    stats: {...baseStats}, skills:{},
    xp: { starting:0, earned:0, spent:0 },
    specializations: [],
    talents: [],
    weapons: [],
    armor: [],
    criticalInjuries: [],
    woundThreshold:0,
    strainThreshold:0,
    portrait:"",
    ship: {
      name:"", model:"",
      silhouette:0, speed:0, handling:0, armor:0,
      hullTraumaThreshold:0, hullTraumaCurrent:0,
      systemStrainThreshold:0, systemStrainCurrent:0,
      defenseFore:0, defenseAft:0, defensePort:0, defenseStarboard:0,
      notes:"",
      weapons:[]
    }
  };
  characters.push(c);
  saveToStorage();
  refreshCharList();
};

document.getElementById("duplicateBtn").onclick = () => {
  if (selectedIndex === null) return;
  const copy = JSON.parse(JSON.stringify(characters[selectedIndex]));
  copy.name = (copy.name || "Character") + " (Copy)";
  characters.push(copy);
  saveToStorage();
  refreshCharList();
};

document.getElementById("deleteBtn").onclick = () => {
  if (selectedIndex === null) return;
  if (!confirm("Delete this character?")) return;
  characters.splice(selectedIndex, 1);
  selectedIndex = null;
  saveToStorage();
  refreshCharList();
  document.getElementById("editorForm").style.display = "none";
  document.getElementById("charNameDisplay").textContent = "— select a character —";
};

document.getElementById("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(characters, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "characters.json";
  a.click();
};

document.getElementById("importBtn").onclick = () =>
  document.getElementById("importFile").click();

document.getElementById("importFile").onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const imported = JSON.parse(r.result || "[]");
      if (Array.isArray(imported)) characters = imported;
      else throw new Error("Invalid format");
      saveToStorage();
      refreshCharList();
      selectedIndex = null;
      document.getElementById("editorForm").style.display = "none";
      document.getElementById("charNameDisplay").textContent = "— select a character —";
    } catch(err) {
      alert("Import failed: invalid JSON");
    }
  };
  r.readAsText(file);
};

document.getElementById("seedBtn").onclick = () => {
  characters = [{
    name:"Han Solo", species:"Human", career:"Smuggler",
    notes:"Never tell me the odds.",
    wounds:3, strain:2, soak:4, defense:1, gear:"DL-44, Millennium Falcon",
    stats:{Brawn:2,Agility:3,Intellect:2,Cunning:3,Willpower:2,Presence:3},
    skills:{ "Piloting (Space)":{rank:2}, Deception:{rank:1}, Mechanics:{rank:1} },
    xp: { starting:100, earned:50, spent:120 },
    specializations: [
      { name: "Scoundrel", source: "EotE Core", notes: "" }
    ],
    talents: [
      { name: "Quick Draw", rank:1, activation:"Incidental", summary:"Draw or stow a weapon as an incidental.", source:"EotE Core" }
    ],
    weapons: [
      { name:"DL-44", skill:"Ranged (Light)", damage:7, crit:3, range:"Medium", encumbrance:1, hp:3, qualities:"Stun setting" }
    ],
    armor: [
      { name:"Armored Jacket", soak:1, defense:1, encumbrance:3, qualities:"Soak +1, Defense +1" }
    ],
    criticalInjuries: [
      { name:"Fearsome Wound", severity: 72, effect:"Increase difficulty of Presence and Willpower checks by 1.", healed:false }
    ],
    woundThreshold: 14,
    strainThreshold: 12,
    portrait:"",
    ship: {
      name:"Millennium Falcon",
      model:"YT-1300",
      silhouette:4,
      speed:5,
      handling:1,
      armor:4,
      hullTraumaThreshold:22,
      hullTraumaCurrent:0,
      systemStrainThreshold:18,
      systemStrainCurrent:0,
      defenseFore:1,
      defenseAft:1,
      defensePort:0,
      defenseStarboard:0,
      notes:"Fastest hunk of junk in the galaxy.",
      weapons:[
        { name:"Quad Laser Cannon", damage:6, crit:3, range:"Long", arc:"All", qualities:"Linked 1" }
      ]
    }
  }];
  saveToStorage();
  refreshCharList();
};

document.getElementById("clearAllBtn").onclick = () => {
  if (confirm("Clear all characters?")) {
    characters = [];
    saveToStorage();
    refreshCharList();
  }
};

document.getElementById("printBtn").onclick = () => window.print();

/* ADD BUTTONS FOR NEW LIST ITEMS */
document.getElementById("addSpecBtn").onclick = () => {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  ensureCharacterShape(c);
  c.specializations.push({ name:"", source:"", notes:"" });
  saveToStorage();
  renderSpecializations(c);
};

document.getElementById("addTalentBtn").onclick = () => {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  ensureCharacterShape(c);
  c.talents.push({ name:"", rank:0, activation:"", summary:"", source:"" });
  saveToStorage();
  renderTalents(c);
};

document.getElementById("addWeaponBtn").onclick = () => {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  ensureCharacterShape(c);
  c.weapons.push({
    name:"", skill:"", damage:0, crit:0,
    range:"", encumbrance:0, hp:0, qualities:""
  });
  saveToStorage();
  renderWeapons(c);
};

document.getElementById("addArmorBtn").onclick = () => {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  ensureCharacterShape(c);
  c.armor.push({
    name:"", soak:0, defense:0, encumbrance:0, qualities:""
  });
  saveToStorage();
  renderArmor(c);
};

document.getElementById("addCritBtn").onclick = () => {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  ensureCharacterShape(c);
  c.criticalInjuries.push({
    name:"", severity:0, effect:"", healed:false
  });
  saveToStorage();
  renderCriticalInjuries(c);
};

document.getElementById("addShipWeaponBtn").onclick = () => {
  if (selectedIndex === null) return;
  const c = characters[selectedIndex];
  ensureCharacterShape(c);
  c.ship.weapons.push({
    name:"", damage:0, crit:0, range:"", arc:"", qualities:""
  });
  saveToStorage();
  renderShipWeapons(c);
};

/* DESTINY BUTTONS */
document.getElementById("destinyLightPlus").onclick = () => {
  destiny.light++;
  saveDestiny();
  renderDestiny();
};
document.getElementById("destinyDarkPlus").onclick = () => {
  destiny.dark++;
  saveDestiny();
  renderDestiny();
};
document.getElementById("destinyFlipToDark").onclick = () => {
  if (destiny.light > 0) {
    destiny.light--;
    destiny.dark++;
    saveDestiny();
    renderDestiny();
  }
};
document.getElementById("destinyFlipToLight").onclick = () => {
  if (destiny.dark > 0) {
    destiny.dark--;
    destiny.light++;
    saveDestiny();
    renderDestiny();
  }
};

/* ================= INIT ================= */
loadFromStorage();
loadDestiny();
refreshCharList();
renderDestiny();

/* ================= STARFIELD ANIMATION ================= */
(function(){
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');

  let stars = [];
  const numStars = 150;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Initialize stars
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.05
    });
  }

  function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.size,0,Math.PI*2);
      ctx.fill();
      s.y -= s.speed;
      if (s.y < 0) s.y = canvas.height;
    });
    requestAnimationFrame(animate);
  }
  animate();
})();
