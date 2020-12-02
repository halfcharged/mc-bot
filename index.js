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
    let ip = 'Failed To Fetch IP'
    console.info(`Logged in as ${bot.user.tag}!`);
    const ping = () => {
        server.ping(10000, 1073741831, (err, res) => {
            getIP((ipErr, currentIP) => {
                if (ipErr) {
                    // every service in the list has failed
                    console.error(ipErr);
                } else {
                    ip = currentIP;
                }
                const date = (new Date()).toLocaleTimeString();
                if (!(typeof err === 'undefined' || err === null)) {
                    bot.user.setStatus('dnd');
                    bot.user.setActivity('Offline - ' + ip, { type: 'PLAYING' }).catch(console.error);
                    console.log((chalk.yellow('\[' + date + '\]:') + chalk.white(' Ping: ' + 'Server Offline')));
                    setTimeout(ping, 30000);
                    return
                }
                if (res.players && (typeof res.players.online !== 'undefined') && (typeof res.players.max !== 'undefined')) {
                    let serverStatus = res.players.online + ' / ' + res.players.max + ' - ' + ip;
                    res.players.online == 0 ? bot.user.setStatus('idle') : bot.user.setStatus('online');
                    bot.user.setActivity(serverStatus, { type: 'PLAYING' }).then(presence => console.log(
                        chalk.cyan('\[' + date + '\]:') + chalk.white(' Ping: ' + serverStatus)
                    )).catch(console.error);
                } else {
                    let serverStatus = ip + ' 🚀';
                    bot.user.setStatus('idle');
                    bot.user.setActivity(serverStatus, { type: 'WATCHING' }).then(presence => console.log(
                        chalk.cyan('\[' + date + '\]:') + chalk.white(' Ping: ' + serverStatus)
                    )).catch(console.error);
                }
                bot.user.setAvatar(res.favicon);
                setTimeout(ping, 30000);
            });
        })
    };
    ping();
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
