// Mookinator UI Handlers - Event handlers and UI logic

/**
 * Handle class selection button clicks
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @param {Function} loadCustomJSONHandler - Function to handle custom JSON loading
 */
function setupClassSelectionHandler(html, loadCustomJSONHandler) {
  html.on("click", ".class-btn", function (e) {
    e.preventDefault();
    
    // Remove selected class from all buttons
    html.find(".class-btn").removeClass("selected");
    
    // Add selected class to clicked button
    $(this).addClass("selected");
    
    // Store selected class data globally
    if ($(this).hasClass("saved-class-btn")) {
      window.currentSelectedClassData = {
        id: $(this).data("id"),
        path: $(this).data("path"),
        title: $(this).data("name"),
        imageUrl: $(this).data("image-url") || ''
      };
      
      // Update selected class title
      html.find(".selected-class-title").text(`Mook selected: ${window.currentSelectedClassData.title}`);
    } else if ($(this).hasClass("custom-btn")) {
      // Handle custom JSON/GCS loading
      window.currentSelectedClassData = null;
      html.find(".selected-class-title").text("Carregando arquivo...");
      
      // Use the provided handler function
      if (loadCustomJSONHandler && typeof loadCustomJSONHandler === 'function') {
        loadCustomJSONHandler(html);
      }
    }
  });
}

/**
 * Handle global load and delete buttons
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @param {Function} deleteClassHandler - Function to handle class deletion
 */
function setupGlobalLoadDeleteButtons(html, deleteClassHandler) {
  // Handle load selected button
  html.find("#load-selected-btn").on("click", () => {
    if (!window.currentSelectedClassData) {
      ui.notifications.warn("Nenhuma Mook selected. Selecione uma classe primeiro.");
      return;
    }

    // Find the complete class data from saved classes
    const savedClasses = window.MookinatorDataLoader.getSavedClasses();
    const classData = savedClasses.find(cls => cls.id === window.currentSelectedClassData.id);
    
    if (classData) {
      // Use the function to populate form from saved data
      window.MookinatorDataLoader.populateFormFromSavedData(html, classData, window.setCurrentMookDataAndPath);
    } else {
      ui.notifications.error("Dados da classe não encontrados.");
    }
  });

  // Handle delete selected button
  html.find("#delete-selected-btn").on("click", () => {
    if (!window.currentSelectedClassData) {
      ui.notifications.warn("Nenhuma Mook selected. Selecione uma classe primeiro.");
      return;
    }

    const classData = window.currentSelectedClassData;
    
    // Show confirmation dialog
    Dialog.confirm({
      title: "Confirmar Remoção",
      content: `<p>Tem certeza que deseja remover a classe "<strong>${classData.title}</strong>"?</p>`,
      yes: () => {
        if (deleteClassHandler(classData.id)) {
          // Remove the button from UI
          html.find(`.saved-class-btn[data-id="${classData.id}"]`).remove();
          
          // Clear current selection
          window.currentSelectedClassData = null;
          html.find(".selected-class-title").text("");
          
          // Check if no more saved classes exist
          if (html.find('.saved-class-btn').length === 0) {
            html.find('.saved-class-buttons').html('<p class="no-saved-classes">Nenhuma classe salva. Carregue um JSON e salve-o para começar.</p>' + window.MookinatorTemplates.generateCustomButtonHtml());
          }
        }
      },
      no: () => {},
      defaultYes: false
    });
  });
}

/**
 * Handle save class button click
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @param {Function} saveClassHandler - Function to save current class
 * @param {Function} getCurrentMookData - Function to get current mook data
 */
function setupSaveButtonHandler(html, saveClassHandler, getCurrentMookData) {
  html.find("#save-class-btn").on("click", () => {
    const currentData = getCurrentMookData();
    
    if (!currentData.mookData) {
      ui.notifications.warn("Nenhuma classe carregada para salvar.");
      return;
    }

    // Show dialog to get class name and image
    const saveDialog = new Dialog({
      title: "Salvar Classe",
      content: `
        <form>
          <div class="form-group">
            <label>Nome da Classe:</label>
            <input type="text" name="className" value="${currentData.title || ''}" style="width: 100%; margin-top: 5px;"/>
          </div>
          <div class="form-group" style="margin-top: 10px;">
            <label>URL da Imagem:</label>
            <div style="display: flex; gap: 5px; margin-top: 5px;">
              <input type="text" name="imageUrl" value="${currentData.imageUrl || ''}" style="flex: 1;"/>
              <button type="button" class="browse-image-btn" style="width: 30px; height: 30px; padding: 0; display: flex; align-items: center; justify-content: center;">📁</button>
            </div>
          </div>
        </form>
      `,
      buttons: {
        save: {
          label: "Salvar",
          callback: (dialogHtml) => {
            const className = dialogHtml.find('input[name="className"]').val().trim();
            const imageUrl = dialogHtml.find('input[name="imageUrl"]').val().trim();
            
            if (!className) {
              ui.notifications.warn("Nome da classe é obrigatório.");
              return false; // Prevent dialog from closing
            }

            // Extract current form configuration to merge with mook data
            const currentFormConfig = window.MookinatorDataLoader.extractCurrentFormConfig(html);
            
            // Merge current mook data with form configuration
            const mergedData = {
              ...currentData.mookData,
              ...currentFormConfig
            };

            // CRITICAL FIX: Use existing ID if we're updating an existing class
            let classId;
            if (window.currentSelectedClassData && window.currentSelectedClassData.id) {
              // We're updating an existing class - use the existing ID
              classId = window.currentSelectedClassData.id;
            } else {
              // We're creating a new class - generate a new ID
              classId = foundry.utils.randomID();
            }

            const classData = {
              id: classId,
              title: className,
              imageUrl: imageUrl,
              path: currentData.path || 'custom',
              data: mergedData
            };

            if (saveClassHandler(classData)) {
              // Update the current selected class data to reflect the saved class
              window.currentSelectedClassData = {
                id: classData.id,
                path: classData.path,
                title: classData.title,
                imageUrl: classData.imageUrl
              };
              
              // Refresh the saved classes display
              refreshSavedClassesDisplay(html);
              
              // MAINTAIN SELECTION: Find and select the newly saved class button
              setTimeout(() => {
                // Remove selected class from all buttons first
                html.find(".class-btn").removeClass("selected");
                
                // Find the button for the newly saved class and select it
                const newButton = html.find(`.saved-class-btn[data-id="${classData.id}"]`);
                if (newButton.length > 0) {
                  newButton.addClass("selected");
                  
                  // Update the selected class title
                  html.find(".selected-class-title").text(`Mook selected: ${classData.title}`);
                }
              }, 100); // Small delay to ensure DOM is updated
              
              return true; // Allow dialog to close
            }
            return false; // Prevent dialog from closing on error
          }
        },
        cancel: {
          label: "Cancelar",
          callback: () => true // Allow dialog to close
        }
      },
      default: "save",
      render: (dialogHtml) => {
        // Setup FilePicker for image selection
        dialogHtml.find('.browse-image-btn').on('click', (e) => {
          e.preventDefault();
          
          new FilePicker({
            type: "image",
            current: dialogHtml.find('input[name="imageUrl"]').val(),
            callback: (path) => {
              dialogHtml.find('input[name="imageUrl"]').val(path);
            }
          }).render(true);
        });
      },
      close: () => {} // Empty close handler to prevent auto-close issues
    });

    saveDialog.render(true);
  });
}

/**
 * Handle generate button click
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @param {Function} gerarMook - Function to generate mook
 * @param {Function} getCurrentMookData - Function to get current mook data
 */
function setupGenerateButtonHandler(html, gerarMook, getCurrentMookData) {
  html.find("#gerar-btn").on("click", async () => {
    const currentData = getCurrentMookData();
    
    if (!currentData.mookData) {
      ui.notifications.warn("No Mook selected. Pick one first.");
      return;
    }

    const form = html[0].querySelector("form");
    const config = extractFormConfig(form);
    
    await gerarMook(config, currentData.mookData);
  });
}

/**
 * Extract configuration from form elements
 * @param {HTMLFormElement} form - The form element
 * @returns {Object} Configuration object
 */
function extractFormConfig(form) {
  const getInt = (name, fallback = 0) => {
    const val = parseInt(form.elements[name].value);
    return isNaN(val) ? fallback : val;
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
  };

  // Add all attributes to config
  const attributes = ['st', 'dx', 'iq', 'ht', 'hp', 'will', 'per', 'fp', 'parry', 'speed', 'move', 'sm', 'dr', 'dodge', 'coins'];
  attributes.forEach(attr => {
    config[attr + 'Min'] = getInt(attr + 'Min', 10);
    config[attr + 'Max'] = getInt(attr + 'Max', 20);
  });

  return config;
}

/**
 * Refresh the saved classes display
 * @param {jQuery} dialogElement - The dialog element
 */
function refreshSavedClassesDisplay(dialogElement) {
  const savedClasses = window.MookinatorDataLoader.getSavedClasses();
  const savedClassButtonsHtml = window.MookinatorTemplates.generateSavedClassButtonsHtml(savedClasses);
  const customButtonHtml = window.MookinatorTemplates.generateCustomButtonHtml();
  
  dialogElement.find('.saved-class-buttons').html(savedClassButtonsHtml + customButtonHtml);
  
  // NOTE: We no longer clear the selection here since we want to maintain it after saving
}

/**
 * Setup all UI event handlers
 * @param {jQuery} html - jQuery object of the dialog HTML
 * @param {Object} handlers - Object containing handler functions
 */
function setupAllHandlers(html, handlers) {
  setupClassSelectionHandler(html, handlers.loadCustomJSON);
  setupGlobalLoadDeleteButtons(html, handlers.deleteClass);
  setupGenerateButtonHandler(html, handlers.gerarMook, handlers.getCurrentMookData);
  setupSaveButtonHandler(html, handlers.saveClass, handlers.getCurrentMookData);
}

// Export functions for use in main.js
window.MookinatorUIHandlers = {
  setupClassSelectionHandler,
  setupGlobalLoadDeleteButtons,
  setupSaveButtonHandler,
  setupGenerateButtonHandler,
  extractFormConfig,
  refreshSavedClassesDisplay,
  setupAllHandlers
};