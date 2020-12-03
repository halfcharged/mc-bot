'use strict';

const getIP = require('external-ip')();

const mcping = require('mcping-js');
const server = new mcping.MinecraftServer('localhost', 25565);
const chalk = require('chalk');

require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
    const initialIP = 'Failed To Fetch IP';
    let ip = initialIP;
    let serverStatus = ''
    let statusType = '';
    let userStatus = '';
    let favicon = null;
    const ipPing = (callback) => {
        getIP((ipErr, currentIP) => {
            let timeout = 3600000;
            if (ipErr) {
                // every service in the list has failed
                console.error(ipErr);
                if (ip == initialIP) {
                    timeout = 60000;
                }
            } else {
                ip = currentIP;
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
                userStatus = 'invisible';
            } else if (res.players && (typeof res.players.online !== 'undefined') && (typeof res.players.max !== 'undefined')) {
                // Server is running.
                serverStatus = res.players.online + ' / ' + res.players.max + ' - ' + ip;
                statusType = 'PLAYING';
                userStatus = res.players.online == 0 ? 'idle' : 'online';
            } else {
                // Server is still launching.
                serverStatus = '🚀' + ip;
                statusType = 'WATCHING';
                userStatus = 'idle';
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
            if (msg.content === '-mc ip') {
                ipPing((err, currentIP) => {
                    msg.channel.send(ip);
                })
            }
        });
    });
});
