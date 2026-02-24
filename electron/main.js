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

// 메인 프로세스 로그 유틸리티
function logToMain(message) {
  const logMsg = `[MAIN] ${new Date().toISOString()} ${message}\n`;
  console.log(logMsg.trim());
  try {
    fs.appendFileSync(path.join(logsPath, 'main.log'), logMsg);
  } catch (e) {
    console.error('Failed to write to main.log', e);
  }
}

// 딥링크 설정 (macOS & Windows)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('commandstack', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('commandstack');
}

// 딥링크로 실행될 때를 위한 글로벌 변수
let deepLinkUrl = null;

// macOS: 딥링크로 실행될 때
app.on('open-url', (event, url) => {
  event.preventDefault();
  deepLinkUrl = url; // 윈도우 생성 전이면 URL 저장
  
  ensureDirectories(); // 로그 디렉토리 확인
  logToMain(`Deep link received (open-url): ${url}`);

  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    try {
      // URL에서 토큰 추출
      const token = new URL(url).searchParams.get('token');
      if (token) {
         logToMain(`Token extracted: ${token.substring(0, 5)}...`);
         
         // 전체 페이지를 새로 로드 (가장 확실한 방법)
         const targetUrl = isDev 
           ? `http://localhost:5173#/auth/callback?token=${token}`
           : `http://localhost:8090#/auth/callback?token=${token}`;
         
         logToMain(`Loading URL: ${targetUrl}`);
         mainWindow.loadURL(targetUrl);
         
         // IPC도 백업으로 전송
         mainWindow.webContents.once('did-finish-load', () => {
           logToMain('Page loaded, sending IPC token as backup');
           mainWindow.webContents.send('deep-link-token', token);
         });
      } else {
         logToMain('No token found in deep link URL');
      }
    } catch (e) {
      logToMain(`Deep link error: ${e.message}`);
      console.error('Deep link error:', e);
    }
  } else {
    logToMain('mainWindow not ready yet considering deep link stored.');
  }
});

// Windows: 딥링크로 실행될 때 (Second Instance Lock)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Windows에서는 commandLine 배열 안에 URL이 포함됨
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      // URL 파싱 및 처리 로직 추가 가능
    }
  });
}

// Spring Boot 서버 시작
function startServer() {
  ensureDirectories();

  const jarPath = isDev
    ? path.join(__dirname, '..', 'server', 'build', 'libs', 'commandstack-1.0.12.jar')
    : path.join(process.resourcesPath, 'server', 'commandstack-1.0.12.jar');

  console.log('Starting Spring Boot server...');
  console.log('JAR path:', jarPath);
  console.log('Database path:', path.join(dbPath, 'commandstack'));

  // 로그 파일 스트림 생성
  const logStream = fs.createWriteStream(path.join(logsPath, 'server.log'), { flags: 'a' });

  const javaArgs = [
    '-jar',
    jarPath,
    `--spring.datasource.url=jdbc:h2:file:${path.join(dbPath, 'commandstack')};AUTO_SERVER=TRUE;AUTO_SERVER_PORT=9092`,
    '--spring.h2.console.enabled=false',
    '--spring.jpa.hibernate.ddl-auto=update',
    '--server.port=8090',
    '--spring.profiles.active=prod'
  ];

  serverProcess = spawn('java', javaArgs, {
    env: { ...process.env },
    cwd: path.dirname(jarPath)
  });

  serverProcess.stdout.on('data', (data) => {
    const log = `[SERVER] ${data.toString()}`;
    console.log(log);
    logStream.write(log);
  });

  serverProcess.stderr.on('data', (data) => {
    const log = `[SERVER ERROR] ${data.toString()}`;
    console.error(log);
    logStream.write(log);
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
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  // 개발 모드: Vite 개발 서버 (5173)
  // 프로덕션: Spring Boot 서버를 통해 클라이언트 서빙 (8090)
  // 이렇게 하면 동일 origin에서 API 호출이 가능하여 CORS/쿠키 문제 해결
  let startUrl;
  let startupToken = null;
  
  if (deepLinkUrl) {
    try {
      const token = new URL(deepLinkUrl).searchParams.get('token');
      if (token) {
        startupToken = token; // 토큰 저장
        startUrl = isDev 
          ? `http://localhost:5173#/auth/callback?token=${token}`
          : `http://localhost:8090#/auth/callback?token=${token}`;
      } else {
        // 토큰 없으면 일반 시작
        startUrl = isDev ? 'http://localhost:5173' : 'http://localhost:8090';
      }
      deepLinkUrl = null; // 초기화
    } catch (e) {
      console.error('Error parsing commandstack URL:', e);
      startUrl = isDev ? 'http://localhost:5173' : 'http://localhost:8090';
    }
  } else {
    startUrl = isDev ? 'http://localhost:5173' : 'http://localhost:8090';
  }

  mainWindow.loadURL(startUrl);

  // 창이 로로드 완료되면 IPC로 토큰 전송 시도 (초기 실행 시)
  mainWindow.webContents.on('did-finish-load', () => {
    if (startupToken) { 
        logToMain(`Sending startup token via IPC: ${startupToken.substring(0, 5)}...`);
        mainWindow.webContents.send('deep-link-token', startupToken);
    }
  });

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

  // 자동 다운로드 비활성화
  autoUpdater.autoDownload = false;

  const updateConfigPath = path.join(process.resourcesPath, 'app-update.yml');
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
      message: `A new version (${info.version}) is available.\nGo to download page?`,
      buttons: ['Go to Download', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) { // Download 선택
        shell.openExternal('https://github.com/Hoooon22/Command_Stack/releases/latest');
      }
    });
  });

  // 이미 최신 버전일 때
  autoUpdater.on('update-not-available', (info) => {
    console.log('Already up to date:', info);
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'No Updates',
      message: `You're on the latest version (${info.version}).`,
      buttons: ['OK']
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
