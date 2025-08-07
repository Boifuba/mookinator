/**
 * Name Generator Dialog Class
 */

class NameDialog extends Dialog {
  constructor(data = {}, options = {}) {
    // Get current settings from mookinatorState if provided
    const mookinatorState = options.mookinatorState;
    const currentSettings = mookinatorState
      ? mookinatorState.getNameGeneratorSettings()
      : {};

    // Get available nations from NAME_DATA with enhanced validation
    let availableNations = [];

    // Enhanced validation of NAME_DATA
    if (!window.NAME_DATA) {
      console.error(
        "Name Generator | window.NAME_DATA is not defined. Make sure name-data.js is loaded before other name generator files."
      );
    } else if (typeof window.NAME_DATA !== "object") {
      console.error(
        "Name Generator | window.NAME_DATA is not an object. Current type:",
        typeof window.NAME_DATA
      );
    } else if (Object.keys(window.NAME_DATA).length === 0) {
      console.error(
        "Name Generator | window.NAME_DATA is empty. No nation data available."
      );
    } else {
      console.log(
        "Name Generator | NAME_DATA loaded successfully with nations:",
        Object.keys(window.NAME_DATA)
      );

      availableNations = Object.keys(window.NAME_DATA).filter(
        (key) =>
          window.NAME_DATA[key] &&
          typeof window.NAME_DATA[key] === "object" &&
          (Array.isArray(window.NAME_DATA[key].male) ||
            Array.isArray(window.NAME_DATA[key].female)) &&
          ((window.NAME_DATA[key].male &&
            window.NAME_DATA[key].male.length > 0) ||
            (window.NAME_DATA[key].female &&
              window.NAME_DATA[key].female.length > 0))
      );

      console.log("Name Generator | Valid nations found:", availableNations);
    }

    // Fallback if no NAME_DATA is available
    if (availableNations.length === 0) {
      console.error(
        "Name Generator | No valid nations found in NAME_DATA. Using minimal fallback."
      );
      availableNations = ["megalos"]; // Minimal fallback

      // Try to create minimal megalos data if it doesn't exist
      if (!window.NAME_DATA) {
        console.warn(
          "Name Generator | Creating minimal NAME_DATA structure as emergency fallback"
        );
        window.NAME_DATA = {};
      }

      if (!window.NAME_DATA.megalos) {
        console.warn(
          "Name Generator | Creating minimal megalos data as emergency fallback"
        );
        window.NAME_DATA.megalos = {
          male: ["Marcus Aurelius", "Gaius Julius", "Lucius Maximus"],
          female: ["Julia Augusta", "Livia Drusilla", "Claudia Octavia"],
        };
      }
    }

    const content = `
      <div class="name-generator-form">
        <div class="form-title">
          Name Generator
        </div>
        
        <form class="name-generator-dialog-form">
          <div class="name-generator-form-section">
            <div class="name-generator-form-group">
                        <div class="name-generator-form-group title-label">

              <label for="nation-select">
                Select Nation:
              </label>

                          </div>

              <select id="nation-select" name="nation" class="name-generator-nation-select">
                ${availableNations
                  .map(
                    (nation) =>
                      `<option value="${nation}">${NameDialog.formatNationName(
                        nation
                      )}</option>`
                  )
                  .join("")}
              </select>
            </div>

           <!-- Estrutura HTML corrigida - substitua esta parte no seu JavaScript -->

<div class="name-generator-form-group two-columns">
  <!-- Coluna 1: Gender -->
  <div class="name-generator-column">
    <div class="name-generator-form-group title-label">
      <label>Select Gender:</label>
    </div>
    <div class="name-generator-gender-options">
      <div class="name-generator-radio-group">
        <input type="radio" id="gender-both" name="gender" value="both" checked>
        <label for="gender-both" class="name-generator-radio-label">
          <span class="name-generator-radio-button"></span>
          <span class="name-generator-radio-text">Both</span>
        </label>
      </div>
      <div class="name-generator-radio-group">
        <input type="radio" id="gender-male" name="gender" value="male">
        <label for="gender-male" class="name-generator-radio-label">
          <span class="name-generator-radio-button"></span>
          <span class="name-generator-radio-text">Male</span>
        </label>
      </div>
      <div class="name-generator-radio-group">
        <input type="radio" id="gender-female" name="gender" value="female">
        <label for="gender-female" class="name-generator-radio-label">
          <span class="name-generator-radio-button"></span>
          <span class="name-generator-radio-text">Female</span>
        </label>
      </div>
    </div>
  </div>

  <!-- Coluna 2: Name Part -->
  <div class="name-generator-column">
    <div class="name-generator-form-group title-label">
      <label>Name Part:</label>
    </div>
    <div class="name-generator-name-part-options">
      <div class="name-generator-radio-group">
        <input type="radio" id="namepart-full" name="namePart" value="full" checked>
        <label for="namepart-full" class="name-generator-radio-label">
          <span class="name-generator-radio-button"></span>
          <span class="name-generator-radio-text">Full Name</span>
        </label>
      </div>
      <div class="name-generator-radio-group">
        <input type="radio" id="namepart-first" name="namePart" value="first">
        <label for="namepart-first" class="name-generator-radio-label">
          <span class="name-generator-radio-button"></span>
          <span class="name-generator-radio-text">First Name</span>
        </label>
      </div>
      <div class="name-generator-radio-group">
        <input type="radio" id="namepart-last" name="namePart" value="last">
        <label for="namepart-last" class="name-generator-radio-label">
          <span class="name-generator-radio-button"></span>
          <span class="name-generator-radio-text">Last Name</span>
        </label>
      </div>
    </div>
  </div>
</div>
            
            <!-- BUTTON DIRECTLY IN HTML -->
            <div class="name-generator-form-group">
              <button type="button" id="apply-settings-btn" class="generate-btn">Apply Settings</button>
            </div>
          </div>
        </form>
      </div>
    `;

    const dialogData = {
      title: "Name Generator",
      content: content,
      buttons: {}, // No buttons in dialog anymore
      default: null,
      close: (html) => {
        // Save current settings before closing
        if (this.mookinatorState) {
          this.mookinatorState.setNameGeneratorSettings({
            nation: this.currentNation,
            gender: this.currentGender,
            namePart: this.currentNamePart,
          });
        }
      },
    };

    const dialogOptions = {
      resizable: true,
      classes: ["mookinator", "name-generator-dialog"],
      ...options,
    };

    super(dialogData, dialogOptions);

    // Store the mookinatorState instance from options
    this.mookinatorState = options.mookinatorState;

    // Initialize current settings from state or defaults
    this.currentNation =
      currentSettings.nation &&
      availableNations.includes(currentSettings.nation)
        ? currentSettings.nation
        : availableNations[0];
    this.currentGender = currentSettings.gender || "both";
    this.currentNamePart = currentSettings.namePart || "full";
  }

  /**
   * Format nation name for display in the dropdown
   * @param {string} nation - The nation key
   * @returns {string} Formatted nation name
   */
  static formatNationName(nation) {
    // Handle common cases
    const commonFormats = {
      megalos: "Megalos",
      "al-haz": "Al-Haz",
      al_haz: "Al-Haz",
    };

    if (commonFormats[nation.toLowerCase()]) {
      return commonFormats[nation.toLowerCase()];
    }

    // For other nations, capitalize first letter and replace underscores/hyphens with spaces
    return nation
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  activateListeners(html) {
    super.activateListeners(html);

    // Event listener for Apply Settings button
    html.find("#apply-settings-btn").on("click", (event) => {
      event.preventDefault();

      const nation = html.find("#nation-select").val();
      const gender = html.find('input[name="gender"]:checked').val();
      const namePart = html.find('input[name="namePart"]:checked').val();

      if (this.mookinatorState) {
        this.mookinatorState.setNameGeneratorSettings({
          nation,
          gender,
          namePart,
        });
      }
      this.close();
    });

    // Handle nation selection change
    html.find("#nation-select").on("change", (event) => {
      this.currentNation = event.target.value;
    });

    // Handle gender selection change
    html.find('input[name="gender"]').on("change", (event) => {
      this.currentGender = event.target.value;
    });

    // Handle name part selection change
    html.find('input[name="namePart"]').on("change", (event) => {
      this.currentNamePart = event.target.value;
    });

    // Initialize current settings from state when dialog opens
    if (this.mookinatorState) {
      const settings = this.mookinatorState.getNameGeneratorSettings();
      this.currentNation = settings.nation || this.currentNation;
      this.currentGender = settings.gender || this.currentGender;
      this.currentNamePart = settings.namePart || this.currentNamePart;

      // Set the form values to match current settings
      html.find("#nation-select").val(this.currentNation);
      html
        .find(`input[name="gender"][value="${this.currentGender}"]`)
        .prop("checked", true);
      html
        .find(`input[name="namePart"][value="${this.currentNamePart}"]`)
        .prop("checked", true);
    }
  }
}
