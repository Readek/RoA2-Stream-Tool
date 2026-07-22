const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const http = require('http')

// this script is where everything starts
// however, there is a part of the code that runs before this script
// since its inside the executable, you wont be able to
// modify it unless youre able to build a new exe on your own
// you can find this code in the git's folder "Interface Source Code"

let resourcesPath, nodePath,
    httpPort, wsPort, guiWidth, guiHeight,
    wsServer, sockets = [],
    storedSettings;

// called from script inside executable
module.exports = function initExec(rPath, nPath) {

   // set the resources path
    resourcesPath = rPath;
    nodePath = nPath; // this is the path from within the executable

    // get some settings from our local settings file (if it exists)
    const guiSettsJsonPath = `${resourcesPath}/Texts/GUI Settings.json`;
    if (fs.existsSync(guiSettsJsonPath)) {
        storedSettings = JSON.parse(fs.readFileSync(guiSettsJsonPath));
    } else {
        // if it doesnt, create default data
        storedSettings = {
            guiWidth: 600,
            guiHeight: 300,
            allowIntro: false,
            workshop: false,
            forceAlt: false,
            forceHD: false,
            noLoAHD: false,
            forceWL: false,
            customRound: false,
            invertScore: false,
            scoreAutoUpdate: false,
            simpleTexts: false,
            alwaysOnTop: false,
            resizable: false,
            zoom: 100,
            remoteUpdatePort: 1111,
            webSocketPort: 1112
        }
        // and write it down to a file
        fs.writeFileSync(guiSettsJsonPath, JSON.stringify(storedSettings, null, 2));
    }

    // apply that data to current state
    httpPort = storedSettings.remoteUpdatePort;
    wsPort = storedSettings.webSocketPort;
    guiWidth = storedSettings.guiWidth;
    guiHeight = storedSettings.guiHeight;

    // Windows seems to consider frame pixels in the window proportions :(
    if (process.platform == "win32") {
        guiWidth = guiWidth + 4;
        guiHeight = guiHeight + 36;
    }

    // initialize them servers
    initHttpServer();
    initWsServer();

}


/** Starts Http server used by remote GUIs */
function initHttpServer() {

    http.createServer((request, response) => {
        if (request.method === "GET" || request.method === "HEAD") {
            let fname;
            if (request.url == "/") { // main remote GUI page
                fname = resourcesPath + "/GUI.html";
            } else { // every other request will just send the file
                fname = resourcesPath + request.url;
            }
            try {
                fname = decodeURI(fname);
                if (request.method === "GET") {
                    fs.readFile(fname, (err, data) => {
                        if (err) {
                            response.writeHead(404);
                            console.log(fname);
                        } else {
                            if (fname.endsWith(".html")) {
                                response.writeHead(200, {'Content-Type': 'text/html'});
                            } else if (fname.endsWith(".js") || fname.endsWith(".mjs")) {
                                response.writeHead(200, {'Content-Type': 'text/javascript'});
                            } else if (fname.endsWith(".css")) {
                                response.writeHead(200, {'Content-Type': 'text/css'});
                            } else {
                                response.writeHead(200, {'Content-Type': 'text'});
                            }
                            response.write(data);
                        }
                        response.end();
                    });
                } else if (request.method === "HEAD") {
                    if (fs.existsSync(fname)) {
                        response.writeHead(200);
                    } else {
                        response.writeHead(404);
                    }
                    response.end();
                }
            } catch (e) {
                response.writeHead(404);
                response.end();
            }
        }
    }).listen(httpPort);
}

/** Starts the web socket server, connecting GUI with overlays and other remote GUIs */
function initWsServer() {
    const WebSocket = require(path.join(nodePath, 'node_modules', 'ws', 'index.js'));
    wsServer = new WebSocket.Server({ port: wsPort });
}

// create main window on startup
app.whenReady().then(() => {
    createWindow()
});


function createWindow() {

    const win = new BrowserWindow({

        minHeight: 250,
        minWidth: 350,
        resizable: false,

        // will be overwitten by css
        // however this prevents a brief flashbang when first loading
        backgroundColor: "#383838",

        title: "RoA2 Stream Tool", // will get overwitten by GUI html title
        icon: path.join(nodePath, 'icon.png'),

        webPreferences: {

            // prevents GUI not updating when minimized
            backgroundThrottling: false,

            // this could mean a potential? security risk, however there are many
            // scripts using node functions within the GUI window in this project
            // TODO research how to do this properly, maybe someday
            nodeIntegration: true,
            contextIsolation: false

        },

        // hide it until it finishes loading
        show: false,

    })

    // we dont like menus
    win.removeMenu()

    // once the page has fully loaded
    win.once('ready-to-show', () => {
        // since newer electron versions, height was incorrectly set before this step
        win.setBounds({width: guiWidth, height: guiHeight});
        // and finally show it!
        win.show();
    })

    // load the main page
    win.loadFile(resourcesPath + "/GUI.html");
    
    // keyboard shortcuts!
    win.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F5') { // refresh the page
            win.reload()
            event.preventDefault()
        } else if (input.key === 'F12') { // web console
            win.webContents.openDevTools()
            win.setResizable(true)
            event.preventDefault()
        }
    })

    // always on top toggle from the GUI
    ipcMain.on('alwaysOnTop', (event, arg) => {
        win.setAlwaysOnTop(arg)
    })

    // window settings
    ipcMain.on('resizable', (event, arg) => {
        win.setResizable(arg)
    })

    // restore default window dimensions
    ipcMain.on('defaultWindow', (event) => {
        // windows includes frame borders on the window dimensions and i hate it
        if (process.platform == "win32") {
            win.setBounds({width: 608, height: 330});
        } else {
            win.setBounds({width: 600, height: 300});
        }
    })

    wsServer.on('connection', (socket, req) => {

        // add this new connection to the array to keep track of them
        sockets.push({ws: socket, id: req.url.substring(5)})
    
        // when a new client connects, send current data
        win.webContents.send('requestData')
    
        // when a socket closes, or disconnects, remove it from the array.
        socket.on('close', function() {
            sockets = sockets.filter(s => s.ws !== socket)
        });

        // in case we get data externally, pass it to the GUI
        socket.on("message", data => {
            win.webContents.send('remoteGuiData', `${data}`)
        })
    
    });

    // when the GUI is ready to send data to browsers
    ipcMain.on('sendData', (event, data) => {
        if (data) {
            const jsonData = JSON.parse(data);
            sockets.forEach(socket => {
                if (jsonData.id == socket.id) {
                    socket.ws.send(data)
                }
            })
        }
    })

    // this sends the temporal node path, used to find modules
    ipcMain.on('getNodePath', (event, data) => {
        win.webContents.send('giveNodePath', nodePath);
    })

    win.on("close", () => {
        // save current window dimensions
        guiWidth = win.getBounds().width;
        guiHeight = win.getBounds().height;
    })
    
}

// close electron when all windows close (for Windows and Linux)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // save current window dimensions
        const data = JSON.parse(fs.readFileSync(`${resourcesPath}/Texts/GUI Settings.json`));
        if (process.platform == "win32") {
            data.guiWidth = guiWidth - 8;
            data.guiHeight = guiHeight - 30;
        } else {
            data.guiWidth = guiWidth;
            data.guiHeight = guiHeight;
        }
        fs.writeFileSync(`${resourcesPath}/Texts/GUI Settings.json`, JSON.stringify(data, null, 2));
        // and good bye
        app.quit()
    }
});

// todo close electron for mac
// in theory, everything works on mac, however even if code to close
// windows was added, I would still need a mac myself to create the exec
// if you're interested in adding support for mac, please submit a pull request
// or hit me up on any of my social media (links on GitHub)