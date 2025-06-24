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
   * Extract shield DB value from equipment - FIXED TO SEARCH IN CORRECT LOCATION
   * @param {Object} equip - Equipment object
   * @returns {number} Shield DB value or 0
   */
  extractShieldDB(equip) {
    console.log(`🛡️ Extraindo DB do escudo: ${equip.description}`);
    
    // PRIORITY 1: Look for DB in equip.features array (where it actually is in the JSON)
    if (equip.features && Array.isArray(equip.features)) {
      console.log(`🛡️ Analisando ${equip.features.length} features principais do escudo...`);
      
      let maxPositiveAmount = 0;
      
      for (const feature of equip.features) {
        console.log(`🛡️ Feature: type=${feature.type}, amount=${feature.amount}, situation="${feature.situation}"`);
        
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
              console.log(`🛡️ Novo maior DB encontrado nas features principais: ${maxPositiveAmount}`);
            }
          }
        }
      }
      
      if (maxPositiveAmount > 0) {
        console.log(`🛡️ DB final extraído das features principais: ${maxPositiveAmount}`);
        return maxPositiveAmount;
      }
    }
    
    // PRIORITY 2: Fallback - Look for DB in weapons.features array
    if (equip.weapons && Array.isArray(equip.weapons)) {
      console.log(`🛡️ Fallback: Analisando features das armas do escudo...`);
      
      for (const weapon of equip.weapons) {
        if (weapon.features && Array.isArray(weapon.features)) {
          let maxPositiveAmount = 0;
          
          for (const feature of weapon.features) {
            if (feature.type === 'conditional_modifier' && 
                typeof feature.amount === 'number' && 
                feature.amount > 0) {
              
              const situation = (feature.situation || '').toLowerCase();
              
              if (situation.includes('dodge') || 
                  situation.includes('parry') || 
                  situation.includes('block') || 
                  situation.includes('db') ||
                  situation.includes('defense')) {
                
                if (feature.amount > maxPositiveAmount) {
                  maxPositiveAmount = feature.amount;
                  console.log(`🛡️ DB encontrado nas features da arma: ${maxPositiveAmount}`);
                }
              }
            }
          }
          
          if (maxPositiveAmount > 0) {
            console.log(`🛡️ DB final extraído das features da arma: ${maxPositiveAmount}`);
            return maxPositiveAmount;
          }
        }
      }
    }
    
    console.warn(`🛡️ ERRO: Nenhum DB válido encontrado nas features do escudo "${equip.description}"`);
    return null; // Return null instead of 0 to indicate no valid DB found
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

    // Function to check if it's a ranged weapon
    const isRangedWeapon = (tags) => tags && tags.includes('Missile Weapon');

    // Extract data with simplified mapping
    const extractList = (sourceArray, nameField = 'name', valueField = null) => {
      return (sourceArray || []).map(item => ({
        nome: item[nameField],
        ...(valueField && { valor: item[valueField] || item.points || '' })
      }));
    };

    const traitsList = extractList(gcsData.traits, 'name', 'levels');
    const skillsList = extractList(gcsData.skills);
    const spellsList = extractList(gcsData.spells);

    // Extract weapons with enhanced data and damage type inference
    const meleeSkills = [];
    const rangedSkills = [];

    (gcsData.equipment || []).forEach(equip => {
      if (equip.weapons) {
        equip.weapons.forEach(weapon => {
          const weaponData = {
            nome: equip.description,
            dano: this.cleanValue(weapon.calc?.damage) || 'N/A',
            usage: this.cleanValue(weapon.usage),
            st: this.cleanValue(weapon.strength)
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
              inferredBaseDamageType: inferredType
            };

            if (existente) {
              existente.attacks.push(attack);
            } else {
              // UPDATED: Check if this equipment is a shield
              const newMeleeSkill = {
                nome: weaponData.nome,
                attacks: [attack]
              };

              // Add shield-specific properties if this is a shield
              if (this.isShield(equip.tags)) {
                console.log(`🛡️ Processando escudo: ${equip.description}`);
                newMeleeSkill.shield = true;
                
                const extractedDb = this.extractShieldDB(equip);
                newMeleeSkill.db = extractedDb;
                
                if (extractedDb !== null && extractedDb > 0) {
                  console.log(`🛡️ Escudo ${equip.description} processado com DB: ${extractedDb}`);
                } else {
                  console.log(`🛡️ ERRO ao extrair DB do escudo ${equip.description}: DB inválido (${extractedDb})`);
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
    const defaultAtributos = {
      st: createDefaultRange(10, 12),
      dx: createDefaultRange(10, 12),
      iq: createDefaultRange(10, 12),
      ht: createDefaultRange(10, 12),
      hp: createDefaultRange(-4, 4),
      will: createDefaultRange(-2, 2),
      per: createDefaultRange(-2, 4),
      fp: createDefaultRange(-2, 4),
      shield: createDefaultRange(-1, 1), 
      parry: createDefaultRange(-1, 1),
      speed: createDefaultRange(-0.25, 0.75),
      move: createDefaultRange(4, 6),
      sm: createDefaultRange(0, 2),
      dr: createDefaultRange(0, 3),
      dodge: createDefaultRange(-1, 1),
      coins: createDefaultRange(50, 200)
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
      skills: { qty: 2, min: 9, max: 13 },
      ranged: { qty: 2, min: 9, max: 13 },
      melee: { qty: 2, min: 9, max: 13 },
      spells: { qty: 2, min: 9, max: 13 },
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
   * Fill form with data from JSON - SIMPLIFIED
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Object} mookData - Mook data object
   */
  preencherFormulario(html, mookData) {
    mookData = this.ensureDefaultCurrency(mookData);
    
    // Fill attributes
    Object.entries(mookData.atributos || {}).forEach(([key, atributo]) => {
      html.find(`input[name="${key}Min"]`).val(atributo.min);
      html.find(`input[name="${key}Max"]`).val(atributo.max);
    });

    // Fill section configurations
    const sections = ["skills", "ranged", "melee", "spells"];
    sections.forEach(section => {
      const config = mookData[section];
      if (config) {
        html.find(`input[name="${section}Qty"]`).val(config.qty);
        html.find(`input[name="${section}Min"]`).val(config.min);
        html.find(`input[name="${section}Max"]`).val(config.max);
      }
    });

    // Fill traits and notes
    if (mookData.traits) {
      html.find(`input[name="traitsQty"]`).val(mookData.traits.qty);
    }
    
    if (mookData.notes) {
      html.find('textarea[data-key="notes"]').val(mookData.notes.join("\n"));
    }
  }

  /**
   * Load custom JSON or GCS file using browser file picker - UPDATED TO SHOW PROPER STATUS
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Function} setCurrentMookDataCallback - Function to set current mook data
   */
  async loadCustomJSON(html, setCurrentMookDataCallback) {
    // Ensure we have a valid callback function
    if (!setCurrentMookDataCallback || typeof setCurrentMookDataCallback !== 'function') {
      console.error("Invalid setCurrentMookDataCallback provided to loadCustomJSON");
      ui.notifications.error("Internal error: Invalid callback function");
      return;
    }

    html.find(".loading-indicator").show();
    html.find(".selected-class-title").text("Selecting file...");
    
    try {
      const fileResult = await this.loadFileFromBrowser();
      
      if (!fileResult) {
        html.find(".loading-indicator").hide();
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
        html.find(".loading-indicator").hide();
        html.find(".selected-class-title").text("");
        return;
      }
      
      this.preencherFormulario(html, mookData);
      
      html.find(".selected-class-title").text(`File loaded: ${title} (${fileType}) - Ready to generate!`);
      html.find(".class-btn").removeClass("selected");
      html.find(".custom-btn").addClass("selected");
      html.find(".loading-indicator").hide();

      ui.notifications.info(`${fileType} file "${title}" loaded successfully! You can now generate mooks.`);
    } catch (error) {
      console.error("Error in loadCustomJSON:", error);
      ui.notifications.error(`Error loading file: ${error.message}`);
      html.find(".loading-indicator").hide();
      html.find(".selected-class-title").text("");
    }
  }
}