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
          
          <input type="number" name="coinsMin" class="input-field-coins"/>
          <span class="section-input-label">-</span>
          <input type="number" name="coinsMax" class="input-field-coins"/>
        </div>
      </div>
    `;
  }

  /**
   * Generate mook quantity input row HTML
   * @returns {string} HTML string for mook quantity input
   */
  generateMookQuantitySection() {
    return `
      <div class="section-group">
        <div class="section-label">Quantity:</div>
        <div class="section-inputs">
          <input type="number" name="mookQty" class="input-field-coins" value="1" min="1"/>
        </div>
      </div>
    `;
  }

  /**
   * Generate the name input field and associated buttons
   * @returns {string} HTML string for the name input and buttons
   */
  generateNameInputAndButtonsHtml() {
    return `
      <div class="name-input-group">
        <label for="npc-input-name" class="name-input-label">Name:</label>
        <input id="npc-input-name" data-key="name" class="gcs-input" type="text" value="">
        <button type="button" id="generate-name-dice-btn" class="name-generator-btn dice-btn" title="Generate Random Name">
          <i class="fas fa-dice"></i>
        </button>
        <button type="button" id="open-name-generator-settings-btn" class="name-generator-btn settings-btn" title="Name Generator Settings">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    `;
  }

  /**
   * Generate the complete dialog HTML template - UPDATED WITH SIDE-BY-SIDE BUTTONS AND MOOK QUANTITY
   * @param {string} customButtonHtml - HTML for custom button
   * @returns {string} Complete HTML template for the dialog
   */
  generateDialogTemplate(customButtonHtml) {
    return `
      <div class="container-mook">
        <h1 class="form-title">Mookinator</h1>
        <div class="mook-form-container">
          <form id="mook-form" class="mook-form">
            ${this.generateNameInputAndButtonsHtml()}
            
            <div class="column">
              <div class="column-title-row">
                <small class="column-header"></small>
                <small class="column-header">min</small>
                <small class="column-header">max</small>
              </div>            
              ${this.generateAttributeInputs(['st', 'dx', 'iq', 'ht', 'parry'])}
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
              </div>            
              ${this.generateAttributeInputs(['speed', 'move', 'sm', 'dr', 'dodge'], "/")}
            </div>
           <div class="section-title"> Knowledge, attacks, traits and money</div>        

           <div class="two-column-sections-container">

             <div class="section-column">
               ${this.generateSectionGroups(['melee', 'ranged', 'skills', 'spells'])}
             </div>
             
           </div>

           
           <div class="elemento-terceira-coluna">


              <div class="section-group">
                <div class="section-label">Traits:</div>
                <div class="section-inputs">
                  <span class="section-input-label">Qtd</span>
                  <input type="number" name="traitsQty" class="input-field"/>
                </div>
              </div>
              ${this.generateCoinsSection()}
              ${this.generateMookQuantitySection()}
            </div>
            <div class="action-buttons-group-bottom">
              <button type="button" class="load-btn custom-btn">Load File</button>
              <button type="button" id="gerar-btn" class="generate-btn">Generate Mook</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }
}