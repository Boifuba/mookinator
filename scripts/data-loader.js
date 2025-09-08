// Mookinator Data Loader - Class-based functions for loading and managing data

class MookinatorDataLoader {
  constructor() {
    /**
     * Default currency data for GURPS
     */
    this.DEFAULT_CURRENCY_DATA = [
      { name: "gold", cost: 80, weight: 0.04, unit: "lbs" },
      { name: "silver", cost: 4, weight: 0.04, unit: "lbs" },
      { name: "copper", cost: 1, weight: 0.008, unit: "lbs" }
    ];
  }

  /**
   * Enhanced clean value function - handles "-", null, undefined, and 0
   * @param {*} val - Value to clean
   * @returns {string} Cleaned value or empty string
   */
  cleanValue(val) {
    if (val === '-' || val === null || val === undefined || val === 0 || val === '0') {
      return '';
    }
    return val || '';
  }

  /**
   * Infer base damage type from weapon usage
   * @param {string} usage - Weapon usage string
   * @returns {string} Inferred base damage type ('sw' or 'thr')
   */
  inferBaseDamageType(usage) {
    if (!usage) return 'sw'; // Default to swing
    
    const usageLower = usage.toLowerCase();
    
    // Thrust-based attacks
    if (usageLower.includes('thrust') || 
        usageLower.includes('stab') || 
        usageLower.includes('pierce') ||
        usageLower.includes('point')) {
      return 'thr';
    }
    
    // Default to swing for most weapons
    return 'sw';
  }

  /**
   * Check if equipment is a shield based on tags
   * @param {Array} tags - Equipment tags array
   * @returns {boolean} True if equipment is a shield
   */
  isShield(tags) {
    if (!tags || !Array.isArray(tags)) return false;
    
    return tags.some(tag => 
      tag.toLowerCase().includes('shield') || 
      tag.toLowerCase().includes('buckler')
    );
  }

  /**
   * Check if weapon is ranged based on tags
   * @param {Array} tags - Equipment tags array
   * @returns {boolean} True if weapon is ranged
   */
  isRangedWeapon(tags) {
    return tags && tags.includes('Missile Weapon');
  }

  /**
   * Helper function to find maximum positive amount from features array
   * @param {Array} features - Features array to search
   * @returns {number} Maximum positive amount found or 0
   */
  _findMaxPositiveAmount(features) {
    let maxPositiveAmount = 0;
    
    for (const feature of features) {
      if (feature.type === 'conditional_modifier' && 
          typeof feature.amount === 'number' && 
          feature.amount > 0) {
        
        // Check if situation mentions defensive capabilities
        const situation = (feature.situation || '').toLowerCase();
        
        if (situation.includes('dodge') || 
            situation.includes('parry') || 
            situation.includes('block') || 
            situation.includes('db') ||
            situation.includes('defense')) {
          
          if (feature.amount > maxPositiveAmount) {
            maxPositiveAmount = feature.amount;
          }
        }
      }
    }
    
    return maxPositiveAmount;
  }

  /**
   * Extract shield DB value from equipment
   * @param {Object} equip - Equipment object
   * @returns {number} Shield DB value or 0 if not found
   */
  extractShieldDB(equip) {
    // PRIORITY 1: Look for DB in equip.features array (where it actually is in the JSON)
    if (equip.features && Array.isArray(equip.features)) {
      const maxPositiveAmount = this._findMaxPositiveAmount(equip.features);
      
      if (maxPositiveAmount > 0) {
        return maxPositiveAmount;
      }
    }
    
    // PRIORITY 2: Fallback - Look for DB in weapons.features array
    if (equip.weapons && Array.isArray(equip.weapons)) {
      for (const weapon of equip.weapons) {
        if (weapon.features && Array.isArray(weapon.features)) {
          const maxPositiveAmount = this._findMaxPositiveAmount(weapon.features);
          
          if (maxPositiveAmount > 0) {
            return maxPositiveAmount;
          }
        }
      }
    }
    
    return 0; // Return 0 for consistency with other numeric return values
  }

  /**
   * Load file using browser's native file picker
   * @returns {Promise<Object|null>} File data or null if error
   */
  loadFileFromBrowser() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.gcs';
      
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          resolve({
            data: data,
            fileName: file.name,
            fileType: file.name.toLowerCase().endsWith('.gcs') ? 'GCS' : 'JSON'
          });
        } catch (error) {
          ui.notifications.error(`Error reading file: ${error.message}`);
          resolve(null);
        }
      };
      
      input.click();
    });
  }

  /**
   * Process GCS file data and convert to Mookinator format - UPDATED WITH SHIELD PROCESSING
   * @param {Object} gcsData - Raw GCS JSON data
   * @returns {Object} Processed mook data in Mookinator format
   */
  processGCSData(gcsData) {

    // Helper function to recursively mark children of Template items as mandatory
    const markTemplateChildrenAsMandatory = (items) => {
      if (!items || !Array.isArray(items)) return;
      
      items.forEach(item => {
        // Check if this item is a Template
        if ((item.name === 'Template' || item.description === 'Template') && item.children && Array.isArray(item.children)) {
          // Mark all children as mandatory
          item.children.forEach(child => {
            child.isMandatory = true;
          });
        }
        
        // Recursively process children
        if (item.children && Array.isArray(item.children)) {
          markTemplateChildrenAsMandatory(item.children);
        }
      });
    };

    // Function to check if it's a ranged weapon
    const isRangedWeapon = (tags) => tags && tags.includes('Missile Weapon');

    // Function to extract attribute value from GCS data
    const extractAttributeValue = (attributeName) => {
      if (gcsData.attributes && Array.isArray(gcsData.attributes)) {
        const attr = gcsData.attributes.find(a => a.attr_id === attributeName);
        if (attr && typeof attr.calc === 'object' && typeof attr.calc.value === 'number') {
          return attr.calc.value;
        }
      }
      // Fallback values if not found
      return 10;
    };

    // Mark Template children as mandatory in traits and equipment
    markTemplateChildrenAsMandatory(gcsData.traits);
    markTemplateChildrenAsMandatory(gcsData.equipment);
    markTemplateChildrenAsMandatory(gcsData.skills);
    markTemplateChildrenAsMandatory(gcsData.spells);

    // Extract data with simplified mapping
    const extractList = (sourceArray, nameField = 'name', valueField = null, includeExtra = false) => {
      const flattenItems = (items) => {
        let result = [];
        items.forEach(item => {
          result.push(item);
          if (item.children && Array.isArray(item.children)) {
            result = result.concat(flattenItems(item.children));
          }
        });
        return result;
      };
      
      const flattenedItems = flattenItems(sourceArray || []);
      
      return flattenedItems.map(item => ({
        nome: item[nameField],
        ...(valueField && { valor: item[valueField] || item.points || '' }),
        ...(includeExtra && item.difficulty && { difficulty: item.difficulty }),
        ...(item.isMandatory && { isMandatory: true })
      }));
    };

    const traitsList = extractList(gcsData.traits, 'name', 'levels');
    const skillsList = extractList(gcsData.skills, 'name', null, true); // Include difficulty for skills
    const spellsList = extractList(gcsData.spells);

    // Extract weapons with enhanced data and damage type inference
    const meleeSkills = [];
    const rangedSkills = [];
    
    // Helper function to flatten equipment items (including children)
    const flattenEquipment = (equipmentArray) => {
      let result = [];
      equipmentArray.forEach(equip => {
        result.push(equip);
        if (equip.children && Array.isArray(equip.children)) {
          result = result.concat(flattenEquipment(equip.children));
        }
      });
      return result;
    };
    
    const flattenedEquipment = flattenEquipment(gcsData.equipment || []);

    // First, extract skills to get difficulty information
    const skillsMap = new Map();
    (gcsData.skills || []).forEach(skill => {
      skillsMap.set(skill.name.toLowerCase(), skill.difficulty);
    });

    flattenedEquipment.forEach(equip => {
      if (equip.weapons) {
        equip.weapons.forEach(weapon => {
          // Try to find skill difficulty for this weapon
          const weaponSkillName = equip.description.toLowerCase();
          const skillDifficulty = skillsMap.get(weaponSkillName);
          
          const weaponData = {
            nome: equip.description,
            dano: this.cleanValue(weapon.calc?.damage) || 'N/A',
            usage: this.cleanValue(weapon.usage),
            st: this.cleanValue(weapon.strength),
            defaults: weapon.defaults || [], // Add defaults array
            difficulty: skillDifficulty, // Add skill difficulty if found
            ...(equip.isMandatory && { isMandatory: true }) // Propagate mandatory flag from equipment
          };

          if (isRangedWeapon(equip.tags)) {
            // Add inferred base damage type for ranged weapons
            const inferredType = this.inferBaseDamageType(weapon.usage);
            
            rangedSkills.push({
              ...weaponData,
              acc: this.cleanValue(weapon.accuracy),
              rof: this.cleanValue(weapon.rate_of_fire),
              recoil: this.cleanValue(weapon.recoil),
              range: this.cleanValue(weapon.range),
              shots: this.cleanValue(weapon.shots),
              bulk: this.cleanValue(weapon.bulk),
              inferredBaseDamageType: inferredType
            });
          } else {
            const existente = meleeSkills.find(w => w.nome === weaponData.nome);
            
            // Add inferred base damage type for melee attacks
            const inferredType = this.inferBaseDamageType(weapon.usage);
            
            const attack = {
              dano: weaponData.dano,
              usage: weaponData.usage,
              reach: this.cleanValue(weapon.reach),
              parry: this.cleanValue(weapon.parry),
              st: weaponData.st,
              block: this.cleanValue(weapon.block),
              inferredBaseDamageType: inferredType,
              defaults: weaponData.defaults // Add defaults to attack
            };

            if (existente) {
              existente.attacks.push(attack);
            } else {
              // UPDATED: Check if this equipment is a shield
              const newMeleeSkill = {
                nome: weaponData.nome,
                attacks: [attack],
                defaults: weaponData.defaults, // Add defaults to weapon
                ...(weaponData.isMandatory && { isMandatory: true }) // Propagate mandatory flag
              };

              // Add shield-specific properties if this is a shield
              if (this.isShield(equip.tags)) {
                console.log(`🛡️ Processando escudo: ${equip.description}`);
                newMeleeSkill.shield = true;
                
                const extractedDb = this.extractShieldDB(equip);
                newMeleeSkill.db = extractedDb;
                
                if (extractedDb > 0) {
                  console.log(`🛡️ Escudo ${equip.description} processado com DB: ${extractedDb}`);
                } else {
                  console.log(`🛡️ Escudo ${equip.description} não possui DB válido (${extractedDb})`);
                }
              }

              meleeSkills.push(newMeleeSkill);
            }
          }
        });
      }
    });

    // Create default configurations
    const createDefaultRange = (min, max) => ({ min, max });
    
    // Extract base attribute values from GCS data
    const baseStValue = extractAttributeValue('st');
    const baseDxValue = extractAttributeValue('dx');
    const baseIqValue = extractAttributeValue('iq');
    const baseHtValue = extractAttributeValue('ht');
    
    const defaultAtributos = {
      st: { ...createDefaultRange(-2, 2), baseValue: baseStValue },
      dx: { ...createDefaultRange(-2, 2), baseValue: baseDxValue },
      iq: { ...createDefaultRange(-2, 2), baseValue: baseIqValue },
      ht: { ...createDefaultRange(-2, 2), baseValue: baseHtValue },
      hp: createDefaultRange(-4, 4),
      will: createDefaultRange(-2, 2),
      per: createDefaultRange(-2, 2),
      fp: createDefaultRange(-2, 4),
      shield: createDefaultRange(-1, 1), 
      parry: createDefaultRange(-1, 1),
      speed: createDefaultRange(-0.25, 0.75),
      move: createDefaultRange(-1, 1),
      sm: createDefaultRange(0, 1),
      dr: createDefaultRange(0, 3),
      dodge: createDefaultRange(-1, 1),
      coins: createDefaultRange(0, 100)
    };

    const processedData = {
      title: gcsData.profile?.name || gcsData.name || 'Imported GCS Character',
      imageUrl: gcsData.profile?.portrait || gcsData.portrait || '',
      traitsList,
      skillsList,
      spellsList,
      meleeSkills,
      rangedSkills,
      atributos: defaultAtributos,
      skills: { qty: 2, min: -2, max: 2 },
      ranged: { qty: 2, min: -2, max: 2 },
      melee: { qty: 2, min: -2, max: 2 },
      spells: { qty: 2, min: -2, max: 2 },
      traits: { qty: 4 },
      notes: gcsData.notes ? [gcsData.notes] : [],
      currency: gcsData.currency || this.DEFAULT_CURRENCY_DATA
    };

    return processedData;
  }

  /**
   * Ensure mook data has default currency if missing
   * @param {Object} mookData - Mook data object
   * @returns {Object} Mook data with guaranteed currency data
   */
  ensureDefaultCurrency(mookData) {
    if (!mookData) return null;
    
    if (!mookData.currency || !Array.isArray(mookData.currency) || mookData.currency.length === 0) {
      mookData.currency = [...this.DEFAULT_CURRENCY_DATA];
    }
    
    return mookData;
  }

  /**
   * Fill form with data from JSON - SIMPLIFIED AND UPDATED WITH MOOK QTY
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Object} mookData - Mook data object
   * @param {Object} savedConfig - Saved configuration to prioritize over mookData defaults
   */
  preencherFormulario(html, mookData, savedConfig = null) {
    mookData = this.ensureDefaultCurrency(mookData);
    
    // Fill attributes
    Object.entries(mookData.atributos || {}).forEach(([key, atributo]) => {
      // Prioritize saved config over mookData defaults
      const minValue = savedConfig?.atributos?.[key]?.min ?? atributo.min;
      const maxValue = savedConfig?.atributos?.[key]?.max ?? atributo.max;
      
      html.find(`input[name="${key}Min"]`).val(minValue);
      html.find(`input[name="${key}Max"]`).val(maxValue);
    });

    // Fill section configurations
    const sections = ["skills", "ranged", "melee", "spells"];
    sections.forEach(section => {
      const config = mookData[section];
      if (config) {
        // Prioritize saved config over mookData defaults
        const qtyValue = savedConfig?.[section]?.qty ?? config.qty;
        const minValue = savedConfig?.[section]?.min ?? config.min;
        const maxValue = savedConfig?.[section]?.max ?? config.max;
        
        html.find(`input[name="${section}Qty"]`).val(qtyValue);
        html.find(`input[name="${section}Min"]`).val(minValue);
        html.find(`input[name="${section}Max"]`).val(maxValue);
      }
    });

    // Fill traits and notes
    if (mookData.traits) {
      // Prioritize saved config over mookData defaults
      const traitsQtyValue = savedConfig?.traitsQty ?? mookData.traits.qty;
      html.find(`input[name="traitsQty"]`).val(traitsQtyValue);
    }
    
    // Fill mook quantity
    if (savedConfig?.mookQty) {
      html.find(`input[name="mookQty"]`).val(savedConfig.mookQty);
    }
    
    if (mookData.notes) {
      html.find('textarea[data-key="notes"]').val(mookData.notes.join("\n"));
    }
  }

  /**
   * Fill form with saved configurations only (no mook data) - UPDATED WITH MOOK QTY
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Object} savedConfig - Saved configuration object
   */
  preencherFormularioComConfiguracoesSalvas(html, savedConfig) {
    if (!savedConfig) return;
    
    // Fill attributes
    Object.entries(savedConfig.atributos || {}).forEach(([key, atributo]) => {
      html.find(`input[name="${key}Min"]`).val(atributo.min);
      html.find(`input[name="${key}Max"]`).val(atributo.max);
    });

    // Fill section configurations
    const sections = ["skills", "ranged", "melee", "spells"];
    sections.forEach(section => {
      const config = savedConfig[section];
      if (config) {
        html.find(`input[name="${section}Qty"]`).val(config.qty);
        html.find(`input[name="${section}Min"]`).val(config.min);
        html.find(`input[name="${section}Max"]`).val(config.max);
      }
    });

    // Fill traits quantity
    if (typeof savedConfig.traitsQty === 'number') {
      html.find(`input[name="traitsQty"]`).val(savedConfig.traitsQty);
    }

    // Fill mook quantity
    if (typeof savedConfig.mookQty === 'number') {
      html.find(`input[name="mookQty"]`).val(savedConfig.mookQty);
    }
  }
  /**
   * Load custom JSON or GCS file using browser file picker - UPDATED TO SHOW PROPER STATUS
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Function} setCurrentMookDataCallback - Function to set current mook data
   * @param {Object} savedConfig - Saved configuration to use when filling form
   */
  async loadCustomJSON(html, setCurrentMookDataCallback, savedConfig = null) {
    // Ensure we have a valid callback function
    if (!setCurrentMookDataCallback || typeof setCurrentMookDataCallback !== 'function') {
      console.error("Invalid setCurrentMookDataCallback provided to loadCustomJSON");
      ui.notifications.error("Internal error: Invalid callback function");
      return;
    }

    html.find(".selected-class-title").text("Selecting file...");
    
    try {
      const fileResult = await this.loadFileFromBrowser();
      
      if (!fileResult) {
        html.find(".selected-class-title").text("");
        return;
      }

      const { data: rawData, fileName, fileType } = fileResult;

      let mookData, title, imageUrl;

      if (fileType === 'GCS') {
        mookData = this.processGCSData(rawData);
        title = mookData.title;
        imageUrl = mookData.imageUrl;
      } else {
        mookData = this.ensureDefaultCurrency(rawData);
        title = mookData.title || fileName.replace(/\.(json|gcs)$/i, '');
        imageUrl = mookData.imageUrl || '';
      }

      // Call the callback function with proper error handling
      try {
        setCurrentMookDataCallback(mookData, fileName, title, imageUrl);
      } catch (callbackError) {
        console.error("Error in setCurrentMookDataCallback:", callbackError);
        ui.notifications.error("Error setting mook data: " + callbackError.message);
        html.find(".selected-class-title").text("");
        return;
      }
      
      this.preencherFormulario(html, mookData, savedConfig);
      
      html.find(".selected-class-title").text(`File loaded: ${title} (${fileType}) - Ready to generate!`);
      html.find(".class-btn").removeClass("selected");
      html.find(".custom-btn").addClass("selected");

      ui.notifications.info(`${fileType} file "${title}" loaded successfully! You can now generate mooks.`);
    } catch (error) {
      console.error("Error in loadCustomJSON:", error);
      ui.notifications.error(`Error loading file: ${error.message}`);
      html.find(".selected-class-title").text("");
    }
  }
}