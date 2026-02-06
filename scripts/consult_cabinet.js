#!/usr/bin/env node
/**
 * Scout Canonical Briefing System
 * 
 * AG is the LIBRARIAN, not the AUTHOR.
 * This script reads canonical files and passes them verbatim to APIs.
 * 
 * Files read (controlled by Joseph):
 *   context/SCOUT_PROJECT_STATE.md - Single source of truth
 *   prompts/pm_persona.md - PM constitution
 *   prompts/gemini_persona.md - Optimizer constitution
 * 
 * Usage:
 *   node scripts/consult_cabinet.js pm "Your question"
 *   node scripts/consult_cabinet.js gemini "Your question"
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Verbatim file reader - no interpretation
function readCanonical(filepath) {
    const fullPath = path.join(process.cwd(), filepath);
    try {
        return fs.readFileSync(fullPath, 'utf8');
    } catch (err) {
        throw new Error(`FATAL: Cannot read canonical file ${filepath}`);
    }
}

// Assemble briefing for PM (ChatGPT)
function assemblePMBriefing() {
    const state = readCanonical('context/SCOUT_PROJECT_STATE.md');
    const persona = readCanonical('prompts/pm_persona.md');

    return `--- CONSTITUTION ---
${persona}

--- PROJECT REALITY ---
${state}`;
}

// Assemble briefing for Optimizer (Gemini)
function assembleOptimizerBriefing() {
    const state = readCanonical('context/SCOUT_PROJECT_STATE.md');
    const persona = readCanonical('prompts/gemini_persona.md');

    return `--- CONSTITUTION ---
${persona}

--- PROJECT REALITY ---
${state}`;
}

// Audit log - preserves all API transactions
function logTransaction(target, systemInstruction, userInput, response) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        target,
        systemInstruction_chars: systemInstruction.length,
        userInput: userInput.slice(0, 200),
        response: response.slice(0, 500)
    };
    const logPath = path.join(process.cwd(), 'logs', 'cabinet_audit.jsonl');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
}

async function consultPM(taskInput) {
    const systemInstruction = assemblePMBriefing();
    console.log(`📋 Constitution + State: ${systemInstruction.length} chars (read-only)\n`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: `[From AG/Claude - Lead Developer]\n\n${taskInput}` }
            ],
            max_tokens: 2000
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(`OpenAI error: ${data.error.message}`);

    const result = data.choices[0].message.content;
    logTransaction('pm', systemInstruction, taskInput, result);
    return result;
}

async function consultOptimizer(taskInput) {
    const systemInstruction = assembleOptimizerBriefing();
    console.log(`📋 Constitution + State: ${systemInstruction.length} chars (read-only)\n`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: `[From AG/Claude - Lead Developer]\n\n${taskInput}` }] }]
        })
    });
    const data = await response.json();
    if (data.error) throw new Error(`Gemini error: ${data.error.message}`);

    const result = data.candidates[0].content.parts[0].text;
    logTransaction('optimizer', systemInstruction, taskInput, result);
    return result;
}

// CLI
const [, , target, ...messageParts] = process.argv;
const message = messageParts.join(' ');

(async () => {
    try {
        let response;
        switch (target) {
            case 'pm':
            case 'chatgpt':
                console.log('📤 Consulting PM (canonical briefing)...\n');
                response = await consultPM(message);
                console.log('📥 PM Response:\n');
                console.log(response);
                break;
            case 'gemini':
            case 'optimizer':
            case 'opt':
                console.log('📤 Consulting Optimizer (canonical briefing)...\n');
                response = await consultOptimizer(message);
                console.log('📥 Optimizer Response:\n');
                console.log(response);
                break;
            default:
                console.log('Scout Canonical Briefing System');
                console.log('AG is the LIBRARIAN, not the AUTHOR.\n');
                console.log('Usage:');
                console.log('  node scripts/consult_cabinet.js pm "question"');
                console.log('  node scripts/consult_cabinet.js gemini "question"');
                console.log('\nCanonical files (Joseph-controlled):');
                console.log('  context/SCOUT_PROJECT_STATE.md');
                console.log('  prompts/pm_persona.md');
                console.log('  prompts/gemini_persona.md');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
