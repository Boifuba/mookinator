// Mookinator Form Operations - Class-based functions for filling and manipulating form fields

class MookinatorFormOperations {
  /**
   * Parse difficulty string to extract base attribute and modifier
   * @param {string} difficulty - Difficulty string like "iq/e", "dx/a", "ht/h", "st/vh"
   * @returns {object} Object with baseAttribute and modifier
   */
  parseDifficulty(difficulty) {
    if (!difficulty || typeof difficulty !== 'string') {
      return { baseAttribute: null, modifier: 0 };
    }

    const parts = difficulty.toLowerCase().split('/');
    if (parts.length !== 2) {
      return { baseAttribute: null, modifier: 0 };
    }

    const baseAttribute = parts[0]; // st, dx, iq, ht
    const difficultyLevel = parts[1]; // e, a, h, vh

    // Convert difficulty level to modifier
    const difficultyModifiers = {
      'e': 0,   // Easy
      'a': -1,  // Average
      'h': -2,  // Hard
      'vh': -3  // Very Hard
    };

    const modifier = difficultyModifiers[difficultyLevel] || 0;

    return { baseAttribute, modifier };
  }

  /**
   * Find the best default modifier for a weapon from its defaults array
   * @param {Array} defaults - Array of default objects from weapon data
   * @returns {object} Object with baseAttribute and modifier for the best default
   */
  findBestWeaponDefault(defaults) {
    if (!defaults || !Array.isArray(defaults) || defaults.length === 0) {
      return { baseAttribute: 'dx', modifier: -4 }; // Fallback to DX-4 if no defaults
    }

    let bestDefault = null;
    let bestModifier = -999; // Start with very negative value

    defaults.forEach(defaultItem => {
      // Only consider attribute-based defaults (dx, st, iq, ht), not skill-based ones
      if (defaultItem.type && ['dx', 'st', 'iq', 'ht'].includes(defaultItem.type.toLowerCase())) {
        const modifier = defaultItem.modifier || 0;
        
        // Find the least negative (best) modifier
        if (modifier > bestModifier) {
          bestModifier = modifier;
          bestDefault = {
            baseAttribute: defaultItem.type.toLowerCase(),
            modifier: modifier
          };
        }
      }
    });

    // If no attribute-based default found, use DX-4 as fallback
    if (!bestDefault) {
      console.warn("⚠️ Nenhum default baseado em atributo encontrado, usando DX-4 como fallback");
      return { baseAttribute: 'dx', modifier: -4 };
    }

    console.log(`🎯 Melhor default encontrado: ${bestDefault.baseAttribute.toUpperCase()}${bestDefault.modifier >= 0 ? '+' : ''}${bestDefault.modifier}`);
    return bestDefault;
  }

  /**
   * Fill field with content - SIMPLIFIED
   * @param {string} textareaKey - Key for the textarea
   * @param {string} content - Content to fill
   */
  preencherCampo(textareaKey, content) {
    const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
    if (!mookApp) {
      ui.notifications.warn("A janela do Mook The Mook Generator window is not open.");
      return;
    }

    mookApp.element.find(`textarea[data-key="${textareaKey}"]`).val(content).trigger("change");
  }

  /**
   * Calculate core attributes (ST, DX, IQ, HT, PARRY)
   * @param {Object} config - Configuration object with min/max values
   * @param {Object} gcsBaseAttributes - Base attribute values from GCS file
   * @param {Object} mookApp - Mook application window
   * @returns {Object} Calculated core attributes
   * @private
   */
  _calculateCoreAttributes(config, gcsBaseAttributes, mookApp) {
    const mookinator = game.modules.get("mookinator").api;
    const coreAttributes = {};
    
    // Calculate ST, DX, IQ, HT with base values from imported file + random modifiers
    ['st', 'dx', 'iq', 'ht'].forEach(attr => {
      const minValue = config.atributos?.[attr]?.min ?? config[attr + 'Min'];
      const maxValue = config.atributos?.[attr]?.max ?? config[attr + 'Max'];
      
      // PRIORITY 1: Use GCS base values if available
      // PRIORITY 2: Use config base values if available  
      // PRIORITY 3: Default to 10
      let baseValue = 10;
      if (gcsBaseAttributes && gcsBaseAttributes[attr] && typeof gcsBaseAttributes[attr].baseValue === 'number') {
        baseValue = gcsBaseAttributes[attr].baseValue;
      } else if (config.atributos?.[attr]?.baseValue && typeof config.atributos[attr].baseValue === 'number') {
        baseValue = config.atributos[attr].baseValue;
      }
      
      if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
        const modifier = mookinator.utils.randomInt(minValue, maxValue);
        const val = baseValue + modifier;
        coreAttributes[attr] = val;
        
        // Update min/max fields in form
        mookApp.element.find(`input[name="${attr}Min"]`).val(minValue);
        mookApp.element.find(`input[name="${attr}Max"]`).val(maxValue);
        
        // Set the calculated value
        mookApp.element.find(`input[data-key="${attr}"]`).val(val).trigger("change");
      }
    });
    
    // Calculate PARRY as pure random value (no base value from file)
    ['parry'].forEach(attr => {
      const minValue = config.atributos?.[attr]?.min ?? config[attr + 'Min'];
      const maxValue = config.atributos?.[attr]?.max ?? config[attr + 'Max'];
      
      if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
        const val = mookinator.utils.randomInt(minValue, maxValue);
        coreAttributes[attr] = val;
      }
    });

    return coreAttributes;
  }

  /**
   * Calculate derived attributes (HP, Will, Per, FP, Speed, Move, Dodge)
   * @param {Object} coreAttributes - Core attributes (ST, DX, IQ, HT)
   * @param {Object} config - Configuration object with min/max values
   * @param {Object} mookApp - Mook application window
   * @returns {Object} Calculated derived attributes
   * @private
   */
  _calculateDerivedAttributes(coreAttributes, config, mookApp) {
    const mookinator = game.modules.get("mookinator").api;
    const derivedAttributes = {};

    // FIXED: HP = HT + random value from HP range (was ST + HP range)
    if (coreAttributes.ht && typeof config.atributos?.hp?.min === "number" && typeof config.atributos?.hp?.max === "number") {
      const hpModifier = mookinator.utils.randomInt(config.atributos.hp.min, config.atributos.hp.max);
      const hpValue = coreAttributes.ht + hpModifier;
      derivedAttributes.hp = hpValue;
      
      mookApp.element.find(`input[name="hpMin"]`).val(config.atributos.hp.min);
      mookApp.element.find(`input[name="hpMax"]`).val(config.atributos.hp.max);
      mookApp.element.find(`input[data-key="hp"]`).val(hpValue).trigger("change");
    }

    // Will = IQ + random value from Will range
    if (coreAttributes.iq && typeof config.atributos?.will?.min === "number" && typeof config.atributos?.will?.max === "number") {
      const willModifier = mookinator.utils.randomInt(config.atributos.will.min, config.atributos.will.max);
      const willValue = coreAttributes.iq + willModifier;
      derivedAttributes.will = willValue;
      
      mookApp.element.find(`input[name="willMin"]`).val(config.atributos.will.min);
      mookApp.element.find(`input[name="willMax"]`).val(config.atributos.will.max);
      mookApp.element.find(`input[data-key="will"]`).val(willValue).trigger("change");
    }

    // Per = IQ + random value from Per range
    if (coreAttributes.iq && typeof config.atributos?.per?.min === "number" && typeof config.atributos?.per?.max === "number") {
      const perModifier = mookinator.utils.randomInt(config.atributos.per.min, config.atributos.per.max);
      const perValue = coreAttributes.iq + perModifier;
      derivedAttributes.per = perValue;
      
      mookApp.element.find(`input[name="perMin"]`).val(config.atributos.per.min);
      mookApp.element.find(`input[name="perMax"]`).val(config.atributos.per.max);
      mookApp.element.find(`input[data-key="per"]`).val(perValue).trigger("change");
    }

    // FIXED: FP = ST + random value from FP range (was HT + FP range)
    if (coreAttributes.st && typeof config.atributos?.fp?.min === "number" && typeof config.atributos?.fp?.max === "number") {
      const fpModifier = mookinator.utils.randomInt(config.atributos.fp.min, config.atributos.fp.max);
      const fpValue = coreAttributes.st + fpModifier;
      derivedAttributes.fp = fpValue;
      
      mookApp.element.find(`input[name="fpMin"]`).val(config.atributos.fp.min);
      mookApp.element.find(`input[name="fpMax"]`).val(config.atributos.fp.max);
      mookApp.element.find(`input[data-key="fp"]`).val(fpValue).trigger("change");
    }

    // UPDATED: Speed = (DX + HT) / 4 + random float from Speed range, rounded to 0.25
    if (coreAttributes.dx && coreAttributes.ht && typeof config.atributos?.speed?.min === "number" && typeof config.atributos?.speed?.max === "number") {
      const baseSpeed = (coreAttributes.dx + coreAttributes.ht) / 4;
      const speedModifier = mookinator.utils.randomFloat(config.atributos.speed.min, config.atributos.speed.max, 2);
      const rawSpeedValue = baseSpeed + speedModifier;
      const speedValue = mookinator.utils.roundToQuarter(rawSpeedValue); // Round to nearest 0.25
      derivedAttributes.speed = speedValue;
      
      mookApp.element.find(`input[name="speedMin"]`).val(config.atributos.speed.min);
      mookApp.element.find(`input[name="speedMax"]`).val(config.atributos.speed.max);
      mookApp.element.find(`input[data-key="speed"]`).val(speedValue).trigger("change");
      
      // UPDATED: Move = floor(Speed) + random value from Move range
      let moveValue = Math.floor(speedValue);
      
      // Add random modifier from Move range if configured
      if (typeof config.atributos?.move?.min === "number" && typeof config.atributos?.move?.max === "number") {
        const moveModifier = mookinator.utils.randomInt(config.atributos.move.min, config.atributos.move.max);
        moveValue += moveModifier;
        
        // Update min/max fields in form
        mookApp.element.find(`input[name="moveMin"]`).val(config.atributos.move.min);
        mookApp.element.find(`input[name="moveMax"]`).val(config.atributos.move.max);
      } else {
        // Fallback to old behavior if no Move range is configured
        mookApp.element.find(`input[name="moveMin"]`).val(0);
        mookApp.element.find(`input[name="moveMax"]`).val(0);
      }
      
      derivedAttributes.move = moveValue;
      mookApp.element.find(`input[data-key="move"]`).val(moveValue).trigger("change");
      
      // Dodge = integer part of Speed + 3 (WITHOUT DB bonus yet - will be added later in main.js)
      const dodgeValue = moveValue + 3;
      derivedAttributes.dodge = dodgeValue;
      mookApp.element.find(`input[name="dodgeMin"]`).val(config.atributos?.dodge?.min || 0);
      mookApp.element.find(`input[name="dodgeMax"]`).val(config.atributos?.dodge?.max || 0);
      mookApp.element.find(`input[data-key="dodge"]`).val(dodgeValue).trigger("change");
    }

    return derivedAttributes;
  }

  /**
   * Calculate other attributes (Shield, SM, DR, Coins)
   * @param {Object} config - Configuration object with min/max values
   * @param {Object} mookApp - Mook application window
   * @returns {Object} Calculated other attributes
   * @private
   */
  _calculateOtherAttributes(config, mookApp) {
    const mookinator = game.modules.get("mookinator").api;
    const otherAttributes = {};

    // UPDATED: Shield - random value from range (like all other independent attributes)
    if (typeof config.atributos?.shield?.min === "number" && typeof config.atributos?.shield?.max === "number") {
      const shieldValue = mookinator.utils.randomInt(config.atributos.shield.min, config.atributos.shield.max);
      otherAttributes.shield = shieldValue;
      
      mookApp.element.find(`input[name="shieldMin"]`).val(config.atributos.shield.min);
      mookApp.element.find(`input[name="shieldMax"]`).val(config.atributos.shield.max);
      mookApp.element.find(`input[data-key="shield"]`).val(shieldValue).trigger("change");
    }

    // Handle remaining attributes that don't change calculation (dr)
    const unchangedAttributes = ["dr"];
    
    unchangedAttributes.forEach(attr => {
      const minValue = config.atributos?.[attr]?.min ?? config[attr + 'Min'];
      const maxValue = config.atributos?.[attr]?.max ?? config[attr + 'Max'];
      
      if (typeof minValue === "number" && typeof maxValue === "number" && maxValue >= minValue) {
        const val = mookinator.utils.randomInt(minValue, maxValue);
        otherAttributes[attr] = val;
        
        // Update min/max fields in form
        mookApp.element.find(`input[name="${attr}Min"]`).val(minValue);
        mookApp.element.find(`input[name="${attr}Max"]`).val(maxValue);
        
        mookApp.element.find(`input[data-key="${attr}"]`).val(val).trigger("change");
      }
    });

    // Handle coins separately (now in vertical section)
    if (typeof config.atributos?.coins?.min === "number" && typeof config.atributos?.coins?.max === "number") {
      const coinsValue = mookinator.utils.randomInt(config.atributos.coins.min, config.atributos.coins.max);
      otherAttributes.coins = coinsValue;
      
      mookApp.element.find(`input[name="coinsMin"]`).val(config.atributos.coins.min);
      mookApp.element.find(`input[name="coinsMax"]`).val(config.atributos.coins.max);
      
      const currentData = mookinator.state.getCurrentMookData();
      const coinDistribution = mookinator.utils.distributeCoins(coinsValue, currentData.mookData?.currency);
      this.preencherCampo("equipment", coinDistribution);
    }

    // Handle SM separately (it might have different logic)
    if (typeof config.atributos?.sm?.min === "number" && typeof config.atributos?.sm?.max === "number") {
      const smValue = mookinator.utils.randomInt(config.atributos.sm.min, config.atributos.sm.max);
      otherAttributes.sm = smValue;
      
      mookApp.element.find(`input[name="smMin"]`).val(config.atributos.sm.min);
      mookApp.element.find(`input[name="smMax"]`).val(config.atributos.sm.max);
      mookApp.element.find(`input[data-key="sm"]`).val(smValue).trigger("change");
    }

    return otherAttributes;
  }

  /**
   * Fill attributes with calculated values - REFACTORED INTO SMALLER METHODS
   * @param {Object} config - Configuration object with min/max values
   * @param {Object} gcsBaseAttributes - Base attribute values from GCS file
   */
  preencherAtributos(config, gcsBaseAttributes = null) {
    const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
    if (!mookApp) return;

    const mookinator = game.modules.get("mookinator").api;

    // Calculate all attribute groups
    const coreAttributes = this._calculateCoreAttributes(config, gcsBaseAttributes, mookApp);
    const derivedAttributes = this._calculateDerivedAttributes(coreAttributes, config, mookApp);
    const otherAttributes = this._calculateOtherAttributes(config, mookApp);

    // Combine all calculated attributes
    const calculatedAttributes = {
      ...coreAttributes,
      ...derivedAttributes,
      ...otherAttributes
    };

    // CRITICAL: Store all calculated attributes in module state
    mookinator.state.setLastCalculatedAttributes(calculatedAttributes);
  }

  /**
   * Format usage text by joining multiple words with hyphens
   * @param {string} usage - Usage text
   * @returns {string} Formatted usage text
   */
  formatUsageText(usage) {
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
  formatMeleeWeapon(weapon, nivel, st = 10, shieldAttributeValue = 0, shieldDbBonusForParry = 0) {
    if (!weapon.attacks || !Array.isArray(weapon.attacks)) {
      return [`${weapon.nome}(${nivel}) #ERROR - No attack data`];
    }

    const mookinator = game.modules.get("mookinator").api;

    // Special handling for shields
    if (weapon.shield === true) {
      return weapon.attacks.map(attack => {
        // For shields, check if we have inferredBaseDamageType for ST-based damage
        let damageStr = attack.dano;
        
        if (attack.inferredBaseDamageType && st) {
          // UPDATED: Extract real damage type from the full damage string
          const realDamageType = mookinator.utils.extractDamageTypeFromFullDamageString(attack.dano);
          
          if (realDamageType === null) {
            ui.notifications.error(`⚠️ Tipo de dano não encontrado para o escudo "${weapon.nome}". Processamento interrompido.`);
            return `${weapon.nome}(${nivel}) #ERROR - Damage type not found in "${attack.dano}"`;
          }
          
          // Use ST-based damage calculation with real damage type
          const weaponItem = { type: [`${attack.inferredBaseDamageType} ${realDamageType}`] };
          const damageResults = mookinator.utils.calculateFinalDamage(st, weaponItem);
          
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
        // UPDATED: Format usage text with hyphens for multiple words
        const properties = [
          attack.reach && `reach ${attack.reach.replace(/-/g, ',')}`,
          attack.usage && `usage ${this.formatUsageText(attack.usage)}`,
          attack.st && `st ${attack.st}`
        ].filter(Boolean);
        
        // UPDATED: Calculate block value only if weapon.db is valid (not null)
        if (weapon.db > 0) {
          const calculatedBlock = Math.floor(nivel / 2) + 3 + weapon.db + shieldAttributeValue;
          properties.push(`block ${calculatedBlock}`);
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
        const realDamageType = mookinator.utils.extractDamageTypeFromFullDamageString(attack.dano);
        
        if (realDamageType === null) {
          ui.notifications.error(`⚠️ Tipo de dano não encontrado para a arma "${weapon.nome}". Processamento interrompido.`);
          return `${weapon.nome}(${nivel}) #ERROR - Damage type not found in "${attack.dano}"`;
        }
        
        // Use ST-based damage calculation with real damage type
        const weaponItem = { type: [`${attack.inferredBaseDamageType} ${realDamageType}`] };
        const damageResults = mookinator.utils.calculateFinalDamage(st, weaponItem);
        
        if (damageResults.length > 0) {
          damageStr = `${damageResults[0].damage} ${damageResults[0].type}`;
        }
      }
      
      if (!damageStr || damageStr === 'N/A') {
        return `${weapon.nome}(${nivel}) #ERROR - No damage data`;
      }

      let weaponLine = `${weapon.nome}(${nivel}) ${damageStr}`;
      
      // Add weapon properties in order, only if they have values
      // UPDATED: Format usage text with hyphens for multiple words
      const properties = [
        attack.reach && `reach ${attack.reach.replace(/-/g, ',')}`,
        attack.usage && `usage ${this.formatUsageText(attack.usage)}`,
        attack.st && `st ${attack.st}`,
        attack.block && `block ${attack.block}`
      ].filter(Boolean);
      
      // NEW PARRY CALCULATION WITH DB BONUS: Use the new formula with DB bonus
      if (attack.parry) {
        const calculatedParry = mookinator.utils.calculateParryValue(nivel, attack.parry, shieldDbBonusForParry);
        properties.splice(-1, 0, `parry ${calculatedParry}`); // Insert parry before block if block exists
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
  formatRangedWeapon(weapon, nivel, st = 10) {
    const mookinator = game.modules.get("mookinator").api;
    let damageStr = weapon.dano;
    
    // Check if we have inferredBaseDamageType for ST-based damage
    if (weapon.inferredBaseDamageType && st) {
      // UPDATED: Extract real damage type from the full damage string
      const realDamageType = mookinator.utils.extractDamageTypeFromFullDamageString(weapon.dano);
      
      if (realDamageType === null) {
        ui.notifications.error(`⚠️ Tipo de dano não encontrado para a arma à distância "${weapon.nome}". Processamento interrompido.`);
        return `${weapon.nome}(${nivel}) #ERROR - Damage type not found in "${weapon.dano}"`;
      }
      
      // Use ST-based damage calculation with real damage type
      const weaponItem = { type: [`${weapon.inferredBaseDamageType} ${realDamageType}`] };
      const damageResults = mookinator.utils.calculateFinalDamage(st, weaponItem);
      
      if (damageResults.length > 0) {
        damageStr = `${damageResults[0].damage} ${damageResults[0].type}`;
      }
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
      weapon.usage && `usage ${this.formatUsageText(weapon.usage)}`,
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
   * Select items from a list (mandatory first, then random)
   * @param {Array} lista - List of items to select from
   * @param {Object} config - Configuration with qty, min, max
   * @param {string} key - Key for the item type ('melee', 'ranged', 'skills', 'spells')
   * @returns {Array} Array of selected items with their original indices
   * @private
   */
  _selectItems(lista, config, key) {
    const mookinator = game.modules.get("mookinator").api;
    const usados = new Set();
    const selectedItems = [];
    
    // First, add all mandatory items
    const mandatoryItems = lista.filter(item => item.isMandatory === true);
    
    if (mandatoryItems.length > 0) {
      mandatoryItems.forEach(item => {
        const originalIndex = lista.findIndex(listItem => listItem === item);
        if (originalIndex !== -1) {
          usados.add(originalIndex);
          selectedItems.push({ item, originalIndex });
          
          // Check if this is a shield and store DB bonus
          if (key === 'melee' && item.shield === true && item.db > 0) {
            mookinator.state.setShieldDbBonus(item.db);
          }
        }
      });
    }
    
    // Reset shield DB bonus if no mandatory shield was found
    if (key === 'melee' && !mandatoryItems.some(item => item.shield === true && item.db > 0)) {
      mookinator.state.setShieldDbBonus(0);
    }
    
    // Then fill remaining slots with random items
    while (selectedItems.length < config.qty && usados.size < lista.length) {
      const idx = Math.floor(Math.random() * lista.length);
      if (!usados.has(idx)) {
        usados.add(idx);
        const item = lista[idx];
        selectedItems.push({ item, originalIndex: idx });
        
        // Check if this is a shield and update DB bonus (only if no mandatory shield was already selected)
        if (key === 'melee' && item.shield === true && item.db > 0 && mookinator.state.getShieldDbBonus() === 0) {
          mookinator.state.setShieldDbBonus(item.db);
        }
      }
    }
    
    return selectedItems;
  }

  /**
   * Calculate skill level for an item
   * @param {Object} item - The skill/weapon/spell item
   * @param {string} key - Key for the item type ('melee', 'ranged', 'skills', 'spells')
   * @param {Object} config - Configuration with min, max values
   * @returns {number} Calculated skill level
   * @private
   */
  _calculateSkillLevel(item, key, config) {
    const mookinator = game.modules.get("mookinator").api;
    
    if (key === 'melee') {
      // Calculate weapon skill level using best default
      if (item.attacks && item.attacks[0] && item.attacks[0].defaults && Array.isArray(item.attacks[0].defaults) && item.attacks[0].defaults.length > 0) {
        const bestDefault = this.findBestWeaponDefault(item.attacks[0].defaults);
        const finalAttributeValue = mookinator.state.getCalculatedAttributeValue(bestDefault.baseAttribute);
        
        if (finalAttributeValue > 0) {
          const randomVariation = mookinator.utils.randomInt(config.min, config.max);
          return finalAttributeValue + randomVariation;
        } else {
          console.warn(`⚠️ Atributo ${bestDefault.baseAttribute} não encontrado para arma ${item.nome}, usando nível aleatório`);
          return mookinator.utils.randomInt(config.min, config.max);
        }
      } else {
        console.warn(`⚠️ Nenhum default encontrado para arma ${item.nome}, usando nível aleatório`);
        return mookinator.utils.randomInt(config.min, config.max);
      }
    } else if (key === 'ranged') {
      // Calculate ranged weapon skill level using weapon defaults
      if (item.defaults && Array.isArray(item.defaults) && item.defaults.length > 0) {
        const bestDefault = this.findBestWeaponDefault(item.defaults);
        const finalAttributeValue = mookinator.state.getCalculatedAttributeValue(bestDefault.baseAttribute);
        
        if (finalAttributeValue > 0) {
          const randomVariation = mookinator.utils.randomInt(config.min, config.max);
          return finalAttributeValue + randomVariation;
        } else {
          console.warn(`⚠️ Atributo ${bestDefault.baseAttribute} não encontrado para arma à distância ${item.nome}, usando nível aleatório`);
          return mookinator.utils.randomInt(config.min, config.max);
        }
      } else {
        console.warn(`⚠️ Nenhum default encontrado para arma à distância ${item.nome}, usando nível aleatório`);
        return mookinator.utils.randomInt(config.min, config.max);
      }
    } else if (key === 'skills') {
      // Calculate skill level based on difficulty if available
      if (item.difficulty) {
        const parsed = this.parseDifficulty(item.difficulty);
        
        if (parsed.baseAttribute) {
          const baseAttributeValue = mookinator.state.getCalculatedAttributeValue(parsed.baseAttribute);
          
          if (baseAttributeValue > 0) {
            const randomVariation = mookinator.utils.randomInt(config.min, config.max);
            return baseAttributeValue + parsed.modifier + randomVariation;
          } else {
            console.warn(`⚠️ Atributo ${parsed.baseAttribute} não encontrado para skill ${item.nome}, usando nível aleatório`);
            return mookinator.utils.randomInt(config.min, config.max);
          }
        } else {
          return mookinator.utils.randomInt(config.min, config.max);
        }
      } else {
        return mookinator.utils.randomInt(config.min, config.max);
      }
    } else if (key === 'spells') {
      // Calculate spell level based on IQ + random variation
      const baseIqValue = mookinator.state.getCalculatedAttributeValue('iq');
      
      if (baseIqValue > 0) {
        const randomVariation = mookinator.utils.randomInt(config.min, config.max);
        return baseIqValue + randomVariation;
      } else {
        console.warn(`⚠️ Atributo IQ não encontrado para spell ${item.nome}, usando nível aleatório`);
        return mookinator.utils.randomInt(config.min, config.max);
      }
    }
    
    return mookinator.utils.randomInt(config.min, config.max);
  }

  /**
   * Format skill output based on item type
   * @param {Object} item - The skill/weapon/spell item
   * @param {number} nivel - Calculated skill level
   * @param {string} key - Key for the item type ('melee', 'ranged', 'skills', 'spells')
   * @param {number} st - Strength value for damage calculation
   * @param {number} shieldAttributeValue - Shield attribute value for block calculation
   * @param {number} shieldDbBonusForParry - Shield DB bonus for parry calculation
   * @returns {Array|string} Formatted output (array for melee weapons, string for others)
   * @private
   */
  _formatSkillOutput(item, nivel, key, st, shieldAttributeValue, shieldDbBonusForParry) {
    if (key === 'melee') {
      return this.formatMeleeWeapon(item, nivel, st, shieldAttributeValue, shieldDbBonusForParry);
    } else if (key === 'ranged') {
      return this.formatRangedWeapon(item, nivel, st);
    } else if (key === 'skills') {
      return `${item.nome}-${nivel}`;
    } else if (key === 'spells') {
      return `${item.nome}-${nivel}`;
    }
    
    return `${item.nome}-${nivel}`;
  }

  /**
   * Fill skills with random levels - REFACTORED INTO SMALLER METHODS
   * @param {Array} lista - List of items
   * @param {string} key - Key for the textarea
   * @param {Object} config - Configuration with qty, min, max
   * @param {number} st - Strength value for damage calculation
   * @param {number} shieldAttributeValue - Shield attribute value for block calculation (only for melee)
   */
  preencherSkills(lista, key, config, st = 10, shieldAttributeValue = 0) {
    if (!lista || !Array.isArray(lista)) return;
    
    const mookinator = game.modules.get("mookinator").api;
    
    // Select items (mandatory first, then random)
    const selectedItems = this._selectItems(lista, config, key);
    
    // Get current shield DB bonus for parry calculations
    const shieldDbBonusForParry = mookinator.state.getShieldDbBonus();
    
    // Calculate levels and format output for each selected item
    const formattedOutputs = [];
    
    selectedItems.forEach(({ item }) => {
      const nivel = this._calculateSkillLevel(item, key, config);
      const output = this._formatSkillOutput(item, nivel, key, st, shieldAttributeValue, shieldDbBonusForParry);
      
      if (Array.isArray(output)) {
        formattedOutputs.push(...output);
      } else {
        formattedOutputs.push(output);
      }
    });
    
    this.preencherCampo(key, formattedOutputs.join('\n'));
  }
}