import { updateAppDownload, updateAppReplace } from "./Update.mjs";

const modal = document.getElementById("updateAppModal");
const modalTitle = document.getElementById("updateModalTitle");
const modalDesc = document.getElementById("updateModalDesc");
const modalButts = document.getElementById("updateModalButts");

// texts in plain sight because bulding a localization system
// at this point would be a bit too much
const updateModalTitleUpdating = "Updating app"
const updateModalDescUpdatingDown = "Downloading latest git version..."
const updateModalDescUpdating = "Replacing files with new update..."

const updateModalTitleDone = "Update succesful!"
const updateModalDescDone = "Update completed. You can now restart the app (press F5)."

const updateModalTitleError = "Update error"
const updateModalDescErrorDown = "Something went wrong while downloading the update. Open the console (F12) for more information."
const updateModalDescErrorUpdating = "Something went wrong while updating the files. Open the console (F12) for more information."


document.getElementById("gitUpdateButt").addEventListener("click", () => {
    modal.showModal();
});

document.getElementById("updateModalAccept").addEventListener("click", async () => {

    // hide buttons
    modalButts.style.display = "none";

    // give some feedback to the user
    replaceModalTexts(updateModalTitleUpdating, updateModalDescUpdatingDown)

    // aaaand update
    const downApp = await updateAppDownload();

    if (downApp) {

        try {
            const updApp = updateAppReplace();
            if (updApp) {
                replaceModalTexts(updateModalTitleDone, updateModalDescDone);
            }
        } catch (error) {
            console.error(error);
            replaceModalTexts(updateModalTitleError, updateModalDescErrorUpdating);
        }

    } else {
        replaceModalTexts(updateModalTitleError, updateModalDescErrorDown);
    }

})

document.getElementById("updateModalGoBack").addEventListener("click", () => {
    modal.close();
})

/**
 * Replaces this modal's title and description strings
 * @param {String} title
 * @param {String} desc
 */
function replaceModalTexts(title, desc) {
    modalTitle.textContent = title;
    modalDesc.innerHTML = desc;
}
