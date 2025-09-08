// Mookinator Module - Main Script

/**
 * MookinatorCore - Main application logic class
 */
class MookinatorCore {
  #api;

  constructor(api) {
    this.#api = api;
  }

  /**
   * Main function to generate multiple mooks - UPDATED: Only trigger native button when quantity > 1
   * @param {Object} config - Configuration object
   * @param {Object} mookData - Mook data object
   */
  async generateMooks(config, mookData) {
    const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
    if (!mookApp) {
      ui.notifications.warn("The Mook Generator window is not open.");
      return;
    }

    const numberOfMooksToGenerate = config.mookQty || 1;

    for (let i = 0; i < numberOfMooksToGenerate; i++) {
      console.log(`Generating Mook ${i + 1} of ${numberOfMooksToGenerate}...`);
      ui.notifications.info(`Generating Mook ${i + 1} of ${numberOfMooksToGenerate}...`);
      
      await this.#generateSingleMook(config, mookData, mookApp, numberOfMooksToGenerate);

      // Add a small delay between mook generations to allow the system to process
      if (i < numberOfMooksToGenerate - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
      }
    }

    // Final notification
    if (numberOfMooksToGenerate === 1) {
      ui.notifications.info("Mook data generated and injected successfully!");
    } else {
      ui.notifications.info(`Finished generating ${numberOfMooksToGenerate} mooks.`);
    }
  }

  /**
   * Generate a single mook with all its attributes, skills, and traits
   * @param {Object} config - Configuration object
   * @param {Object} mookData - Mook data object
   * @param {Object} mookApp - The mook application window
   * @param {number} numberOfMooksToGenerate - Total number of mooks being generated
   */
  async #generateSingleMook(config, mookData, mookApp, numberOfMooksToGenerate) {
    // Handle name generation
    await this.#handleMookNameGeneration(mookApp);

    // Fill attributes
    await this.#fillMookAttributes(config, mookData);

    // Fill skills, spells, and traits
    await this.#fillMookSkillsAndTraits(config, mookData);

    // UPDATED: Only trigger native button when quantity > 1
    if (numberOfMooksToGenerate > 1) {
      await this.#triggerNativeCreateMookButton();
    }
  }

  /**
   * Handle mook name generation and injection
   * @param {Object} mookApp - The mook application window
   */
  async #handleMookNameGeneration(mookApp) {
    console.log("MookinatorCore | Starting name generation process");
    
    // NEW: Clear the name field before generating a new name for each mook
    mookApp.element.find('input[data-key="name"]').val('').trigger("change");
    console.log("MookinatorCore | Cleared existing name field");

    let currentName = mookApp.element.find('input[data-key="name"]').val();
    
    // If the name field is empty, generate a new name
    if (!currentName || currentName.trim() === '') {
      console.log("MookinatorCore | Name field is empty, generating new name");
      const nameSettings = this.#api.state.getNameGeneratorSettings();
      const newName = this.#api.NameGenerator.generateRandomName(
        nameSettings.nation,
        nameSettings.gender,
        nameSettings.namePart
      );
      
      if (newName) {
        console.log(`MookinatorCore | Generated new name: "${newName}"`);
        mookApp.element.find('input[data-key="name"]').val(newName).trigger("change");
        this.#api.state.setGeneratedNpcName(newName);
        
        // Update the native GURPS sheet with the generated name
        await this.#updateNativeMookName(newName);
        currentName = newName;
      } else {
        console.warn("MookinatorCore | Failed to generate new name");
      }
    } else {
      console.log(`MookinatorCore | Using existing name: "${currentName}"`);
      // If name already exists, also update the native sheet
      // Small delay to ensure the Mookinator field is fully updated
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.#updateNativeMookName(currentName);
    }
  }

  /**
   * Fill mook attributes with calculated values
   * @param {Object} config - Configuration object
   * @param {Object} mookData - Mook data object
   */
  async #fillMookAttributes(config, mookData) {
    console.log("MookinatorCore | Starting attribute filling process");
    
    // Fill attributes first (including ST) with new calculation logic
    this.#api.formOperations.preencherAtributos(config, mookData.atributos);
    
    // Small delay to ensure fields are updated
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log("MookinatorCore | Attributes filled and processed");
  }

  /**
   * Fill mook skills, spells, and traits
   * @param {Object} config - Configuration object
   * @param {Object} mookData - Mook data object
   */
  async #fillMookSkillsAndTraits(config, mookData) {
    console.log("MookinatorCore | Starting skills, spells, and traits filling process");
    
    // CRITICAL FIX: Get the calculated ST and Shield values from module state instead of form fields
    const calculatedAttributes = this.#api.state.getLastCalculatedAttributes();
    const stValue = calculatedAttributes.st || 10;
    const shieldAttributeValue = calculatedAttributes.shield || 0;
    
    console.log(`MookinatorCore | Using calculated ST: ${stValue}, Shield: ${shieldAttributeValue}`);
    
    // Fill all skill types with ST-based damage calculation and shield attribute
    this.#api.formOperations.preencherSkills(mookData.meleeSkills, 'melee', config.melee, stValue, shieldAttributeValue);
    this.#api.formOperations.preencherSkills(mookData.rangedSkills, 'ranged', config.ranged, stValue);
    this.#api.formOperations.preencherSkills(mookData.skillsList, 'skills', config.skills);
    this.#api.formOperations.preencherSkills(mookData.spellsList, 'spells', config.spells);

    // CRITICAL: Apply DB bonus to Dodge after melee skills are processed
    const shieldDbBonus = this.#api.state.getShieldDbBonus();
    if (shieldDbBonus > 0) {
      console.log(`MookinatorCore | Applying shield DB bonus: ${shieldDbBonus} to Dodge`);
      const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
      const currentDodge = this.#api.state.getCalculatedAttributeValue('dodge');
      const finalDodge = currentDodge + shieldDbBonus;
      
      // Update the dodge field in the form
      mookApp.element.find('input[data-key="dodge"]').val(finalDodge).trigger("change");
      
      // Update the dodge value in module state
      const updatedAttributes = this.#api.state.getLastCalculatedAttributes();
      updatedAttributes.dodge = finalDodge;
      this.#api.state.setLastCalculatedAttributes(updatedAttributes);
    }

    // Fill traits
    if (mookData.traitsList && Array.isArray(mookData.traitsList)) {
      console.log(`MookinatorCore | Processing ${mookData.traitsList.length} available traits`);
      
      // First, add all mandatory traits
      const mandatoryTraits = mookData.traitsList.filter(item => item.isMandatory === true);
      const selectedTraits = [];
      
      if (mandatoryTraits.length > 0) {
        console.log(`MookinatorCore | Found ${mandatoryTraits.length} mandatory traits`);
        mandatoryTraits.forEach(item => {
          const formattedTrait = item.valor && item.valor.toString().trim() !== '' 
            ? `${item.nome} ${item.valor}` 
            : item.nome;
          selectedTraits.push(formattedTrait);
        });
      }
      
      // Then fill remaining slots with random non-mandatory traits
      if (selectedTraits.length < config.traitsQty) {
        const nonMandatoryTraits = mookData.traitsList.filter(item => !item.isMandatory);
        const remainingSlots = config.traitsQty - selectedTraits.length;
        
        console.log(`MookinatorCore | Selecting ${remainingSlots} random traits from ${nonMandatoryTraits.length} available`);
        
        const randomTraits = nonMandatoryTraits
          .sort(() => 0.5 - Math.random())
          .slice(0, remainingSlots)
          .map(item => {
            const formattedTrait = item.valor && item.valor.toString().trim() !== '' 
              ? `${item.nome} ${item.valor}` 
              : item.nome;
            return formattedTrait;
          });
        
        selectedTraits.push(...randomTraits);
      }
      
      this.#api.formOperations.preencherCampo('traits', selectedTraits.join('\n'));
      console.log(`MookinatorCore | Applied ${selectedTraits.length} traits total`);
    }

    // Fill notes
    if (mookData.notes) {
      console.log("MookinatorCore | Filling notes section");
      this.#api.formOperations.preencherCampo('notes', mookData.notes.join('\n'));
    }
    
    console.log("MookinatorCore | Skills, spells, and traits filling completed");
  }

  /**
   * Update the name field in the native GURPS sheet (/mook)
   * @param {string} name - The name to inject into the native sheet
   */
  async #updateNativeMookName(name) {
    if (!name || typeof name !== 'string') {
      console.warn("MookinatorCore | Invalid name provided to updateNativeMookName:", name);
      return;
    }

    console.log(`MookinatorCore | Starting native name update process for: "${name}"`);

    try {
      // Use the same mookApp window that we're already injecting data into
      const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));

      if (!mookApp) {
        console.warn("MookinatorCore | Mook Generator window not found");
        return;
      }

      console.log("MookinatorCore | Found Mook Generator window, searching for name field");

      // Try different selectors for the name field in the native sheet
      const nameSelectors = [
        'input[name="name"]',
        'input[data-dtype="String"][name="name"]',
        '.sheet-header input[name="name"]',
        '.charname input',
        'input.charname',
        '.character-name input',
        '#npc-input-name',
        'input[data-key="name"]',
        '.gcs-input[data-key="name"]'
      ];

      let nameField = null;
      let usedSelector = null;
      
      for (const selector of nameSelectors) {
        console.log(`MookinatorCore | Trying selector: ${selector}`);
        nameField = mookApp.element.find(selector);
        if (nameField.length > 0) {
          usedSelector = selector;
          console.log(`MookinatorCore | SUCCESS: Found native name field using selector: ${selector}`);
          break;
        } else {
          console.log(`MookinatorCore | No match for selector: ${selector}`);
        }
      }

      if (!nameField || nameField.length === 0) {
        console.warn("MookinatorCore | Could not find name field in native GURPS sheet");
        console.log("MookinatorCore | Available input fields:", mookApp.element.find('input').map((i, el) => el.name || el.className).get());
        console.log("MookinatorCore | Available input fields with IDs:", mookApp.element.find('input[id]').map((i, el) => `#${el.id}`).get());
        console.log("MookinatorCore | Available input fields with data-key:", mookApp.element.find('input[data-key]').map((i, el) => `[data-key="${el.getAttribute('data-key')}"]`).get());
        return;
      }

      console.log(`MookinatorCore | Found ${nameField.length} matching field(s) with selector: ${usedSelector}`);
      console.log(`MookinatorCore | Current field value: "${nameField.val()}"`);

      // Update the name field value
      nameField.val(name);
      console.log(`MookinatorCore | Set field value to: "${name}"`);
      
      // Trigger change event to ensure the sheet updates properly
      nameField.trigger('change');
      nameField.trigger('blur');
      nameField.trigger('input');
      console.log("MookinatorCore | Triggered change, blur, and input events");

      console.log(`MookinatorCore | Successfully updated native sheet name to: ${name}`);
      
    } catch (error) {
      console.error("MookinatorCore | Error updating native sheet name:", error);
      console.error("MookinatorCore | Error stack:", error.stack);
    }
  }

  /**
   * Trigger the "Create Mook" button on the native GURPS sheet with enhanced logging and retry logic
   */
  async #triggerNativeCreateMookButton() {
    console.log("MookinatorCore | Starting native button trigger process");
    
    try {
      // Use the same mookApp window that we're already injecting data into
      const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));

      if (!mookApp) {
        console.warn("MookinatorCore | Mook Generator window not found for button click");
        return;
      }

      console.log("MookinatorCore | Found Mook Generator window, searching for create button");

      // Find the button by its ID
      const createButton = mookApp.element.find('#npc-input-create');

      if (createButton.length > 0) {
        console.log("MookinatorCore | Found native button with ID #npc-input-create");
        console.log(`MookinatorCore | Button element count: ${createButton.length}`);
        console.log(`MookinatorCore | Button is visible: ${createButton.is(':visible')}`);
        console.log(`MookinatorCore | Button is enabled: ${!createButton.prop('disabled')}`);
        
        // Helper function to simulate complete mouse click events
        const simulateCompleteClick = (element) => {
          const domElement = element[0]; // Get the actual DOM element from jQuery
          console.log(`MookinatorCore | Simulating click on element: ${domElement.tagName}#${domElement.id}`);
          
          // Create and dispatch mousedown event
          const mousedownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: 1,
            clientX: 0,
            clientY: 0
          });
          domElement.dispatchEvent(mousedownEvent);
          console.log("MookinatorCore | Dispatched mousedown event");
          
          // Create and dispatch mouseup event
          const mouseupEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: 0,
            clientX: 0,
            clientY: 0
          });
          domElement.dispatchEvent(mouseupEvent);
          console.log("MookinatorCore | Dispatched mouseup event");
          
          // Create and dispatch click event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            button: 0,
            buttons: 0,
            clientX: 0,
            clientY: 0
          });
          domElement.dispatchEvent(clickEvent);
          console.log("MookinatorCore | Dispatched click event");
          
          // Also try the traditional click method as fallback
          domElement.click();
          console.log("MookinatorCore | Called traditional click() method");
        };
        
        // First click (should be "Test Mook")
        const initialText = createButton.text().trim();
        console.log(`MookinatorCore | First click - Button text: "${initialText}"`);
        console.log("MookinatorCore | Executing first click...");
        simulateCompleteClick(createButton);
        
        // Wait for the first click to process
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log("MookinatorCore | Waited 300ms after first click");
        
        // Wait for button text to change to "Create Mook" with timeout
        let attempts = 0;
        const maxAttempts = 20; // 4 seconds maximum wait (20 * 200ms)
        let buttonTextChanged = false;
        
        console.log("MookinatorCore | Starting button text change detection loop");
        while (attempts < maxAttempts && !buttonTextChanged) {
          const currentText = createButton.text().trim();
          console.log(`MookinatorCore | Checking button text (attempt ${attempts + 1}/${maxAttempts}): "${currentText}"`);
          
          // Check if text changed from initial text (indicating state change)
          if (currentText !== initialText && currentText.toLowerCase().includes('create')) {
            buttonTextChanged = true;
            console.log(`MookinatorCore | SUCCESS: Button text changed to: "${currentText}"`);
            break;
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        if (!buttonTextChanged) {
          console.warn(`MookinatorCore | WARNING: Button text did not change after ${maxAttempts} attempts (${maxAttempts * 200}ms). Proceeding with second click anyway.`);
          console.warn(`MookinatorCore | Final button text: "${createButton.text().trim()}"`);
        }
        
        // Second click (should be "Create Mook")
        const finalText = createButton.text().trim();
        console.log(`MookinatorCore | Second click - Button text: "${finalText}"`);
        console.log("MookinatorCore | Executing second click...");
        simulateCompleteClick(createButton);
        
        // Final delay to allow the second click to process
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log("MookinatorCore | Waited 300ms after second click");
        console.log("MookinatorCore | Both button clicks completed successfully.");
        
      } else {
        console.warn("MookinatorCore | Could not find native 'Create Mook' button with ID #npc-input-create.");
        console.log("MookinatorCore | Available buttons in mook sheet:", mookApp.element.find('button').map((i, el) => `#${el.id || 'no-id'} .${el.className || 'no-class'}`).get());
        console.log("MookinatorCore | Available elements with 'create' in ID:", mookApp.element.find('[id*="create"]').map((i, el) => `#${el.id}`).get());
        console.log("MookinatorCore | Available clickable elements:", mookApp.element.find('button, input[type="button"], input[type="submit"], .clickable').map((i, el) => `${el.tagName}#${el.id || 'no-id'}.${el.className || 'no-class'}`).get());
      }
    } catch (error) {
      console.error("MookinatorCore | Error triggering native 'Create Mook' button:", error);
      console.error("MookinatorCore | Error stack:", error.stack);
    }
  }
}

/**
 * Safe function that can be called directly from macros
 * This checks for module availability and waits if needed
 */
async function safeMookinatorLauncher() {
  // Check if module exists
  const module = game.modules.get("mookinator");
  if (!module) {
    console.error("Mookinator module not found");
    ui.notifications.error("Mookinator module not found");
    return;
  }

  // If API is not ready, wait for it
  if (!module.api) {
    console.log(" 🐮 Mookinator API not ready, waiting...");
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds maximum wait
    
    while (!module.api && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
    }
    
    if (!module.api) {
      console.error("Mookinator API failed to initialize after waiting");
      ui.notifications.error("Mookinator failed to initialize. Please refresh and try again.");
      return;
    }
  }

  // Verify required components
  const requiredComponents = ['state', 'utils', 'dataLoader', 'formOperations', 'templates', 'uiHandlers', 'core'];
  const missingComponents = requiredComponents.filter(comp => !module.api[comp]);
  
  if (missingComponents.length > 0) {
    console.error("Missing Mookinator components:", missingComponents);
    ui.notifications.error("Mookinator is missing required components. Please refresh and try again.");
    return;
  }

  // Try to call the initialization function
  try {
    // Call the real initialization function directly
    await inicializarMookGenerator();
  } catch (error) {
    console.error("Error launching Mookinator:", error);
    ui.notifications.error("Failed to launch Mookinator. Check console for details.");
  }
}

// Make the safe launcher globally available for macros
window.safeMookinatorLauncher = safeMookinatorLauncher;

/**
 * Main function to initialize the Mook Generator - UPDATED WITH CLOSE BUTTON REMOVAL
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
  
  // Load saved configurations
  const savedConfig = mookinator.utils.loadSavedConfig();
  
  const customButtonHtml = mookinator.templates.generateCustomButtonHtml();
  const dialogContent = mookinator.templates.generateDialogTemplate(customButtonHtml);

  const dialog = new Dialog({
    title: "Mookinator",
    content: dialogContent,
    buttons: {}, // Remove all default buttons
    render: (html) => {
      // Fill form with saved configurations
      mookinator.dataLoader.preencherFormularioComConfiguracoesSalvas(html, savedConfig);
      
      const handlers = {
        loadCustomJSON: (html) => {
          mookinator.dataLoader.loadCustomJSON(html, mookinator.state.setCurrentMookDataAndPath.bind(mookinator.state), savedConfig);
        },
        gerarMook: (config, mookData) => mookinator.core.generateMooks(config, mookData),
        getCurrentMookData: () => mookinator.state.getCurrentMookData()
      };

      mookinator.uiHandlers.setupAllHandlers(html, handlers);
    },
    resizable: true,

    close: (html) => {
      // Save current form configuration before closing
      try {
        const form = html[0].querySelector("form");
        if (form) {
          const currentConfig = mookinator.uiHandlers.extractFormConfig(form);
          mookinator.utils.saveCurrentConfig(currentConfig);
        }
      } catch (error) {
        console.warn("Erro ao salvar configurações:", error);
      }
      
      mookinator.state.clearCurrentMookData();
    }
  });

  dialog.render(true, {
    width: 510,
    classes: ["mookinator"]
  });

  // Generate and inject name when loading the Mookinator window
  setTimeout(async () => {
    try {
      const mookinator = game.modules.get("mookinator").api;
      const settings = mookinator.state.getNameGeneratorSettings();
      const initialName = mookinator.NameGenerator.generateRandomName(
        settings.nation,
        settings.gender,
        settings.namePart
      );

      if (initialName) {
        const nameField = dialog.element.find('input#npc-input-name[data-key="name"].gcs-input');
        if (nameField.length > 0) {
          nameField.val(initialName).trigger("change").trigger("input").trigger("blur");
          mookinator.state.setGeneratedNpcName(initialName);

          // Small delay before trying to update the native sheet
          await new Promise(resolve => setTimeout(resolve, 100));
          await mookinator.core.updateNativeMookName(initialName);
        }
      }
    } catch (error) {
      console.error("Mookinator | Error generating and injecting initial name:", error);
    }
  }, 200); // Initial delay to ensure the dialog is rendered
}

// Module initialization
Hooks.once("init", () => {
  console.log(" 🐮 Mookinator | Initializing...");
  
  // Ensure game.mookinator is properly initialized for backward compatibility
  if (!game.mookinator) {
    game.mookinator = {};
  }
  
  // Assign the safe launcher immediately in the init hook
  game.mookinator.inicializarMookGenerator = safeMookinatorLauncher;
  
  // Register all form field settings for persistence
  const attributes = ['st', 'dx', 'iq', 'ht', 'hp', 'will', 'per', 'fp', 'shield', 'parry', 'speed', 'move', 'sm', 'dr', 'dodge', 'coins'];
  const sections = ['skills', 'ranged', 'melee', 'spells'];
  
  // Register attribute min/max settings
  attributes.forEach(attr => {
    game.settings.register("mookinator", `${attr}Min`, {
      name: `${attr} Min`,
      scope: "client",
      config: false,
      type: Number,
      default: attr === 'coins' ? 0 : (attr === 'speed' ? -1.0 : -2)
    });
    
    game.settings.register("mookinator", `${attr}Max`, {
      name: `${attr} Max`,
      scope: "client", 
      config: false,
      type: Number,
      default: attr === 'coins' ? 100 : (attr === 'speed' ? 0.75 : (attr === 'fp' ? 4 : 2))
    });
  });
  
  // Register section settings (qty, min, max)
  sections.forEach(section => {
    game.settings.register("mookinator", `${section}Qty`, {
      name: `${section} Quantity`,
      scope: "client",
      config: false,
      type: Number,
      default: 2
    });
    
    game.settings.register("mookinator", `${section}Min`, {
      name: `${section} Min`,
      scope: "client",
      config: false,
      type: Number,
      default: -2
    });
    
    game.settings.register("mookinator", `${section}Max`, {
      name: `${section} Max`,
      scope: "client",
      config: false,
      type: Number,
      default: 2
    });
  });
  
  // Register traits quantity setting
  game.settings.register("mookinator", "traitsQty", {
    name: "Traits Quantity",
    scope: "client",
    config: false,
    type: Number,
    default: 4
  });
  
  // NEW: Register mook quantity setting
  game.settings.register("mookinator", "mookQty", {
    name: "Mook Quantity",
    scope: "client",
    config: false,
    type: Number,
    default: 1
  });
  
  console.log(" 🐮 Mookinator | Settings registered");
});

Hooks.once("ready", () => {
  console.log(" 🐮 Mookinator | Ready hook triggered");
  
  // Validate that name data is loaded before initializing the module
  if (!window.NAME_DATA) {
    console.error("Mookinator | NAME_DATA not found. Name generator functionality may not work properly.");
    console.error("Mookinator | Make sure name-data.js is loaded before main.js");
  } else {
    console.log(" 🐮 Mookinator | NAME_DATA loaded successfully with", Object.keys(window.NAME_DATA).length, "nations");
  }
  
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
    module.api.NameGenerator = NameGenerator;
    module.api.NameDialog = NameDialog;
    
    // Initialize the core application logic
    module.api.core = new MookinatorCore(module.api);
    
    // Set up the main function
    module.api.inicializarMookGenerator = inicializarMookGenerator;
    
    console.log(" 🐮 Mookinator | API components initialized successfully");
  } catch (error) {
    console.error(" 🐮 Mookinator | Error initializing module API:", error);
    ui.notifications.error("Failed to initialize Mookinator module. Check console for details.");
    return;
  }
  
  // Ensure game.mookinator is properly initialized for backward compatibility
  if (!game.mookinator) {
    game.mookinator = {};
  }
  
  // Update the function reference to the real one now that API is ready
  game.mookinator.inicializarMookGenerator = inicializarMookGenerator;
  
  console.log(" 🐮 Mookinator | Module fully initialized and ready to use");
});