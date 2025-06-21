// Mookinator Templates - HTML Templates for UI Components

/**
 * Generate saved class buttons HTML
 * @param {Array} savedClasses - Array of saved class objects
 * @returns {string} HTML string for saved class buttons
 */
function generateSavedClassButtonsHtml(savedClasses) {
  if (!savedClasses || savedClasses.length === 0) {
    return '<p class="no-saved-classes">Nenhuma classe salva. Carregue um JSON e salve-o para começar.</p>';
  }

  return savedClasses.map(cls => `
    <button type="button" class="class-btn saved-class-btn" data-path="${cls.path}" data-name="${cls.title}" data-id="${cls.id}" data-image-url="${cls.imageUrl || ''}" style="background-image: url('${cls.imageUrl || ''}')">
      <span class="class-name">${cls.title}</span>
    </button>
  `).join("");
}

/**
 * Generate custom button HTML
 * @returns {string} HTML string for custom JSON button
 */
function generateCustomButtonHtml() {
  return `
    <button type="button" class="class-btn custom-btn">
      <span class="class-name">+</span>
    </button>
  `;
}

/**
 * Generate attribute input rows HTML
 * @param {Array} attributes - Array of attribute names
 * @param {string} separator - Separator character between min/max inputs
 * @returns {string} HTML string for attribute inputs
 */
function generateAttributeInputs(attributes, separator = "-") {
  return attributes.map(attr => `
    <div class="input-row">
      <span class="input-label">${attr.toUpperCase()}</span>
      <input type="number" name="${attr}Min" class="input-field"/>
      <span class="separator">${separator}</span>
      <input type="number" name="${attr}Max" class="input-field"/>
    </div>
  `).join('');
}

/**
 * Generate section group HTML for skills/spells configuration
 * @param {Array} sections - Array of section names
 * @returns {string} HTML string for section groups
 */
function generateSectionGroups(sections) {
  return sections.map(section => `
    <div class="section-group">
      <div class="section-label">${section.charAt(0).toUpperCase() + section.slice(1)}:</div>
      <div class="section-inputs">
        <span class="section-input-label">Qtd</span>
        <input type="number" name="${section}Qty" class="input-field"/>
        <span class="section-input-label">Min</span>
        <input type="number" name="${section}Min" class="input-field"/>
        <span class="section-input-label">Max</span>
        <input type="number" name="${section}Max" class="input-field"/>
      </div>
    </div>
  `).join('');
}

/**
 * Generate coins section group HTML (min/max only)
 * @returns {string} HTML string for coins section group
 */
function generateCoinsSection() {
  return `
    <div class="section-group">
      <div class="section-label">Coins:</div>
      <div class="section-inputs">
        <span class="section-input-label">Min</span>
        <input type="number" name="coinsMin" class="input-field-coins"/>
        <span class="section-input-label">Max</span>
        <input type="number" name="coinsMax" class="input-field-coins"/>
      </div>
    </div>
  `;
}

/**
 * Generate the complete dialog HTML template
 * @param {string} savedClassButtonsHtml - HTML for saved class buttons
 * @param {string} customButtonHtml - HTML for custom button
 * @returns {string} Complete HTML template for the dialog
 */
function generateDialogTemplate(savedClassButtonsHtml, customButtonHtml) {
  return `
    <div class="container-mook">
      <h1 class="form-title">Mookinator</h1>
      <div class="mook-form-container">
        <div class="class-buttons">
          <div class="saved-class-buttons">
            ${savedClassButtonsHtml}
            ${customButtonHtml}
          </div>
        </div>
        <div class="action-buttons-group-top">
          <button type="button" id="load-selected-btn" class="load-selected-btn">Load</button>
          <button type="button" id="delete-selected-btn" class="delete-selected-btn">Delete</button>
          <button type="button" id="save-class-btn" class="save-class-btn">Save</button>
        </div>
        <div class="loading-indicator">
          <p>Carregando dados da classe...</p>
        </div>
        <div class="selected-class-title"></div>
        <form id="mook-form" class="mook-form">
          
          <div class="column">
                   <div class="column-title-row">
                      <small class="column-header"></small>
            <small class="column-header">min</small>
                  <small class="column-header">max</small>
</div>            ${generateAttributeInputs(['st', 'dx', 'iq', 'ht', 'parry'])}
          </div>
          <div class="column">
                              <div class="column-title-row">
                      <small class="column-header"></small>
            <small class="column-header">min</small>
                  <small class="column-header">max</small>
</div>
            ${generateAttributeInputs(['hp', 'will', 'per', 'fp', 'shield'])}
          </div>
          <div class="column">
                   <div class="column-title-row">
                      <small class="column-header"></small>
            <small class="column-header">min</small>
                  <small class="column-header">max</small>
</div>            ${generateAttributeInputs(['speed', 'move', 'sm', 'dr', 'dodge'], "/")}
          </div>
      
          <div class="vertical-section">
            ${generateSectionGroups(['melee', 'ranged', 'skills', 'spells'])}
            <div class="section-group">
              <div class="section-label">Traits:</div>
              <div class="section-inputs">
                <span class="section-input-label">Qtd</span>
                <input type="number" name="traitsQty" class="input-field"/>
              </div>
            </div>
            ${generateCoinsSection()}
          </div>
          <div class="action-buttons-group-bottom">
            <button type="button" id="gerar-btn" class="generate-btn">Generate Random Mook</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Export functions for use in main.js
window.MookinatorTemplates = {
  generateSavedClassButtonsHtml,
  generateCustomButtonHtml,
  generateAttributeInputs,
  generateSectionGroups,
  generateCoinsSection,
  generateDialogTemplate
};