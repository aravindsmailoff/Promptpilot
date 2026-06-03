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
const lastSentReplies = new Set();

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
    console.log(`[WhatsApp DEBUG] messages.upsert event received, type: ${m?.type}, messages count: ${m?.messages?.length}`);
    if (m.type === 'notify') {
      for (const msg of m.messages) {
        console.log(`[WhatsApp DEBUG] Processing message key: ${JSON.stringify(msg.key)}, hasMessage: ${!!msg.message}`);
        if (msg.message) {
          const from = msg.key.remoteJidAlt || msg.key.remoteJid;
          const isPrivate = from.endsWith('@s.whatsapp.net') || from.endsWith('@lid');
          const isGroup = from.endsWith('@g.us');
          const text = msg.message.conversation || 
                       msg.message.extendedTextMessage?.text || 
                       msg.message.imageMessage?.caption || 
                       "";
          const senderName = msg.key.fromMe ? 'Me' : (msg.pushName || from.split('@')[0]);

          console.log(`[WhatsApp DEBUG] Resolved text: "${text}", fromMe: ${msg.key.fromMe}, isPrivate: ${isPrivate}, isGroup: ${isGroup}`);

          if (text.trim().length > 0) {
            console.log(`[WhatsApp] ${msg.key.fromMe ? 'Outgoing' : 'Incoming'} from ${senderName}: ${text}`);
            
            const myJid = sock?.user?.id ? sock.user.id.split('@')[0].split(':')[0] : '';
            const myJidFull = sock?.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : '';
            const isSelfChat = from.split('@')[0] === myJid || from === myJidFull;
            const isAllowedCommand = !msg.key.fromMe || isSelfChat;

            const cleanText = text.trim();

            // Check for Context Clearing Command from WhatsApp!
            const isClearCommand = (
              cleanText.startsWith('/') && (
                cleanText.toLowerCase().startsWith('/clearcontext') || 
                cleanText.toLowerCase().startsWith('/clear')
              )
            ) || (
              cleanText.toLowerCase() === 'clear memories' ||
              cleanText.toLowerCase() === 'clear context'
            );

            if (isClearCommand && isAllowedCommand) {
              try {
                console.log('[WhatsApp] Clear memories command triggered.');
                const clearRes = await fetch('http://127.0.0.1:8001/memories', {
                  method: 'DELETE'
                });
                if (clearRes.ok) {
                  await sock.sendMessage(from, { text: "🧹 Context memories database has been cleared successfully!" }, { quoted: msg });
                } else {
                  await sock.sendMessage(from, { text: "⚠️ Failed to clear context memories." }, { quoted: msg });
                }
                continue;
              } catch (clearErr) {
                console.error('[WhatsApp] Failed to clear memories:', clearErr.message);
                await sock.sendMessage(from, { text: `❌ Error clearing memories: ${clearErr.message}` }, { quoted: msg });
                continue;
              }
            }

            // Check for Chatbot Creation Command from WhatsApp!
            const isCreationCommand = (
              cleanText.startsWith('/') && (
                cleanText.toLowerCase().startsWith('/createbot') || 
                cleanText.toLowerCase().startsWith('/newbot')
              )
            ) || (
              cleanText.toLowerCase().startsWith('create bot') || 
              cleanText.toLowerCase().startsWith('create chatbot')
            );

            if (isCreationCommand && isAllowedCommand) {
              try {
                let botName = "";
                let botRole = "";
                let botPrompt = "";

                const nameMatch = cleanText.match(/(?:name|Name)\s*:\s*([^|,\n]+)/);
                const roleMatch = cleanText.match(/(?:role|Role)\s*:\s*([^|,\n]+)/);
                const promptMatch = cleanText.match(/(?:prompt|Prompt|instructions|Instructions)\s*:\s*([\s\S]+)/);

                if (nameMatch && roleMatch && promptMatch) {
                  botName = nameMatch[1].trim();
                  botRole = roleMatch[1].trim();
                  botPrompt = promptMatch[1].trim();
                } else {
                  // Fallback positional parse: split by comma/pipe after removing command prefix
                  const cleanCmd = cleanText.replace(/^([\/!]createbot|[\/!]newbot|create chatbot|create bot)\s*/i, '').trim();
                  const parts = cleanCmd.split(/[,|]/);
                  if (parts.length >= 3) {
                    botName = parts[0].trim();
                    botRole = parts[1].trim();
                    botPrompt = parts.slice(2).join(',').trim();
                  }
                }

                if (!botName || !botRole || !botPrompt) {
                  const helpMessage = `⚠️ *Failed to create bot.*\n\n*Required format:* \`/createbot Name: [Name] | Role: [Role] | Prompt: [System Prompt]*\n\n*Example:* \`/createbot Name: Legal Advisor | Role: Attorney | Prompt: You are a startup lawyer. Use past memory records to advise on contracts.\``;
                  await sock.sendMessage(from, { text: helpMessage }, { quoted: msg });
                  continue;
                }

                // Load config to update
                const configPath = path.join(__dirname, 'whatsapp-config.json');
                let config = { autoReplyUnknown: true, autoReplyGroups: false, selectedContacts: [], knownContacts: [], activeAutoReplyBotId: 'customer', bots: [] };
                if (fs.existsSync(configPath)) {
                  try {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                  } catch (e) {}
                }

                // If config.bots is empty or not loaded, initialize default ones
                if (!config.bots || config.bots.length === 0) {
                  config.bots = [
                    {
                      id: 'meeting',
                      name: 'Meeting Summarizer',
                      role: 'Meeting Intelligence Officer',
                      systemPrompt: 'You are a meeting assistant. Analyze startup meeting transcripts and zoom logs. Extract key decisions, action items, assignees, and deadlines. Use context memories to answer accurately.',
                      icon: 'Video',
                      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                    },
                    {
                      id: 'customer',
                      name: 'Customer Support Bot',
                      role: 'CRM & Client Success Manager',
                      systemPrompt: 'You are a customer success specialist. Answer customer queries, write email/WhatsApp responses, and resolve support tickets using past interaction memories. Keep it friendly and professional.',
                      icon: 'MessageSquare',
                      color: 'text-green-400 bg-green-500/10 border-green-500/20'
                    },
                    {
                      id: 'employee',
                      name: 'Team & HR Operations',
                      role: 'HR Manager & Employee Coach',
                      systemPrompt: 'You are a startup HR manager. Create onboarding steps, write job descriptions, answer policy questions, and resolve operations questions using startup memories. Keep it clear and supportive.',
                      icon: 'Users',
                      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                    }
                  ];
                }

                const newBot = {
                  id: 'custom-' + Date.now(),
                  name: botName,
                  role: botRole,
                  description: `Custom startup assistant for ${botRole}.`,
                  systemPrompt: botPrompt,
                  icon: 'Brain',
                  color: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                };

                config.bots.push(newBot);
                config.activeAutoReplyBotId = newBot.id;

                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

                const successMessage = `🤖 *Chatbot Created successfully!*\n\n*Name*: ${newBot.name}\n*Role*: ${newBot.role}\n*Instructions*: ${newBot.systemPrompt}\n\nThis agent is now registered and set as your active WhatsApp auto-reply responder.`;
                await sock.sendMessage(from, { text: successMessage }, { quoted: msg });
                console.log(`[WhatsApp] Created and activated bot: ${botName}`);
                continue;
              } catch (createErr) {
                console.error('[WhatsApp] Failed to create bot from command:', createErr.message);
                await sock.sendMessage(from, { text: `❌ Error creating bot: ${createErr.message}` }, { quoted: msg });
                continue;
              }
            }

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
            const isBotSelfMessage = msg.key.fromMe && lastSentReplies.has(text.trim());

            // Reply if it's not our own bot message AND (it's from someone else OR it is a self-chat)
            const isAllowedSender = !msg.key.fromMe || (isSelfChat && !isBotSelfMessage);

            console.log(`[WhatsApp DEBUG] Sender check: JID="${from}", myJid="${myJid}", myJidFull="${myJidFull}", isSelfChat=${isSelfChat}, isBotSelfMessage=${isBotSelfMessage}, isAllowedSender=${isAllowedSender}`);

            if (isAllowedSender && (isPrivate || isGroup) && text.trim().length > 1) {
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

                const cleanPhoneNoCountry = phoneNumber.length > 10 ? phoneNumber.slice(-10) : phoneNumber;
                const matchesPhone = (list) => {
                  return list.some(contact => {
                    const cleanContact = contact.replace(/[^0-9]/g, '');
                    if (!cleanContact) return false;
                    const cleanContact10 = cleanContact.length > 10 ? cleanContact.slice(-10) : cleanContact;
                    return cleanContact10 === cleanPhoneNoCountry;
                  });
                };

                const isSelected = matchesPhone(config.selectedContacts) || 
                                   config.selectedContacts.includes(senderName) || 
                                   config.selectedContacts.includes(from) ||
                                   (isPrivate && cachedContactName && config.selectedContacts.includes(cachedContactName)) ||
                                   (isGroup && groupName && config.selectedContacts.includes(groupName));
                const isKnown = matchesPhone(config.knownContacts) || 
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

                console.log(`[WhatsApp DEBUG] Auto-reply evaluation: isSelected=${isSelected}, isKnown=${isKnown}, autoReplyUnknown=${config.autoReplyUnknown}, shouldReply=${shouldReply}`);

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

                // Determine which bot system prompt to use
                let activeBot = config.bots?.find(b => b.id === config.activeAutoReplyBotId) || config.bots?.find(b => b.id === 'customer');
                if (!activeBot) {
                  activeBot = {
                    name: 'Customer Support Bot',
                    role: 'CRM & Client Success Manager',
                    systemPrompt: 'You are a customer success specialist. Answer customer queries, write email/WhatsApp responses, and resolve support tickets using past interaction memories. Keep it friendly and professional.'
                  };
                }

                // Auto-route to Meeting Summarizer if keywords match
                const lowerText = text.toLowerCase();
                if (lowerText.includes('meeting') || lowerText.includes('summary') || lowerText.includes('transcript') || lowerText.includes('action items')) {
                  const meetingBot = config.bots?.find(b => b.id === 'meeting');
                  if (meetingBot) {
                    activeBot = meetingBot;
                  }
                }

                // Compile structured product catalog if present on activeBot
                let catalogText = '';
                if (activeBot.products && Array.isArray(activeBot.products) && activeBot.products.length > 0) {
                  catalogText = activeBot.products.map((p, index) => {
                    return `Product #${index + 1}: ${p.name}
Price: ${p.price}
Image Link: ${p.imageUrl || 'None'}
Description: ${p.description}`;
                  }).join('\n\n');
                }

                console.log(`[WhatsApp] Auto-reply using agent prompt for '${activeBot.name}' (${activeBot.role})`);

                 // Call Next.js Chat API to generate response
                 const prompt = `System Instructions:
 You are the '${activeBot.name}' (Role: ${activeBot.role}). ${activeBot.systemPrompt}
 
 ${catalogText ? `Here is the structured Product Catalog for your startup. Use this information as your absolute source of truth when answering questions about products, rates, pricing, and availability:
 ${catalogText}
 
 If the user asks about products, pricing, or details, recommend the appropriate product, cite its price, and list the exact "Image Link" URL from the catalog in your response (so the system can deliver it).` : ''}
 
 Use the provided context (which contains past emails, notes, messages, and browser history) to reply accurately and contextually. Keep the reply concise (max 3 sentences), friendly, and natural. Do not mention that you are an AI or using search context unless asked.
 
 Context:
 ${contextText || 'No context memories found.'}
 
 Incoming Message from ${senderName} in a ${isGroup ? 'group' : 'private'} chat:
 "${text}"
 
 CRITICAL LANGUAGE REQUIREMENT: You MUST reply in the same language as the incoming message. For example, if the incoming message is in Tamil, your response MUST be in Tamil. If the incoming message is in Hindi, your response MUST be in Hindi. If the incoming message is in English, your response MUST be in English. Do not write any labels like "English:" or "Tamil:". Write ONLY the direct message content in that language.`;

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
                    lastSentReplies.add(reply.trim());
                    if (lastSentReplies.size > 50) {
                      const first = lastSentReplies.values().next().value;
                      lastSentReplies.delete(first);
                    }

                    // Extract image URL from response if present
                    const imageUrlRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|webp)(?:\?[^\s]*)?)/i;
                    const match = reply.match(imageUrlRegex);
                    if (match) {
                      const imageUrl = match[1];
                      const caption = reply.replace(imageUrl, '').trim();
                      console.log(`[WhatsApp] Auto-reply media image detected: ${imageUrl}`);
                      await sock.sendMessage(from, { image: { url: imageUrl }, caption: caption }, { quoted: msg });
                    } else {
                      await sock.sendMessage(from, { text: reply }, { quoted: msg });
                    }
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
        lastSentReplies.add(text.trim());
        if (lastSentReplies.size > 50) {
          const first = lastSentReplies.values().next().value;
          lastSentReplies.delete(first);
        }

        // Extract image URL from manual message if present
        const imageUrlRegex = /(https?:\/\/[^\s]+?\.(?:png|jpg|jpeg|webp)(?:\?[^\s]*)?)/i;
        const match = text.match(imageUrlRegex);
        if (match) {
          const imageUrl = match[1];
          const caption = text.replace(imageUrl, '').trim();
          console.log(`[WhatsApp] API send media image detected: ${imageUrl}`);
          await sock.sendMessage(jid, { image: { url: imageUrl }, caption: caption });
        } else {
          await sock.sendMessage(jid, { text });
        }

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
