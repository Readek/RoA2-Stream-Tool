
<p align="center">

  <img src="https://github.com/Readek/RoA2-Stream-Tool/blob/main/preview.png" alt="Preview">
  
</p>

<h1 align="center">RoA2 Stream Tool</h1>

Remember that RoA1 stream tool everyone used? Well, its back! Sorta.

This is your familiar RoA stream tool, but now updated to be used for the second game. As such, overlays have remained the same.

This is kinda why I don't consider this a serious 1.0 yet, because for it to be complete, I would have to rework VS and Scoreboard overlays. Which may (or may not) happen! It also doesnt have the cleanests of code.

Now that this is a proper, separated repo, it will be easier for me to update it and add tiny features overtime.

**Pull requests** are welcome, even if its just to fix a typo or to update a render!

If you need any support, theres a [Discord Server](https://discord.gg/EX22CTBNrM) (or if you don't like Discord (i dont either), you can DM me to my [Mastodon](preview.png) account).

And now for your classic README wall of text:

---

## Features
- [Easy and fast setup](https://file.garden/ZW90VTBJky9JVpp_/RoAST/Setup.mp4) using a browser source. Drag and drop!
- [Handy interface](https://file.garden/ZW90VTBJky9JVpp_/RoAST/GUIDemo.mp4) to quickly change everything you need, like player names, pronouns, characters, scores, round, casters...
  - With customizable **Player and Commentator Presets** to setup your match in no time!
- Every single character, skin and palette the game has to offer is supported!
  - **Workshop** characters are also supported!
- A "[VS Screen](https://file.garden/ZW90VTBJky9JVpp_/RoAST/VSDemo.mp4)" to be displayed when waiting for the next game.
- A [Bracket View](https://file.garden/ZW90VTBJky9JVpp_/RoAST/BracketPreview.png) to showcase your tournament's top 8 positions!
- A [Remote GUI](https://raw.githubusercontent.com/Readek/RoA-Stream-Tool/master/Git%20wiki%20images/8%20-%20Remote%20GUI/Mobile%20View.png) that can be accessed by any device within the local network, including mobile devices!
- Now with **2v2 support**!
- Made to be customized! Add workshop characters, custom overlays or even dive into the code if you're brave enough!

---

## How to setup
These are instructions for **OBS Studio**:
- Get the [latest release](https://github.com/Readek/RoA2-Stream-Tool/releases).
- Extract somewhere.
- Drag and drop `Scoreboard.html` into OBS, or add a new browser source in OBS pointing at the local file.
  - If the source looks weird, manually set the source's properties to 1920 width and 1080 height, or set your OBS canvas resolution to 1080p, or make the source fit the screen (Ctrl+F).
- In the source's properties, change *Use custom frame rate* -> `60` (if streaming at 60fps of course).
- Manage it all with the `RoA2 Stream Tool` executable.

Repeat from the 3rd step to add the `VS Screen.html` and `Bracket.html` views, though I recommend you to do so on another scene.

It is **very recommended** that you turn off the in-game top HUD. The overlay was made with that HUD off in mind (someday, RoA2, someday...).

### Interface shortcuts!
- Press `Enter` to update*.
- Press either `F1` or `F2` to increase P1's or P2's score.
- Press `ESC` to clear player info*.

*Functionallity may change in some menus to ease workflow.*

For developing, there are some shorcuts to make things easier:
- Press `F5` to reload the GUI.
- Press `F12` to open the dev console. This will also unlock window resolution.

---

## Advanced setup
Yes, those instructions above are enough, but we can do better. **All of this is optional** of course.
 
2 basic transitions are included in the `Resources/OBS Transitions` folder, intended to be used to change to the game scene and to the vs screen, if you don't have a transition yourself of course. To use them on OBS:
- Add a new stinger transition.
- Set the video file to `Game In.webm` if creating the game scene transition, and `Swoosh.webm` if creating a vs screen transition.
- Transition point -> `350 ms`.
- I recommend you to set the Audio Fade Style to crossfade, just in case.
- On the scene's right click menu, set it to Transition Override to the transition you just created.


### Remote GUI

The Stream Tool GUI can be controlled remotely by any device within the local network where the GUI is running, and yes, this includes mobile devices! Please take a look at the [wiki](https://github.com/Readek/RoA-Stream-Tool/wiki/8.-Remote-GUI) for instructions.
