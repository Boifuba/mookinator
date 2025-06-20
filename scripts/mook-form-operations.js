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
 * Fill attributes with calculated values - UPDATED WITH SHIELD AND SPEED LOGIC
 * @param {Object} config - Configuration object with min/max values
 */
function preencherAtributos(config) {
  const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
  if (!mookApp) return;

  console.log("🎯 Iniciando preenchimento de atributos com nova lógica...");

  // Object to store all calculated attributes
  const calculatedAttributes = {};

  // Step 1: Calculate base attributes first (ST, DX, IQ, HT)
  const baseAttributes = {};
  
  // Calculate ST, DX, IQ, HT as random values within their ranges
  ['st', 'dx', 'iq', 'ht'].forEach(attr => {
    const minValue = config[attr + 'Min'];
    const maxValue = config[attr + 'Max'];
    
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
  
  // HP = ST + random value from HP range
  if (baseAttributes.st && typeof config.hpMin === "number" && typeof config.hpMax === "number") {
    const hpModifier = window.MookinatorUtils.randomInt(config.hpMin, config.hpMax);
    const hpValue = baseAttributes.st + hpModifier;
    calculatedAttributes.hp = hpValue;
    
    mookApp.element.find(`input[name="hpMin"]`).val(config.hpMin);
    mookApp.element.find(`input[name="hpMax"]`).val(config.hpMax);
    mookApp.element.find(`input[data-key="hp"]`).val(hpValue).trigger("change");
    
    console.log(`❤️ HP: ${baseAttributes.st} (ST) + ${hpModifier} (modifier) = ${hpValue}`);
  }

  // Will = IQ + random value from Will range
  if (baseAttributes.iq && typeof config.willMin === "number" && typeof config.willMax === "number") {
    const willModifier = window.MookinatorUtils.randomInt(config.willMin, config.willMax);
    const willValue = baseAttributes.iq + willModifier;
    calculatedAttributes.will = willValue;
    
    mookApp.element.find(`input[name="willMin"]`).val(config.willMin);
    mookApp.element.find(`input[name="willMax"]`).val(config.willMax);
    mookApp.element.find(`input[data-key="will"]`).val(willValue).trigger("change");
    
    console.log(`🧠 Will: ${baseAttributes.iq} (IQ) + ${willModifier} (modifier) = ${willValue}`);
  }

  // Per = IQ + random value from Per range
  if (baseAttributes.iq && typeof config.perMin === "number" && typeof config.perMax === "number") {
    const perModifier = window.MookinatorUtils.randomInt(config.perMin, config.perMax);
    const perValue = baseAttributes.iq + perModifier;
    calculatedAttributes.per = perValue;
    
    mookApp.element.find(`input[name="perMin"]`).val(config.perMin);
    mookApp.element.find(`input[name="perMax"]`).val(config.perMax);
    mookApp.element.find(`input[data-key="per"]`).val(perValue).trigger("change");
    
    console.log(`👁️ Per: ${baseAttributes.iq} (IQ) + ${perModifier} (modifier) = ${perValue}`);
  }

  // FP = HT + random value from FP range
  if (baseAttributes.ht && typeof config.fpMin === "number" && typeof config.fpMax === "number") {
    const fpModifier = window.MookinatorUtils.randomInt(config.fpMin, config.fpMax);
    const fpValue = baseAttributes.ht + fpModifier;
    calculatedAttributes.fp = fpValue;
    
    mookApp.element.find(`input[name="fpMin"]`).val(config.fpMin);
    mookApp.element.find(`input[name="fpMax"]`).val(config.fpMax);
    mookApp.element.find(`input[data-key="fp"]`).val(fpValue).trigger("change");
    
    console.log(`⚡ FP: ${baseAttributes.ht} (HT) + ${fpModifier} (modifier) = ${fpValue}`);
  }

  // UPDATED: Speed = (DX + HT) / 4 + random float from Speed range, rounded to 0.25
  if (baseAttributes.dx && baseAttributes.ht && typeof config.speedMin === "number" && typeof config.speedMax === "number") {
    const baseSpeed = (baseAttributes.dx + baseAttributes.ht) / 4;
    const speedModifier = window.MookinatorUtils.randomFloat(config.speedMin, config.speedMax, 2);
    const rawSpeedValue = baseSpeed + speedModifier;
    const speedValue = window.MookinatorUtils.roundToQuarter(rawSpeedValue); // Round to nearest 0.25
    calculatedAttributes.speed = speedValue;
    
    mookApp.element.find(`input[name="speedMin"]`).val(config.speedMin);
    mookApp.element.find(`input[name="speedMax"]`).val(config.speedMax);
    mookApp.element.find(`input[data-key="speed"]`).val(speedValue).trigger("change");
    
    console.log(`🏃 Speed: (${baseAttributes.dx} + ${baseAttributes.ht}) / 4 + ${speedModifier} = ${rawSpeedValue} → ${speedValue} (rounded to 0.25)`);
    
    // Move = integer part of Speed
    const moveValue = Math.floor(speedValue);
    calculatedAttributes.move = moveValue;
    mookApp.element.find(`input[name="moveMin"]`).val(config.moveMin || 0);
    mookApp.element.find(`input[name="moveMax"]`).val(config.moveMax || 0);
    mookApp.element.find(`input[data-key="move"]`).val(moveValue).trigger("change");
    
    console.log(`🚶 Move: floor(${speedValue}) = ${moveValue}`);
    
    // Dodge = integer part of Speed + 3
    const dodgeValue = moveValue + 3;
    calculatedAttributes.dodge = dodgeValue;
    mookApp.element.find(`input[name="dodgeMin"]`).val(config.dodgeMin || 0);
    mookApp.element.find(`input[name="dodgeMax"]`).val(config.dodgeMax || 0);
    mookApp.element.find(`input[data-key="dodge"]`).val(dodgeValue).trigger("change");
    
    console.log(`🤸 Dodge: ${moveValue} (Move) + 3 = ${dodgeValue}`);
  }

  // UPDATED: Shield - random value from range (like all other independent attributes)
  if (typeof config.shieldMin === "number" && typeof config.shieldMax === "number") {
    const shieldValue = window.MookinatorUtils.randomInt(config.shieldMin, config.shieldMax);
    calculatedAttributes.shield = shieldValue;
    
    mookApp.element.find(`input[name="shieldMin"]`).val(config.shieldMin);
    mookApp.element.find(`input[name="shieldMax"]`).val(config.shieldMax);
    mookApp.element.find(`input[data-key="shield"]`).val(shieldValue).trigger("change");
    
    console.log(`🛡️ Shield: ${shieldValue}`);
  }

  // Step 3: Handle remaining attributes that don't change calculation (dr, coins)
  const unchangedAttributes = ["dr", "coins"];
  
  unchangedAttributes.forEach(attr => {
    const minValue = config[attr + 'Min'];
    const maxValue = config[attr + 'Max'];
    
    if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
      const val = window.MookinatorUtils.randomInt(minValue, maxValue);
      calculatedAttributes[attr] = val;
      
      // Update min/max fields in form
      mookApp.element.find(`input[name="${attr}Min"]`).val(minValue);
      mookApp.element.find(`input[name="${attr}Max"]`).val(maxValue);

      // Special handling for coins
      if (attr === "coins") {
        const currentData = window.MookinatorState.getCurrentMookData();
        console.log("🪙 Processando moedas - Valor:", val, "Dados de moeda disponíveis:", currentData.mookData?.currency);
        const coinDistribution = window.MookinatorUtils.distributeCoins(val, currentData.mookData?.currency);
        preencherCampo("equipment", coinDistribution);
      }
      
      mookApp.element.find(`input[data-key="${attr}"]`).val(val).trigger("change");
      
      console.log(`📊 ${attr.toUpperCase()}: ${val}`);
    }
  });

  // Step 4: Handle SM separately (it might have different logic)
  if (typeof config.smMin === "number" && typeof config.smMax === "number") {
    const smValue = window.MookinatorUtils.randomInt(config.smMin, config.smMax);
    calculatedAttributes.sm = smValue;
    
    mookApp.element.find(`input[name="smMin"]`).val(config.smMin);
    mookApp.element.find(`input[name="smMax"]`).val(config.smMax);
    mookApp.element.find(`input[data-key="sm"]`).val(smValue).trigger("change");
    
    console.log(`📏 SM: ${smValue}`);
  }

  // CRITICAL: Store all calculated attributes in global state
  window.MookinatorState.setLastCalculatedAttributes(calculatedAttributes);

  console.log("✅ Preenchimento de atributos concluído com nova lógica!");
}

/**
 * Format melee weapon with enhanced data - UPDATED FOR SHIELD HANDLING WITH CORRECTED SHIELD CALCULATION
 * @param {Object} weapon - Weapon object with attacks array
 * @param {number} nivel - Skill level
 * @param {number} st - Strength value for damage calculation
 * @param {number} shieldAttributeValue - Shield attribute value for block calculation
 * @returns {Array} Array of formatted weapon strings
 */
function formatMeleeWeapon(weapon, nivel, st = 10, shieldAttributeValue = 0) {
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
        // Use ST-based damage calculation
        const weaponItem = { type: [`${attack.inferredBaseDamageType} cr`] };
        const damageResults = window.MookinatorUtils.calculateFinalDamage(st, weaponItem);
        
        if (damageResults.length > 0) {
          damageStr = `${damageResults[0].damage} ${damageResults[0].type}`;
        }
      }
      
      if (!damageStr || damageStr === 'N/A') {
        return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
      }

      // Start with weapon name, level, and damage (shields can be used as weapons)
      let shieldLine = `${weapon.nome}(${nivel}) ${damageStr}`;
      
      // Add weapon properties in order, only if they have values
      // UPDATED: Clean up usage text for shields - replace "Shield Bash" with "Bash" and remove quotes
      const properties = [
        attack.reach && `reach ${attack.reach.replace(/-/g, ',')}`,
        attack.usage && `usage ${attack.usage.replace(/Shield\s+/i, '')}`, // Remove "Shield " prefix and quotes
        attack.st && `st ${attack.st}`
      ].filter(Boolean);
      
      // UPDATED: Calculate block value using corrected formula: Math.floor(nivel / 3) + 3 + weapon.db + shieldAttributeValue
      if (weapon.db && weapon.db > 0) {
        const calculatedBlock = Math.floor(nivel / 3) + 3 + weapon.db + shieldAttributeValue;
        properties.push(`block ${calculatedBlock}`);
        
        console.log(`🛡️ Block calculado para ${weapon.nome}: floor(${nivel} / 3) + 3 + ${weapon.db} + ${shieldAttributeValue} = ${calculatedBlock}`);
      }
      
      if (properties.length > 0) {
        shieldLine += ' ' + properties.join(' ');
      }
      
      return shieldLine;
    });
  }

  // Regular weapon handling with ST-based damage calculation
  return weapon.attacks.map(attack => {
    let damageStr = attack.dano;
    
    // Check if we have inferredBaseDamageType for ST-based damage
    if (attack.inferredBaseDamageType && st) {
      // Use ST-based damage calculation
      const weaponItem = { type: [`${attack.inferredBaseDamageType} cr`] };
      const damageResults = window.MookinatorUtils.calculateFinalDamage(st, weaponItem);
      
      if (damageResults.length > 0) {
        damageStr = `${damageResults[0].damage} ${damageResults[0].type}`;
      }
    }
    
    if (!damageStr || damageStr === 'N/A') {
      return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
    }

    let weaponLine = `${weapon.nome}(${nivel}) ${damageStr}`;
    
    // Add weapon properties in order, only if they have values
    // UPDATED: Remove quotes from usage for regular weapons too
    const properties = [
      attack.reach && `reach ${attack.reach.replace(/-/g, ',')}`,
      attack.usage && `usage ${attack.usage}`, // Regular weapons don't get quotes
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
 * Format ranged weapon with enhanced data - UPDATED FOR ST-BASED DAMAGE
 * @param {Object} weapon - Weapon object
 * @param {number} nivel - Skill level
 * @param {number} st - Strength value for damage calculation
 * @returns {string} Formatted weapon string
 */
function formatRangedWeapon(weapon, nivel, st = 10) {
  let damageStr = weapon.dano;
  
  // Check if we have inferredBaseDamageType for ST-based damage
  if (weapon.inferredBaseDamageType && st) {
    // Use ST-based damage calculation
    const weaponItem = { type: [`${weapon.inferredBaseDamageType} imp`] };
    const damageResults = window.MookinatorUtils.calculateFinalDamage(st, weaponItem);
    
    if (damageResults.length > 0) {
      damageStr = `${damageResults[0].damage} ${damageResults[0].type}`;
    }
  }
  
  if (!damageStr || damageStr.trim() === '' || damageStr === 'N/A') {
    return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
  }

  let weaponLine = `${weapon.nome}(${nivel}) ${damageStr}`;
  
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
 * Fill skills with random levels - UPDATED WITH SHIELD GUARANTEE AND SHIELD ATTRIBUTE
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
    
    // If we have shields, guarantee at least one
    if (shields.length > 0) {
      const randomShieldIndex = Math.floor(Math.random() * shields.length);
      const selectedShield = shields[randomShieldIndex];
      const nivel = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
      
      const formattedShields = formatMeleeWeapon(selectedShield, nivel, st, shieldAttributeValue);
      escolhidos.push(...formattedShields);
      
      console.log(`🛡️ Escudo garantido adicionado: ${selectedShield.nome}(${nivel})`);
      
      // Mark this shield as used by finding its index in the original list
      const originalShieldIndex = lista.findIndex(item => item === selectedShield);
      if (originalShieldIndex !== -1) {
        usados.add(originalShieldIndex);
      }
    }
    
    // Fill remaining slots with random weapons (shields or regular)
    while (escolhidos.length < config.qty && usados.size < lista.length) {
      const idx = Math.floor(Math.random() * lista.length);
      if (!usados.has(idx)) {
        usados.add(idx);
        const item = lista[idx];
        const nivel = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        
        const formattedWeapons = formatMeleeWeapon(item, nivel, st, shieldAttributeValue);
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
  preencherSkills
};