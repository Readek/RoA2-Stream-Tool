import { FinderSelect } from "./Finder Select.mjs";

class SkinFinder extends FinderSelect {

    constructor() {
        super(document.getElementById("skinFinder"));
    }

    /**
     * Fills the skin finder with the player's current character's skins
     * @param {Player} player - Player that clicked on the skin selector
     */
    fillSkinList(player) {

        // clear the list
        this._clearList();

        // get the entry list from the current player
        const entries = player.getSkinEntries();
        for (let i = 0; i < entries.length; i++) {
            this.addEntry(entries[i]);
        }

        // load them skin images
        player.loadSkinImages();

    }

}

export const skinFinder = new SkinFinder;