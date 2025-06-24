// Mookinator State Management - Class-based state management

class MookinatorState {
  constructor() {
    // Private variables for current mook data
    this.currentMookData = null;
    this.currentMookPath = null;
    this.currentMookTitle = null;
    this.currentMookImageUrl = null;
    this.currentSelectedClassData = null;

    // Private variable to store last calculated attributes
    this.lastCalculatedAttributes = {};

    // Private variable to store current shield DB bonus
    this.currentShieldDbBonus = 0;
  }

  /**
   * Set current mook data and related information
   * @param {Object} data - Mook data object
   * @param {string} path - Path to the JSON file
   * @param {string} title - Title of the class
   * @param {string} imageUrl - URL of the class image
   */
  setCurrentMookDataAndPath(data, path, title, imageUrl) {
    const mookinator = game.modules.get("mookinator").api;
    this.currentMookData = mookinator.dataLoader.ensureDefaultCurrency(data);
    this.currentMookPath = path;
    this.currentMookTitle = title;
    this.currentMookImageUrl = imageUrl;
    
    this.currentSelectedClassData = {
      id: this.currentSelectedClassData?.id || foundry.utils.randomID(),
      path: path,
      title: title,
      imageUrl: imageUrl
    };
    
    console.log("🪙 Dados de moeda garantidos:", this.currentMookData?.currency);
  }

  /**
   * Get current mook data and related information
   * @returns {Object} Object containing current mook data and metadata
   */
  getCurrentMookData() {
    return {
      mookData: this.currentMookData,
      path: this.currentMookPath,
      title: this.currentMookTitle,
      imageUrl: this.currentMookImageUrl
    };
  }

  /**
   * Clear all current mook data
   */
  clearCurrentMookData() {
    this.currentMookData = null;
    this.currentMookPath = null;
    this.currentMookTitle = null;
    this.currentMookImageUrl = null;
    this.currentSelectedClassData = null;
    this.lastCalculatedAttributes = {}; // Clear calculated attributes too
    this.currentShieldDbBonus = 0; // Clear shield DB bonus too
  }

  /**
   * Set last calculated attributes
   * @param {Object} attributes - Object with calculated attribute values
   */
  setLastCalculatedAttributes(attributes) {
    this.lastCalculatedAttributes = { ...attributes };
    console.log("📊 Atributos calculados armazenados:", this.lastCalculatedAttributes);
  }

  /**
   * Get last calculated attributes
   * @returns {Object} Object with last calculated attribute values
   */
  getLastCalculatedAttributes() {
    return { ...this.lastCalculatedAttributes };
  }

  /**
   * Get specific calculated attribute value
   * @param {string} attributeName - Name of the attribute
   * @returns {number} Calculated attribute value or 0 if not found
   */
  getCalculatedAttributeValue(attributeName) {
    return this.lastCalculatedAttributes[attributeName] || 0;
  }

  /**
   * Set shield DB bonus value
   * @param {number} value - Shield DB bonus value
   */
  setShieldDbBonus(value) {
    this.currentShieldDbBonus = value || 0;
    console.log(`🛡️ Shield DB bonus definido: ${this.currentShieldDbBonus}`);
  }

  /**
   * Get shield DB bonus value
   * @returns {number} Current shield DB bonus value
   */
  getShieldDbBonus() {
    return this.currentShieldDbBonus;
  }

  /**
   * Get current selected class data
   * @returns {Object|null} Current selected class data
   */
  getCurrentSelectedClassData() {
    return this.currentSelectedClassData;
  }

  /**
   * Set current selected class data
   * @param {Object} value - Class data object
   */
  setCurrentSelectedClassData(value) {
    this.currentSelectedClassData = value;
  }
}