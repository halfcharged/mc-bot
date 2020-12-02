'use strict';

const getIP = require('external-ip')();

require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
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
