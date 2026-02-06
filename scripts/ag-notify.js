#!/usr/bin/env node
/**
 * Scout AG Infrastructure - Notification & Logging Utilities
 * 
 * Usage:
 *   node scripts/ag-notify.js telegram "Your message here"
 *   node scripts/ag-notify.js notion-bug "Bug title" "Bug description"
 *   node scripts/ag-notify.js notion-feature "Feature title" "Feature description"
 */

require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const NOTION_API_TOKEN = process.env.NOTION_API_TOKEN;

// Scout project tracker database ID (discovered via API search)
const NOTION_DATABASE_ID = '5750b83c-c247-47a3-b701-26761d92a5a4';

async function sendTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(`Telegram error: ${data.description}`);
    console.log('✅ Telegram message sent');
    return data;
}

async function createNotionItem(title, description, type = 'Task') {
    const url = 'https://api.notion.com/v1/pages';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${NOTION_API_TOKEN}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
                'Item': {
                    title: [{ text: { content: title } }]
                },
                'Details': {
                    rich_text: [{ text: { content: description } }]
                },
                'Type': {
                    select: { name: type }
                },
                'Stage': {
                    status: { name: 'Backlog' }
                }
            }
        })
    });
    const data = await response.json();
    if (data.object === 'error') throw new Error(`Notion error: ${data.message}`);
    console.log(`✅ Notion ${type} created: ${data.url}`);
    return data;
}

// CLI interface
const [, , command, ...args] = process.argv;

(async () => {
    try {
        switch (command) {
            case 'telegram':
                await sendTelegram(args.join(' '));
                break;
            case 'notion-task':
                await createNotionItem(args[0], args.slice(1).join(' '), 'Task');
                break;
            case 'notion-phase':
                await createNotionItem(args[0], args.slice(1).join(' '), 'Phase');
                break;
            default:
                console.log('Usage:');
                console.log('  node scripts/ag-notify.js telegram "message"');
                console.log('  node scripts/ag-notify.js notion-task "title" "description"');
                console.log('  node scripts/ag-notify.js notion-phase "title" "description"');
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
