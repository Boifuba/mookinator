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
  
  console.log("🪙 Dados de moeda garantidos:", currentMookData?.currency);
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
 * Distribute coins among different currency types - SIMPLIFIED
 * @param {number} totalValue - Total value to distribute
 * @param {Array} currencyData - Array of currency objects
 * @returns {string} Formatted coin distribution string
 */
function distributeCoins(totalValue, currencyData) {
  console.log("🪙 Distribuindo moedas - Valor total:", totalValue, "Dados de moeda:", currencyData);
  
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
      
      console.log(`🪙 ${capitalizedName}: ${quantity} moedas, valor $${totalCost}`);
    }
  });

  const finalResult = result.length > 0 ? result.join('\n') : "No coins";
  console.log("🪙 Resultado final da distribuição:", finalResult);
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
 * Fill attributes with random values - SIMPLIFIED
 * @param {Object} config - Configuration object with min/max values
 */
function preencherAtributos(config) {
  const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
  if (!mookApp) return;

  const attributes = ["st", "dx", "iq", "ht", "hp", "will", "per", "fp", "parry", "speed", "move", "sm", "dr", "dodge", "coins"];
  
  attributes.forEach(attr => {
    const minValue = config[attr + 'Min'];
    const maxValue = config[attr + 'Max'];
    
    if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
      const val = Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
      
      // Update min/max fields in form
      mookApp.element.find(`input[name="${attr}Min"]`).val(minValue);
      mookApp.element.find(`input[name="${attr}Max"]`).val(maxValue);

      // Special handling for coins
      if (attr === "coins") {
        console.log("🪙 Processando moedas - Valor:", val, "Dados de moeda disponíveis:", currentMookData?.currency);
        const coinDistribution = distributeCoins(val, currentMookData?.currency);
        preencherCampo("equipment", coinDistribution);
      }
      
      mookApp.element.find(`input[data-key="${attr}"]`).val(val).trigger("change");
    }
  });
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

  console.log("🎯 Iniciando geração do Mook...");
  console.log("🪙 Dados de moeda disponíveis:", mookData?.currency);

  // Fill attributes first (including ST)
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

  console.log("✅ Geração do Mook concluída!");
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
  console.log("Mookinator | Módulo inicializado");
  
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
  console.log("Mookinator | Módulo pronto para uso");
  ui.notifications.info("Mookinator carregado! Use game.mookinator.inicializarMookGenerator() em uma macro.");
});