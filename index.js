'use strict';

const getIP = require('external-ip')();

const mcping = require('mcping-js');
const server = new mcping.MinecraftServer('localhost', 25565);
const chalk = require('chalk');

require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const ADMINS=(process.env.ADMINS && (typeof process.env.ADMINS !== 'undefined')) ? process.env.ADMINS.split(" ") : [];

bot.login(TOKEN);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    const initialIP = 'Failed To Fetch IP';
    let ip = initialIP;
    let serverStatus = ''
    let statusType = '';
    let userStatus = '';
    let favicon = null;
    let players = [];
    const fetchIP = (callback) => {
        getIP((ipErr, currentIP) => {
            if (!ipErr && currentIP) {
                ip = currentIP;
            }
            if (callback) {
                callback(ipErr, currentIP);
            }
        });
    };
    const ipPing = (callback) => {
        fetchIP((ipErr, currentIP) => {
            let timeout = 3600000;
            if (ipErr) {
                console.error(ipErr);
                if (ip == initialIP) {
                    timeout = 60000;
                }
            }
            if (callback) {
                callback(ipErr, currentIP);
            }
            setTimeout(ipPing, timeout);
        });
    };
    const mcping = () => {
        server.ping(10000, 1073741831, (err, res) => {
            const lastServerStatus = serverStatus;
            const lastStatusType = statusType;
            const lastUserStatus = userStatus;
            if (!(typeof err === 'undefined' || err === null)) {
                // Server is offline.
                serverStatus = '🚫' + ip;
                statusType = 'WATCHING';
                userStatus = 'dnd';
                players = [];
            } else if (res.players && (typeof res.players.online !== 'undefined') && (typeof res.players.max !== 'undefined')) {
                // Server is running.
                serverStatus = res.players.online + ' / ' + res.players.max + ' - ' + ip;
                statusType = 'PLAYING';
                userStatus = res.players.online == 0 ? 'idle' : 'online';
                if (res.players.sample && (typeof res.players.sample !== 'undefined')) {
                    players = res.players.sample.map(player => player.name).sort();
                } else {
                    players = [];
                }
            } else {
                // Server is still launching.
                serverStatus = '🚀' + ip;
                statusType = 'WATCHING';
                userStatus = 'idle';
                players = [];
            }
            const lastFavicon = favicon;
            if (res) {
                favicon = res.favicon;
            }
            if (lastServerStatus != serverStatus || lastStatusType != statusType || lastUserStatus != userStatus) {
                const date = (new Date()).toLocaleTimeString();
                bot.user.setStatus(userStatus).catch(console.error);
                bot.user.setActivity(serverStatus, { type: statusType }).then(presence => console.log(
                    chalk.cyan('\[' + date + '\]:') + chalk.white(' Status: ' + serverStatus)
                )).catch(console.error);
            }
            if (favicon && favicon != lastFavicon) {
                bot.user.setAvatar(favicon);
            }
            setTimeout(mcping, 10000);
        });
    };
    ipPing((err, ip) => {
        mcping();
        bot.on('message', msg => {
            const content = msg.content.trim();
            // General commands.
            switch (content) {
                case '-mc ip':
                    fetchIP((err, currentIP) => {
                        msg.channel.send(err ? ip : currentIP);
                    });
                    return;
                case '-mc list':
                    if (players.length <= 0) {
                        msg.channel.send('There are currently no players in the minecraft server.');
                        return;
                    }
                    if (players.length == 1) {
                        msg.channel.send(`There is currently 1 player in the minecraft server: *${players[0]}*`);
                        return;
                    }
                    msg.channel.send(`There are currently ${players.length} players in the minecraft server:\n    ${players.map(p => `*${p}*`).join('\n    ')}`);
                    return;
            }
            // Elevated commands.
            if (content.length < 5 || !content.startsWith('!mc')) {
                return;
            }
            // Check to make sure that the author of the message has the correct permissions to execute commands on the minecraft server.
            if (!msg.author || (typeof msg.author == 'undefined') || !msg.author.username || (typeof msg.author.username === 'undefined')) {
                msg.channel.send("Unable to execute command as I am unable to gauge who sent the message.")
                return;
            }
            const discriminator = (msg.author.discriminator && (typeof msg.author.discriminator !== 'undefined')) ? ('#' + msg.author.discriminator) : '';
            const user = msg.author.username + discriminator;
            if (!ADMINS.includes(user)) {
                msg.channel.send("Only mc-bot admins are able to execute commands on the minecraft server.");
                return;
            }
            // Execute the command on the minecraft server.
            const command = content.substr(4).trimStart();
            msg.channel.send(`Execute command: ${command}`);
        });
    });
});
