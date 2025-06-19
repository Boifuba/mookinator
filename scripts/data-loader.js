// Mookinator Data Loader - Functions for loading and managing data

/**
 * Default currency data for GURPS
 */
const DEFAULT_CURRENCY_DATA = [
  { name: "gold", cost: 80, weight: 0.04, unit: "lbs" },
  { name: "silver", cost: 4, weight: 0.04, unit: "lbs" },
  { name: "copper", cost: 1, weight: 0.008, unit: "lbs" }
];

/**
 * Enhanced clean value function - handles "-", null, undefined, and 0
 * @param {*} val - Value to clean
 * @returns {string} Cleaned value or empty string
 */
function cleanValue(val) {
  if (val === '-' || val === null || val === undefined || val === 0 || val === '0') {
    return '';
  }
  return val || '';
}

/**
 * Load mook data from JSON file
 * @param {string} jsonPath - Path to the JSON file
 * @returns {Promise<Object|null>} Mook data object or null if error
 */
async function carregarDadosMook(jsonPath) {
  try {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`Arquivo ${jsonPath} não encontrado`);
    return await response.json();
  } catch (err) {
    ui.notifications.error(`Erro ao carregar dados: ${err.message}`);
    return null;
  }
}

/**
 * Load file using browser's native file picker
 * @returns {Promise<Object|null>} File data or null if error
 */
function loadFileFromBrowser() {
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
        ui.notifications.error(`Erro ao ler arquivo: ${error.message}`);
        resolve(null);
      }
    };
    
    input.click();
  });
}

/**
 * Process GCS file data and convert to Mookinator format
 * @param {Object} gcsData - Raw GCS JSON data
 * @returns {Object} Processed mook data in Mookinator format
 */
function processGCSData(gcsData) {
  console.log("🔄 Processando dados GCS...", gcsData);

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

  // Extract weapons with enhanced data
  const meleeSkills = [];
  const rangedSkills = [];

  (gcsData.equipment || []).forEach(equip => {
    if (equip.weapons) {
      equip.weapons.forEach(weapon => {
        const weaponData = {
          nome: equip.description,
          dano: cleanValue(weapon.calc?.damage) || 'N/A',
          usage: cleanValue(weapon.usage),
          st: cleanValue(weapon.strength)
        };

        if (isRangedWeapon(equip.tags)) {
          rangedSkills.push({
            ...weaponData,
            acc: cleanValue(weapon.accuracy),
            rof: cleanValue(weapon.rate_of_fire),
            recoil: cleanValue(weapon.recoil),
            range: cleanValue(weapon.range),
            shots: cleanValue(weapon.shots),
            bulk: cleanValue(weapon.bulk)
          });
        } else {
          const existente = meleeSkills.find(w => w.nome === weaponData.nome);
          const attack = {
            dano: weaponData.dano,
            usage: weaponData.usage,
            reach: cleanValue(weapon.reach),
            parry: cleanValue(weapon.parry),
            st: weaponData.st,
            block: cleanValue(weapon.block)
          };

          if (existente) {
            existente.attacks.push(attack);
          } else {
            meleeSkills.push({
              nome: weaponData.nome,
              attacks: [attack]
            });
          }
        }
      });
    }
  });

  // Create default configurations
  const createDefaultRange = (min, max) => ({ min, max });
  const defaultAtributos = {
    st: createDefaultRange(10, 15),
    dx: createDefaultRange(10, 15),
    iq: createDefaultRange(10, 15),
    ht: createDefaultRange(10, 15),
    hp: createDefaultRange(10, 15),
    will: createDefaultRange(10, 15),
    per: createDefaultRange(10, 15),
    fp: createDefaultRange(10, 15),
    shield: createDefaultRange(8, 12), // UPDATED: Changed from parry to shield
    speed: createDefaultRange(5, 8),
    move: createDefaultRange(5, 8),
    sm: createDefaultRange(0, 2),
    dr: createDefaultRange(0, 5),
    dodge: createDefaultRange(8, 12),
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
    skills: { qty: 3, min: 9, max: 14 },
    ranged: { qty: 2, min: 9, max: 14 },
    melee: { qty: 3, min: 9, max: 14 },
    spells: { qty: 2, min: 9, max: 14 },
    traits: { qty: 5 },
    notes: gcsData.notes ? [gcsData.notes] : [],
    currency: gcsData.currency || DEFAULT_CURRENCY_DATA
  };

  console.log("✅ Dados GCS processados:", processedData);
  return processedData;
}

/**
 * Ensure mook data has default currency if missing
 * @param {Object} mookData - Mook data object
 * @returns {Object} Mook data with guaranteed currency data
 */
function ensureDefaultCurrency(mookData) {
  if (!mookData) return null;
  
  if (!mookData.currency || !Array.isArray(mookData.currency) || mookData.currency.length === 0) {
    console.log("🪙 Adicionando dados de moeda padrão...");
    mookData.currency = [...DEFAULT_CURRENCY_DATA];
  }
  
  return mookData;
}

/**
 * Fill form with data from JSON - SIMPLIFIED
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @param {Object} mookData - Mook data object
 */
function preencherFormulario(html, mookData) {
  mookData = ensureDefaultCurrency(mookData);
  
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
 * Extract current form configuration - SIMPLIFIED
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @returns {Object} Current form configuration
 */
function extractCurrentFormConfig(html) {
  const getInt = (name, fallback = 0) => {
    const val = parseInt(html.find(`input[name="${name}"]`).val());
    return isNaN(val) ? fallback : val;
  };

  // Extract attributes configuration - UPDATED: Changed parry to shield
  const attributes = ['st', 'dx', 'iq', 'ht', 'hp', 'will', 'per', 'fp', 'shield', 'speed', 'move', 'sm', 'dr', 'dodge', 'coins'];
  const atributos = {};
  attributes.forEach(attr => {
    atributos[attr] = {
      min: getInt(attr + 'Min', 10),
      max: getInt(attr + 'Max', 20)
    };
  });

  // Extract section configurations
  const sections = ['skills', 'ranged', 'melee', 'spells'];
  const config = { atributos };
  
  sections.forEach(section => {
    config[section] = {
      qty: getInt(section + 'Qty', 3),
      min: getInt(section + 'Min', 9),
      max: getInt(section + 'Max', 14)
    };
  });

  config.traits = { qty: getInt('traitsQty', 5) };
  return config;
}

/**
 * Generic function to handle data loading and form population
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @param {Object|string} dataSource - Either mook data object or path to JSON
 * @param {string} title - Title for the class
 * @param {string} imageUrl - Image URL
 * @param {Function} setCurrentMookDataCallback - Callback function
 */
async function handleDataLoading(html, dataSource, title, imageUrl, setCurrentMookDataCallback) {
  html.find(".loading-indicator").show();

  try {
    let mookData;
    
    if (typeof dataSource === 'string') {
      // It's a path, load from file
      mookData = await carregarDadosMook(dataSource);
      if (!mookData) {
        html.find(".loading-indicator").hide();
        return;
      }
    } else {
      // It's already data
      mookData = dataSource;
    }

    const mookDataWithCurrency = ensureDefaultCurrency(mookData);
    const finalTitle = mookDataWithCurrency.title || title;
    const finalImageUrl = mookDataWithCurrency.imageUrl || imageUrl || '';

    if (setCurrentMookDataCallback && typeof setCurrentMookDataCallback === 'function') {
      setCurrentMookDataCallback(mookDataWithCurrency, dataSource, finalTitle, finalImageUrl);
    }
    
    preencherFormulario(html, mookDataWithCurrency);
    html.find(".selected-class-title").text(`Mook selected: ${finalTitle}`);
    html.find(".loading-indicator").hide();
    
    ui.notifications.info(`Classe "${finalTitle}" carregada com sucesso!`);
  } catch (error) {
    ui.notifications.error(`Erro ao carregar classe: ${error.message}`);
    html.find(".loading-indicator").hide();
  }
}

/**
 * Populate form with data from saved class - SIMPLIFIED
 */
async function populateFormFromSavedData(html, classData, setCurrentMookDataCallback) {
  if (!classData || !classData.data) {
    ui.notifications.error("Dados da classe não encontrados.");
    return;
  }
  
  await handleDataLoading(html, classData.data, classData.title, classData.imageUrl, setCurrentMookDataCallback);
}

/**
 * Load and populate form with class data - SIMPLIFIED
 */
async function loadAndPopulateForm(html, jsonPath, className, setCurrentMookDataCallback) {
  await handleDataLoading(html, jsonPath, className, '', setCurrentMookDataCallback);
}

/**
 * Load custom JSON or GCS file using browser file picker
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @param {Function} setCurrentMookDataCallback - Function to set current mook data
 */
async function loadCustomJSON(html, setCurrentMookDataCallback) {
  html.find(".loading-indicator").show();
  html.find(".selected-class-title").text("Selecionando arquivo...");
  
  try {
    const fileResult = await loadFileFromBrowser();
    
    if (!fileResult) {
      html.find(".loading-indicator").hide();
      html.find(".selected-class-title").text("");
      return;
    }

    const { data: rawData, fileName, fileType } = fileResult;

    let mookData, title, imageUrl;

    if (fileType === 'GCS') {
      console.log("🎯 Detectado arquivo GCS, processando...");
      mookData = processGCSData(rawData);
      title = mookData.title;
      imageUrl = mookData.imageUrl;
    } else {
      mookData = ensureDefaultCurrency(rawData);
      title = mookData.title || fileName.replace(/\.(json|gcs)$/i, '');
      imageUrl = mookData.imageUrl || '';
    }

    if (setCurrentMookDataCallback && typeof setCurrentMookDataCallback === 'function') {
      setCurrentMookDataCallback(mookData, fileName, title, imageUrl);
    }
    
    preencherFormulario(html, mookData);
    
    html.find(".selected-class-title").text(`Mook selected: ${title} (${fileType})`);
    html.find(".class-btn").removeClass("selected");
    html.find(".custom-btn").addClass("selected");
    html.find(".loading-indicator").hide();

    ui.notifications.info(`Arquivo ${fileType} "${title}" carregado com sucesso!`);
  } catch (error) {
    ui.notifications.error(`Erro ao carregar arquivo: ${error.message}`);
    html.find(".loading-indicator").hide();
    html.find(".selected-class-title").text("");
  }
}

/**
 * Save a class to persistent storage
 * @param {Object} classData - Class data object with id, title, imageUrl, path
 */
function saveClass(classData) {
  try {
    const savedClasses = getSavedClasses();
    
    if (classData.data) {
      classData.data = ensureDefaultCurrency(classData.data);
    }
    
    const existingIndex = savedClasses.findIndex(cls => cls.id === classData.id);
    
    if (existingIndex >= 0) {
      savedClasses[existingIndex] = classData;
      ui.notifications.info(`Classe "${classData.title}" atualizada com sucesso!`);
    } else {
      savedClasses.push(classData);
      ui.notifications.info(`Classe "${classData.title}" salva com sucesso!`);
    }
    
    game.settings.set("mookinator", "savedClasses", savedClasses);
    return true;
  } catch (error) {
    ui.notifications.error(`Erro ao salvar classe: ${error.message}`);
    return false;
  }
}

/**
 * Delete a class from persistent storage
 * @param {string} id - Class ID to delete
 */
function deleteClass(id) {
  try {
    const savedClasses = getSavedClasses();
    const filteredClasses = savedClasses.filter(cls => cls.id !== id);
    
    if (filteredClasses.length < savedClasses.length) {
      game.settings.set("mookinator", "savedClasses", filteredClasses);
      ui.notifications.info("Classe removida com sucesso!");
      return true;
    } else {
      ui.notifications.warn("Classe não encontrada para remoção.");
      return false;
    }
  } catch (error) {
    ui.notifications.error(`Erro ao remover classe: ${error.message}`);
    return false;
  }
}

/**
 * Get saved classes from persistent storage
 * @returns {Array} Array of saved class objects
 */
function getSavedClasses() {
  try {
    return game.settings.get("mookinator", "savedClasses") || [];
  } catch (error) {
    console.error("Erro ao recuperar classes salvas:", error);
    return [];
  }
}

// Export functions for use in main.js
window.MookinatorDataLoader = {
  carregarDadosMook,
  loadFileFromBrowser,
  processGCSData,
  preencherFormulario,
  extractCurrentFormConfig,
  populateFormFromSavedData,
  loadAndPopulateForm,
  loadCustomJSON,
  saveClass,
  deleteClass,
  getSavedClasses,
  ensureDefaultCurrency,
  cleanValue,
  DEFAULT_CURRENCY_DATA
};