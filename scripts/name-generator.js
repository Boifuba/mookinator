/**
 * Name Generator Main Class
 */

class NameGenerator {
  static MODULE_NAME = "mookinator"; // ✅ Corrigido para usar o nome correto do módulo

  constructor() {
    this.dialog = null;
  }

  /**
   * Generate a random name based on nation, gender, and name part
   * @param {string} nation - The nation to select from
   * @param {string} gender - The gender ('male', 'female', or 'both')
   * @param {string} namePart - The part of name to return ('full', 'first', 'last')
   * @returns {string|null} Generated name or null if error
   */
  static generateRandomName(nation, gender, namePart) {
    try {
      // Enhanced validation of NAME_DATA availability
      if (!window.NAME_DATA) {
        console.warn("Name Generator | window.NAME_DATA is not defined. Using fallback names.");
        // Fallback simples quando NAME_DATA não existe
        const fallbackNames = [
          "Marcus Aurelius", "Gaius Julius", "Lucius Maximus",
          "Julia Augusta", "Livia Drusilla", "Claudia Octavia"
        ];
        const randomIndex = Math.floor(Math.random() * fallbackNames.length);
        const selectedName = fallbackNames[randomIndex];
        
        switch (namePart) {
          case 'first':
            return selectedName.split(' ')[0] || selectedName;
          case 'last':
            const nameParts = selectedName.split(' ');
            return nameParts[nameParts.length - 1] || selectedName;
          case 'full':
          default:
            return selectedName;
        }
      }
      
      if (typeof window.NAME_DATA !== 'object') {
        console.error("Name Generator | window.NAME_DATA is not an object. Current type:", typeof window.NAME_DATA);
        return null;
      }
      
      if (!window.NAME_DATA[nation]) {
        console.error(`Name Generator | Nation '${nation}' not found in NAME_DATA. Available nations:`, Object.keys(window.NAME_DATA));
        return null;
      }
      
      const nationData = window.NAME_DATA[nation];
      
      // Validate nation data structure
      if (!nationData || typeof nationData !== 'object') {
        console.error(`Name Generator | Nation data for '${nation}' is invalid:`, nationData);
        return null;
      }
      
      if (!nationData.male && !nationData.female) {
        console.error(`Name Generator | Nation '${nation}' has no male or female name arrays`);
        return null;
      }
      
      // Validate that the arrays exist and have content
      const maleNames = Array.isArray(nationData.male) ? nationData.male : [];
      const femaleNames = Array.isArray(nationData.female) ? nationData.female : [];
      
      if (maleNames.length === 0 && femaleNames.length === 0) {
        console.error(`Name Generator | Nation '${nation}' has empty name arrays`);
        return null;
      }

      console.log(`Name Generator | Found ${maleNames.length + femaleNames.length} names for nation '${nation}', gender '${gender}'`);
      
      let availableNames = [];

      // Select names based on gender
      switch (gender) {
        case 'male':
          availableNames = [...maleNames];
          if (availableNames.length === 0) {
            console.warn(`Name Generator | No male names available for nation '${nation}', trying female names`);
            availableNames = [...femaleNames];
          }
          break;
        case 'female':
          availableNames = [...femaleNames];
          if (availableNames.length === 0) {
            console.warn(`Name Generator | No female names available for nation '${nation}', trying male names`);
            availableNames = [...maleNames];
          }
          break;
        case 'both':
        default:
          availableNames = [...maleNames, ...femaleNames];
          break;
      }

      if (availableNames.length === 0) {
        console.error(`Name Generator | No names available for nation '${nation}' with gender '${gender}'`);
        return null;
      }
      
      // Select a random full name
      const randomIndex = Math.floor(Math.random() * availableNames.length);
      const selectedFullName = availableNames[randomIndex];
      
      if (!selectedFullName || typeof selectedFullName !== 'string') {
        console.error(`Name Generator | Selected name is invalid:`, selectedFullName);
        return null;
      }

      // Return the appropriate part of the name
      switch (namePart) {
        case 'first':
          return selectedFullName.split(' ')[0] || selectedFullName;
        case 'last':
          const nameParts = selectedFullName.split(' ');
          return nameParts[nameParts.length - 1] || selectedFullName;
        case 'full':
        default:
          return selectedFullName;
      }
    } catch (error) {
      console.error('Name Generator | Error generating random name:', error);
      return null;
    }
  }

  /**
   * Open the name generator dialog
   */
  openDialog() {
    try {
      if (this.dialog) {
        this.dialog.close();
      }
      
      const mookinator = game.modules.get("mookinator").api;
      this.dialog = new mookinator.NameDialog({}, { mookinatorState: mookinator.state });
      this.dialog.render(true, {
        width: 510,
        classes: ["mookinator"]
      });
    } catch (error) {
      console.error('Name Generator | Error opening dialog:', error);
      ui.notifications.error('Error opening Name Generator dialog');
    }
  }

  /**
   * Send selected name to chat
   */
  static async sendNameToChat(name, nation, gender = null) {
    try {
      const nationName = nation === 'megalos' ? 'Megalos' : nation === 'al-haz' ? 'Al-Haz' : nation;
      const genderText = gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : '';
      
      const message = `Generated name: ${name} from ${nationName}`;

      const chatContent = `
        <div class="name-generator-chat-result">
          <div class="name-result-header">
            <h3>Name Generator</h3>
          </div>
          <div class="name-result-content">
            <div class="selected-name">
              ${name}
            </div>
            <div class="nation-info">${nationName}${genderText ? ` - ${genderText}` : ''}</div>
          </div>
        </div>
      `;

      await ChatMessage.create({
        content: chatContent,
        whisper: []
      });

      ui.notifications.info(message);
    } catch (error) {
      console.error('Name Generator | Error sending name to chat:', error);
      ui.notifications.error('Error sending name to chat');
    }
  }
}