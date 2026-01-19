const { app, BrowserWindow, Menu, shell } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let serverProcess;
const isDev = process.env.NODE_ENV === 'development';

// 사용자 데이터 디렉토리 설정
const userDataPath = path.join(app.getPath('home'), '.devzip', 'commandstack');
const dbPath = path.join(userDataPath, 'database');
const configPath = path.join(userDataPath, 'config');
const logsPath = path.join(userDataPath, 'logs');

// 디렉토리 생성
function ensureDirectories() {
  [userDataPath, dbPath, configPath, logsPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Spring Boot 서버 시작
function startServer() {
  ensureDirectories();

  const jarPath = isDev
    ? path.join(__dirname, '..', 'server', 'build', 'libs', 'commandstack-1.0.3.jar')
    : path.join(process.resourcesPath, 'server', 'commandstack-1.0.3.jar');

  console.log('Starting Spring Boot server...');
  console.log('JAR path:', jarPath);
  console.log('Database path:', path.join(dbPath, 'commandstack'));

  const javaArgs = [
    '-jar',
    jarPath,
    `--spring.datasource.url=jdbc:h2:file:${path.join(dbPath, 'commandstack')};AUTO_SERVER=TRUE;AUTO_SERVER_PORT=9092`,
    '--spring.h2.console.enabled=false',
    '--spring.jpa.hibernate.ddl-auto=update',
    '--server.port=8090'
  ];

  serverProcess = spawn('java', javaArgs, {
    env: { ...process.env }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.toString()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.toString()}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    if (code !== 0 && !app.isQuitting) {
      // 서버 크래시 시 알림
      const { dialog } = require('electron');
      dialog.showErrorBox(
        'Server Error',
        'Spring Boot server crashed. Please check logs and restart the application.'
      );
      app.quit();
    }
  });

  // 서버 시작 대기
  return new Promise((resolve) => {
    const checkServer = setInterval(() => {
      require('http').get('http://localhost:8090/actuator/health', (res) => {
        if (res.statusCode === 200) {
          clearInterval(checkServer);
          console.log('Server is ready!');
          resolve();
        }
      }).on('error', () => {
        // 서버 아직 준비 안됨
      });
    }, 1000);

    // 타임아웃 30초
    setTimeout(() => {
      clearInterval(checkServer);
      resolve();
    }, 30000);
  });
}

// 메인 윈도우 생성
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // 개발 모드: Vite 개발 서버
  // 프로덕션: 빌드된 정적 파일
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(process.resourcesPath, 'client', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  // 개발자 도구
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // 외부 링크는 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 메뉴 설정
function createMenu() {
  const template = [
    {
      label: 'CommandStack',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            autoUpdater.checkForUpdates();
          }
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  if (isDev) {
    template.push({
      label: 'Developer',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Open User Data',
          click: () => {
            shell.openPath(userDataPath);
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 자동 업데이트 설정
function setupAutoUpdater() {
  if (isDev) return;

  // 자동 다운로드 비활성화 (사용자에게 먼저 묻기 위해)
  autoUpdater.autoDownload = false;

  const updateConfigPath = path.join(process.resourcesPath, 'app-update.yml');
  // app-update.yml 파일이 없으면 electron-updater가 기본적으로 에러를 내거나 동작하지 않을 수 있음
  // 하지만 packaged 된 앱에서는 자동으로 생성되므로 굳이 체크하지 않아도 됨.
  // 여기서는 로깅만 남기고 진행.
  if (!fs.existsSync(updateConfigPath)) {
    console.warn(`[AutoUpdate] Config not found at ${updateConfigPath}, relying on internal config.`);
  }

  // 업데이트 확인 시작
  autoUpdater.checkForUpdates();

  // 업데이트가 감지되었을 때
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.\nDo you want to download it now?`,
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) { // Download 선택
        console.log('User accepted update, downloading...');
        autoUpdater.downloadUpdate();
      }
    });
  });

  // 다운로드 진행 상황 로깅
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
  });

  // 다운로드 완료 시
  autoUpdater.on('update-downloaded', () => {
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. Restart the application to install updates?',
      buttons: ['Restart', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) { // Restart 선택
        autoUpdater.quitAndInstall();
      }
    });
  });

  // 업데이트 관련 에러 발생 시
  autoUpdater.on('error', (err) => {
    console.error('Auto update error:', err);
  });
}

// 앱 초기화
app.whenReady().then(async () => {
  console.log('App starting...');
  console.log('Is Development:', isDev);

  if (!isDev) {
    await startServer();
  }

  createWindow();
  createMenu();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 앱 종료 시 서버 정리
app.on('before-quit', () => {
  app.isQuitting = true;
  if (serverProcess) {
    console.log('Stopping Spring Boot server...');
    serverProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 에러 핸들링
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
