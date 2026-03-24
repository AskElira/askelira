# AskElira Desktop App Guide

## Installation

### macOS
1. Download `AskElira-2.0.0.dmg`
2. Open the DMG file
3. Drag AskElira to Applications folder
4. Launch from Applications or Spotlight

### Windows
1. Download `AskElira-Setup-2.0.0.exe`
2. Run the installer
3. Follow installation wizard
4. Launch from Start Menu or Desktop shortcut

### Linux
1. Download `AskElira-2.0.0.AppImage`
2. Make executable: `chmod +x AskElira-2.0.0.AppImage`
3. Run: `./AskElira-2.0.0.AppImage`

---

## First Launch

On first launch, AskElira will:
1. Check for OpenClaw installation (install if needed)
2. Create `~/.askelira/memory/` directory
3. Copy `.env.template` to `~/.askelira/.env`
4. Start the gateway and UI server
5. Open the main window

**Configure API Keys:**
- Edit `~/.askelira/.env`
- Add your Brave Search API key
- Add your Anthropic API key
- Restart the app

---

## System Tray

AskElira runs in the system tray for quick access:

**Tray Menu:**
- **Show Window** - Bring main window to front
- **New Debate** - Quick input dialog for new question
- **Recent Debates** - Last 5 debates (click to view)
- **Status** - Shows gateway status
- **Quit** - Exit AskElira

**Tray Icon States:**
- 🟢 Green - Gateway online, ready
- 🟡 Yellow - Debate in progress
- 🔴 Red - Gateway offline or error

---

## Main Window

### Question Input
- Type your question in the text area
- Questions can be up to 500 characters
- Press `Cmd/Ctrl + Enter` to submit

### Agent Count Slider
- Range: 100 - 100,000 agents
- Default: 10,000 agents
- More agents = higher accuracy + higher cost
- Cost estimate shown below slider

### Results Panel
- **Decision**: YES / NO / INCONCLUSIVE / INSUFFICIENT_DATA
- **Confidence**: 0-100% (circular gauge)
- **Verdict**: GO / CONDITIONAL / NO-GO
- **Arguments FOR**: Supporting reasons
- **Arguments AGAINST**: Opposing reasons
- **Cost**: Actual API cost for this debate

### History Sidebar
- Recent debates (last 30 days)
- Click any debate to view full results
- Search box for semantic search
- Auto-refreshes every 30 seconds

---

## Keyboard Shortcuts

### Global
- `Cmd/Ctrl + N` - New debate
- `Cmd/Ctrl + H` - Show/hide history
- `Cmd/Ctrl + ,` - Open settings
- `Cmd/Ctrl + Q` - Quit app

### Window
- `Cmd/Ctrl + R` - Reload window
- `Cmd/Ctrl + W` - Close window
- `Cmd/Ctrl + M` - Minimize window
- `F11` - Toggle fullscreen

### Developer
- `Cmd/Ctrl + Shift + I` - Toggle DevTools
- `Cmd/Ctrl + Shift + R` - Hard reload

---

## Notifications

AskElira sends native OS notifications for:

1. **Debate Complete** (click to view results)
   - Shows decision and confidence
   - Question preview

2. **Gateway Status** (info only)
   - Gateway started
   - Gateway stopped
   - Connection errors

3. **Updates** (action required)
   - Update available (download now?)
   - Update downloaded (install now?)

**Disable notifications:**
- macOS: System Preferences → Notifications → AskElira
- Windows: Settings → System → Notifications → AskElira
- Linux: Depends on desktop environment

---

## Auto-Updates

AskElira checks for updates on app start:

1. **Update available** → Dialog asks to download
2. **Download in background** → Progress shown
3. **Update ready** → Dialog asks to install
4. **Restart to update** → Or install on next quit

**Manual check:**
- Menu: Help → Check for Updates

**Disable auto-updates:**
- Edit `~/.askelira/.env`
- Add `AUTO_UPDATE=false`

---

## Troubleshooting

### App won't start
1. Check Console (macOS) or Event Viewer (Windows) for errors
2. Delete `~/askelira/` and restart
3. Reinstall OpenClaw: `npm install -g openclaw`

### Gateway offline
1. Check if port 5678 is in use: `lsof -i :5678` (macOS/Linux)
2. Restart gateway: `askelira start` (CLI)
3. Check logs: `~/.askelira/logs/YYYY-MM-DD.log`

### No API results
1. Verify API keys in `~/.askelira/.env`
2. Check network connection
3. Verify API key permissions (Brave, Anthropic)

### High memory usage
1. Reduce agent count (use <10k agents)
2. Clear old debates: Delete `~/.askelira/memory/*.md`
3. Restart app

### UI not loading
1. Check UI server: `http://localhost:3000`
2. Clear cache: Menu → View → Force Reload
3. Reset UI: Delete `~/Library/Application Support/AskElira/` (macOS)

---

## Platform-Specific Notes

### macOS
- **Gatekeeper warning:** First launch requires right-click → Open
- **Transparency:** UI uses macOS vibrancy effects
- **Menu bar:** Native macOS menu (File, Edit, View, etc.)

### Windows
- **SmartScreen warning:** Click "More info" → "Run anyway"
- **System tray:** Right-click icon in notification area
- **Auto-start:** Add to Startup folder if desired

### Linux
- **Dependencies:** Requires `libappindicator3-1` for tray icon
- **Wayland:** May have tray icon issues (use X11)
- **AppImage permissions:** Must be executable

---

## Data Storage

- **Memory files:** `~/.askelira/memory/YYYY-MM-DD.md`
- **Vector DB:** `~/.askelira/memory/vectordb/`
- **Logs:** `~/.askelira/logs/YYYY-MM-DD.log`
- **Config:** `~/.askelira/.env`
- **App data:** 
  - macOS: `~/Library/Application Support/AskElira/`
  - Windows: `%APPDATA%\AskElira\`
  - Linux: `~/.config/AskElira/`

---

## Uninstalling

### macOS
1. Quit AskElira
2. Delete from Applications
3. Delete `~/.askelira/` (optional, keeps your data)
4. Delete `~/Library/Application Support/AskElira/` (optional)

### Windows
1. Quit AskElira
2. Control Panel → Uninstall a program → AskElira
3. Delete `~/.askelira/` (optional)
4. Delete `%APPDATA%\AskElira\` (optional)

### Linux
1. Delete the AppImage file
2. Delete `~/.askelira/` (optional)
3. Delete `~/.config/AskElira/` (optional)

---

**Need help?** Open an issue: https://github.com/jellyforex/askelira/issues
