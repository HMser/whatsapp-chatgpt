const { createServer } = require('http');
const sessionName = 'GPT-Bot-By-HM';
const donet = 'https://t.me/xHMser';
const owner = ['916235504329'];
const {
  default: sansekaiConnect,
  useSingleFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType
} = require('baileys');
const { state, saveState } = useSingleFileAuthState(`./${sessionName}.data`);
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const figlet = require('figlet');
const _ = require('lodash');
const PhoneNumber = require('awesome-phonenumber');

const store = makeInMemoryStore({ 'logger': pino()['child']({ 'level': 'silent', 'stream': 'log' }) });

const color = (text, color) => {
  return !color ? chalk.hex('#39FF14')(text) : chalk.keyword(color)(text);
};

function smsg(client, message, store) {
  if (!message) return message;
  let webMessageInfo = proto.WebMessageInfo;

  if (message.key) {
    message.id = message.key.id;
    message.isForwarded = message.id.startsWith('remote') && message.id.length === 10;
    message.remoteJid = message.key.remoteJid;
    message.fromMe = message.key.fromMe;
    message.isGroup = message.chat.isGroup;
    message.from = client.contacts[client.user.jid && client.user.jid.split('@')[0]].vname || '';
    if (message.isForwarded) message.from = client.contacts[jidDecode(message.remoteJid)].vname || '';
    if (message.participant) message.from = client.contacts[client.jid].vname || '';
    if (message.quoted) message.quoted.id = message.quoted.stanzaId;
    if (message.quoted) message.quoted.chat = client.contacts[jidDecode(message.quoted.participant)];
    if (message.quoted) message.quoted.fromMe = client.jid === jidDecode(message.quoted.participant);
    if (message.quoted) message.quoted.text = message.quoted.text || message.quoted.caption || message.quoted.conversation || message.quoted.extendedTextMessage || message.quoted.videoMessage || message.quoted.audioMessage || message.quoted.stickerMessage || '';
    let mimetype = message.quoted.mimetype || '';
    message.quoted.text = typeof message.quoted.text === 'string' ? { 'text': message.quoted.text } : message.quoted.text;
    message.quoted.mimetype = mimetype;
    message.quoted.id = message.quoted.id;
    message.quoted.chat = client.contacts[message.quoted.participant];
    message.quoted.fromMe = message.quoted.chat.id === client.user.id;
    message.quoted.contextInfo = message.quoted.contextInfo || message.quoted.caption || message.quoted.conversation || message.quoted.extendedTextMessage || message.quoted.videoMessage || message.quoted.audioMessage || message.quoted.stickerMessage || '';
    message.quoted.mentionedJid = message.quoted.contextInfo ? message.quoted.contextInfo.mentionedJid : [];
    if (message.quoted.mentionedJid) {
      let memb = message.quoted.mentionedJid.map((jid) => client.contacts[jid.split('@')[0]].vname || '').join(', ');
      message.quoted.text = `${memb ? memb + ':\n' : ''}${message.quoted.text}`;
    }
  }

  if (message.quoted && message.quoted.id && message.isGroup) {
    let index = _.findIndex(store['group_data'], { 'id': message.quoted.id });
    if (index >= 0) {
      message.quoted.from = store['group_data'][index].from;
      message.quoted.fromMe = store['group_data'][index].fromMe;
      message.quoted.text = store['group_data'][index].text;
      message.quoted.type = store['group_data'][index].type;
      message.quoted.text = { 'text': message.quoted.text };
    }
  }

  if (message.quoted && message.quoted.id && !message.isGroup) {
    let index = _.findIndex(store['data'], { 'id': message.quoted.id });
    if (index >= 0) {
      message.quoted.from = store['data'][index].from;
      message.quoted.fromMe = store['data'][index].fromMe;
      message.quoted.text = store['data'][index].text;
      message.quoted.type = store['data'][index].type;
      message.quoted.text = { 'text': message.quoted.text };
    }
  }

  if (message.quoted && message.quoted.mimetype && message.quoted.mimetype === 'image/jpeg') {
    message.quoted.type = 'image';
    message.quoted.caption = message.quoted.text;
    message.quoted.text = { 'text': message.quoted.text };
  }

  if (message.quoted && message.quoted.mimetype && message.quoted.mimetype === 'video/mp4') {
    message.quoted.type = 'video';
    message.quoted.caption = message.quoted.text;
    message.quoted.text = { 'text': message.quoted.text };
  }

  if (message.quoted && message.quoted.mimetype && message.quoted.mimetype === 'audio/mp3') {
    message.quoted.type = 'audio';
    message.quoted.caption = message.quoted.text;
    message.quoted.text = { 'text': message.quoted.text };
  }

  if (message.quoted && message.quoted.mimetype && message.quoted.mimetype === 'application/pdf') {
    message.quoted.type = 'document';
    message.quoted.caption = message.quoted.text;
    message.quoted.text = { 'text': message.quoted.text };
  }

  if (message.quoted && message.quoted.mimetype && message.quoted.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    message.quoted.type = 'spreadsheet';
    message.quoted.caption = message.quoted.text;
    message.quoted.text = { 'text': message.quoted.text };
  }

  if (message.quoted && message.quoted.mimetype && message.quoted.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    message.quoted.type = 'document';
    message.quoted.caption = message.quoted.text;
    message.quoted.text = { 'text': message.quoted.text };
  }

  if (message.quoted && message.quoted.mimetype && message.quoted.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    message.quoted.type = 'document';
    message.quoted.caption = message.quoted.text;
    message.quoted.text = { 'text': message.quoted.text };
  }

  if (message.quoted && message.quoted.type && message.quoted.type === 'product') {
    message.quoted.caption = message.quoted.productTitle;
    message.quoted.text = { 'text': message.quoted.productTitle };
  }

  if (message.isMedia && !message.isNotification && message.type === 'chat') {
    if (message.mimetype === 'image/jpeg' || message.mimetype === 'image/png') {
      message.type = 'image';
      message.text = { 'text': message.caption };
    }

    if (message.mimetype === 'video/mp4' || message.mimetype === 'video/webm') {
      message.type = 'video';
      message.text = { 'text': message.caption };
    }

    if (message.mimetype === 'audio/mp3' || message.mimetype === 'audio/opus') {
      message.type = 'audio';
      message.text = { 'text': message.caption };
    }

    if (message.mimetype === 'application/pdf') {
      message.type = 'document';
      message.text = { 'text': message.caption };
    }

    if (
      message.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      message.mimetype === 'application/vnd.ms-excel'
    ) {
      message.type = 'spreadsheet';
      message.text = { 'text': message.caption };
    }

    if (
      message.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      message.mimetype === 'application/vnd.ms-word'
    ) {
      message.type = 'document';
      message.text = { 'text': message.caption };
    }

    if (
      message.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      message.mimetype === 'application/vnd.ms-powerpoint'
    ) {
      message.type = 'document';
      message.text = { 'text': message.caption };
    }

    if (message.mimetype === 'application/octet-stream') {
      message.type = 'document';
      message.text = { 'text': message.caption };
    }
  }

  if (message.isGroup) {
    message.sender = message.author || {};
    message.sender.id = message.author || {};
    message.sender.isMe = message.sender.jid === client.user.jid;
    message.from = client.contacts[message.author.split('@')[0]].vname || '';
    message.fromMe = message.sender.jid === client.user.jid;
    if (message.mentionedJid) {
      let memb = message.mentionedJid.map((jid) => client.contacts[jid.split('@')[0]].vname || '').join(', ');
      message.text = `${memb ? memb + ':\n' : ''}${message.text}`;
    }
  }

  return message;
}

async function sendMessage(client, to, text) {
  const message = await generateMessageID(to);
  await client.sendMessage(
    to,
    text,
    'extendedTextMessage',
    { 'quoted': message }
  );
}

async function sendMention(client, to, text, mentioned) {
  const message = await generateMessageID(to);
  await client.sendMessage(
    to,
    text,
    'extendedTextMessage',
    { 'quoted': message, 'contextInfo': { 'mentionedJid': mentioned } }
  );
}

async function sendReply(client, to, text, quoted) {
  const message = await generateMessageID(to);
  await client.sendMessage(
    to,
    text,
    'extendedTextMessage',
    { 'quoted': quoted, 'quotedMsg': quoted, 'contextInfo': { 'mentionedJid': [quoted.participant] } }
  );
}

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { message } = payload;

        const client = sansekaiConnect(sessionName, state, {
          'patchDownloadedContent': true,
          'forwardMessageContent': true,
          'store': store,
          'logger': pino()['child']({ 'level': 'silent', 'stream': 'log' }),
          'version': fetchLatestBaileysVersion,
          'qr': {
            'format': 'terminal',
            'color': {
              'dark': '\u001b[38;5;198m',
              'light': '\u001b[38;5;199m'
            }
          },
          'createOptions': {
            'waitForChats': true,
            'newQRCode': true
          }
        });

        client.onStateChanged(async (state) => {
          if (state === 'CONFLICT') {
            await client.forceUpdate();
          }
          if (state === 'UNPAIRED') {
            await client.forceUpdate();
          }
        });

        client.onMessage(async (message) => {
          const jid = message.key.remoteJid;
          const sender = jid.includes('-') ? jid.split('-')[0] : jid;
          const msgContent = smsg(client, message, store);
          const isOwner = owner.includes(sender);

          if (isOwner && message.isGroup) {
            const groupId = message.chat.id;
            const groupData = store['group_data'] || [];

            if (!groupData.some((data) => data.id === groupId)) {
              groupData.push({
                'id': groupId,
                'from': message.from,
                'fromMe': message.fromMe,
                'text': message.text,
                'type': message.type
              });

              store['group_data'] = groupData;
              saveState();
            }
          }

          if (isOwner && !message.isGroup) {
            const chatId = message.chat.id;
            const data = store['data'] || [];

            if (!data.some((item) => item.id === chatId)) {
              data.push({
                'id': chatId,
                'from': message.from,
                'fromMe': message.fromMe,
                'text': message.text,
                'type': message.type
              });

              store['data'] = data;
              saveState();
            }
          }

          if (message.isGroup) {
            console.log(
              color('Group', 'blue'),
              color('from', 'white'),
              color(message.from, 'yellow'),
              color('=>', 'white'),
              color(message.text, 'green')
            );
          } else {
            console.log(
              color('Message', 'magenta'),
              color('from', 'white'),
              color(message.from, 'yellow'),
              color('=>', 'white'),
              color(message.text, 'green')
            );
          }

          if (message.isGroup && message.mentionedJid.includes(client.user.jid)) {
            const mentioned = [message.author];
            await sendMention(client, message.chat.id, `Halo @${message.sender.id.split('@')[0]}! Ada yang bisa kami bantu?`, mentioned);
          }

          if (message.isGroup && message.body === '!ping') {
            await sendReply(client, message.chat.id, 'Pong!', message);
          }

          if (!message.isGroup && message.body === '!ping') {
            await sendMessage(client, message.chat.id, 'Pong!');
          }

          if (!message.isGroup && message.body === '!donet') {
            await sendMessage(client, message.chat.id, `Silakan kunjungi link ini untuk donasi: ${donet}`);
          }
        });

        res.statusCode = 200;
        res.end('OK');
      } catch (error) {
        console.error(error);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(color(figlet.textSync('WhatsApp Bot', 'Slant'), 'magenta'));
  console.log(color('Server started on port', 'cyan'), color(port, 'yellow'));
});
