


<p align="center">
  <img src="https://github.com/Boifuba/mookinator/blob/main/images/mookinator.png" alt="Logo" width="400">
</p>

# Mookinator

A custom module for Foundry VTT, developed to streamline the creation of "mooks" (generic characters or enemies) for the GURPS system. With Mookinator, you can quickly generate stats, skills, equipment, and even coins for your characters, based on customizable settings or by importing data from GCS/JSON files.

## The Concept of Classes

GURPS doesn't have classes, but for Mookinator we’ll use this idea. If you want to generate NPCs like Bandits or  guards, open your GCS and include only traits, skills, weapons, and spells that such a class might commonly have in your world. The quantity doesn't matter—just add whatever seems fun. Don’t worry about attributes or point totals for now.

## Compatibility

* **System**: GURPS  
* **Tested Foundry VTT**: 13  
* **Maximum Foundry VTT**: 13


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

1. Import a character sheet made in GCS that you would use for an NPC.  
   I recommend including a larger number of skills, traits, and spells, ignoring character points.  
   If you want something to always be included in NPC sheets, place it inside a container called **"Template"**.

   > For attacks, just include the weapons — not the skills.

2. Adjust the minimum and maximum values to determine how much you want skill levels to fluctuate.

3. Set the number of skills, traits, and spells.

4. Click the gear icon to choose a name type!

5. Click **Generate Mook** and make fine adjustments if you want.

Done! Just test and create your mook.


## Credits

This module was developed by **Boifubá**.

Mookinator is an unofficial module for Foundry VTT and GURPS. GURPS is a product of Steve Jackson Games. All rights reserved to Steve Jackson Games.

## License

This project is licensed under the MIT License.



## Need help?

Join us on [Discord](https://discord.gg/223PjGAM2Y), or create an [issue](https://github.com/Boifuba/mookinator/issues) here.


## Do want to support me ? 

Buy me a [coffee](https://github.com/sponsors/Boifuba)

> The Discord is in Portuguese, but you can make your questions in English — we understand you!
