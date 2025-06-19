# Mookinator

##  How to Use the Module (GURPS NPC Generation)

This module was created to make it easier to generate NPCs (like guards, bandits, cultists, etc.) for GURPS campaigns in Foundry VTT — any scenario.

###  Steps

1. **Create a base character in GCS**  
   In **GURPS Character Sheet (GCS)**, build a character sheet with all the *possible options* your NPC type might use:
   - Add around 10 weapons the NPC **could** use.
   - Add any spells they **might** have access to (if applicable).
   - Add a variety of traits (positive or negative) to represent **personality**.
   - Include a list of skills to represent **general knowledge** or background.

2. **Import the character into the module**  
   Save the `.gcs` file and import it into Foundry VTT using this module.

3. **Configure generation parameters**  
   After importing, you'll be able to define:
   - **Minimum and maximum** values for the attributes (ST, DX, IQ, HT).
   - How many **skills** the NPC will get.
   - How many **weapons** they will actively use.
   - How many **traits** will be randomly selected.

4. **Randomize your NPC (MOOC)**  
   Click the generate button and voilà! A random NPC will be created using the options and constraints you set.

5. **Edit with GGA (GURPS Generic Assistant)**  
   The generated NPC can be further edited using the **MOOC** tool inside **GGA**, allowing for fine-tuning and adjustments.


##  Installation

In Foundry VTT:

1. Go to **"Add-on Modules"**.
2. Click **"Install Module"**.
3. Paste the manifest URL: 

<pre>https://raw.githubusercontent.com/Boifuba/mookinator/refs/heads/main/module.json  </pre>
4. Click **"Install"**.






## Estrutura do Projeto

```
mookinator/
├── module.json         # Manifest do módulo
├── README.md           # Documentação
├── scripts/            # Arquivos JavaScript
│   ├── main.js         # Arquivo principal
│   ├──        # Configurações
│   ├── config.js       # Configurações
│   ├── config.js       # Configurações
├── styles/             # Arquivos CSS
│   └── mookinator.css  # Estilos principais
└── lang/               # Localizações
    └── pt-BR.json      # Português brasileiro
```

## Desenvolvimento

Para desenvolver este módulo:

1. Clone o repositório na pasta de módulos do Foundry
2. Faça suas modificações
3. Reinicie o Foundry ou recarregue a página
4. Teste as funcionalidades

## Licença

MIT License




dx+ht/4