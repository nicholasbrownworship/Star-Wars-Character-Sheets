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

/* ================= STORAGE ================= */
function saveToStorage() {
  localStorage.setItem("ffgChars", JSON.stringify(characters));
}

function loadFromStorage() {
  const d = localStorage.getItem("ffgChars");
  if (d) characters = JSON.parse(d);
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

    // set innerHTML for skill block
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;min-width:220px;">
        <strong style="font-size:13px">${skill}</strong>
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

      // flash outline on the whole skill block for feedback
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

    // dice dot visualization: up to max(attrValue, rank), with "upgrades" equal to min(attr, rank)
    const diceDiv = container.querySelector(".skillDice");
    let total = Math.max(rank, attrValue);
    let upgrades = Math.min(rank, attrValue);
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("span");
      dot.className = "dice-dot " + (upgrades > 0 ? "proficiency" : "ability");
      upgrades--;
      diceDiv.appendChild(dot);
    }

    // CLICK ON DICE DOTS TO AUTO-FILL DICE POOL
    diceDiv.onclick = () => {
      const proficiencyDice = Math.min(attrValue, rank);
      const abilityDice = Math.max(attrValue, rank) - proficiencyDice;

      document.getElementById("diceAbility").value = abilityDice;
      document.getElementById("diceProficiency").value = proficiencyDice;

      // visual feedback: flash outline on dots
      diceDiv.style.boxShadow = "0 0 8px rgba(68,215,255,0.18)";
      setTimeout(() => diceDiv.style.boxShadow = "", 300);
    };

    skillList.appendChild(container);
  });
}

/* ================= CHARACTER EDIT / OPEN ================= */
function openCharacter(index) {
  selectedIndex = index;
  const c = characters[index];
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

  // ensure stats object exists and fill missing attributes with 0
  c.stats = c.stats || {};
  ["Brawn","Agility","Intellect","Cunning","Willpower","Presence"].forEach(k => {
    if (typeof c.stats[k] !== 'number') c.stats[k] = 0;
  });

  c.skills = c.skills || {};
  renderStats(c.stats);
  renderSkills(c.skills);
  refreshCharList();
}

/* ================= SAVE ================= */
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

  // stats
  c.stats = {};
  document.querySelectorAll("#stats input").forEach(i => {
    c.stats[i.dataset.stat] = +i.value || 0;
  });

  // skills are edited live (we already saved them on change)
  saveToStorage();
  refreshCharList();
};

/* ================= DICE ROLLER (uses dice/ images) ================= */
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
      // fallback emoji if image missing
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
  const outcome = netSuccess > 0 ? "Success" : "Fail"; // outcome logic

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
  // Clear dice result displays
  document.getElementById("diceResult").innerHTML = "";
  document.getElementById("netResult").innerHTML = "";

  // Clear all dice input fields
  const diceInputs = [
    "diceAbility","diceProficiency","diceBoost",
    "diceDifficulty","diceChallenge","diceSetback","diceForce"
  ];
  diceInputs.forEach(id => document.getElementById(id).value = 0);
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
    stats: {...baseStats}, skills:{}
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
    skills:{ "Piloting (Space)":{rank:2}, Deception:{rank:1}, Mechanics:{rank:1} }
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

/* ================= INIT ================= */
loadFromStorage();
refreshCharList();

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
