# CommandStack Electron

Electron wrapper for CommandStack - Developer-centric personal management system

## 📦 Development Setup

### Prerequisites
- Node.js 18+
- Java 17+
- npm or yarn

### Install Dependencies

```bash
# Root directory
cd electron
npm install
```

### Development Mode

**Option 1: Run all services separately (Recommended for development)**

```bash
# Terminal 1: React Client
cd client
npm run dev

# Terminal 2: Spring Boot Server
cd server
./gradlew bootRun

# Terminal 3: Electron
cd electron
npm start
```

**Option 2: Run all at once**

```bash
cd electron
npm run dev
```

## 🏗️ Building for Production

### Build All Platforms

```bash
# From root directory
./build.sh
```

### Build Specific Platform

```bash
# macOS only
./build.sh mac

# Windows only
./build.sh win
```

### Manual Build

```bash
# 1. Build client
cd client
npm run build

# 2. Build server
cd server
./gradlew bootJar

# 3. Build Electron app
cd electron
npm run build        # Build both client and server
npm run dist         # Create distributable
npm run dist:mac     # macOS DMG
npm run dist:win     # Windows installer
```

## 📂 Output Files

Distribution files will be in `electron/dist/`:

- **macOS**: `CommandStack-1.0.1.dmg`, `CommandStack-1.0.1-arm64.dmg`
- **Windows**: `CommandStack Setup 1.0.1.exe`
- **Linux**: `CommandStack-1.0.1.AppImage`, `commandstack_1.0.1_amd64.deb`

## 🗄️ User Data Location

Application data is stored in:

- **macOS/Linux**: `~/.devzip/commandstack/`
- **Windows**: `C:\Users\{username}\AppData\Local\Devzip\CommandStack\`

Structure:
```
.devzip/commandstack/
├── database/
│   └── commandstack.mv.db
├── config/
└── logs/
```

## 🔄 Auto-Update

Auto-update is configured using `electron-updater`.

To enable updates, you need to:
1. Set up a release server (e.g., GitHub Releases)
2. Configure `publish` in `package.json`
3. Sign your application

## 🎨 Icons

Current icons are placeholders. To add custom icons:

1. Place icons in `electron/assets/`:
   - `icon.icns` - macOS (512x512)
   - `icon.ico` - Windows (256x256)
   - `icon.png` - Linux (512x512)

2. Generate icons using [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder):

```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./icon.png --output=./assets
```

## 🐛 Debugging

### View Logs

**Development:**
- Electron logs: Terminal output
- Spring Boot logs: Terminal output
- React logs: Browser DevTools (auto-opened)

**Production:**
- Application logs: `~/.devzip/commandstack/logs/`
- Open user data folder: Menu → Developer → Open User Data

### Common Issues

**Server not starting:**
- Check Java is installed: `java -version`
- Check port 8080 is available
- View server logs in console

**Database issues:**
- Check permissions on `~/.devzip/commandstack/database/`
- Delete database to reset: `rm -rf ~/.devzip/commandstack/database/*`

## 📝 Architecture

```
┌─────────────────────────────────────┐
│         Electron Main Process       │
│  - Window Management                │
│  - Spring Boot Lifecycle            │
│  - Auto Updates                     │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼────────┐
│  Renderer      │  │  Spring Boot  │
│  (React UI)    │  │  (Backend)    │
│  localhost:5173│  │  localhost:8080│
│  (dev)         │  │               │
│  file:// (prod)│  │               │
└────────────────┘  └───────────────┘
```

## 🚀 Next Steps

1. **Add Application Icon**: Replace placeholder icons in `assets/`
2. **Configure Auto-Update**: Set up release server and signing
3. **Customize Branding**: Update app name, description in `package.json`
4. **Add System Integration**: Tray icon, keyboard shortcuts, etc.
