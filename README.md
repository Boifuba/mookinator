

![Mookinator Logo](https://github.com/Boifuba/mookinator/blob/main/images/mookinator.png) 

# Mookinator


A custom module for Foundry VTT, developed to streamline the creation of "mooks" (generic characters or enemies) for the GURPS system. With Mookinator, you can quickly generate stats, skills, equipment, and even coins for your characters, based on customizable settings or by importing data from GCS/JSON files.

## The Concept of Classes

GURPS doesn't have classes, but for Mookinator we’ll use this idea. If you want to generate NPCs like Bandits or  guards, open your GCS and include only traits, skills, weapons, and spells that such a class might commonly have in your world. The quantity doesn't matter—just add whatever seems fun. Don’t worry about attributes or point totals for now.

## Compatibility

* **System**: GURPS  
* **Minimum Foundry VTT**: 11  
* **Tested Foundry VTT**: 13  
* **Maximum Foundry VTT**: 13

## Installation

There are two main ways to install Mookinator in Foundry VTT:

### Method 1: Via Manifest URL (Recommended)

1. Open Foundry VTT and go to the main screen.  
2. Click on the **Add-on Modules** tab.  
3. Click the **Install Module** button.  
4. At the bottom of the window, paste the following manifest URL in the **Manifest URL** field:  
   `https://github.com/Boifuba/mookinator/releases/download/1.0.2/module.json`  
5. Click **Install**.  
6. After installation, launch your GURPS world. Inside the world, go to **Game Settings** (gear icon in the right sidebar).  
7. Click **Manage Modules**.  
8. Find "Mookinator" in the list and check the box to enable it.  
9. Click **Save Module Settings** at the bottom.



## How to Use

### Opening the Mookinator

To open the Mookinator interface, you need to run a JavaScript macro.

1. In Foundry VTT, open the **Compendiuns** tab (usually on the right sidebar)  
2. Find Mokinator and drag it to your macro bar 
3. Name the macro (e.g., "Open Mookinator").  
4. Or just create a new macro and set the macro **Type** to `Script`.  
5. In the **Command** field, paste the following code:
   ```javascript
   game.mookinator.inicializarMookGenerator();
   ```
6. Click **Save Macro**.  
7. Now click the macro to open the Mookinator window.

### Mookinator Interface

The Mookinator window lets you configure and generate your mooks:

* **Saved Class Buttons**: At the top, you'll see buttons for previously saved mook classes. Click to select a class.
* **`+` Button (Custom)**: Allows you to upload a JSON or GCS (GURPS Character Sheet) file from your computer.
* **Action Buttons (Top)**:
  * **Load**: Loads the selected class configuration into the form.
  * **Delete**: Deletes the selected saved class.
  * **Save**: Saves the current form configuration as a new class or updates an existing one. You can define a name and image for the saved class.
* **Attribute Configuration**: Sections to set min and max values for attributes like ST, DX, IQ, HT, HP, Will, Per, FP, Parry, Shield, Speed, Move, SM, DR, Dodge, and Coins. Mookinator will generate random values within these ranges.
* **Section Configuration (Skills, Ranged, Melee, Spells, Traits)**: Define the quantity (`Qty`), minimum level (`Min`), and maximum level (`Max`) for the character's skills, attacks, and traits.
* **"Generate Random Mook" Button**: This is the main button that generates a mook based on the current form and fills the Foundry VTT text fields (like Skills, Melee, Ranged, Traits, Notes, and Equipment/Coins).

### Loading Existing Classes

1. Click one of the saved class buttons at the top of the window.  
2. Click **Load**. The form will be filled with that class's settings.

### Loading Custom JSON/GCS

1. Click the `+` (Custom) button.  
2. A file picker window will open. Select a `.json` or `.gcs` (GURPS Character Sheet) file.  
3. Mookinator will process the file and populate the form with extracted data.

### Saving a Class Configuration

1. Configure the form with your desired attribute and section values.  
2. Click the **Save** button.  
3. A pop-up will appear asking for a **Class Name** and an optional **Image URL**.  
4. Fill in the fields and click **Save**. Your configuration will be saved and appear as a new class button.

### Generating a Random Mook

1. Make sure the form is filled out with the desired configuration (by loading a saved class, custom file, or manual input).  
2. Click the **Generate Random Mook** button.  
3. Mookinator will generate and fill in the Foundry text fields with:
   * Attributes (ST, DX, IQ, HT, HP, Will, Per, FP, Speed, Move, SM, DR, Dodge, Parry, Shield, Coins)
   * Skills  
   * Melee Attacks  
   * Ranged Attacks  
   * Traits  
   * Notes  
   * Equipment, including coin distribution

## Detailed Features

* **ST-Based Damage Calculation**: The module calculates melee and ranged weapon damage based on the generated ST value using the standard GURPS damage table.
* **Shield Processing**: Extracts the DB (Defense Bonus) from shields imported from GCS files and applies the bonus to Parry and Dodge, ensuring the mook has a functional shield if available in the data.
* **Coin Distribution**: Randomly generates a coin amount within a defined range and distributes it among gold, silver, and copper based on standard GURPS values.
* **GCS Import**: Converts data from GCS files into the Mookinator format, facilitating the creation of mooks from existing characters.

## Credits

This module was developed by **Boifubá**.

Mookinator is an unofficial module for Foundry VTT and GURPS. GURPS is a product of Steve Jackson Games. All rights reserved to Steve Jackson Games.

## License

This project is licensed under the MIT License.