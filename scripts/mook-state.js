// Mookinator State Management - Global state variables and functions

// Global variables for current mook data
let currentMookData = null;
let currentMookPath = null;
let currentMookTitle = null;
let currentMookImageUrl = null;
let currentSelectedClassData = null;

// NEW: Global variable to store last calculated attributes
let lastCalculatedAttributes = {};

/**
 * Set current mook data and related information
 * @param {Object} data - Mook data object
 * @param {string} path - Path to the JSON file
 * @param {string} title - Title of the class
 * @param {string} imageUrl - URL of the class image
 */
function setCurrentMookDataAndPath(data, path, title, imageUrl) {
  currentMookData = window.MookinatorDataLoader.ensureDefaultCurrency(data);
  currentMookPath = path;
  currentMookTitle = title;
  currentMookImageUrl = imageUrl;
  
  currentSelectedClassData = {
    id: currentSelectedClassData?.id || foundry.utils.randomID(),
    path: path,
    title: title,
    imageUrl: imageUrl
  };
  
  console.log("🪙 Dados de moeda garantidos:", currentMookData?.currency);
}

/**
 * Get current mook data and related information
 * @returns {Object} Object containing current mook data and metadata
 */
function getCurrentMookData() {
  return {
    mookData: currentMookData,
    path: currentMookPath,
    title: currentMookTitle,
    imageUrl: currentMookImageUrl
  };
}

/**
 * Clear all current mook data
 */
function clearCurrentMookData() {
  currentMookData = null;
  currentMookPath = null;
  currentMookTitle = null;
  currentMookImageUrl = null;
  currentSelectedClassData = null;
  lastCalculatedAttributes = {}; // Clear calculated attributes too
}

/**
 * Set last calculated attributes
 * @param {Object} attributes - Object with calculated attribute values
 */
function setLastCalculatedAttributes(attributes) {
  lastCalculatedAttributes = { ...attributes };
  console.log("📊 Atributos calculados armazenados:", lastCalculatedAttributes);
}

/**
 * Get last calculated attributes
 * @returns {Object} Object with last calculated attribute values
 */
function getLastCalculatedAttributes() {
  return { ...lastCalculatedAttributes };
}

/**
 * Get specific calculated attribute value
 * @param {string} attributeName - Name of the attribute
 * @returns {number} Calculated attribute value or 0 if not found
 */
function getCalculatedAttributeValue(attributeName) {
  return lastCalculatedAttributes[attributeName] || 0;
}

// Export functions and variables for use in other modules
window.MookinatorState = {
  setCurrentMookDataAndPath,
  getCurrentMookData,
  clearCurrentMookData,
  setLastCalculatedAttributes,
  getLastCalculatedAttributes,
  getCalculatedAttributeValue,
  get currentSelectedClassData() { return currentSelectedClassData; },
  set currentSelectedClassData(value) { currentSelectedClassData = value; }
};