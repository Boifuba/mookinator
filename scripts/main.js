// Mookinator Module - Main Script

/**
 * Main function to generate the Mook - UPDATED WITH ST-BASED DAMAGE CALCULATION, SHIELD ATTRIBUTE, AND DB BONUS
 * @param {Object} config - Configuration object
 * @param {Object} mookData - Mook data object
 */
async function gerarMook(config, mookData) {
  const mookApp = Object.values(ui.windows).find(w => w.title?.includes("Mook Generator"));
  if (!mookApp) {
    ui.notifications.warn("A janela do Mook Generator não está aberta.");
    return;
  }

  console.log("🎯 Iniciando geração do Mook...");
  console.log("🪙 Dados de moeda disponíveis:", mookData?.currency);

  // Fill attributes first (including ST) with new calculation logic
  window.MookinatorFormOperations.preencherAtributos(config);
  
  // Small delay to ensure fields are updated
  await new Promise(resolve => setTimeout(resolve, 100));

  // CRITICAL FIX: Get the calculated ST and Shield values from global state instead of form fields
  const calculatedAttributes = window.MookinatorState.getLastCalculatedAttributes();
  const stValue = calculatedAttributes.st || 10;
  const shieldAttributeValue = calculatedAttributes.shield || 0;
  
  console.log(`💪 ST calculado para dano de armas: ${stValue}`);
  console.log(`🛡️ Valor do atributo Shield: ${shieldAttributeValue}`);

  // Fill all skill types with ST-based damage calculation and shield attribute
  window.MookinatorFormOperations.preencherSkills(mookData.meleeSkills, 'melee', config.melee, stValue, shieldAttributeValue);
  window.MookinatorFormOperations.preencherSkills(mookData.rangedSkills, 'ranged', config.ranged, stValue);
  window.MookinatorFormOperations.preencherSkills(mookData.skillsList, 'skills', config.skills);
  window.MookinatorFormOperations.preencherSkills(mookData.spellsList, 'spells', config.spells);

  // CRITICAL: Apply DB bonus to Dodge after melee skills are processed
  const shieldDbBonus = window.MookinatorState.getShieldDbBonus();
  if (shieldDbBonus > 0) {
    const currentDodge = window.MookinatorState.getCalculatedAttributeValue('dodge');
    const finalDodge = currentDodge + shieldDbBonus;
    
    // Update the dodge field in the form
    mookApp.element.find('input[data-key="dodge"]').val(finalDodge).trigger("change");
    
    // Update the dodge value in global state
    const updatedAttributes = window.MookinatorState.getLastCalculatedAttributes();
    updatedAttributes.dodge = finalDodge;
    window.MookinatorState.setLastCalculatedAttributes(updatedAttributes);
    
    console.log(`🤸 Dodge final: ${currentDodge} (base) + ${shieldDbBonus} (DB bonus) = ${finalDodge}`);
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
    window.MookinatorFormOperations.preencherCampo('traits', traits.join('\n'));
  }

  // Fill notes
  if (mookData.notes) {
    window.MookinatorFormOperations.preencherCampo('notes', mookData.notes.join('\n'));
  }

  console.log("✅ Geração do Mook concluída!");
}

/**
 * Main function to initialize the Mook Generator
 */
async function inicializarMookGenerator() {
  GURPS.executeOTF("/mook");
  
  const savedClasses = window.MookinatorDataLoader.getSavedClasses();
  const savedClassButtonsHtml = window.MookinatorTemplates.generateSavedClassButtonsHtml(savedClasses);
  const customButtonHtml = window.MookinatorTemplates.generateCustomButtonHtml();
  const dialogContent = window.MookinatorTemplates.generateDialogTemplate(savedClassButtonsHtml, customButtonHtml);

  const dialog = new Dialog({
    title: "Mookinator",
    content: dialogContent,
    buttons: { fechar: { label: "Fechar" } },
    render: (html) => {
      const handlers = {
        loadAndPopulateForm: (html, jsonPath, className) => {
          window.MookinatorDataLoader.loadAndPopulateForm(html, jsonPath, className, window.MookinatorState.setCurrentMookDataAndPath);
        },
        loadCustomJSON: (html) => {
          window.MookinatorDataLoader.loadCustomJSON(html, window.MookinatorState.setCurrentMookDataAndPath);
        },
        saveClass: (classData) => {
          const success = window.MookinatorDataLoader.saveClass(classData);
          if (success) {
            window.MookinatorUIHandlers.refreshSavedClassesDisplay(html);
          }
          return success;
        },
        deleteClass: (classId) => {
          return window.MookinatorDataLoader.deleteClass(classId);
        },
        gerarMook: gerarMook,
        getCurrentMookData: window.MookinatorState.getCurrentMookData
      };

      window.MookinatorUIHandlers.setupAllHandlers(html, handlers);
    },
    resizable: true,
    width: 600,
    height: 500,
    close: () => { 
      window.MookinatorState.clearCurrentMookData();
    }
  });

  dialog.render(true);
}

// Module initialization
Hooks.once("init", () => {
  console.log("Mookinator | Módulo inicializado");
  
  game.settings.register("mookinator", "savedClasses", {
    name: "Saved Classes",
    hint: "Stored class configurations for the Mookinator module",
    scope: "world",
    config: false,
    type: Array,
    default: []
  });
});

Hooks.once("ready", () => {
  console.log("Mookinator | Módulo pronto para uso");
  
  // Ensure game.mookinator is properly initialized
  if (!game.mookinator) {
    game.mookinator = {};
  }
  
  game.mookinator.inicializarMookGenerator = inicializarMookGenerator;
  
  // Add to global scope for debugging
  window.mookinator = game.mookinator;
  
  // ui.notifications.info("Mookinator carregado! Use game.mookinator.inicializarMookGenerator() em uma macro.");
  
  // Debug log to verify initialization
  console.log("Mookinator | game.mookinator:", game.mookinator);
  console.log("Mookinator | Função disponível:", typeof game.mookinator.inicializarMookGenerator);
});