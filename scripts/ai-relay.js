#!/usr/bin/env node
/**
 * Scout AG Inter-AI Relay (with Briefing Packet)
 * 
 * Per PM recommendation: Stateless calls with explicit context files.
 * Every request includes SCOUT_PROJECT_STATE.md + role-specific prompt.
 * 
 * Usage:
 *   node scripts/ai-relay.js pm "Your message here"
 *   node scripts/ai-relay.js gemini "Your message here"
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Load context files
function loadContextFile(filename) {
    try {
        return fs.readFileSync(path.join(process.cwd(), filename), 'utf8');
    } catch (err) {
        console.warn(`Warning: Could not load ${filename}`);
        return '';
    }
}

// Build briefing packet for PM
function buildPMContext() {
    const projectState = loadContextFile('SCOUT_PROJECT_STATE.md');
    const pmPrompt = loadContextFile('SCOUT_PM_PROMPT.md');
    const operatingModel = loadContextFile('scout_operating_model.md') || '';

    return `${pmPrompt}

---

# Current Project State
${projectState}

---

# Operating Model Reference
${operatingModel}`;
}

// Build briefing packet for Optimizer
function buildOptimizerContext() {
    const projectState = loadContextFile('SCOUT_PROJECT_STATE.md');
    const optPrompt = loadContextFile('SCOUT_OPTIMIZER_PROMPT.md');

    return `${optPrompt}

---

# Current Project State
${projectState}`;
}

async function sendToChatGPT(message) {
    const systemContext = buildPMContext();
    console.log(`📋 Briefing packet: ${systemContext.length} chars\n`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemContext },
                { role: 'user', content: `[From AG/Claude - Lead Developer]\n\n${message}` }
            ],
            max_tokens: 2000
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(`OpenAI error: ${data.error.message}`);
    return data.choices[0].message.content;
}

async function sendToGemini(message) {
    const systemContext = buildOptimizerContext();
    console.log(`📋 Briefing packet: ${systemContext.length} chars\n`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemContext }] },
            contents: [{ parts: [{ text: `[From AG/Claude - Lead Developer]\n\n${message}` }] }]
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
    return data.candidates[0].content.parts[0].text;
}

// CLI interface
const [, , target, ...messageParts] = process.argv;
const message = messageParts.join(' ');

(async () => {
    try {
        let response;
        switch (target) {
            case 'chatgpt':
            case 'pm':
                console.log('📤 Sending to ChatGPT (PM) with briefing packet...\n');
                response = await sendToChatGPT(message);
                console.log('📥 PM Response:\n');
                console.log(response);
                break;
            case 'gemini':
            case 'optimizer':
            case 'opt':
                console.log('📤 Sending to Gemini (Optimizer) with briefing packet...\n');
                response = await sendToGemini(message);
                console.log('📥 Optimizer Response:\n');
                console.log(response);
                break;
            default:
                console.log('Usage:');
                console.log('  node scripts/ai-relay.js pm "message"');
                console.log('  node scripts/ai-relay.js gemini "message"');
                console.log('\nContext files loaded on each request:');
                console.log('  - SCOUT_PROJECT_STATE.md');
                console.log('  - SCOUT_PM_PROMPT.md or SCOUT_OPTIMIZER_PROMPT.md');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
