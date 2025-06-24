// Mookinator Module - Main Script

/**
 * Main function to generate the Mook - UPDATED WITH ST-BASED DAMAGE CALCULATION, SHIELD ATTRIBUTE, AND DB BONUS
 * @param {Object} config - Configuration object
 * @param {Object} mookData - Mook data object
 */
async function gerarMook(config, mookData) {
  const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
  if (!mookApp) {
    ui.notifications.warn("The Mook Generator window is not open.");
    return;
  }

  console.log("🎯 Starting Mookinator...");
  
  const mookinator = game.modules.get("mookinator").api;

  // Fill attributes first (including ST) with new calculation logic
  mookinator.formOperations.preencherAtributos(config);
  
  // Small delay to ensure fields are updated
  await new Promise(resolve => setTimeout(resolve, 100));

  // CRITICAL FIX: Get the calculated ST and Shield values from module state instead of form fields
  const calculatedAttributes = mookinator.state.getLastCalculatedAttributes();
  const stValue = calculatedAttributes.st || 10;
  const shieldAttributeValue = calculatedAttributes.shield || 0;
  
  
  // Fill all skill types with ST-based damage calculation and shield attribute
  mookinator.formOperations.preencherSkills(mookData.meleeSkills, 'melee', config.melee, stValue, shieldAttributeValue);
  mookinator.formOperations.preencherSkills(mookData.rangedSkills, 'ranged', config.ranged, stValue);
  mookinator.formOperations.preencherSkills(mookData.skillsList, 'skills', config.skills);
  mookinator.formOperations.preencherSkills(mookData.spellsList, 'spells', config.spells);

  // CRITICAL: Apply DB bonus to Dodge after melee skills are processed
  const shieldDbBonus = mookinator.state.getShieldDbBonus();
  if (shieldDbBonus > 0) {
    const currentDodge = mookinator.state.getCalculatedAttributeValue('dodge');
    const finalDodge = currentDodge + shieldDbBonus;
    
    // Update the dodge field in the form
    mookApp.element.find('input[data-key="dodge"]').val(finalDodge).trigger("change");
    
    // Update the dodge value in module state
    const updatedAttributes = mookinator.state.getLastCalculatedAttributes();
    updatedAttributes.dodge = finalDodge;
    mookinator.state.setLastCalculatedAttributes(updatedAttributes);
    
  
  }

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
    mookinator.formOperations.preencherCampo('traits', traits.join('\n'));
  }

  // Fill notes
  if (mookData.notes) {
    mookinator.formOperations.preencherCampo('notes', mookData.notes.join('\n'));
  }

  
}

/**
 * Main function to initialize the Mook Generator - SIMPLIFIED WITHOUT PERSISTENCE
 */
async function inicializarMookGenerator() {
  // Ensure the module API is initialized before proceeding
  const module = game.modules.get("mookinator");
  if (!module.api) {
    ui.notifications.error("Mookinator module not properly initialized. Please refresh and try again.");
    return;
  }

  GURPS.executeOTF("/mook");
  
  const mookinator = module.api;
  const customButtonHtml = mookinator.templates.generateCustomButtonHtml();
  const dialogContent = mookinator.templates.generateDialogTemplate(customButtonHtml);

  const dialog = new Dialog({
    title: "Mookinator",
    content: dialogContent,
    buttons: { fechar: { label: "Close" } },
    render: (html) => {
      const handlers = {
        loadCustomJSON: (html) => {
          mookinator.dataLoader.loadCustomJSON(html, mookinator.state.setCurrentMookDataAndPath.bind(mookinator.state));
        },
        gerarMook: gerarMook,
        getCurrentMookData: () => mookinator.state.getCurrentMookData()
      };

      mookinator.uiHandlers.setupAllHandlers(html, handlers);
    },
    resizable: true,
    width: 600,
    height: 500,
    close: () => { 
      mookinator.state.clearCurrentMookData();
    }
  });

  dialog.render(true);
}

// Module initialization
Hooks.once("init", () => {
  console.log("Mookinator | module initialization started");
  // No settings registration needed - no persistence
});

Hooks.once("ready", () => {
  console.log("Mookinator | Module is ready to use!");
  
  // Get the module instance
  const module = game.modules.get("mookinator");
  
  // Initialize the module API structure
  if (!module.api) {
    module.api = {};
  }
  
  // Initialize all sub-modules with proper error handling
  try {
    module.api.state = new MookinatorState();
    module.api.utils = new MookinatorUtils();
    module.api.dataLoader = new MookinatorDataLoader();
    module.api.formOperations = new MookinatorFormOperations();
    module.api.templates = new MookinatorTemplates();
    module.api.uiHandlers = new MookinatorUIHandlers();
    
    // Set up the main function
    module.api.inicializarMookGenerator = inicializarMookGenerator;
    
    console.log("Mookinator | Module API initialized successfully:", module.api);
  } catch (error) {
    console.error("Mookinator | Error initializing module API:", error);
    ui.notifications.error("Failed to initialize Mookinator module. Check console for details.");
    return;
  }
  
  // Ensure game.mookinator is properly initialized for backward compatibility
  if (!game.mookinator) {
    game.mookinator = {};
  }
  
  game.mookinator.inicializarMookGenerator = inicializarMookGenerator;
  
  // Debug log to verify initialization
  console.log("Mookinator | Função disponível:", typeof module.api.inicializarMookGenerator);
});