import { Player } from "./Player.mjs";
import { fileExists } from "../File System.mjs";
import { getCharImage, getTrailImage } from "../GetImage.mjs";
import { updateBgCharImg } from "./BG Char Image.mjs";
import { currentColors } from "../Colors.mjs";
import { settings } from "../Settings.mjs";
import { profileInfo } from "../Profile Info.mjs";
import { stPath } from "../Globals.mjs";
import { gamemode } from "../Gamemode Change.mjs";
import { paletteFinder } from "../Finder/Palette Finder.mjs";
import { scores } from "../Score/Scores.mjs";

export class PlayerGame extends Player {

    profileType = "player";

    tag = "";
    pronouns = "";
    socials = {};

    vsSkin;
    scSrc;
    scBrowserSrc;
    vsSrc;
    vsBrowserSrc;
    vsBgSrc;

    pInfoDiv;
    cInfoDiv;

    palEntries = [];
    #palettesLoaded;

    constructor(id, pInfoEl, cInfoEl) {
        
        super(id);
        this.nameInp = pInfoEl.getElementsByClassName("nameInput")[0];
        this.charSel = cInfoEl.getElementsByClassName("charSelector")[0];
        this.skinSel = cInfoEl.getElementsByClassName("skinSelector")[0];
        this.palSel = cInfoEl.getElementsByClassName("paletteSelector")[0];

        this.setFinderListeners();

        this.randomImg = (this.pNum-1)%2 ? "P2" : "P1";

        // resize the container if it overflows
        this.nameInp.addEventListener("input", () => {this.resizeInput()});

        // open player info menu if clicking on the icon
        pInfoEl.getElementsByClassName("pInfoButt")[0].addEventListener("click", () => {
            profileInfo.show(this);
        });

        this.pInfoDiv = pInfoEl;
        this.cInfoDiv = cInfoEl;

        this.palSel.addEventListener("click", () => {
            paletteFinder.open(this.palSel);
            paletteFinder.fillPaletteList(this);
            paletteFinder.focusFilter();
        });

    }


    getName() {
        return this.nameInp.value;
    }
    setName(name) {
        this.nameInp.value = name;
        this.resizeInput();
    }
    getPronouns() {
        return this.pronouns;
    }
    setPronouns(text) {
        this.pronouns = text;
    }
    getTag() {
        return this.tag;
    }
    setTag(tag) {
        this.tag = tag;
    }
    getSocials() {
        return this.socials;
    }
    setSocials(socials) {
        this.socials = socials;
    }


    /**
     * Updates the skin for this player
     * @param {Object} skin - Skin data
     * @param {boolean} notDefault - If palette is also changing to something
     */
    async skinChange(skin, notDefault) {

        this.setReady(false);
        this.#palettesLoaded = false;

        // remove focus from the skin list so it auto hides
        document.activeElement.blur();

        this.skin = skin;
        this.vsSkin = skin;
        this.palette = skin.nonFolder ? null : "Default";

        // update the text of the skin selector
        this.skinSel.innerHTML = skin.name;

        // if the skin doesnt have palettes, dont show selector
        if (!this.skin.nonFolder && this.char != "Random") {
            this.palSel.style.display = "flex";
            this.generatePaletteEntries();
        } else {
            this.palSel.style.display = "none";
        }

        // update all images!
        await this.setIconImg();

        if (!notDefault) {
            await this.paletteChange("Default", true);
        } else {
            await this.setVsImg();
        }

        // set up a trail for the vs screen
        await this.setTrailImage();

        // notify the user that we done here
        this.setReady(true);

    }

    /**
     * Updates palette for this player
     * @param {String} palette - Palette name
     * @param {Boolean} skinChanged - Did skin also change?
     */
    async paletteChange(palette, skinChanged) {

        this.setReady(false);

        // remove focus from the palette list so it auto hides
        document.activeElement.blur();

        this.palette = palette;

        // update palette selector text
        this.palSel.innerHTML = palette;

        // update all images!
        await this.setScImg();
        // this depends on sc image
        await this.setVsImg();
        // update the VS BG based on the vs img
        await this.setVsBg();

        // change the background character image (if first 2 players)
        if (this.pNum-1 < 2) {
            if (this.char == "Random" && this.pNum == 1) {
                updateBgCharImg(this.pNum-1, `${stPath.charRandom}/P2.png`);
            } else {
                updateBgCharImg(this.pNum-1, this.scSrc);
            }
        }

        // notify the user that we done here
        if (!skinChanged) {
            this.setReady(true);
        }

    }

    /** Creates list entries so the Palette Finder can get them when called */
    async generatePaletteEntries() {

        const palImgs = [];
        this.palEntries = [];

        // for skins that didnt bother adding any palettes
        if (!this.skin.palettes) this.skin.palettes = [];

        // add these four since every skin always have them
        const fullPalettes = ["Default", "Blue", "Red", "Green", ...this.skin.palettes];

        // add an entry for every palette
        for (let i = 0; i < fullPalettes.length; i++) {
            
            // this will be the div to click
            const newDiv = document.createElement('div');
            newDiv.className = "finderEntry";
            newDiv.addEventListener("click", () => {
                this.paletteChange(fullPalettes[i])
            });
            
            // palette name
            const spanName = document.createElement('span');
            spanName.innerHTML = fullPalettes[i];
            spanName.className = "pfName";

            // add them to the div we created before
            newDiv.appendChild(spanName);

            // now for the character image, this is the mask/mirror div
            const charImgBox = document.createElement("div");
            charImgBox.className = "pfCharImgBox";

            // store for later
            palImgs.push(charImgBox);

            // add it to the main div
            newDiv.appendChild(charImgBox);

            // and now add the div to the entry list
            this.palEntries.push(newDiv);

        }

        this.palImgs = palImgs;

    }
    getPaletteEntries() {
        return this.palEntries;
    }

    /** Loads skin images next to each skin entry on the skin list */
    async loadPaletteImages() {

        if (!this.#palettesLoaded) { // only first time skin finder is opened

            this.#palettesLoaded = true;

            const currentSkin = this.skin.name;

            // to properly sync
            const fullPalettes = ["Default", "Blue", "Red", "Green", ...this.skin.palettes];
    
            // add them images to each entry
            for (let i = 0; i < this.palImgs.length; i++) {
    
                // if we changed skin in the middle of img loading, discard next ones
                if (currentSkin == this.skin.name) {

                    // get the final image
                    const finalImg = new Image();
                    finalImg.className = "pfCharImg";
                    finalImg.src = await getCharImage(
                        this.char,
                        this.skin,
                        fullPalettes[i],
                        "Skins",
                        "P2"
                    );
                    // preload it so the gui doesnt implode when loading 30 images at once
                    finalImg.decode().then(() => {
                        // we have to position it
                        paletteFinder.positionCharImg(
                            this.skin.name,
                            finalImg,
                            {gui: this.charInfo.gui}
                        );
                        // attach it
                        this.palImgs[i].appendChild(finalImg);
                    })
    
                } else {
                    break;
                }
                
            }

        }

    }

    /** Sets the Scoreboard image depening on recolors */
    async setScImg() {

        const promises = [];

        // get us a valid image
        promises.push(getCharImage(
            this.char,
            this.skin,
            this.palette,
            "Skins",
            this.randomImg
        ));
        promises.push(this.getBrowserSrc(
            this.char, this.skin, this.palette, "Skins", this.randomImg
        ));

        // when those finish loading, set the image values
        await Promise.all(promises).then( (value) => {
            this.scSrc = value[0];
            this.scBrowserSrc = value[1];
        });

    }

    /** Sets the VS Screen image depending on recolors and settings */
    async setVsImg() {

        if (settings.isHDChecked()) {

            const promises = [];
            const skinName = {};
            skinName.name = this.skin.lovers && !settings.isNoLoAChecked() ? "LoA HD" : "HD";

            promises.push(getCharImage(
                this.char, skinName, this.palette, "Skins", this.randomImg));
            promises.push(this.getBrowserSrc(
                this.char, skinName, this.palette, "Skins", this.randomImg));

            this.vsSkin = {name: skinName.name};

            await Promise.all(promises).then( (value) => {
                this.vsSrc = value[0];
                this.vsBrowserSrc = value[1];
            })

        } else { // if no HD, just use the scoreboard image
            this.vsSrc = this.scSrc;
            this.vsBrowserSrc = this.scBrowserSrc;
            this.vsSkin = this.skin;            
        }

    }

    /** Sets the player's VS Screen background video src */
    async setVsBg() {

        // background goes omega if final game of a bo5 set
        let omega = "";
        if (scores[0].getScore() == 2 && scores[1].getScore() == 2) {
            omega = " Omega";
        }

        let vsBG = `${this.char}/BG${omega}.mp4`;
        let trueBGPath = stPath.char;

        if (this.charInfo.vsScreen) { // safety check
            if (this.charInfo.vsScreen.background) { // if the character has a specific BG
                vsBG = `${this.charInfo.vsScreen.background}/BG${omega}.mp4`;
            }
        }

        // if it doesnt exist, use a default BG
        if (!await fileExists(`${trueBGPath}/${vsBG}`)) {
            this.vsBgSrc = `Resources/Characters/BG${omega}.mp4`;
        } else {
            if (settings.isWsChecked()) {
                this.vsBgSrc = `Resources/Characters/_Workshop/${vsBG}`;
            } else {
                this.vsBgSrc = `Resources/Characters/${vsBG}`;
            }
        }

    }

    /** Generates a new trail image for this player */
    async setTrailImage() {
        const color = currentColors[(this.pNum-1)%2].hex.substring(1);
        this.trailSrc = await getTrailImage(this.shader, this.char, this.vsSkin.name,
            this.palette, color);
    }

    /**
     * Returns character image position data for the scoreboard
     * @returns Array of scoreboard position data
     */
    getScCharPos() {
        const scCharPos = [];
        const charPos = this.charInfo;
        if (charPos.scoreboard.neutral) {
            if (charPos.scoreboard[this.skin.name]) {
                // if the skin has a specific position
                scCharPos[0] = charPos.scoreboard[this.skin.name].x;
                scCharPos[1] = charPos.scoreboard[this.skin.name].y;
                scCharPos[2] = charPos.scoreboard[this.skin.name].scale;
            } else { // use a default position
                scCharPos[0] = charPos.scoreboard.neutral.x;
                scCharPos[1] = charPos.scoreboard.neutral.y;
                scCharPos[2] = charPos.scoreboard.neutral.scale;
            }
        } else { // if there are no character positions, set positions for "Random"
            if (this.pNum % 2 == 0) {
                scCharPos[0] = 30;
            } else {
                scCharPos[0] = 35;
            }
            scCharPos[1] = -10;
            scCharPos[2] = 1.2;
        }
        return scCharPos;
    }
    /**
     * Returns character image position data for the scoreboard
     * @returns Array of scoreboard position data
     */
    getVsCharPos() {
        const vsCharPos = [];
        const charPos = this.charInfo;
        // get the character positions
        if (charPos.vsScreen) {
            if (charPos.vsScreen[this.vsSkin.name]) { // if the skin has a specific position
                vsCharPos[0] = charPos.vsScreen[this.vsSkin.name].x;
                vsCharPos[1] = charPos.vsScreen[this.vsSkin.name].y;
                vsCharPos[2] = charPos.vsScreen[this.vsSkin.name].scale;
            } else { //if not, use a default position
                vsCharPos[0] = charPos.vsScreen.neutral.x;
                vsCharPos[1] = charPos.vsScreen.neutral.y;
                vsCharPos[2] = charPos.vsScreen.neutral.scale;
            }
        } else { // if there are no character positions, set positions for "Random"
            if (this.pNum % 2 == 0) {
                vsCharPos[0] = -500;
            } else {
                vsCharPos[0] = -475;
            }
            //if doubles, we need to move it up a bit
            if (gamemode.getGm() == 2) {
                vsCharPos[1] = -125;
            } else {
                vsCharPos[1] = 0;
            }
            vsCharPos[2] = .8;
        }
        return vsCharPos;
    }

    /** Changes the width of an input box depending on the text */
    resizeInput() {
        this.nameInp.style.width = this.getTextWidth(this.nameInp.value,
            window.getComputedStyle(this.nameInp).fontSize + " " +
            window.getComputedStyle(this.nameInp).fontFamily
            ) + 12 + "px";
    }

    /** Used to get the exact width of a text considering the font used */
    getTextWidth(text, font) {
        const canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement("canvas"));
        const context = canvas.getContext("2d");
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    }

}