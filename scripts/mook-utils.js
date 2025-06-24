// Mookinator Utils - Class-based damage calculation system and general utilities

class MookinatorUtils {
  constructor() {
    // Damage table based on ST values
    this.dmgTable = {
      "1":{"thr":'1d-6', "sw":'1d-5'},
      "2":{"thr":'1d-6', "sw":'1d-5'},
      "3":{"thr":'1d-5', "sw":'1d-4'},
      "4":{"thr":'1d-5', "sw":'1d-4'},
      "5":{"thr":'1d-4', "sw":'1d-3'},
      "6":{"thr":'1d-4', "sw":'1d-3'},
      "7":{"thr":'1d-3', "sw":'1d-2'},
      "8":{"thr":'1d-3', "sw":'1d-2'},
      "9":{"thr":'1d-2', "sw":'1d-1'},
      "10":{"thr":'1d-2', "sw":'1d'},
      "11":{"thr":'1d-1', "sw":'1d+1'},
      "12":{"thr":'1d-1', "sw":'1d+2'},
      "13":{"thr":'1d', "sw":'2d-1'},
      "14":{"thr":'1d', "sw":'2d'},
      "15":{"thr":'1d+1', "sw":'2d+1'},
      "16":{"thr":'1d+1', "sw":'2d+2'},
      "17":{"thr":'1d+2', "sw":'3d-1'},
      "18":{"thr":'1d+2', "sw":'3d'},
      "19":{"thr":'2d-1', "sw":'3d+1'},
      "20":{"thr":'2d-1', "sw":'3d+2'},
      "21":{"thr":'2d', "sw":'4d-1'},
      "22":{"thr":'2d', "sw":'4d'},
      "23":{"thr":'2d+1', "sw":'4d+1'},
      "24":{"thr":'2d+1', "sw":'4d+2'},
      "25":{"thr":'2d+2', "sw":'5d-1'},
      "26":{"thr":'2d+2', "sw":'5d'},
      "27":{"thr":'3d-1', "sw":'5d+1'},
      "28":{"thr":'3d-1', "sw":'5d+1'},
      "29":{"thr":'3d', "sw":'5d+2'},
      "30":{"thr":'3d', "sw":'5d+2'},
      "31":{"thr":'3d+1', "sw":'6d-1'},
      "32":{"thr":'3d+1', "sw":'6d-1'},
      "33":{"thr":'3d+2', "sw":'6d'},
      "34":{"thr":'3d+2', "sw":'6d'},
      "35":{"thr":'4d-1', "sw":'6d+1'},
      "36":{"thr":'4d-1', "sw":'6d+1'},
      "37":{"thr":'4d', "sw":'6d+2'},
      "38":{"thr":'4d', "sw":'6d+2'},
      "39":{"thr":'4d+1', "sw":'7d-1'},
      "40":{"thr":'4d+1', "sw":'7d-1'},
      "45":{"thr":'5d', "sw":'7d+1'},
      "50":{"thr":'5d+2', "sw":'8d-1'},
      "55":{"thr":'6d', "sw":'8d+1'},
      "60":{"thr":'7d-1', "sw":'9d'},
      "65":{"thr":'7d+1', "sw":'9d+2'},
      "70":{"thr":'8d', "sw":'10d'},
      "75":{"thr":'8d+2', "sw":'10d+2'},
      "80":{"thr":'9d', "sw":'11d'},
      "85":{"thr":'9d+2', "sw":'11d+2'},
      "90":{"thr":'10d', "sw":'12d'},
      "95":{"thr":'10d+2', "sw":'12d+2'},
      "100":{"thr":'11d', "sw":'13d'}	
    };
  }

  /**
   * Generate random number within range (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer between min and max
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random floating point number within range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {number} Random float between min and max
   */
  randomFloat(min, max, decimals = 2) {
    const random = Math.random() * (max - min) + min;
    return parseFloat(random.toFixed(decimals));
  }

  /**
   * Round to nearest quarter (0.25 increments)
   * @param {number} value - Value to round
   * @returns {number} Value rounded to nearest 0.25
   */
  roundToQuarter(value) {
    return Math.round(value * 4) / 4;
  }

  /**
   * Extract damage type from full damage string - NEW FUNCTION
   * @param {string} fullDamageString - Full damage string like "1d+2 cut", "2d imp", "1d-1 cr"
   * @returns {string|null} Damage type (cut, imp, cr, pi, burn, tox, fat, cor, etc.) or null if not found
   */
  extractDamageTypeFromFullDamageString(fullDamageString) {
    if (!fullDamageString || typeof fullDamageString !== 'string') {
      return null;
    }

    const str = fullDamageString.trim().toLowerCase();
    
    // Common GURPS damage types - ordered by specificity to avoid partial matches
    const damageTypes = [
      'pi++', 'pi+', 'pi-', 'pi',  // Piercing variants (most specific first)
      'cut', 'imp', 'cr',          // Common physical types
      'burn', 'cor', 'fat', 'tox', // Special damage types
      'spec'                       // Special damage
    ];
    
    // Look for damage type at the end of the string (most common format)
    for (const damageType of damageTypes) {
      // Match damage type as a separate word at the end
      const regex = new RegExp(`\\b${damageType.replace(/[+\-]/g, '\\$&')}$`, 'i');
      if (regex.test(str)) {
        return damageType;
      }
    }
    
    // Look for damage type anywhere in the string as fallback
    for (const damageType of damageTypes) {
      const regex = new RegExp(`\\b${damageType.replace(/[+\-]/g, '\\$&')}\\b`, 'i');
      if (regex.test(str)) {
        return damageType;
      }
    }
    
    console.warn(`⚠️ Tipo de dano não encontrado na string: "${fullDamageString}"`);
    return null;
  }

  /**
   * Distribute coins among different currency types - SIMPLIFIED
   * @param {number} totalValue - Total value to distribute
   * @param {Array} currencyData - Array of currency objects
   * @returns {string} Formatted coin distribution string
   */
  distributeCoins(totalValue, currencyData) {
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
   * Parse a damage string into dice and modifier components
   * @param {string} dmgStr - Damage string like "1d+2", "2d-1", "1d"
   * @returns {object} Object with dice and mod properties
   */
  parseDamageString(dmgStr) {
    if (!dmgStr || dmgStr.trim() === '') {
      return { dice: 0, mod: 0 };
    }

    const str = dmgStr.trim();
    
    // Handle cases like "1d+2", "2d-1", "1d"
    const match = str.match(/^(\d+)d([+-]\d+)?$/);
    if (match) {
      const dice = parseInt(match[1]);
      const mod = match[2] ? parseInt(match[2]) : 0;
      return { dice, mod };
    }
    
    // Handle cases like "+2", "-1" (pure modifiers)
    const modMatch = str.match(/^([+-]\d+)$/);
    if (modMatch) {
      return { dice: 0, mod: parseInt(modMatch[1]) };
    }
    
    // Handle cases like "2" (pure numbers)
    const numMatch = str.match(/^(\d+)$/);
    if (numMatch) {
      return { dice: 0, mod: parseInt(numMatch[1]) };
    }
    
    return { dice: 0, mod: 0 };
  }

  /**
   * Format dice and modifier back into a damage string
   * @param {number} dice - Number of dice
   * @param {number} mod - Modifier value
   * @returns {string} Formatted damage string
   */
  formatDamageString(dice, mod) {
    if (dice === 0 && mod === 0) {
      return '';
    }
    
    if (dice === 0) {
      return mod > 0 ? `+${mod}` : `${mod}`;
    }
    
    if (mod === 0) {
      return `${dice}d`;
    }
    
    return mod > 0 ? `${dice}d+${mod}` : `${dice}d${mod}`;
  }

  /**
   * Combine two damage strings by adding their dice and modifiers
   * @param {string} dmg1 - First damage string
   * @param {string} dmg2 - Second damage string
   * @returns {string} Combined damage string
   */
  combineDamageStrings(dmg1, dmg2) {
    const parsed1 = this.parseDamageString(dmg1);
    const parsed2 = this.parseDamageString(dmg2);
    
    const totalDice = parsed1.dice + parsed2.dice;
    const totalMod = parsed1.mod + parsed2.mod;
    
    return this.formatDamageString(totalDice, totalMod);
  }

  /**
   * Parse weapon damage type string like "sw cr", "thr+1 imp", "thr+2 cr"
   * @param {string} typeStr - Damage type string
   * @returns {object} Object with baseType, modifier, and damageType
   */
  parseWeaponDamageTypeString(typeStr) {
    if (!typeStr || typeStr.trim() === '') {
      return { baseType: '', modifier: '', damageType: '' };
    }

    const str = typeStr.trim();
    
    // Match patterns like "sw cr", "thr+1 imp", "thr+2 cr", "thr-1 cut"
    const match = str.match(/^(sw|thr)([+-]\d+)?\s+(\w+)$/);
    if (match) {
      return {
        baseType: match[1], // "sw" or "thr"
        modifier: match[2] || '', // "+1", "+2", "-1", etc. or empty
        damageType: match[3] // "cr", "imp", "cut", etc.
      };
    }
    
    return { baseType: '', modifier: '', damageType: '' };
  }

  /**
   * Parse parry string to extract numeric and letter components
   * @param {string} parryStr - Parry string like "2U", "0F", "OF", "3F"
   * @returns {object} Object with numeric and letter properties
   */
  parseParryString(parryStr) {
    if (!parryStr || parryStr.trim() === '') {
      return { numeric: 0, letter: '' };
    }

    const str = parryStr.trim();
    
    // Match patterns like "2U", "0F", "3F"
    const match = str.match(/^(\d+)([A-Za-z])$/);
    if (match) {
      return {
        numeric: parseInt(match[1]),
        letter: match[2]
      };
    }
    
    // Handle cases like "OF" (letter only, numeric is 0)
    const letterOnlyMatch = str.match(/^([A-Za-z])$/);
    if (letterOnlyMatch) {
      return {
        numeric: 0,
        letter: letterOnlyMatch[1]
      };
    }
    
    // Handle pure numbers (no letter)
    const numOnlyMatch = str.match(/^(\d+)$/);
    if (numOnlyMatch) {
      return {
        numeric: parseInt(numOnlyMatch[1]),
        letter: ''
      };
    }
    
    return { numeric: 0, letter: '' };
  }

  /**
   * Calculate parry value using the formula: floor(nivel / 2) + 3 + originalNumeric + originalLetter + dbBonus
   * @param {number} nivel - Skill level
   * @param {string} originalParry - Original parry string from weapon data
   * @param {number} dbBonus - Shield DB bonus to add to parry
   * @returns {string} Calculated parry value with letter
   */
  calculateParryValue(nivel, originalParry, dbBonus = 0) {
    const parsed = this.parseParryString(originalParry);
    const baseParry = Math.floor(nivel / 2) + 3;
    const finalNumeric = baseParry + parsed.numeric + dbBonus;
    
    // Return the calculated value with the original letter
    return parsed.letter ? `${finalNumeric}${parsed.letter}` : `${finalNumeric}`;
  }

  /**
   * Calculate final damage values for a weapon based on ST
   * @param {number} st - Strength value
   * @param {object} item - Weapon item with type array
   * @returns {array} Array of damage objects with damage, type, and baseType
   */
  calculateFinalDamage(st, item) {
    // Get base damage from ST table
    const stStr = st.toString();
    const baseDamage = this.dmgTable[stStr] || this.dmgTable["10"]; // Default to ST 10 if not found
    
    const damageResults = [];
    
    // Process each damage type in the weapon's type array
    if (item.type && Array.isArray(item.type)) {
      item.type.forEach(typeStr => {
        const parsed = this.parseWeaponDamageTypeString(typeStr);
        
        if (parsed.baseType && parsed.damageType) {
          // Get base damage (thr or sw) from ST table
          const baseDmg = baseDamage[parsed.baseType];
          
          if (baseDmg) {
            let finalDamage = baseDmg;
            
            // Apply weapon modifier if present
            if (parsed.modifier && parsed.modifier.trim() !== '') {
              finalDamage = this.combineDamageStrings(baseDmg, parsed.modifier);
            }
            
            damageResults.push({
              damage: finalDamage,
              type: parsed.damageType,
              baseType: parsed.baseType // Include baseType for formatting
            });
          }
        }
      });
    }
    
    return damageResults;
  }

  /**
   * Format melee weapon output with separate lines for each damage type
   * @param {array} damageResults - Array of damage objects from calculateFinalDamage
   * @param {string} weaponName - Name of the weapon
   * @param {number} nivel - Skill level
   * @returns {array} Array of formatted weapon strings
   */
  formatMeleeWeaponOutput(damageResults, weaponName, nivel) {
    const output = [];
    
    // Create one line for each damage type with new format: weaponName-BaseType(nivel)
    damageResults.forEach(result => {
      if (result.damage && result.damage.trim() !== '') {
        // Capitalize first letter of baseType (sw -> Sw, thr -> Thr)
        const capitalizedBaseType = result.baseType.charAt(0).toUpperCase() + result.baseType.slice(1);
        
        // Format: weaponName-BaseType(nivel) damage type
        output.push(`${weaponName}-${capitalizedBaseType}(${nivel}) ${result.damage} ${result.type}`);
      }
    });
    
    return output;
  }
}