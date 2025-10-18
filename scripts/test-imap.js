#!/usr/bin/env node
/**
 * Simple IMAP connectivity tester using imapflow.
 * Usage: node scripts/test-imap.js
 * It reads EMAIL1_* and EMAIL2_* from your .env (load with dotenv).
 */
const { ImapFlow } = require('imapflow');
require('dotenv').config();

const accounts = [
  {
    id: 'account1',
    host: process.env.EMAIL1_HOST,
    port: Number(process.env.EMAIL1_PORT || 993),
    secure: (process.env.EMAIL1_SECURE || 'true') === 'true',
    user: process.env.EMAIL1_USER,
    pass: process.env.EMAIL1_PASSWORD
  },
  {
    id: 'account2',
    host: process.env.EMAIL2_HOST,
    port: Number(process.env.EMAIL2_PORT || 993),
    secure: (process.env.EMAIL2_SECURE || 'true') === 'true',
    user: process.env.EMAIL2_USER,
    pass: process.env.EMAIL2_PASSWORD
  }
].filter(a => a.user && a.pass && a.host);

async function testAccount(acc) {
  console.log(`\nTesting ${acc.id} (${acc.user}@${acc.host}:${acc.port})`);
  const client = new ImapFlow({
    host: acc.host,
    port: acc.port,
    secure: acc.secure,
    auth: { user: acc.user, pass: acc.pass },
    logger: false
  });

  try {
    await client.connect();
    console.log(`✅ Successfully connected to ${acc.id}`);
    const mailbox = await client.mailboxOpen('INBOX');
    console.log(`Mailbox INBOX opened, exists=${mailbox.exists}`);
    await client.logout();
  } catch (err) {
    console.error(`❌ Failed to connect to ${acc.id}:`, err && err.message ? err.message : err);
  }
}

async function main() {
  if (accounts.length === 0) {
    console.log('No accounts configured in .env (provide EMAIL1_USER and EMAIL1_PASSWORD etc.)');
    process.exit(1);
  }

  for (const acc of accounts) {
    // eslint-disable-next-line no-await-in-loop
    await testAccount(acc);
  }
}

main();
