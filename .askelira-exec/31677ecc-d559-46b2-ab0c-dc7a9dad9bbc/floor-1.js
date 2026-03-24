// index.js
console.log('Hello World');

// package.json
{
  "name": "hello-world-script",
  "version": "1.0.0",
  "description": "A basic Node.js Hello World script",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node index.js"
  },
  "keywords": ["hello-world", "nodejs"],
  "author": "AskElira Build System",
  "license": "MIT",
  "engines": {
    "node": ">=14.0.0"
  }
}

// README.md
# Hello World Script

A minimal Node.js script that outputs 'Hello World' to the console.

## Prerequisites
- Node.js v14.0.0 or higher
- npm (comes with Node.js)

## Installation
No dependencies to install for this basic script.

## Usage
Run the script using either method:

```bash
node index.js
```

or

```bash
npm start
```

## Expected Output
```
Hello World
```

## Project Structure
```
.
├── index.js       # Main script file
├── package.json   # Project configuration
└── README.md      # This file
```