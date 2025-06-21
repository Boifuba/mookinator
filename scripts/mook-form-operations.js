// Mookinator Form Operations - Functions for filling and manipulating form fields

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
 * Fill attributes with calculated values - UPDATED WITH PARRY AND SHIELD LOGIC AND CORRECTED HP/FP FORMULAS
 * @param {Object} config - Configuration object with min/max values
 */
function preencherAtributos(config) {
  const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
  if (!mookApp) return;

  console.log("🎯 Iniciando preenchimento de atributos com nova lógica...");

  // Object to store all calculated attributes
  const calculatedAttributes = {};

  // Step 1: Calculate base attributes first (ST, DX, IQ, HT, PARRY)
  const baseAttributes = {};
  
  // Calculate ST, DX, IQ, HT, PARRY as random values within their ranges
  ['st', 'dx', 'iq', 'ht', 'parry'].forEach(attr => {
    const minValue = config.atributos?.[attr]?.min ?? config[attr + 'Min'];
    const maxValue = config.atributos?.[attr]?.max ?? config[attr + 'Max'];
    
    if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
      const val = window.MookinatorUtils.randomInt(minValue, maxValue);
      baseAttributes[attr] = val;
      calculatedAttributes[attr] = val;
      
      // Update min/max fields in form
      mookApp.element.find(`input[name="${attr}Min"]`).val(minValue);
      mookApp.element.find(`input[name="${attr}Max"]`).val(maxValue);
      
      // Set the calculated value
      mookApp.element.find(`input[data-key="${attr}"]`).val(val).trigger("change");
      
      console.log(`📊 ${attr.toUpperCase()}: ${val}`);
    }
  });

  // Step 2: Calculate dependent attributes

  // FIXED: HP = HT + random value from HP range (was ST + HP range)
  if (baseAttributes.ht && typeof config.atributos?.hp?.min === "number" && typeof config.atributos?.hp?.max === "number") {
    const hpModifier = window.MookinatorUtils.randomInt(config.atributos.hp.min, config.atributos.hp.max);
    const hpValue = baseAttributes.ht + hpModifier;
    calculatedAttributes.hp = hpValue;
    
    mookApp.element.find(`input[name="hpMin"]`).val(config.atributos.hp.min);
    mookApp.element.find(`input[name="hpMax"]`).val(config.atributos.hp.max);
    mookApp.element.find(`input[data-key="hp"]`).val(hpValue).trigger("change");
    
    console.log(`❤️ HP: ${baseAttributes.ht} (HT) + ${hpModifier} (modifier) = ${hpValue}`);
  }

  // Will = IQ + random value from Will range
  if (baseAttributes.iq && typeof config.atributos?.will?.min === "number" && typeof config.atributos?.will?.max === "number") {
    const willModifier = window.MookinatorUtils.randomInt(config.atributos.will.min, config.atributos.will.max);
    const willValue = baseAttributes.iq + willModifier;
    calculatedAttributes.will = willValue;
    
    mookApp.element.find(`input[name="willMin"]`).val(config.atributos.will.min);
    mookApp.element.find(`input[name="willMax"]`).val(config.atributos.will.max);
    mookApp.element.find(`input[data-key="will"]`).val(willValue).trigger("change");
    
    console.log(`🧠 Will: ${baseAttributes.iq} (IQ) + ${willModifier} (modifier) = ${willValue}`);
  }

  // Per = IQ + random value from Per range
  if (baseAttributes.iq && typeof config.atributos?.per?.min === "number" && typeof config.atributos?.per?.max === "number") {
    const perModifier = window.MookinatorUtils.randomInt(config.atributos.per.min, config.atributos.per.max);
    const perValue = baseAttributes.iq + perModifier;
    calculatedAttributes.per = perValue;
    
    mookApp.element.find(`input[name="perMin"]`).val(config.atributos.per.min);
    mookApp.element.find(`input[name="perMax"]`).val(config.atributos.per.max);
    mookApp.element.find(`input[data-key="per"]`).val(perValue).trigger("change");
    
    console.log(`👁️ Per: ${baseAttributes.iq} (IQ) + ${perModifier} (modifier) = ${perValue}`);
  }

  // FIXED: FP = ST + random value from FP range (was HT + FP range)
  if (baseAttributes.st && typeof config.atributos?.fp?.min === "number" && typeof config.atributos?.fp?.max === "number") {
    const fpModifier = window.MookinatorUtils.randomInt(config.atributos.fp.min, config.atributos.fp.max);
    const fpValue = baseAttributes.st + fpModifier;
    calculatedAttributes.fp = fpValue;
    
    mookApp.element.find(`input[name="fpMin"]`).val(config.atributos.fp.min);
    mookApp.element.find(`input[name="fpMax"]`).val(config.atributos.fp.max);
    mookApp.element.find(`input[data-key="fp"]`).val(fpValue).trigger("change");
    
    console.log(`⚡ FP: ${baseAttributes.st} (ST) + ${fpModifier} (modifier) = ${fpValue}`);
  }

  // UPDATED: Speed = (DX + HT) / 4 + random float from Speed range, rounded to 0.25
  if (baseAttributes.dx && baseAttributes.ht && typeof config.atributos?.speed?.min === "number" && typeof config.atributos?.speed?.max === "number") {
    const baseSpeed = (baseAttributes.dx + baseAttributes.ht) / 4;
    const speedModifier = window.MookinatorUtils.randomFloat(config.atributos.speed.min, config.atributos.speed.max, 2);
    const rawSpeedValue = baseSpeed + speedModifier;
    const speedValue = window.MookinatorUtils.roundToQuarter(rawSpeedValue); // Round to nearest 0.25
    calculatedAttributes.speed = speedValue;
    
    mookApp.element.find(`input[name="speedMin"]`).val(config.atributos.speed.min);
    mookApp.element.find(`input[name="speedMax"]`).val(config.atributos.speed.max);
    mookApp.element.find(`input[data-key="speed"]`).val(speedValue).trigger("change");
    
    console.log(`🏃 Speed: (${baseAttributes.dx} + ${baseAttributes.ht}) / 4 + ${speedModifier} = ${rawSpeedValue} → ${speedValue} (rounded to 0.25)`);
    
    // UPDATED: Move = floor(Speed) + random value from Move range
    let moveValue = Math.floor(speedValue);
    
    // Add random modifier from Move range if configured
    if (typeof config.atributos?.move?.min === "number" && typeof config.atributos?.move?.max === "number") {
      const moveModifier = window.MookinatorUtils.randomInt(config.atributos.move.min, config.atributos.move.max);
      moveValue += moveModifier;
      
      // Update min/max fields in form
      mookApp.element.find(`input[name="moveMin"]`).val(config.atributos.move.min);
      mookApp.element.find(`input[name="moveMax"]`).val(config.atributos.move.max);
      
      console.log(`🚶 Move: floor(${speedValue}) + ${moveModifier} (random modifier) = ${moveValue}`);
    } else {
      // Fallback to old behavior if no Move range is configured
      mookApp.element.find(`input[name="moveMin"]`).val(0);
      mookApp.element.find(`input[name="moveMax"]`).val(0);
      
      console.log(`🚶 Move: floor(${speedValue}) = ${moveValue} (no random modifier configured)`);
    }
    
    calculatedAttributes.move = moveValue;
    mookApp.element.find(`input[data-key="move"]`).val(moveValue).trigger("change");
    
    // Dodge = integer part of Speed + 3 (WITHOUT DB bonus yet - will be added later in main.js)
    const dodgeValue = moveValue + 3;
    calculatedAttributes.dodge = dodgeValue;
    mookApp.element.find(`input[name="dodgeMin"]`).val(config.atributos?.dodge?.min || 0);
    mookApp.element.find(`input[name="dodgeMax"]`).val(config.atributos?.dodge?.max || 0);
    mookApp.element.find(`input[data-key="dodge"]`).val(dodgeValue).trigger("change");
    
    console.log(`🤸 Dodge: ${moveValue} (Move) + 3 = ${dodgeValue} (DB bonus will be added later)`);
  }

  // UPDATED: Shield - random value from range (like all other independent attributes)
  if (typeof config.atributos?.shield?.min === "number" && typeof config.atributos?.shield?.max === "number") {
    const shieldValue = window.MookinatorUtils.randomInt(config.atributos.shield.min, config.atributos.shield.max);
    calculatedAttributes.shield = shieldValue;
    
    mookApp.element.find(`input[name="shieldMin"]`).val(config.atributos.shield.min);
    mookApp.element.find(`input[name="shieldMax"]`).val(config.atributos.shield.max);
    mookApp.element.find(`input[data-key="shield"]`).val(shieldValue).trigger("change");
    
    console.log(`🛡️ Shield: ${shieldValue}`);
  }

  // Step 3: Handle remaining attributes that don't change calculation (dr)
  const unchangedAttributes = ["dr"];
  
  unchangedAttributes.forEach(attr => {
    const minValue = config.atributos?.[attr]?.min ?? config[attr + 'Min'];
    const maxValue = config.atributos?.[attr]?.max ?? config[attr + 'Max'];
    
    if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
      const val = window.MookinatorUtils.randomInt(minValue, maxValue);
      calculatedAttributes[attr] = val;
      
      // Update min/max fields in form
      mookApp.element.find(`input[name="${attr}Min"]`).val(minValue);
      mookApp.element.find(`input[name="${attr}Max"]`).val(maxValue);
      
      mookApp.element.find(`input[data-key="${attr}"]`).val(val).trigger("change");
      
      console.log(`📊 ${attr.toUpperCase()}: ${val}`);
    }
  });

  // Step 4: Handle coins separately (now in vertical section)
  if (typeof config.atributos?.coins?.min === "number" && typeof config.atributos?.coins?.max === "number") {
    const coinsValue = window.MookinatorUtils.randomInt(config.atributos.coins.min, config.atributos.coins.max);
    calculatedAttributes.coins = coinsValue;
    
    mookApp.element.find(`input[name="coinsMin"]`).val(config.atributos.coins.min);
    mookApp.element.find(`input[name="coinsMax"]`).val(config.atributos.coins.max);
    
    const currentData = window.MookinatorState.getCurrentMookData();
    console.log("🪙 Processando moedas - Valor:", coinsValue, "Dados de moeda disponíveis:", currentData.mookData?.currency);
    const coinDistribution = window.MookinatorUtils.distributeCoins(coinsValue, currentData.mookData?.currency);
    preencherCampo("equipment", coinDistribution);
    
    console.log(`🪙 COINS: ${coinsValue}`);
  }

  // Step 5: Handle SM separately (it might have different logic)
  if (typeof config.atributos?.sm?.min === "number" && typeof config.atributos?.sm?.max === "number") {
    const smValue = window.MookinatorUtils.randomInt(config.atributos.sm.min, config.atributos.sm.max);
    calculatedAttributes.sm = smValue;
    
    mookApp.element.find(`input[name="smMin"]`).val(config.atributos.sm.min);
    mookApp.element.find(`input[name="smMax"]`).val(config.atributos.sm.max);
    mookApp.element.find(`input[data-key="sm"]`).val(smValue).trigger("change");
    
    console.log(`📏 SM: ${smValue}`);
  }

  // CRITICAL: Store all calculated attributes in global state
  window.MookinatorState.setLastCalculatedAttributes(calculatedAttributes);

  console.log("✅ Preenchimento de atributos concluído com nova lógica!");
}

/**
 * Format usage text by joining multiple words with hyphens
 * @param {string} usage - Usage text
 * @returns {string} Formatted usage text
 */
function formatUsageText(usage) {
  if (!usage || typeof usage !== 'string') {
    return '';
  }
  
  // Split by spaces and join with hyphens, then convert to lowercase
  return usage.trim().split(/\s+/).join('-').toLowerCase();
}

/**
 * Format melee weapon with enhanced data - UPDATED WITH REAL DAMAGE TYPE EXTRACTION
 * @param {Object} weapon - Weapon object with attacks array
 * @param {number} nivel - Skill level
 * @param {number} st - Strength value for damage calculation
 * @param {number} shieldAttributeValue - Shield attribute value for block calculation
 * @param {number} shieldDbBonusForParry - Shield DB bonus for parry calculation
 * @returns {Array} Array of formatted weapon strings
 */
function formatMeleeWeapon(weapon, nivel, st = 10, shieldAttributeValue = 0, shieldDbBonusForParry = 0) {
  if (!weapon.attacks || !Array.isArray(weapon.attacks)) {
    return [`${weapon.nome}(${nivel}) #ERROR - No attack data`];
  }

  // Special handling for shields
  if (weapon.shield === true) {
    console.log(`🛡️ Formatando escudo: ${weapon.nome} com DB ${weapon.db} e Shield Attribute ${shieldAttributeValue}`);
    
    return weapon.attacks.map(attack => {
      // For shields, check if we have inferredBaseDamageType for ST-based damage
      let damageStr = attack.dano;
      
      if (attack.inferredBaseDamageType && st) {
        // UPDATED: Extract real damage type from the full damage string
        const realDamageType = window.MookinatorUtils.extractDamageTypeFromFullDamageString(attack.dano);
        
        if (realDamageType === null) {
          ui.notifications.error(`⚠️ Tipo de dano não encontrado para o escudo "${weapon.nome}". Processamento interrompido.`);
          return `${weapon.nome}(${nivel}) #ERROR - Damage type not found in "${attack.dano}"`;
        }
        
        // Use ST-based damage calculation with real damage type
        const weaponItem = { type: [`${attack.inferredBaseDamageType} ${realDamageType}`] };
        const damageResults = window.MookinatorUtils.calculateFinalDamage(st, weaponItem);
        
        if (damageResults.length > 0) {
          damageStr = `${damageResults[0].damage} ${damageResults[0].type}`;
        }
        
        console.log(`🛡️ Escudo ${weapon.nome}: Tipo de dano extraído "${realDamageType}" de "${attack.dano}"`);
      }
      
      if (!damageStr || damageStr === 'N/A') {
        return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
      }

      // Start with weapon name, level, and damage (shields can be used as weapons)
      let shieldLine = `${weapon.nome}(${nivel}) ${damageStr}`;
      
      // Add weapon properties in order, only if they have values
      // UPDATED: Format usage text with hyphens for multiple words
      const properties = [
        attack.reach && `reach ${attack.reach.replace(/-/g, ',')}`,
        attack.usage && `usage ${formatUsageText(attack.usage)}`,
        attack.st && `st ${attack.st}`
      ].filter(Boolean);
      
      // UPDATED: Calculate block value only if weapon.db is valid (not null)
      if (weapon.db !== null && weapon.db > 0) {
        const calculatedBlock = Math.floor(nivel / 2) + 3 + weapon.db + shieldAttributeValue;
        properties.push(`block ${calculatedBlock}`);
        
        console.log(`🛡️ Block calculado para ${weapon.nome}: floor(${nivel} / 2) + 3 + ${weapon.db} + ${shieldAttributeValue} = ${calculatedBlock}`);
      } else {
        console.log(`🛡️ AVISO: Escudo ${weapon.nome} não possui DB válido (db=${weapon.db}), block não será calculado`);
      }
      
      if (properties.length > 0) {
        shieldLine += ' ' + properties.join(' ');
      }
      
      return shieldLine;
    });
  }

  // Regular weapon handling with ST-based damage calculation and DB BONUS FOR PARRY
  return weapon.attacks.map(attack => {
    let damageStr = attack.dano;
    
    // Check if we have inferredBaseDamageType for ST-based damage
    if (attack.inferredBaseDamageType && st) {
      // UPDATED: Extract real damage type from the full damage string
      const realDamageType = window.MookinatorUtils.extractDamageTypeFromFullDamageString(attack.dano);
      
      if (realDamageType === null) {
        ui.notifications.error(`⚠️ Tipo de dano não encontrado para a arma "${weapon.nome}". Processamento interrompido.`);
        return `${weapon.nome}(${nivel}) #ERROR - Damage type not found in "${attack.dano}"`;
      }
      
      // Use ST-based damage calculation with real damage type
      const weaponItem = { type: [`${attack.inferredBaseDamageType} ${realDamageType}`] };
      const damageResults = window.MookinatorUtils.calculateFinalDamage(st, weaponItem);
      
      if (damageResults.length > 0) {
        damageStr = `${damageResults[0].damage} ${damageResults[0].type}`;
      }
      
      console.log(`⚔️ Arma ${weapon.nome}: Tipo de dano extraído "${realDamageType}" de "${attack.dano}"`);
    }
    
    if (!damageStr || damageStr === 'N/A') {
      return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
    }

    let weaponLine = `${weapon.nome}(${nivel}) ${damageStr}`;
    
    // Add weapon properties in order, only if they have values
    // UPDATED: Format usage text with hyphens for multiple words
    const properties = [
      attack.reach && `reach ${attack.reach.replace(/-/g, ',')}`,
      attack.usage && `usage ${formatUsageText(attack.usage)}`,
      attack.st && `st ${attack.st}`,
      attack.block && `block ${attack.block}`
    ].filter(Boolean);
    
    // NEW PARRY CALCULATION WITH DB BONUS: Use the new formula with DB bonus
    if (attack.parry) {
      const calculatedParry = window.MookinatorUtils.calculateParryValue(nivel, attack.parry, shieldDbBonusForParry);
      properties.splice(-1, 0, `parry ${calculatedParry}`); // Insert parry before block if block exists
      
      console.log(`⚔️ Parry calculado para ${weapon.nome}: floor(${nivel} / 2) + 3 + parry(${attack.parry}) + DB(${shieldDbBonusForParry}) = ${calculatedParry}`);
    }
    
    if (properties.length > 0) {
      weaponLine += ' ' + properties.join(' ');
    }
    
    return weaponLine;
  });
}

/**
 * Format ranged weapon with enhanced data - UPDATED WITH REAL DAMAGE TYPE EXTRACTION
 * @param {Object} weapon - Weapon object
 * @param {number} nivel - Skill level
 * @param {number} st - Strength value for damage calculation
 * @returns {string} Formatted weapon string
 */
function formatRangedWeapon(weapon, nivel, st = 10) {
  let damageStr = weapon.dano;
  
  // Check if we have inferredBaseDamageType for ST-based damage
  if (weapon.inferredBaseDamageType && st) {
    // UPDATED: Extract real damage type from the full damage string
    const realDamageType = window.MookinatorUtils.extractDamageTypeFromFullDamageString(weapon.dano);
    
    if (realDamageType === null) {
      ui.notifications.error(`⚠️ Tipo de dano não encontrado para a arma à distância "${weapon.nome}". Processamento interrompido.`);
      return `${weapon.nome}(${nivel}) #ERROR - Damage type not found in "${weapon.dano}"`;
    }
    
    // Use ST-based damage calculation with real damage type
    const weaponItem = { type: [`${weapon.inferredBaseDamageType} ${realDamageType}`] };
    const damageResults = window.MookinatorUtils.calculateFinalDamage(st, weaponItem);
    
    if (damageResults.length > 0) {
      damageStr = `${damageResults[0].damage} ${damageResults[0].type}`;
    }
    
    console.log(`🏹 Arma à distância ${weapon.nome}: Tipo de dano extraído "${realDamageType}" de "${weapon.dano}"`);
  }
  
  if (!damageStr || damageStr.trim() === '' || damageStr === 'N/A') {
    return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
  }

  let weaponLine = `${weapon.nome}(${nivel}) ${damageStr}`;
  
  // Add weapon properties in order, only if they have values
  // UPDATED: Format usage text with hyphens for multiple words
  const properties = [
    weapon.acc && `acc ${weapon.acc}`,
    weapon.rof && `rof ${weapon.rof}`,
    weapon.recoil && `rcl ${weapon.recoil}`,
    weapon.usage && `usage ${formatUsageText(weapon.usage)}`,
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
 * Fill skills with random levels - UPDATED WITH SHIELD GUARANTEE AND DB BONUS TRACKING WITH NULL CHECK
 * @param {Array} lista - List of items
 * @param {string} key - Key for the textarea
 * @param {Object} config - Configuration with qty, min, max
 * @param {number} st - Strength value for damage calculation
 * @param {number} shieldAttributeValue - Shield attribute value for block calculation (only for melee)
 */
function preencherSkills(lista, key, config, st = 10, shieldAttributeValue = 0) {
  if (!lista || !Array.isArray(lista)) return;
  
  const usados = new Set();
  const escolhidos = [];
  
  // Special handling for melee weapons to guarantee at least one shield
  if (key === 'melee') {
    console.log("🛡️ Processando armas corpo a corpo com garantia de escudo...");
    
    // Separate shields from regular weapons
    const shields = lista.filter(item => item.shield === true);
    const regularWeapons = lista.filter(item => item.shield !== true);
    
    console.log(`🛡️ Encontrados ${shields.length} escudos e ${regularWeapons.length} armas regulares`);
    
    // If we have shields, guarantee at least one (but only if it has valid DB)
    if (shields.length > 0) {
      // Filter shields to only include those with valid DB (not null)
      const validShields = shields.filter(shield => shield.db !== null && shield.db > 0);
      
      if (validShields.length > 0) {
        const randomShieldIndex = Math.floor(Math.random() * validShields.length);
        const selectedShield = validShields[randomShieldIndex];
        const nivel = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        
        // CRITICAL: Store the selected shield's DB value globally
        const selectedShieldDb = selectedShield.db;
        window.MookinatorState.setShieldDbBonus(selectedShieldDb);
        
        const formattedShields = formatMeleeWeapon(selectedShield, nivel, st, shieldAttributeValue, selectedShieldDb);
        escolhidos.push(...formattedShields);
        
        console.log(`🛡️ Escudo garantido adicionado: ${selectedShield.nome}(${nivel}) com DB ${selectedShieldDb}`);
        
        // Mark this shield as used by finding its index in the original list
        const originalShieldIndex = lista.findIndex(item => item === selectedShield);
        if (originalShieldIndex !== -1) {
          usados.add(originalShieldIndex);
        }
      } else {
        console.log(`🛡️ AVISO: Nenhum escudo com DB válido encontrado. Escudos disponíveis:`, shields.map(s => `${s.nome} (DB: ${s.db})`));
        // Reset shield DB bonus since no valid shield was selected
        window.MookinatorState.setShieldDbBonus(0);
      }
    } else {
      // Reset shield DB bonus since no shields are available
      window.MookinatorState.setShieldDbBonus(0);
    }
    
    // Fill remaining slots with random weapons (shields or regular) - all get the DB bonus for parry
    const shieldDbBonusForParry = window.MookinatorState.getShieldDbBonus();
    while (escolhidos.length < config.qty && usados.size < lista.length) {
      const idx = Math.floor(Math.random() * lista.length);
      if (!usados.has(idx)) {
        usados.add(idx);
        const item = lista[idx];
        const nivel = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        
        const formattedWeapons = formatMeleeWeapon(item, nivel, st, shieldAttributeValue, shieldDbBonusForParry);
        escolhidos.push(...formattedWeapons);
      }
    }
  } else {
    // UPDATED: Special handling for skills to guarantee "shield" skill if present
    if (key === 'skills') {
      console.log("🛡️ Processando skills com garantia de skill 'shield'...");
      
      // Look for a skill named "shield" (case-insensitive)
      const shieldSkillIndex = lista.findIndex(item => 
        item.nome && item.nome.toLowerCase() === 'shield'
      );
      
      if (shieldSkillIndex !== -1) {
        const shieldSkill = lista[shieldSkillIndex];
        const nivel = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        
        escolhidos.push(`${shieldSkill.nome}-${nivel}`);
        usados.add(shieldSkillIndex);
        
        console.log(`🛡️ Skill 'shield' garantida adicionada: ${shieldSkill.nome}-${nivel}`);
      }
    }
    
    // Regular handling for other skill types (skills, spells, ranged)
    while (escolhidos.length < config.qty && usados.size < lista.length) {
      const idx = Math.floor(Math.random() * lista.length);
      if (!usados.has(idx)) {
        usados.add(idx);
        const item = lista[idx];
        const nivel = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        
        if (key === 'ranged') {
          const formattedWeapon = formatRangedWeapon(item, nivel, st);
          escolhidos.push(formattedWeapon);
        } else if (key === 'skills' || key === 'spells') {
          escolhidos.push(`${item.nome}-${nivel}`);
        }
      }
    }
  }
  
  preencherCampo(key, escolhidos.join('\n'));
}

// Export functions for use in other modules
window.MookinatorFormOperations = {
  preencherCampo,
  preencherAtributos,
  formatMeleeWeapon,
  formatRangedWeapon,
  preencherSkills,
  formatUsageText
};