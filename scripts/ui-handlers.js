// Mookinator UI Handlers - Class-based event handlers and UI logic

class MookinatorUIHandlers {
  /**
   * Setup handlers for the name generator buttons
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Object} mookinatorState - The MookinatorState instance
   */
  setupNameGeneratorHandlers(html, mookinatorState) {
    // Handler for the gear button (open settings dialog)
    html.find("#open-name-generator-settings-btn").on("click", async () => {
      try {
        const mookinator = game.modules.get("mookinator").api;
        const nameGenerator = new mookinator.NameGenerator();
        
        nameGenerator.openDialog();
      } catch (error) {
        console.error("Error opening name generator dialog:", error);
        ui.notifications.error("Error opening name generator dialog");
      }
    });

    // Handler for the dice button (generate random name)
    html.find("#generate-name-dice-btn").on("click", async () => {
      try {
        const mookinator = game.modules.get("mookinator").api;
        
        // Get current settings from state
        const settings = mookinatorState.getNameGeneratorSettings();
        
        const generatedName = mookinator.NameGenerator.generateRandomName(
          settings.nation, 
          settings.gender, 
          settings.namePart
        );
        
        if (generatedName) {
          html.find("#npc-input-name").val(generatedName).trigger("change");
          mookinatorState.setGeneratedNpcName(generatedName);
          
          // Inject name into /mook character sheet input field
          const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
          if (mookApp) {
            // Find the specific name input field with id="npc-input-name" and inject the generated name
            const nameField = mookApp.element.find('#npc-input-name[data-key="name"]');
            if (nameField.length > 0) {
              nameField.val(generatedName).trigger("change");
              console.log(`🎯 Nome "${generatedName}" injetado no campo #npc-input-name da ficha /mook`);
            } else {
              console.warn("Campo #npc-input-name não encontrado na ficha /mook");
            }
          } else {
            console.warn("Ficha /mook não encontrada");
          }
          
        } else {
          ui.notifications.warn("Could not generate a name with current settings.");
        }
      } catch (error) {
        console.error("Error generating random name:", error);
        ui.notifications.error("Error generating random name");
      }
    });
  }

  /**
   * Handle file loading button click - UPDATED FOR NEW BUTTON LOCATION
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Function} loadCustomJSONHandler - Function to handle custom JSON loading
   */
  setupFileLoadingHandler(html, loadCustomJSONHandler) {
    const mookinator = game.modules.get("mookinator").api;
    
    html.on("click", ".load-btn", function (e) {
      e.preventDefault();
      
      // Handle custom JSON/GCS loading
      mookinator.state.setCurrentSelectedClassData(null);
      html.find(".selected-class-title").text("Loading file...");
      
      // Use the provided handler function with proper error handling
      if (loadCustomJSONHandler && typeof loadCustomJSONHandler === 'function') {
        try {
          loadCustomJSONHandler(html);
        } catch (error) {
          console.error("Error in loadCustomJSONHandler:", error);
          ui.notifications.error("Error loading custom file: " + error.message);
          html.find(".selected-class-title").text("");
        }
      } else {
        console.error("loadCustomJSONHandler is not a valid function");
        ui.notifications.error("Internal error: Invalid file loader function");
        html.find(".selected-class-title").text("");
      }
    });
  }

  /**
   * Handle generate button click
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Function} gerarMook - Function to generate mook
   * @param {Function} getCurrentMookData - Function to get current mook data
   */
  setupGenerateButtonHandler(html, gerarMook, getCurrentMookData) {
    const mookinator = game.modules.get("mookinator").api;
    
    html.find("#gerar-btn").on("click", async () => {
      try {
        const currentData = getCurrentMookData();
        
        if (!currentData.mookData) {
          ui.notifications.warn("No mook data available. Please load a GCS or JSON file first.");
          return;
        }

        const form = html[0].querySelector("form");
        const config = this.extractFormConfig(form);
        
        await gerarMook(config, currentData.mookData);
        
        // Save current configuration after successful generation
        try {
          mookinator.utils.saveCurrentConfig(config);
        } catch (saveError) {
          console.warn("Erro ao salvar configurações após geração:", saveError);
        }
      } catch (error) {
        console.error("Error in generate button handler:", error);
        ui.notifications.error("Error generating mook: " + error.message);
      }
    });
  }

  /**
   * Extract configuration from form elements - UPDATED: Added parry and mookQty
   * @param {HTMLFormElement} form - The form element
   * @returns {Object} Configuration object
   */
  extractFormConfig(form) {
    const getInt = (name, fallback = 0) => {
      try {
        const element = form.elements[name];
        if (!element) {
          console.warn(`Form element '${name}' not found, using fallback value ${fallback}`);
          return fallback;
        }
        const val = parseInt(element.value);
        return isNaN(val) ? fallback : val;
      } catch (error) {
        console.warn(`Error getting form element '${name}':`, error);
        return fallback;
      }
    };

    const config = {
      skills: { 
        qty: getInt("skillsQty", 3), 
        min: getInt("skillsMin", 9), 
        max: getInt("skillsMax", 14) 
      },
      ranged: { 
        qty: getInt("rangedQty", 3), 
        min: getInt("rangedMin", 9), 
        max: getInt("rangedMax", 14) 
      },
      melee: { 
        qty: getInt("meleeQty", 3), 
        min: getInt("meleeMin", 9), 
        max: getInt("meleeMax", 14) 
      },
      spells: { 
        qty: getInt("spellsQty", 3), 
        min: getInt("spellsMin", 9), 
        max: getInt("spellsMax", 14) 
      },
      traitsQty: getInt("traitsQty", 5),
      mookQty: getInt("mookQty", 1),
    };

    // Add all attributes to config - UPDATED: Added parry
    const attributes = ['st', 'dx', 'iq', 'ht', 'hp', 'will', 'per', 'fp', 'shield', 'parry', 'speed', 'move', 'sm', 'dr', 'dodge', 'coins'];
    
    // Create atributos object with proper structure
    config.atributos = {};
    attributes.forEach(attr => {
      config.atributos[attr] = {
        min: getInt(attr + 'Min', 10),
        max: getInt(attr + 'Max', 20)
      };
    });

    return config;
  }

  /**
   * Setup all UI event handlers - UPDATED FOR NEW BUTTON LAYOUT
   * @param {jQuery} html - jQuery object of the dialog HTML
   * @param {Object} handlers - Object containing handler functions
   */
  setupAllHandlers(html, handlers) {
    try {
      // Validate handlers object
      if (!handlers || typeof handlers !== 'object') {
        throw new Error("Invalid handlers object provided");
      }

      // Validate required handler functions
      const requiredHandlers = ['loadCustomJSON', 'gerarMook', 'getCurrentMookData'];
      for (const handlerName of requiredHandlers) {
        if (!handlers[handlerName] || typeof handlers[handlerName] !== 'function') {
          throw new Error(`Required handler '${handlerName}' is missing or not a function`);
        }
      }

      this.setupFileLoadingHandler(html, handlers.loadCustomJSON);
      this.setupGenerateButtonHandler(html, handlers.gerarMook, handlers.getCurrentMookData);
      this.setupNameGeneratorHandlers(html, game.modules.get("mookinator").api.state);
    } catch (error) {
      console.error("Error setting up UI handlers:", error);
      ui.notifications.error("Error initializing UI handlers: " + error.message);
    }
  }
}
