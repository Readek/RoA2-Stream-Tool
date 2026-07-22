import { FinderSelect } from "./Finder Select.mjs";

class PaletteFinder extends FinderSelect {

    constructor() {
        super(document.getElementById("paletteFinder"));
    }

    /**
     * Fills the palette finder with the player's current character's palettes
     * @param {Player} player - Player that clicked on the palette selector
     */
    fillPaletteList(player) {

        // clear the list
        this._clearList();

        // get the entry list from the current player
        const entries = player.getPaletteEntries();
        for (let i = 0; i < entries.length; i++) {
            this.addEntry(entries[i]);
        }

        // load them palette images
        player.loadPaletteImages();

    }

}

export const paletteFinder = new PaletteFinder;