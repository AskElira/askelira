# 🎨 AskElira Enhanced CLI & TUI Guide

Beautiful terminal interfaces for AskElira with visual enhancements and **conversational interactive dashboard**.

## ✨ **NEW: Conversational Dashboard!** 💬

Talk to your dashboard using natural language! No need to memorize commands or keyboard shortcuts - just ask what you want to see:

```bash
askelira-tui

askelira> show me the dashboard
askelira> what are the agents doing?
askelira> how is customer dashboard doing?
askelira> help
```

The TUI understands natural language and responds conversationally. It's like talking to your infrastructure!

## 📦 What's New

### Enhanced CLI (`ask` command)
- 🌈 Colorful gradient ASCII art banner
- 📦 Styled message boxes (success, error, info, warning)
- 📊 Progress bars for building visualization
- ⏳ Animated spinners for operations
- 🎨 Brand-consistent colors
- 🤖 Agent activity displays
- 📈 Dashboard summaries

### Conversational TUI Dashboard (`askelira-tui` command)
- 💬 **Talk to your dashboard with natural language!**
- 🖥️ Interactive terminal interface with conversational commands
- 📊 Real-time stats and metrics
- 🏢 Building list view
- 👀 Live building progress monitoring
- 🤖 Agent activity feed with live updates
- 🗣️ Natural language understanding
- 🎯 Multiple view modes accessible by talking

## 🚀 Quick Start

### Install New CLI Tools

The enhanced CLI is already set up! Just use the new commands:

```bash
# Enhanced CLI with visual improvements
ask --help

# Full TUI dashboard (React-based)
askelira-tui

# Or use the alias
askelira dashboard
```

## 📚 Enhanced CLI Commands

### `ask` - Enhanced Visual CLI

All commands include beautiful visual output:

#### Initialize Workspace
```bash
ask init
```
Features:
- Animated spinner during setup
- Success boxes with next steps
- Color-coded file creation status
- Helpful command suggestions

#### Start Web UI
```bash
ask web
ask web --port 3001
```
Features:
- Info box with server details
- Highlighted URL for easy copying
- Clear shutdown instructions

#### Show Dashboard
```bash
ask status
```
Features:
- Boxed dashboard with stats
- Color-coded metrics
- Agent activity display
- System health indicator

#### Visualize Building Process
```bash
ask build
ask build --floors 5
```
Features:
- Multi-bar progress visualization
- Real-time floor-by-floor progress
- Color-coded status (building → live)
- Auto-completion celebration

#### View Agent Activity
```bash
ask agents
```
Features:
- Agent names in brand colors
- Current actions
- Floor assignments
- Helpful tips

## 💬 Conversational TUI Dashboard

### Launch TUI
```bash
askelira-tui
# or
askelira dashboard
# or
ask dashboard
```

### How It Works

The TUI Dashboard is **conversational** - you talk to it using natural language! Just type what you want to see, and it understands.

```
askelira> show me the dashboard
askelira> what are the agents doing?
askelira> how is customer dashboard doing?
askelira> list all buildings
askelira> help
```

### Conversational Commands

| What You Say | What You Get |
|--------------|--------------|
| `show dashboard`, `stats`, `status` | 📊 Dashboard overview with stats |
| `list buildings`, `show buildings` | 🏢 All your buildings |
| `show [building name]` | 🎯 Detailed building view with floors |
| `how is [building] doing?` | 🎯 Building status |
| `what are agents doing?`, `show agents` | 🤖 Agent activity feed |
| `show [agent name]`, `what is [agent] doing?` | 🤖 Specific agent activity |
| `floors`, `show floors` | 📊 Floor summary |
| `help` | 💡 Command help |
| `clear` | 🧹 Clear screen |
| `quit`, `exit`, `bye` | 👋 Exit |

### Natural Language Examples

**Dashboard & Stats:**
- "show me the dashboard"
- "what's the status?"
- "give me an overview"
- "show stats"

**Buildings:**
- "list all buildings"
- "show buildings"
- "how is customer dashboard doing?"
- "what's the status of API integration?"

**Agents:**
- "what are the agents doing?"
- "show agent activity"
- "what is Alba working on?"
- "show me David"

**Other:**
- "help me"
- "what can you do?"
- "clear the screen"
- "quit"

### Features

#### 📊 Dashboard View
Access by saying: `"show dashboard"` or `"stats"`
- Total buildings count
- Active buildings
- Floor statistics (total/live)
- Agent count
- System status indicator

#### 🏢 Buildings List
Access by saying: `"list buildings"` or `"show buildings"`
- All your buildings
- Floor counts per building
- Quick overview

#### 🎯 Specific Building View
Access by saying: `"show [building name]"` or `"how is [building] doing?"`
- Real-time floor progress bars
- Color-coded floor status
- Detailed floor information
- Progress percentages

#### 🤖 Agent Activity Feed
Access by saying: `"what are agents doing?"` or `"show agents"`
- Recent agent actions
- Color-coded by agent
- Floor indicators
- Building context

#### 🤖 Specific Agent View
Access by saying: `"show [agent name]"` or `"what is [agent] doing?"`
- Agent-specific activity
- Current floor and building
- Actions in progress

### Auto-Updates

The dashboard automatically updates every **5 seconds** with fresh data. You'll see new agent activity and building progress without needing to refresh.

## 🎨 Visual Enhancements

### Brand Colors

The CLI uses AskElira's brand palette:

- **Primary** (Teal): `#2dd4bf` - Main actions, titles
- **Secondary** (Purple): `#a78bfa` - Progress bars, floors
- **Success** (Green): `#4ade80` - Completions, Alba
- **Warning** (Yellow): `#facc15` - Building status, Steven
- **Error** (Red): `#f87171` - Errors, Vex
- **Info** (Blue): `#60a5fa` - Information, tips

### Agent Colors

Each agent has a distinct color:
- 🟢 **Alba**: Green (`#4ade80`)
- 🔵 **David**: Cyan (`#2dd4bf`)
- 🔴 **Vex**: Red (`#f87171`)
- 🟣 **Elira**: Purple (`#a78bfa`)
- 🟡 **Steven**: Yellow (`#facc15`)

### Progress Indicators

**Progress Bars:**
```
Floor 1 |████████████████████| 100% | live ✓
Floor 2 |███████████░░░░░░░░░|  65% | building...
Floor 3 |░░░░░░░░░░░░░░░░░░░░|   0% | pending
```

**Spinners:**
```
⠋ Initializing workspace...
⠙ Building floor 3...
✓ Complete!
```

**Status Symbols:**
- `●` Live/Active
- `◐` Researching
- `◓` Building
- `◑` Auditing
- `○` Pending
- `✗` Broken
- `■` Blocked

## 📦 Message Boxes

### Success Box
```
╭───────── ✓ Success ─────────╮
│                              │
│  Workspace created!          │
│  Ready to build!             │
│                              │
╰──────────────────────────────╯
```

### Info Box
```
╭────────── ⓘ Info ───────────╮
│                              │
│  Starting server...          │
│  URL: http://localhost:3000  │
│                              │
╰──────────────────────────────╯
```

### Warning Box
```
╭───────── ⚠ Warning ──────────╮
│                              │
│  This action requires        │
│  additional permissions      │
│                              │
╰──────────────────────────────╯
```

### Error Box
```
╭────────── ✗ Error ───────────╮
│                              │
│  Connection failed           │
│  Please try again            │
│                              │
╰──────────────────────────────╯
```

## 🔧 Advanced Usage

### Disable Banner

If you want to skip the ASCII banner:

```bash
export ASKELIRA_NO_BANNER=1
ask status
```

### Custom Port for Web UI

```bash
ask web --port 4000
```

### Simulate Different Floor Counts

```bash
ask build --floors 10
```

## 🎯 Use Cases

### 1. Quick Status Check
```bash
ask status
```
Perfect for checking your buildings at a glance.

### 2. Conversational Monitoring
```bash
askelira-tui
# Then talk to it:
askelira> show customer dashboard
askelira> what are agents doing?
askelira> show alba
```
Ask questions naturally for real-time information.

### 3. Visual Progress Tracking
```bash
ask build --floors 5
```
Great for demos or understanding the building process.

### 4. Agent Activity Monitoring
```bash
ask agents
```
See what your agents are working on.

## 🏗️ Architecture

### Enhanced CLI Stack
```
commander.js     → Command parsing
chalk            → Text coloring
figlet           → ASCII art
boxen            → Styled boxes
gradient-string  → Gradient text
ora              → Spinners
cli-progress     → Progress bars
```

### TUI Stack
```
readline         → Built-in Node.js input handling
chalk            → Text coloring
Natural Language → Regex pattern matching
Real-time Updates → setInterval auto-refresh
```

## 📊 Comparison

| Feature | Original CLI | Enhanced CLI | Conversational TUI |
|---------|--------------|--------------|-------------------|
| Colors | ❌ | ✅ | ✅ |
| ASCII Art | ❌ | ✅ | ✅ |
| Progress Bars | ❌ | ✅ | ✅ |
| Spinners | ❌ | ✅ | ✅ |
| Boxes | ❌ | ✅ | ✅ |
| Interactive | ❌ | ❌ | ✅ |
| Real-time Updates | ❌ | Limited | ✅ (every 5s) |
| Natural Language | ❌ | ❌ | ✅ 💬 |
| Conversational | ❌ | ❌ | ✅ 💬 |

## 🐛 Troubleshooting

### ASCII Art Not Displaying

Some terminals don't support all characters. Try a modern terminal:
- macOS: iTerm2, Hyper
- Linux: GNOME Terminal, Terminator
- Windows: Windows Terminal, Cmder

### Colors Not Showing

Enable true color support:
```bash
export COLORTERM=truecolor
```

### TUI Crashes on Start

Make sure all dependencies are installed:
```bash
npm install --legacy-peer-deps
```

### Progress Bars Glitching

This can happen in tmux/screen. Try running outside these multiplexers or configure them for better Unicode support.

## 🚀 Future Enhancements

Planned features:
- [ ] Socket.io integration for real live updates
- [ ] Historical data charts in TUI
- [ ] Agent logs viewer
- [ ] Building editor (create/modify buildings in TUI)
- [ ] Settings panel (API keys, preferences)
- [ ] Export reports (PDF/HTML)
- [ ] Multi-building comparison view
- [ ] Notification system
- [ ] Custom themes
- [ ] Plugin system

## 📚 Examples

### Example 1: First-Time Setup
```bash
ask init
ask web
```

### Example 2: Monitor Building Conversationally
```bash
askelira-tui

# Talk to your dashboard:
askelira> show dashboard
# See overview stats

askelira> how is customer dashboard doing?
# View detailed building progress

askelira> what are agents doing?
# See agent activity

askelira> show alba
# Check specific agent

askelira> help
# See all commands

askelira> quit
# Exit when done
```

### Example 3: Quick Status
```bash
ask status
```

### Example 4: Demo Mode
```bash
ask build --floors 8
# Watch animated building process
```

## 💡 Tips

1. **Use `ask` for quick commands** - Faster than `askelira`
2. **Use `askelira-tui` for conversational monitoring** - Talk to your dashboard naturally!
3. **Don't worry about exact commands** - The TUI understands variations like "show dashboard", "stats", "status", etc.
4. **Ask for help anytime** - Type `help` in the TUI to see all commands
5. **Auto-updates every 5 seconds** - Watch live changes without refreshing
6. **Create aliases** - Add to `.bashrc` or `.zshrc`:
   ```bash
   alias tui='askelira-tui'
   alias build='ask build'
   alias status='ask status'
   ```

## 🎓 Learning Resources

### CLI Enhancement
- [Chalk Documentation](https://www.npmjs.com/package/chalk)
- [Ora Spinners](https://www.npmjs.com/package/ora)
- [Boxen Styling](https://www.npmjs.com/package/boxen)

### TUI Development
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Building Terminal Interfaces with Node.js](https://blog.openreplay.com/building-terminal-interfaces-nodejs/)
- [Ink Tutorial](https://vadimdemedes.com/posts/ink-3)

## 🤝 Contributing

Want to improve the CLI/TUI? Here's how:

1. Add new commands in `bin/cli-enhanced.js`
2. Add new views in `bin/tui-dashboard.js`
3. Update this guide
4. Test in multiple terminals
5. Submit PR

## Sources

- [Building Terminal Interfaces with Node.js](https://blog.openreplay.com/building-terminal-interfaces-nodejs/)
- [Blessed vs Ink Comparison](https://npm-compare.com/blessed,ink)
- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [CLI Visual Enhancement Tools](https://www.squash.io/how-to-create-npm-terminal-text-effects/)
- [CLI Progress Bars](https://www.npmjs.com/package/cli-progress)
- [7 TUI Libraries](https://blog.logrocket.com/7-tui-libraries-interactive-terminal-apps/)

---

Made with ❤️ for AskElira
