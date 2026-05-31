const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 8002;
let qrCodeData = null;
let connectionStatus = 'disconnected';

// Auto-install dependencies if missing
function ensureDependencies() {
  const pkgs = ['@whiskeysockets/baileys', 'qrcode', 'pino'];
  let missing = false;
  for (const pkg of pkgs) {
    try {
      require.resolve(pkg);
    } catch (e) {
      missing = true;
      break;
    }
  }
  if (missing) {
    console.log('[WhatsApp] Installing required dependencies (@whiskeysockets/baileys, qrcode, pino)...');
    try {
      execSync('npm install @whiskeysockets/baileys qrcode pino --no-save --no-audit --no-fund', { stdio: 'inherit' });
      console.log('[WhatsApp] Dependencies installed successfully. Restarting WhatsApp service to load new modules...');
      const { spawn } = require('child_process');
      const child = spawn(process.argv[0], process.argv.slice(1), {
        detached: true,
        stdio: 'inherit'
      });
      child.unref();
      process.exit(0);
    } catch (err) {
      console.error('[WhatsApp] Dependency installation failed:', err);
    }
  }
}

ensureDependencies();

// Start Baileys connection
let makeWASocket, useMultiFileAuthState, DisconnectReason;
try {
  const baileys = require('@whiskeysockets/baileys');
  makeWASocket = baileys.default;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
} catch (e) {
  console.error('[WhatsApp] Could not load @whiskeysockets/baileys:', e.message);
  process.exit(1);
}

const qrcodeLib = require('qrcode');
const pino = require('pino');

let sock = null;
let knownChats = { groups: [], privates: [] };

async function updateChatsList() {
  if (!sock) return;
  try {
    console.log('[WhatsApp] Fetching participating groups...');
    const groups = await sock.groupFetchAllParticipating();
    const groupList = Object.values(groups).map(g => ({
      jid: g.id,
      name: g.subject
    }));
    knownChats.groups = groupList;
    console.log(`[WhatsApp] Loaded ${groupList.length} groups.`);
  } catch (err) {
    console.error('[WhatsApp] Failed to fetch participating groups:', err.message);
  }
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
  
  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrcodeLib.toDataURL(qr, (err, url) => {
        if (!err) {
          qrCodeData = url;
          connectionStatus = 'qr';
        }
      });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('[WhatsApp] Connection closed, reconnecting: ', shouldReconnect);
      qrCodeData = null;
      connectionStatus = 'disconnected';
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 3000);
      }
    } else if (connection === 'open') {
      console.log('[WhatsApp] Connection opened successfully!');
      qrCodeData = null;
      connectionStatus = 'connected';
      setTimeout(updateChatsList, 3000);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Sync contacts from WhatsApp connection
  sock.ev.on('contacts.upsert', (contacts) => {
    if (contacts && Array.isArray(contacts)) {
      for (const contact of contacts) {
        if (contact.id && contact.id.endsWith('@s.whatsapp.net')) {
          const jid = contact.id;
          const name = contact.name || contact.verifiedName || contact.notify || jid.split('@')[0];
          const phone = jid.split('@')[0];
          if (!knownChats.privates.some(c => c.jid === jid)) {
            knownChats.privates.push({ jid, name, phone });
          }
        }
      }
    }
  });

  sock.ev.on('contacts.set', ({ contacts }) => {
    if (contacts && Array.isArray(contacts)) {
      for (const contact of contacts) {
        if (contact.id && contact.id.endsWith('@s.whatsapp.net')) {
          const jid = contact.id;
          const name = contact.name || contact.verifiedName || contact.notify || jid.split('@')[0];
          const phone = jid.split('@')[0];
          if (!knownChats.privates.some(c => c.jid === jid)) {
            knownChats.privates.push({ jid, name, phone });
          }
        }
      }
    }
  });

  // Listen for incoming messages
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        if (msg.message) {
          const from = msg.key.remoteJid;
          const isPrivate = from.endsWith('@s.whatsapp.net');
          const isGroup = from.endsWith('@g.us');
          const text = msg.message.conversation || 
                       msg.message.extendedTextMessage?.text || 
                       msg.message.imageMessage?.caption || 
                       "";
          const senderName = msg.key.fromMe ? 'Me' : (msg.pushName || from.split('@')[0]);

          if (text.trim().length > 0) {
            console.log(`[WhatsApp] ${msg.key.fromMe ? 'Outgoing' : 'Incoming'} from ${senderName}: ${text}`);
            
            // 1. Index the message in context_server
            try {
              const res = await fetch('http://127.0.0.1:8001/memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `${senderName}: ${text}`,
                  source: 'whatsapp',
                  source_app: 'WhatsApp',
                  metadata: {
                    sender: senderName,
                    jid: from,
                    timestamp: new Date().toISOString(),
                    direction: msg.key.fromMe ? 'outgoing' : 'incoming'
                  }
                })
              });
              if (res.ok) {
                console.log('[WhatsApp] Message indexed in database.');
              }
            } catch (err) {
              console.error('[WhatsApp] Failed to send message to context server:', err.message);
            }

            // Update knownChats mapping dynamically based on incoming traffic
            if (!msg.key.fromMe) {
              if (isPrivate) {
                const phoneNumber = from.split('@')[0];
                if (!knownChats.privates.some(c => c.jid === from)) {
                  knownChats.privates.push({
                    jid: from,
                    name: senderName,
                    phone: phoneNumber
                  });
                }
              } else if (isGroup) {
                if (!knownChats.groups.some(g => g.jid === from)) {
                  updateChatsList().catch(() => {});
                }
              }
            }

            // 2. Auto-reply contextually (for private incoming messages or group messages if configured)
            if (!msg.key.fromMe && (isPrivate || isGroup) && text.trim().length > 1) {
              try {
                // Read configuration dynamically to avoid restarting service on settings update
                let config = { autoReplyUnknown: true, autoReplyGroups: false, selectedContacts: [], knownContacts: [] };
                try {
                  const configPath = path.join(__dirname, 'whatsapp-config.json');
                  if (fs.existsSync(configPath)) {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                  }
                } catch (configErr) {
                  console.error('[WhatsApp] Failed to read auto-reply config:', configErr.message);
                }

                // If it is a group message, but auto-reply for groups is disabled, skip it
                if (isGroup && !config.autoReplyGroups) {
                  continue;
                }

                // Resolve group name if in a group chat
                let groupName = '';
                if (isGroup) {
                  const cachedGroup = knownChats.groups.find(g => g.jid === from);
                  if (cachedGroup) {
                    groupName = cachedGroup.name;
                  } else {
                    try {
                      const groupMeta = await sock.groupMetadata(from);
                      groupName = groupMeta?.subject || '';
                      knownChats.groups.push({ jid: from, name: groupName });
                    } catch (metaErr) {
                      console.warn('[WhatsApp] Failed to fetch group metadata:', metaErr.message);
                    }
                  }
                }

                const phoneNumber = from.split('@')[0];
                
                // Resolve private contact name if in a private chat
                let cachedContactName = '';
                if (isPrivate) {
                  const cachedContact = knownChats.privates.find(c => c.jid === from);
                  if (cachedContact) {
                    cachedContactName = cachedContact.name;
                  }
                }

                const isSelected = config.selectedContacts.includes(phoneNumber) || 
                                   config.selectedContacts.includes(senderName) || 
                                   config.selectedContacts.includes(from) ||
                                   (isPrivate && cachedContactName && config.selectedContacts.includes(cachedContactName)) ||
                                   (isGroup && groupName && config.selectedContacts.includes(groupName));
                const isKnown = config.knownContacts.includes(phoneNumber) || 
                                config.knownContacts.includes(senderName) || 
                                config.knownContacts.includes(from) ||
                                (isPrivate && cachedContactName && config.knownContacts.includes(cachedContactName)) ||
                                (isGroup && groupName && config.knownContacts.includes(groupName));

                // Detect if the bot is mentioned in the group message
                let isBotMentioned = false;
                if (isGroup) {
                  const myJid = sock?.user?.id ? sock.user.id.split('@')[0].split(':')[0] : '';
                  const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                  const cleanMentions = mentions.map(m => m.split('@')[0]);
                  
                  const hasDirectMention = myJid && cleanMentions.some(m => m === myJid);
                  const hasNameMention = text.toLowerCase().includes('gemma') || 
                                         (sock?.user?.name && text.toLowerCase().includes(sock.user.name.toLowerCase()));
                  
                  isBotMentioned = hasDirectMention || hasNameMention;
                }

                // Auto-reply logic:
                // Private chat: reply if contact is selected OR (auto-reply to unknown is active and contact is not ignored)
                // Group chat: reply if group JID/name is selected OR (auto-reply in groups is active AND bot is mentioned AND group is not ignored)
                let shouldReply = false;
                if (isPrivate) {
                  shouldReply = isSelected || (config.autoReplyUnknown && !isKnown);
                } else if (isGroup) {
                  shouldReply = isSelected || (isBotMentioned && !isKnown);
                }

                if (!shouldReply) {
                  if (isGroup) {
                    console.log(`[WhatsApp] Skipping group auto-reply for JID ${from} (Bot mentioned: ${isBotMentioned}, isKnown/Ignored: ${isKnown}).`);
                  } else {
                    console.log(`[WhatsApp] Skipping auto-reply for ${senderName} (${phoneNumber}) per configuration.`);
                  }
                  continue;
                }

                console.log(`[WhatsApp] Generating contextual auto-reply for ${isGroup ? 'Group' : 'Contact'} ${senderName} (${phoneNumber})...`);
                
                // Fetch relevant context from context_server
                const searchRes = await fetch('http://127.0.0.1:8001/search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: text, top_k: 3 })
                });
                
                let contextText = '';
                if (searchRes.ok) {
                  const searchData = await searchRes.json();
                  const memories = searchData.results || [];
                  contextText = memories.map(m => `[From ${m.source_app}]: ${m.content}`).join('\n\n');
                }

                // Call Next.js Chat API to generate response
                const prompt = `You are a helpful personal assistant replying to a WhatsApp message in a ${isGroup ? 'group' : 'private'} chat. Use the provided context (which contains the user's past emails, notes, messages, and browser history) to reply accurately and contextually. Keep the reply concise (max 3 sentences), friendly, and natural. Do not mention that you are an AI or using search context unless asked.

Context:
${contextText || 'No context memories found.'}

Incoming Message from ${senderName}:
"${text}"

Write the response directly.`;

                const chatRes = await fetch('http://127.0.0.1:9002/api/context/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt })
                });

                if (chatRes.ok) {
                  const chatData = await chatRes.json();
                  const reply = chatData.reply;
                  if (reply && reply.trim()) {
                    console.log(`[WhatsApp] Auto-replying to ${senderName} (${from}): ${reply}`);
                    await sock.sendMessage(from, { text: reply }, { quoted: msg });
                  }
                } else {
                  console.error('[WhatsApp] Chat API failed:', await chatRes.text());
                }
              } catch (replyErr) {
                console.error('[WhatsApp] Failed to send auto-reply:', replyErr.message);
              }
            }
          }
        }
      }
    }
  });
}

// Start WhatsApp link
connectToWhatsApp();

// HTTP server to expose status & QR code to Next.js
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: connectionStatus,
      qr: qrCodeData
    }));
  } else if (req.method === 'GET' && req.url === '/chats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(knownChats));
  } else if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { to, text } = payload;
        if (!to || !text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'to and text are required' }));
          return;
        }

        if (connectionStatus !== 'connected' || !sock) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'WhatsApp is not connected' }));
          return;
        }

        // Format to as JID if not already
        let jid = to;
        if (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@g.us')) {
          let cleanPhone = to.replace(/[^0-9]/g, '');
          // Auto-prepend country code if target is 10 digits and connected user JID is available
          if (cleanPhone.length === 10 && sock && sock.user && sock.user.id) {
            const myJid = sock.user.id.split('@')[0].split(':')[0];
            const myClean = myJid.replace(/[^0-9]/g, '');
            if (myClean.length > 10) {
              const countryCode = myClean.slice(0, myClean.length - 10);
              cleanPhone = countryCode + cleanPhone;
              console.log(`[WhatsApp] Auto-prepended country code ${countryCode} to 10-digit phone number: ${cleanPhone}`);
            }
          }
          
          // Check if cleanPhone matches the logged-in user's own number
          if (sock && sock.user && sock.user.id) {
            const myJidNumber = sock.user.id.split('@')[0].split(':')[0];
            if (cleanPhone === myJidNumber) {
              jid = sock.user.id;
              console.log(`[WhatsApp] Target number matches logged-in user. Using exact JID for self-chat: ${jid}`);
            } else {
              jid = `${cleanPhone}@s.whatsapp.net`;
            }
          } else {
            jid = `${cleanPhone}@s.whatsapp.net`;
          }
        }

        console.log(`[WhatsApp] Sending message via API to ${jid}: ${text}`);
        await sock.sendMessage(jid, { text });

        // Index the outgoing message in context_server as well
        try {
          await fetch('http://127.0.0.1:8001/memories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `Me: ${text}`,
              source: 'whatsapp',
              source_app: 'WhatsApp',
              metadata: {
                sender: 'Me',
                jid: jid,
                timestamp: new Date().toISOString(),
                direction: 'outgoing'
              }
            })
          });
        } catch (idxErr) {
          console.error('[WhatsApp] Failed to index outgoing API message:', idxErr.message);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error('[WhatsApp] Send API error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[WhatsApp Service] API listening on http://127.0.0.1:${PORT}`);
});
