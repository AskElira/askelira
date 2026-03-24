# AskElira Templates

Templates let you quickly scaffold an AskElira project for common use cases.

## Available Templates

### trading
**Trading Strategy Evaluator**
Evaluate a trading strategy with swarm intelligence. Asks agents to debate whether a given strategy should be deployed.

```bash
askelira create trading
```

Fields:
- **Strategy name** — Name of the strategy being evaluated
- **Market** — Target market (stocks, crypto, futures, etc.)
- **Agent count** — Number of agents for the swarm debate

### hiring
**Hiring Decision Helper**
Evaluate hiring decisions with swarm debate. Useful for getting a diverse perspective on candidate fit.

```bash
askelira create hiring
```

Fields:
- **Role title** — The position being filled
- **Team name** — Which team the hire would join
- **Agent count** — Number of agents for the swarm debate

### product
**Product Launch Evaluator**
Should you launch this product? Swarm debate decides. Good for go/no-go decisions on new features or products.

```bash
askelira create product
```

Fields:
- **Product name** — Name of the product or feature
- **Target market** — The intended audience (B2B SaaS, consumer, enterprise, etc.)
- **Agent count** — Number of agents for the swarm debate

## Usage

```bash
# Interactive — prompts for each field
askelira create trading

# Specify output directory
askelira create hiring --dir ./my-hiring-eval

# List available templates
askelira create --list
```

## What Gets Generated

Each template creates a project directory with:

```
my-project/
  askelira.config.json   # Template configuration
  run.js                 # Ready-to-run swarm script
  README.md              # Project-specific readme
```

## Customization

After scaffolding, edit `run.js` to:
- Change the question being debated
- Adjust agent count
- Add custom post-processing logic
- Integrate with your own tools

Edit `askelira.config.json` to update project metadata.

## Creating Custom Templates

Place a directory in `templates/` with files that use `{{key}}` placeholders. These are replaced with user-provided values during scaffolding. For example, a file containing `{{strategy}}` will have that token replaced with whatever the user enters for the "Strategy name" prompt.
