import { stPath } from './Globals.mjs';
import { fileExists } from './File System.mjs';
import { Player } from './Player/Player.mjs';
import { RoaRecolor } from './RoA WebGL Shader.mjs';

const anonShader = new RoaRecolor;

/**
 * @typedef {Object} Skin
 * @property {String} hex - The skin color code to be used
 * @property {Boolean} blend - Makes the image have "Early Access" shading
 * @property {Array} alpha - Set the transparency for each part (for example: [1, 0.75, 0.5, 1])
 * @property {Boolean} golden - Adds golden shading to the character's black pixels
 * @property {Boolean} force - Forces recoloring of the image with the given hex code
*/

/**
 * Returns a regular src path if an image with the skin name exists.
 * Returns the default skin image if image file can't be found.
 * Returns the random image if a default skin image can't be found.
 * @param {String} char - Character name
 * @param {Skin} skin - Skin data
 * @param {String} palette - Skin color palette
 * @param {String} imgType - To determine which folder to look for
 * @param {String} failPath - To determine which image to use in case of fail
 * @returns {String} Image src
*/
export async function getCharImage(char, skin, palette, imgType, failPath) {

    // actual image to look for
    const skinPal = palette ? `/${palette}` : ``; // if palette is null, ignore
    const imgPath = `${stPath.char}/${char}/${imgType}/${skin.name}${skinPal}.png`;

    // in case initial image fails, search for a default one
    const defaultPath = `${stPath.char}/${char}/${imgType}/Default/Default.png`;

    if (await fileExists(imgPath)) {
        return imgPath;
    } else if (await fileExists(defaultPath)) {
        return defaultPath;
    } else {
        // return one big "?" if everything fails
        return `${stPath.charRandom}/${failPath}.png`;
    }

}

/**
 * Returns a monocolor image src preserving alpha of the requested character+skin.
 * If an image can't be found, it returns a 1x1 transparent pixer src.
 * @param {Player} shader - Player that will use the recolor shader
 * @param {String} char Character name
 * @param {Skin} skin - Skin data
 * @param {String} color - Desired out color
 * @returns {String} - Image src
 */
export async function getTrailImage(shader, char, skin, palette, color) {

    // we add "FFFFFF" to the color to avoid shader issues when using only 1 color
    color += "FFFFFF";

    let filePath;

    if (await fileExists(`${stPath.char}/${char}/Skins/${skin}/${palette}.png`)) {

        // if the requested skin exists as a separate image
        filePath = `${stPath.char}/${char}/Skins/${skin}/${palette}.png`;

    } else if (await fileExists(`${stPath.char}/${char}/Skins/${skin}.png`)) {
        filePath = `${stPath.char}/${char}/Skins/${skin}.png`;
    }
    
    if (filePath) {
        return await shader.getRoARecolor(
            "Trail",
            filePath,
            [127, 127, 127, 1], // any color would do
            [360, 100, 100, 1], // range picks up all colors
            {hex : color, ea : true}, // with blend true, only 1 color will be applied to everything
        )
    } else {
        // if an image can't be found, return a 1x1 transparent pixel
        return 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
    }

}

export async function genericRecolor(src, color) {

    // we add "FFFFFF" to the color to avoid shader issues when using only 1 color
    const colorForShader = color.substring(1) + "FFFFFF";

    return await anonShader.getRoARecolor(
        "Trail",
        src,
        [127, 127, 127, 1], // any color would do
        [360, 100, 100, 1], // range picks up all colors
        {hex : colorForShader, ea : true}, // with blend true, only 1 color will be applied to everything
    ) 

}