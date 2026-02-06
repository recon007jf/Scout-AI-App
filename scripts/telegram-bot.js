#!/usr/bin/env node
/**
 * Scout AG Telegram Bot (Two-Way)
 * 
 * Long-running service that:
 * 1. Listens for incoming Telegram messages from Joseph
 * 2. Routes them to Claude (via Anthropic API) or ChatGPT
 * 3. Sends responses back to Telegram
 * 
 * Usage:
 *   node scripts/telegram-bot.js
 * 
 * Commands:
 *   /pm <message>    - Route to ChatGPT (PM)
 *   /opt <message>   - Route to Gemini (Optimizer)
 *   <any message>    - Route to Claude (AG)
 */

require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// System prompts
const AG_SYSTEM = `You are AG (Claude), the Lead Developer for Scout, an AI-powered sales intelligence platform.
Your role: Implementation, execution, diagnostics, solution proposals.
You work with:
- Joseph (Final Authority) - who is messaging you via Telegram
- ChatGPT (PM/Red Team)
- Gemini (Specialist Optimizer)
Respond concisely. You can use /pm or /opt commands to relay to other AIs.
Per operating model: You do not make architecture decisions independently or approve your own work.`;

const PM_SYSTEM = `You are the Project Manager and Red Team for Scout, an AI-powered sales intelligence platform.
Your role: Adversarial review, risk detection, code review approval, consensus synthesis.
You work with:
- Joseph (Final Authority)
- AG/Claude (Lead Developer)
- Gemini (Specialist Optimizer)
Respond concisely. If you need more context, ask for it.`;

const OPTIMIZER_SYSTEM = `You are the Specialist Optimizer for Scout, an AI-powered sales intelligence platform.
Your role: Second-pass analysis, optimization suggestions, alternative perspectives.
You work with:
- Joseph (Final Authority)
- ChatGPT (PM/Red Team)
- AG/Claude (Lead Developer)
Respond concisely. Focus on optimization and alternative approaches.`;

let lastUpdateId = 0;

async function sendTelegram(text) {
    // Split long messages (Telegram limit is 4096 chars)
    const chunks = text.match(/[\s\S]{1,4000}/g) || [text];
    for (const chunk of chunks) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: chunk,
                parse_mode: 'Markdown'
            })
        });
    }
}

async function sendToClaude(message) {
    if (!ANTHROPIC_API_KEY) {
        return "❌ ANTHROPIC_API_KEY not configured. Cannot route to Claude.";
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: AG_SYSTEM,
            messages: [{ role: 'user', content: message }]
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(`Claude error: ${data.error.message}`);
    return data.content[0].text;
}

async function sendToChatGPT(message) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: PM_SYSTEM },
                { role: 'user', content: message }
            ],
            max_tokens: 2000
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(`OpenAI error: ${data.error.message}`);
    return data.choices[0].message.content;
}

async function sendToGemini(message) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: OPTIMIZER_SYSTEM }] },
            contents: [{ parts: [{ text: message }] }]
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(`Gemini error: ${data.error.message}`);
    return data.candidates[0].content.parts[0].text;
}

async function handleMessage(text) {
    // Route based on command prefix
    if (text.startsWith('/pm ')) {
        const msg = text.slice(4);
        console.log(`📤 Routing to PM: ${msg.slice(0, 50)}...`);
        return `📥 *PM Response:*\n\n${await sendToChatGPT(msg)}`;
    } else if (text.startsWith('/opt ')) {
        const msg = text.slice(5);
        console.log(`📤 Routing to Optimizer: ${msg.slice(0, 50)}...`);
        return `📥 *Optimizer Response:*\n\n${await sendToGemini(msg)}`;
    } else if (text.startsWith('/help')) {
        return `🤖 *Scout AG Bot Commands:*

/pm <message> - Talk to ChatGPT (PM)
/opt <message> - Talk to Gemini (Optimizer)
Any other message - Talk to Claude (AG)

Example: /pm Should we proceed with the auth refactor?`;
    } else {
        // Default: route to Claude
        console.log(`📤 Routing to Claude: ${text.slice(0, 50)}...`);
        return `📥 *AG Response:*\n\n${await sendToClaude(text)}`;
    }
}

async function pollForMessages() {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API error:', data);
            return;
        }

        for (const update of data.result) {
            lastUpdateId = update.update_id;

            // Only process messages from Joseph
            if (update.message?.chat?.id?.toString() === TELEGRAM_CHAT_ID) {
                const text = update.message.text;
                if (text) {
                    console.log(`\n📨 Received: ${text.slice(0, 100)}...`);
                    try {
                        const response = await handleMessage(text);
                        await sendTelegram(response);
                    } catch (err) {
                        console.error('Error handling message:', err);
                        await sendTelegram(`❌ Error: ${err.message}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Poll error:', err.message);
    }
}

async function main() {
    console.log('🤖 Scout AG Telegram Bot starting...');
    console.log(`📱 Listening for messages from chat ID: ${TELEGRAM_CHAT_ID}`);
    console.log('Commands: /pm, /opt, /help, or plain text for Claude\n');

    // Initial greeting
    await sendTelegram('🤖 Scout AG Bot online. Send /help for commands.');

    // Poll loop
    while (true) {
        await pollForMessages();
    }
}

main().catch(console.error);
