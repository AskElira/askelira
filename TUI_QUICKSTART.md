# 💬 Conversational TUI Quick Start

## ✨ NEW: Talk to Your Dashboard!

The TUI is now **conversational** - just type what you want to see in natural language!

## ✅ Working Command (Use This!)

```bash
cd /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm
node bin/tui-dashboard.js
```

That's it! The conversational TUI will launch immediately.

## 💬 How to Use

Once running, you'll see a prompt: `askelira>`

Just type what you want to see in natural language:

```
askelira> show me the dashboard
askelira> what are the agents doing?
askelira> how is customer dashboard doing?
askelira> list all buildings
askelira> show alba
askelira> help
askelira> quit
```

## 🗣️ Conversational Commands

| What You Say | What You Get |
|--------------|--------------|
| `show dashboard`, `stats`, `status` | Dashboard overview |
| `list buildings`, `show buildings` | All buildings |
| `show [building name]` | Specific building details |
| `what are agents doing?`, `show agents` | Agent activity |
| `show [agent]`, `what is [agent] doing?` | Specific agent info |
| `help` | See all commands |
| `clear` | Clear screen |
| `quit`, `exit`, `bye` | Exit TUI |

## 🎨 What You'll See

```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║         🏢 AskElira - Conversational Dashboard        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝

  💬 Talk to me! Ask me anything about your buildings.

  Examples:
    • "show me the dashboard"
    • "what are the agents doing?"
    • "how is customer dashboard doing?"
    • "show building status"
    • "list all buildings"
    • "quit" or "exit" to leave

askelira>
```

Just type naturally and the dashboard will respond!

## 🔧 Make It Easier

Add this alias to your `~/.zshrc` or `~/.bashrc`:

```bash
alias tui='cd /Users/openclawd/Desktop/AskElira-Projects/2.1-Production/askelira-bundled-npm && node bin/tui-dashboard.js'
```

Then just run:
```bash
tui
```

## 📊 Features

- **💬 Conversational interface** - Talk naturally, no memorizing commands!
- **🤖 Natural language understanding** - Understands variations and synonyms
- **⏱️ Real-time updates** every 5 seconds
- **🎨 Color-coded agents** (Alba=green, David=cyan, Vex=red, Elira=purple, Steven=yellow)
- **📊 Progress bars** for each floor
- **🔍 Smart search** - Finds buildings and agents by name
- **💡 Helpful responses** - Suggests commands when it doesn't understand

## 🐛 Troubleshooting

**If nothing shows:**
```bash
# Check if chalk is installed
npm list chalk

# Reinstall if needed
npm install chalk
```

**If colors don't work:**
```bash
export FORCE_COLOR=1
node bin/tui-dashboard.js
```

**If the prompt doesn't appear:**
- Make sure you're using Node.js v18 or higher
- Try pressing Enter to see the prompt

## 💡 Pro Tips

1. **Don't worry about exact wording** - "show dashboard", "display stats", "what's the status" all work!
2. **Use autocomplete** - Type part of a command and press Tab (if your terminal supports it)
3. **Type "help" anytime** - See all available commands
4. **Auto-updates work in background** - Data refreshes every 5 seconds automatically
5. **Make an alias** - Add to `~/.zshrc` or `~/.bashrc`:
   ```bash
   alias tui='cd /path/to/askelira && node bin/tui-dashboard.js'
   ```

Enjoy talking to your dashboard! 💬✨
