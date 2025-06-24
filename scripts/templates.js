// Mookinator Templates - Class-based HTML templates for UI components

class MookinatorTemplates {
  /**
   * Generate custom button HTML
   * @returns {string} HTML string for custom JSON button
   */
  generateCustomButtonHtml() {
    return `
      <button type="button" class="class-btn custom-btn">
        <span class="class-name">Load GCS/JSON File</span>
      </button>
    `;
  }

  /**
   * Generate attribute input rows HTML
   * @param {Array} attributes - Array of attribute names
   * @param {string} separator - Separator character between min/max inputs
   * @returns {string} HTML string for attribute inputs
   */
  generateAttributeInputs(attributes, separator = "-") {
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
  generateSectionGroups(sections) {
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
  generateCoinsSection() {
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
   * Generate the complete dialog HTML template - SIMPLIFIED WITHOUT PERSISTENCE
   * @param {string} customButtonHtml - HTML for custom button
   * @returns {string} Complete HTML template for the dialog
   */
  generateDialogTemplate(customButtonHtml) {
    return `
      <div class="container-mook">
        <h1 class="form-title">Mookinator</h1>
        <div class="mook-form-container">
          <div class="class-buttons">
            <div class="load-file-section">
              ${customButtonHtml}
            </div>
          </div>
          <div class="loading-indicator">
            <p>Loading file...</p>
          </div>
          <div class="selected-class-title"></div>
          <form id="mook-form" class="mook-form">
            
            <div class="column">
                     <div class="column-title-row">
                        <small class="column-header"></small>
              <small class="column-header">min</small>
                    <small class="column-header">max</small>
  </div>            ${this.generateAttributeInputs(['st', 'dx', 'iq', 'ht', 'parry'])}
            </div>
            <div class="column">
                                <div class="column-title-row">
                        <small class="column-header"></small>
              <small class="column-header">min</small>
                    <small class="column-header">max</small>
  </div>
              ${this.generateAttributeInputs(['hp', 'will', 'per', 'fp', 'shield'])}
            </div>
            <div class="column">
                     <div class="column-title-row">
                        <small class="column-header"></small>
              <small class="column-header">min</small>
                    <small class="column-header">max</small>
  </div>            ${this.generateAttributeInputs(['speed', 'move', 'sm', 'dr', 'dodge'], "/")}
            </div>
        
            <div class="vertical-section">
              ${this.generateSectionGroups(['melee', 'ranged', 'skills', 'spells'])}
              <div class="section-group">
                <div class="section-label">Traits:</div>
                <div class="section-inputs">
                  <span class="section-input-label">Qtd</span>
                  <input type="number" name="traitsQty" class="input-field"/>
                </div>
              </div>
              ${this.generateCoinsSection()}
            </div>
            <div class="action-buttons-group-bottom">
              <button type="button" id="gerar-btn" class="generate-btn">Generate Random Mook</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}