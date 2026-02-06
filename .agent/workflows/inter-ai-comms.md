---
description: how to consult PM or Optimizer via inter-AI relay
---

# Inter-AI Communication Workflow

Use this workflow to consult ChatGPT (PM) or Gemini (Optimizer).

## Consult PM (ChatGPT)

// turbo

1. Run the consult_cabinet script to send a message to PM:

```bash
cd /Users/josephlf/.gemini/antigravity/scratch/scout-production && node scripts/consult_cabinet.js pm "YOUR_MESSAGE_HERE"
```

## Consult Optimizer (Gemini)

// turbo
2. Run the consult_cabinet script to send a message to Optimizer:

```bash
cd /Users/josephlf/.gemini/antigravity/scratch/scout-production && node scripts/consult_cabinet.js gemini "YOUR_MESSAGE_HERE"
```

## Notes

- Both APIs receive the canonical briefing (project state + persona) automatically
- Responses will include any questions for Joseph or other AIs
- AG relays questions verbatim
