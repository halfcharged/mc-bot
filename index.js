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
    let ip = ''
    console.info(`Logged in as ${bot.user.tag}!`);
    server.ping(10000, 1073741831, (err, res) => {
        getIP((ipErr, currentIP) => {
            if (ipErr) {
                // every service in the list has failed
                throw err;
            } else {
                ip = currentIP;
            }
            if (!(typeof err === 'undefined' || err === null)) {
                bot.user.setStatus('dnd')
                    .then(console.log)
                    .catch(console.error);
                bot.user.setActivity('Offline - ' + ip, { type: 'PLAYING' });
                return
            }
            if (typeof res.players.sample === 'undefined') { bot.user.setStatus('idle') }
            if (!(typeof res.players.sample === 'undefined')) { bot.user.setStatus('online') }
            let serverStatus = res.players.online + ' / ' + res.players.max + ' - ' + ip;
            const date = (new Date()).toLocaleTimeString();
            bot.user.setAvatar(res.favicon);
            bot.user.setActivity(serverStatus, { type: 'PLAYING' }).then(presence => console.log(
                chalk.cyan('\[' + date + '\]:') + chalk.white(' Ping: ' + serverStatus)
            )).catch(console.error);
        });
    })
});

bot.on('message', msg => {
    if (msg.content === '-mc ip') {
        getIP((err, ip) => {
            if (err) {
                // every service in the list has failed
                throw err;
            }
            msg.channel.send(ip);
        });
    }
});
