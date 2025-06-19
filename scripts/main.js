// Mookinator Module - Main Script

// Global variables for current mook data
let currentMookData = null;
let currentMookPath = null;
let currentMookTitle = null;
let currentMookImageUrl = null;
let currentSelectedClassData = null;

/**
 * Set current mook data and related information
 * @param {Object} data - Mook data object
 * @param {string} path - Path to the JSON file
 * @param {string} title - Title of the class
 * @param {string} imageUrl - URL of the class image
 */
function setCurrentMookDataAndPath(data, path, title, imageUrl) {
  currentMookData = window.MookinatorDataLoader.ensureDefaultCurrency(data);
  currentMookPath = path;
  currentMookTitle = title;
  currentMookImageUrl = imageUrl;
  
  currentSelectedClassData = {
    id: currentSelectedClassData?.id || foundry.utils.randomID(),
    path: path,
    title: title,
    imageUrl: imageUrl
  };
  
}

/**
 * Get current mook data and related information
 * @returns {Object} Object containing current mook data and metadata
 */
function getCurrentMookData() {
  return {
    mookData: currentMookData,
    path: currentMookPath,
    title: currentMookTitle,
    imageUrl: currentMookImageUrl
  };
}

// Expose functions globally
window.setCurrentMookDataAndPath = setCurrentMookDataAndPath;
window.currentSelectedClassData = currentSelectedClassData;

/**
 * Generate random number within range (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer between min and max
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random floating point number within range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Random float between min and max
 */
function randomFloat(min, max, decimals = 2) {
  const random = Math.random() * (max - min) + min;
  return parseFloat(random.toFixed(decimals));
}

/**
 * Round to nearest quarter (0.25 increments)
 * @param {number} value - Value to round
 * @returns {number} Value rounded to nearest 0.25
 */
function roundToQuarter(value) {
  return Math.round(value * 4) / 4;
}

/**
 * Distribute coins among different currency types - SIMPLIFIED
 * @param {number} totalValue - Total value to distribute
 * @param {Array} currencyData - Array of currency objects
 * @returns {string} Formatted coin distribution string
 */
function distributeCoins(totalValue, currencyData) {
  
  if (!currencyData || !Array.isArray(currencyData) || totalValue <= 0) {
    console.warn("⚠️ Dados de moeda inválidos ou valor zero");
    return "No coins";
  }

  const currencies = currencyData
    .map(currency => ({
      ...currency,
      cost: parseFloat(currency.cost),
      weight: parseFloat(currency.weight)
    }))
    .sort((a, b) => b.cost - a.cost);

  const result = [];
  let remainingValue = totalValue;

  currencies.forEach((currency, index) => {
    if (remainingValue <= 0) return;

    const isLastCurrency = index === currencies.length - 1;
    let quantity = 0;
    
    if (isLastCurrency) {
      quantity = Math.floor(remainingValue / currency.cost);
    } else {
      const maxQuantity = Math.floor(remainingValue / currency.cost);
      if (maxQuantity > 0) {
        quantity = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * Math.min(maxQuantity + 1, 10));
      }
    }

    if (quantity > 0) {
      const totalCost = quantity * currency.cost;
      const totalCurrencyWeight = quantity * currency.weight;
      remainingValue -= totalCost;
      
      const capitalizedName = currency.name.charAt(0).toUpperCase() + currency.name.slice(1);
      result.push(`${capitalizedName} Coins; ${quantity}; $${totalCost}; ${totalCurrencyWeight.toFixed(2)} ${currency.unit}`);
      
    }
  });

  const finalResult = result.length > 0 ? result.join('\n') : "No coins";
  return finalResult;
}

/**
 * Fill field with content - SIMPLIFIED
 * @param {string} textareaKey - Key for the textarea
 * @param {string} content - Content to fill
 */
function preencherCampo(textareaKey, content) {
  const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
  if (!mookApp) {
    ui.notifications.warn("A janela do Mook Generator não está aberta.");
    return;
  }

  mookApp.element.find(`textarea[data-key="${textareaKey}"]`).val(content).trigger("change");
}

/**
 * Fill attributes with calculated values - UPDATED WITH SHIELD AND SPEED LOGIC
 * @param {Object} config - Configuration object with min/max values
 */
function preencherAtributos(config) {
  const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
  if (!mookApp) return;


  // Step 1: Calculate base attributes first (ST, DX, IQ, HT)
  const baseAttributes = {};
  
  // Calculate ST, DX, IQ, HT as random values within their ranges
  ['st', 'dx', 'iq', 'ht'].forEach(attr => {
    const minValue = config[attr + 'Min'];
    const maxValue = config[attr + 'Max'];
    
    if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
      const val = randomInt(minValue, maxValue);
      baseAttributes[attr] = val;
      
      // Update min/max fields in form
      mookApp.element.find(`input[name="${attr}Min"]`).val(minValue);
      mookApp.element.find(`input[name="${attr}Max"]`).val(maxValue);
      
      // Set the calculated value
      mookApp.element.find(`input[data-key="${attr}"]`).val(val).trigger("change");
      
    }
  });

  // Step 2: Calculate dependent attributes
  
  // HP = ST + random value from HP range
  if (baseAttributes.st && typeof config.hpMin === "number" && typeof config.hpMax === "number") {
    const hpModifier = randomInt(config.hpMin, config.hpMax);
    const hpValue = baseAttributes.st + hpModifier;
    
    mookApp.element.find(`input[name="hpMin"]`).val(config.hpMin);
    mookApp.element.find(`input[name="hpMax"]`).val(config.hpMax);
    mookApp.element.find(`input[data-key="hp"]`).val(hpValue).trigger("change");
    
  }

  // Will = IQ + random value from Will range
  if (baseAttributes.iq && typeof config.willMin === "number" && typeof config.willMax === "number") {
    const willModifier = randomInt(config.willMin, config.willMax);
    const willValue = baseAttributes.iq + willModifier;
    
    mookApp.element.find(`input[name="willMin"]`).val(config.willMin);
    mookApp.element.find(`input[name="willMax"]`).val(config.willMax);
    mookApp.element.find(`input[data-key="will"]`).val(willValue).trigger("change");
    
  }

  // Per = IQ + random value from Per range
  if (baseAttributes.iq && typeof config.perMin === "number" && typeof config.perMax === "number") {
    const perModifier = randomInt(config.perMin, config.perMax);
    const perValue = baseAttributes.iq + perModifier;
    
    mookApp.element.find(`input[name="perMin"]`).val(config.perMin);
    mookApp.element.find(`input[name="perMax"]`).val(config.perMax);
    mookApp.element.find(`input[data-key="per"]`).val(perValue).trigger("change");
    
  }

  // FP = HT + random value from FP range
  if (baseAttributes.ht && typeof config.fpMin === "number" && typeof config.fpMax === "number") {
    const fpModifier = randomInt(config.fpMin, config.fpMax);
    const fpValue = baseAttributes.ht + fpModifier;
    
    mookApp.element.find(`input[name="fpMin"]`).val(config.fpMin);
    mookApp.element.find(`input[name="fpMax"]`).val(config.fpMax);
    mookApp.element.find(`input[data-key="fp"]`).val(fpValue).trigger("change");
    
  }

  // UPDATED: Speed = (DX + HT) / 4 + random float from Speed range, rounded to 0.25
  if (baseAttributes.dx && baseAttributes.ht && typeof config.speedMin === "number" && typeof config.speedMax === "number") {
    const baseSpeed = (baseAttributes.dx + baseAttributes.ht) / 4;
    const speedModifier = randomFloat(config.speedMin, config.speedMax, 2);
    const rawSpeedValue = baseSpeed + speedModifier;
    const speedValue = roundToQuarter(rawSpeedValue); // Round to nearest 0.25
    
    mookApp.element.find(`input[name="speedMin"]`).val(config.speedMin);
    mookApp.element.find(`input[name="speedMax"]`).val(config.speedMax);
    mookApp.element.find(`input[data-key="speed"]`).val(speedValue).trigger("change");
    
    
    // Move = integer part of Speed
    const moveValue = Math.floor(speedValue);
    mookApp.element.find(`input[name="moveMin"]`).val(config.moveMin || 0);
    mookApp.element.find(`input[name="moveMax"]`).val(config.moveMax || 0);
    mookApp.element.find(`input[data-key="move"]`).val(moveValue).trigger("change");
    
    
    // Dodge = integer part of Speed + 3
    const dodgeValue = moveValue + 3;
    mookApp.element.find(`input[name="dodgeMin"]`).val(config.dodgeMin || 0);
    mookApp.element.find(`input[name="dodgeMax"]`).val(config.dodgeMax || 0);
    mookApp.element.find(`input[data-key="dodge"]`).val(dodgeValue).trigger("change");
    
  }

  // UPDATED: Shield - no calculation, just random value from range
  if (typeof config.shieldMin === "number" && typeof config.shieldMax === "number") {
    const shieldValue = randomInt(config.shieldMin, config.shieldMax);
    
    mookApp.element.find(`input[name="shieldMin"]`).val(config.shieldMin);
    mookApp.element.find(`input[name="shieldMax"]`).val(config.shieldMax);
    mookApp.element.find(`input[data-key="shield"]`).val(shieldValue).trigger("change");
    
  }

  // Step 3: Handle remaining attributes that don't change calculation (dr, coins)
  const unchangedAttributes = ["dr", "coins"];
  
  unchangedAttributes.forEach(attr => {
    const minValue = config[attr + 'Min'];
    const maxValue = config[attr + 'Max'];
    
    if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
      const val = randomInt(minValue, maxValue);
      
      // Update min/max fields in form
      mookApp.element.find(`input[name="${attr}Min"]`).val(minValue);
      mookApp.element.find(`input[name="${attr}Max"]`).val(maxValue);

      // Special handling for coins
      if (attr === "coins") {
        const coinDistribution = distributeCoins(val, currentMookData?.currency);
        preencherCampo("equipment", coinDistribution);
      }
      
      mookApp.element.find(`input[data-key="${attr}"]`).val(val).trigger("change");
      
    }
  });

  // Step 4: Handle SM separately (it might have different logic)
  if (typeof config.smMin === "number" && typeof config.smMax === "number") {
    const smValue = randomInt(config.smMin, config.smMax);
    
    mookApp.element.find(`input[name="smMin"]`).val(config.smMin);
    mookApp.element.find(`input[name="smMax"]`).val(config.smMax);
    mookApp.element.find(`input[data-key="sm"]`).val(smValue).trigger("change");
    
  }

}

/**
 * Format melee weapon with enhanced data - SIMPLIFIED
 * @param {Object} weapon - Weapon object with attacks array
 * @param {number} nivel - Skill level
 * @returns {Array} Array of formatted weapon strings
 */
function formatMeleeWeapon(weapon, nivel) {
  if (!weapon.attacks || !Array.isArray(weapon.attacks)) {
    return [`${weapon.nome}(${nivel}) #ERROR - No attack data`];
  }

  return weapon.attacks.map(attack => {
    if (!attack.dano || attack.dano === 'N/A') {
      return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
    }

    let weaponLine = `${weapon.nome}(${nivel}) ${attack.dano}`;
    
    // Add weapon properties in order, only if they have values
    const properties = [
      attack.reach && `reach ${attack.reach.replace(/-/g, ',')}`,
      attack.usage && `usage ${attack.usage}`,
      attack.parry && `parry ${attack.parry}`,
      attack.st && `st ${attack.st}`,
      attack.block && `block ${attack.block}`
    ].filter(Boolean);
    
    if (properties.length > 0) {
      weaponLine += ' ' + properties.join(' ');
    }
    
    return weaponLine;
  });
}

/**
 * Format ranged weapon with enhanced data - SIMPLIFIED
 * @param {Object} weapon - Weapon object
 * @param {number} nivel - Skill level
 * @returns {string} Formatted weapon string
 */
function formatRangedWeapon(weapon, nivel) {
  if (!weapon.dano || weapon.dano.trim() === '' || weapon.dano === 'N/A') {
    return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
  }

  let weaponLine = `${weapon.nome}(${nivel}) ${weapon.dano}`;
  
  // Add weapon properties in order, only if they have values
  const properties = [
    weapon.acc && `acc ${weapon.acc}`,
    weapon.rof && `rof ${weapon.rof}`,
    weapon.recoil && `rcl ${weapon.recoil}`,
    weapon.usage && `usage ${weapon.usage}`,
    weapon.range && `range ${weapon.range}`,
    weapon.shots && `shots ${weapon.shots}`,
    weapon.bulk && `bulk ${weapon.bulk}`,
    weapon.st && `st ${weapon.st}`
  ].filter(Boolean);
  
  if (properties.length > 0) {
    weaponLine += ' ' + properties.join(' ');
  }
  
  return weaponLine;
}

/**
 * Fill skills with random levels - SIMPLIFIED
 * @param {Array} lista - List of items
 * @param {string} key - Key for the textarea
 * @param {Object} config - Configuration with qty, min, max
 */
function preencherSkills(lista, key, config) {
  if (!lista || !Array.isArray(lista)) return;
  
  const usados = new Set();
  const escolhidos = [];
  
  while (escolhidos.length < config.qty && usados.size < lista.length) {
    const idx = Math.floor(Math.random() * lista.length);
    if (!usados.has(idx)) {
      usados.add(idx);
      const item = lista[idx];
      const nivel = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
      
      if (key === 'melee') {
        const formattedWeapons = formatMeleeWeapon(item, nivel);
        escolhidos.push(...formattedWeapons);
      } else if (key === 'ranged') {
        const formattedWeapon = formatRangedWeapon(item, nivel);
        escolhidos.push(formattedWeapon);
      } else if (key === 'skills' || key === 'spells') {
        escolhidos.push(`${item.nome}-${nivel}`);
      }
    }
  }
  
  preencherCampo(key, escolhidos.join('\n'));
}

/**
 * Main function to generate the Mook - SIMPLIFIED
 * @param {Object} config - Configuration object
 * @param {Object} mookData - Mook data object
 */
async function gerarMook(config, mookData) {
  const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
  if (!mookApp) {
    ui.notifications.warn("A janela do Mook Generator não está aberta.");
    return;
  }


  // Fill attributes first (including ST) with new calculation logic
  preencherAtributos(config);
  
  // Small delay to ensure fields are updated
  await new Promise(resolve => setTimeout(resolve, 100));

  // Fill all skill types
  preencherSkills(mookData.meleeSkills, 'melee', config.melee);
  preencherSkills(mookData.rangedSkills, 'ranged', config.ranged);
  preencherSkills(mookData.skillsList, 'skills', config.skills);
  preencherSkills(mookData.spellsList, 'spells', config.spells);

  // Fill traits
  if (mookData.traitsList && Array.isArray(mookData.traitsList)) {
    const traits = mookData.traitsList
      .sort(() => 0.5 - Math.random())
      .slice(0, config.traitsQty)
      .map(item => {
        if (item.valor && item.valor.toString().trim() !== '') {
          return `${item.nome} ${item.valor}`;
        } else {
          return item.nome;
        }
      });
    preencherCampo('traits', traits.join('\n'));
  }

  // Fill notes
  if (mookData.notes) {
    preencherCampo('notes', mookData.notes.join('\n'));
  }

}

/**
 * Main function to initialize the Mook Generator
 */
async function inicializarMookGenerator() {
  GURPS.executeOTF("/mook");
  
  const savedClasses = window.MookinatorDataLoader.getSavedClasses();
  const savedClassButtonsHtml = window.MookinatorTemplates.generateSavedClassButtonsHtml(savedClasses);
  const customButtonHtml = window.MookinatorTemplates.generateCustomButtonHtml();
  const dialogContent = window.MookinatorTemplates.generateDialogTemplate(savedClassButtonsHtml, customButtonHtml);

  const dialog = new Dialog({
    title: "Mookinator",
    content: dialogContent,
    buttons: { fechar: { label: "Fechar" } },
    render: (html) => {
      const handlers = {
        loadAndPopulateForm: (html, jsonPath, className) => {
          window.MookinatorDataLoader.loadAndPopulateForm(html, jsonPath, className, setCurrentMookDataAndPath);
        },
        loadCustomJSON: (html) => {
          window.MookinatorDataLoader.loadCustomJSON(html, setCurrentMookDataAndPath);
        },
        saveClass: (classData) => {
          const success = window.MookinatorDataLoader.saveClass(classData);
          if (success) {
            window.MookinatorUIHandlers.refreshSavedClassesDisplay(html);
          }
          return success;
        },
        deleteClass: (classId) => {
          return window.MookinatorDataLoader.deleteClass(classId);
        },
        gerarMook: gerarMook,
        getCurrentMookData: getCurrentMookData
      };

      window.MookinatorUIHandlers.setupAllHandlers(html, handlers);
    },
    resizable: true,
    width: 600,
    height: 500,
    close: () => { 
      currentMookData = null;
      currentMookPath = null;
      currentMookTitle = null;
      currentMookImageUrl = null;
      currentSelectedClassData = null;
    }
  });

  dialog.render(true);
}

// Module initialization
Hooks.once("init", () => {
  console.log("Mookinator | Initializing Mookinator module...");
  
  game.settings.register("mookinator", "savedClasses", {
    name: "Saved Classes",
    hint: "Stored class configurations for the Mookinator module",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
  
  game.mookinator = {
    inicializarMookGenerator: inicializarMookGenerator
  };
});

Hooks.once("ready", () => {
  console.log("Mookinator | Module ready to use!");
  ui.notifications.info("Mookinator carregado! Use game.mookinator.inicializarMookGenerator() em uma macro.");
});