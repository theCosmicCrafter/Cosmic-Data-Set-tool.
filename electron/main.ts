import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'
import fs from 'node:fs/promises'
import { exec, spawn, ChildProcess } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
let pythonServerProcess: ChildProcess | null = null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// --- PYTHON SERVER MANAGEMENT ---
function startPythonServer() {
    const backendScript = path.join(__dirname, '../backend/main.py');
    console.log(`Attempting to launch Python server: ${backendScript}`);

    // Assuming 'python' is in PATH. In production, you might bundle a python executable.
    pythonServerProcess = spawn('python', [backendScript]);

    pythonServerProcess.stdout?.on('data', (data) => {
        console.log(`[Python]: ${data}`);
        // Optionally forward to renderer
    });

    pythonServerProcess.stderr?.on('data', (data) => {
        console.error(`[Python Error]: ${data}`);
    });

    pythonServerProcess.on('close', (code) => {
        console.log(`Python server exited with code ${code}`);
    });
}

function stopPythonServer() {
    if (pythonServerProcess) {
        pythonServerProcess.kill();
        pythonServerProcess = null;
    }
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: '#0f172a', 
        symbolColor: '#e2e8f0',
        height: 35
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, 
      contextIsolation: true, // Recommended security practice
      webSecurity: false // Allow loading local resources (file://) for this dataset tool
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

// --- APP LIFECYCLE ---

app.on('window-all-closed', () => {
  stopPythonServer();
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
    createWindow();
    startPythonServer();
});

app.on('will-quit', () => {
    stopPythonServer();
});


// --- IPC HANDLERS ---

// 1. Open Directory Dialog
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory']
  })
  if (canceled) {
    return null
  } else {
    return filePaths[0]
  }
})

// 2. Scan Eagle Library
ipcMain.handle('eagle:scanLibrary', async (event, libPath: string) => {
    const imagesPath = path.join(libPath, 'images');
    const assets: any[] = [];
    
    try {
        const folders = await fs.readdir(imagesPath);
        
        // Limit for safety in this demo, though in prod we'd stream this
        const foldersToScan = folders; 

        for (const folder of foldersToScan) {
            if (!folder.endsWith('.info')) continue;

            const folderPath = path.join(imagesPath, folder);
            const metadataPath = path.join(folderPath, 'metadata.json');

            try {
                // Check if metadata exists
                await fs.access(metadataPath);
                
                const rawMeta = await fs.readFile(metadataPath, 'utf-8');
                const meta = JSON.parse(rawMeta);
                
                // Find the original file (it's in the same folder, usually named meta.name + meta.ext)
                // However, Eagle sometimes changes filenames. We look for the file that matches the extension.
                const files = await fs.readdir(folderPath);
                const mediaFile = files.find(f => f !== 'metadata.json' && !f.endsWith('.txt'));

                if (mediaFile) {
                     assets.push({
                         eagleId: meta.id,
                         name: meta.name,
                         ext: meta.ext,
                         tags: meta.tags || [],
                         description: meta.annotation || "",
                         rating: meta.star || 0,
                         fullPath: path.join(folderPath, mediaFile),
                         width: meta.width,
                         height: meta.height,
                         duration: meta.duration
                     });
                }
            } catch (err) {
                // Skip invalid folders
                continue;
            }
        }
        return assets;
    } catch (error) {
        console.error("Error reading Eagle library:", error);
        throw error;
    }
});

// 3. Install Model System Command
ipcMain.handle('system:installModel', async (event, modelId: string, basePath: string) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const sendLog = (msg: string) => window?.webContents.send('install-log', msg);

  sendLog(`Initializing installation sequence for ${modelId}...`);

  let command = '';
  // Construct command based on modelId
  // Ensure basePath is safe or handled.
  
  if (modelId === 'vision') {
     const targetDir = path.join(basePath, 'llm', 'Florence-2-large-PromptGen-v2.0');
     // Install huggingface_hub first just in case
     command = `pip install -U huggingface_hub && huggingface-cli download microsoft/Florence-2-large-PromptGen-v2.0 --local-dir "${targetDir}"`;
  } else if (modelId === 'thinking') {
     command = `ollama pull qwen2.5-coder:7b`;
  } else if (modelId === 'aesthetic') {
      const targetDir = path.join(basePath, 'textencoder', 'siglip-so400m-patch14-384');
      command = `pip install -U huggingface_hub && huggingface-cli download google/siglip-so400m-patch14-384 --local-dir "${targetDir}"`;
  } else if (modelId === 'backend_deps') {
      // Install requirements from backend/requirements.txt
      const reqPath = path.join(__dirname, '../backend/requirements.txt');
      command = `pip install -r "${reqPath}"`;
  } else {
      sendLog(`Unknown model ID: ${modelId}`);
      return false;
  }

  sendLog(`Executing command: ${command}`);

  return new Promise((resolve, reject) => {
      const child = exec(command);

      child.stdout?.on('data', (data) => {
          sendLog(data.toString());
      });

      child.stderr?.on('data', (data) => {
          // Stderr usually contains progress bars for pip/ollama, treating as log
          sendLog(data.toString());
      });

      child.on('close', (code) => {
          if (code === 0) {
              sendLog(`SUCCESS: Installation complete for ${modelId}.`);
              resolve(true);
          } else {
              sendLog(`FAILURE: Installation process exited with code ${code}.`);
              resolve(false);
          }
      });
  });
});