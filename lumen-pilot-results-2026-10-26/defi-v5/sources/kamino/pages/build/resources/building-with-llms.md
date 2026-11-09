> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Building with LLMs

> Leverage Kamino documentation with AI agents and language models for faster development

> [!NOTE]
>
> Kamino documentation is optimized for AI-powered development. Our machine-readable resources enable LLMs and AI agents to understand our APIs and build transactions on Solana.

## Kamino AI Resources

> **[skill.md](https://kamino.com/docs/skill.md)**
>
> Structured capability reference with API endpoints, SDK methods, and integration workflows. Start here for agent tool use.

> **[llms.txt](https://kamino.com/docs/llms.txt)**
>
> Curated index of all documentation pages with one-line descriptions and direct URLs.

> **[llms-pages.json](https://kamino.com/docs/llms-pages.json)**
>
> Machine-readable JSON mapping of every page with title, section, URL, and keywords.

### skill.md

The skill.md file provides a comprehensive, machine-readable reference of Kamino's capabilities across all four products: Earn, Borrow, Multiply, and Liquidity.

| Includes | Description |
| - | - |
| API endpoints | Complete REST endpoint reference for all products |
| SDK methods | TypeScript method signatures with real code examples |
| Workflows | Step-by-step operations: deposit, borrow, withdraw, repay, stake, harvest |
| Integration patterns | Earn vaults, Borrow markets, Liquidity strategies, and Farms |
| Use cases | Agent transaction building, API integration, automated DeFi strategies |

### llms.txt

A structured navigation map of Kamino's entire documentation, enabling LLMs to discover relevant pages and resources efficiently.

| Includes | Description |
| - | - |
| Page directory | All documentation pages with direct URLs |
| Tutorials | Organized by category: Earn, Borrow, Liquidity, Rewards, Oracle |
| API reference | Endpoint navigation and documentation links |
| Recipes | Code example locations and implementation guides |

### llms-pages.json

A JSON file mapping every page path to its metadata: title, URL, section, description, and keywords. Useful for programmatic discovery and filtering.

```json theme={null}
{
  "/products/lending-vaults": {
    "title": "Lending Vaults",
    "url": "https://kamino.com/docs/products/lending-vaults",
    "section": "Docs",
    "description": "Single-token managed yield aggregation across Kamino's lending markets",
    "keywords": ["kamino", "lending vaults", "yield", "vault shares", "auto-compounding"]
  }
}
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.