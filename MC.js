/*
 * MC.js
 * Copyright (C) 2021 Callum McColl <Callum McColl@callum.local>
 *
 * Distributed under terms of the MIT license.
 */
'use strict';

const getIP = require('external-ip')();
const child_process = require("child_process");
const fs = require('fs');
const sleep = require('sleep');
const chalk = require('chalk');
const mcping = require('mcping-js');

const ServerStatus = require('./ServerStatus');

module.exports = class MC {

    constructor(bot, TOKEN, ADMINS, SCREEN_NAME, MC) {
        this.bot = bot;
        this.TOKEN = TOKEN;
        this.ADMINS = ADMINS;
        this.SCREEN_NAME = SCREEN_NAME;
        this.MC = MC;
    }

    startMonitoring() {
        this.bot.login(this.TOKEN);
        this.server = new mcping.MinecraftServer('localhost', 25565);
        this.bot.on('ready', () => {
            this.log(`Logged in as ${this.bot.user.tag}!`);
            const initialIP = 'Failed To Fetch IP';
            this.serverStatus = new ServerStatus(this.MC, initialIP, '', '', '', null, []);
            const fetchIP = (callback) => {
                getIP((ipErr, currentIP) => {
                    if (!ipErr && currentIP) {
                        this.serverStatus.ip = currentIP;
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
                        this.logError(ipErr);
                        if (this.serverStatus.ip == initialIP) {
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
                this.server.ping(10000, 1073741831, (err, res) => {
                    if (this.serverStatus.ping(err, res)) {
                        this.bot.user.setStatus(this.serverStatus.userStatus).catch(this.logError);
                        this.bot.user.setActivity(this.serverStatus.serverStatus, { type: this.serverStatus.statusType })
                            .then(presence => this.log('Status: ' + this.serverStatus.serverStatus)).catch(this.logError);
                    }
                    const lastFavicon = this.serverStatus.favicon;
                    if (this.serverStatus.favicon && this.serverStatus.favicon != lastFavicon) {
                        this.bot.user.setAvatar(this.serverStatus.favicon);
                    }
                    setTimeout(mcping, 10000);
                });
            };
            const message = (msg) => {
                const content = msg.content.trim();
                if (!content.startsWith(`-${this.MC}`) && !content.startsWith(`!${this.MC}`)) {
                    return;
                }
                // General commands.
                switch (content) {
                    case `-${this.MC} ip`:
                        fetchIP((err, currentIP) => {
                            msg.channel.send(err ? ip : currentIP);
                        });
                        return;
                    case `-${this.MC} list`:
                        if (this.serverStatus.players.length <= 0) {
                            msg.channel.send('There are currently no players in the minecraft server.');
                            return;
                        }
                        if (this.serverStatus.players.length == 1) {
                            msg.channel.send(`There is currently 1 player in the minecraft server: *${this.serverStatus.players[0]}*`);
                            return;
                        }
                        msg.channel.send(`There are currently ${this.serverStatus.players.length} players in the minecraft server:\n    ${this.serverStatus.players.map(p => `*${p}*`).join('\n    ')}`);
                        return;
                }
                const admin = this.isAdmin(msg.author) && msg.channel.type == 'dm';
                if (content == `-${this.MC} help`) {
                    msg.channel.send(this.usage(admin));
                    return;
                }
                // Admin commands.
                if (!admin || content.length < this.MC.length + 3) {
                    msg.channel.send('Invalid command');
                    msg.channel.send(this.usage(admin));
                    return;
                }
                switch (content) {
                    case `-${this.MC} admins`:
                        if (this.ADMINS.length < 1) {
                            msg.channel.send('There are currently no admins.');
                            return;
                        }
                        msg.channel.send(this.ADMINS.join(", "));
                        return;
                }
                // Execute commands on the minecraft server.
                if (!content.startsWith(`!${this.MC}`)) {
                    msg.channel.send('Invalid command');
                    msg.channel.send(this.usage(admin));
                    return;
                }
                if (this.serverStatus.offline()) {
                    msg.channel.send("Unable to execute command since the minecraft server is not running.")
                    return;
                }
                const command = content.substr(4).trimStart();
                this.executeCommand(command, msg.channel);
            };
            ipPing((err, ip) => {
                mcping();
                this.bot.on('message', message);
            });
        });
    }

    log(msg) {
        const date = (new Date()).toLocaleTimeString();
        console.log(chalk.cyan('\[' + date + '\]') + chalk.white(' ' + msg));
    }

    logError(msg) {
        const str = (msg instanceof Error) ? msg.message : msg;
        const date = (new Date()).toLocaleTimeString();
        console.error(chalk.red('\[' + date + '\] Error:') + chalk.white(' ' + str));
    }

    usage(admin) {
        const normalUsage = `-${this.MC} <command>`
        const adminUsage = `       !${this.MC} <minecraft-server-command>`
        const usage = admin ? (normalUsage + '\n' + adminUsage) : normalUsage
        const commands = [
          'ip                    Retrieves the ip used to connect to the minecraft server.',
          'list                  List users currently in the minecraft server.',
          'help                  Shows this help text.'
        ];
        const adminCommands = [
          'admins                Lists discord users that have admin privileges.'
        ];
        const allCommands = (admin ? commands.concat(adminCommands) : commands).sort().join('\n  ');
        return `
\`\`\`
OVERVIEW: A discord bot for monitoring a minecraft server.

USAGE: ${usage}

COMMANDS:
  ${allCommands}
\`\`\`
        `;
    }

    executeCommand(command, channel) {
        try {
            child_process.execSync(`screen -S ${this.SCREEN_NAME} -X log off`);
            fs.rmSync(`/tmp/mc-${this.SCREEN_NAME}-command`, { force: true });
            child_process.execSync(`screen -S ${this.SCREEN_NAME} -X logfile /tmp/mc-${this.SCREEN_NAME}-command`);
            child_process.execSync(`screen -S ${this.SCREEN_NAME} -X logfile flush 0`);
            child_process.execSync(`screen -S ${this.SCREEN_NAME} -X log`);
            child_process.execSync(`screen -S ${this.SCREEN_NAME} -X stuff "${command}\r"`);
            this.log('Executed Command: "' + command + '"');
        } catch(err) {
            channel.send(`Unable to execute command: ${err.message}`);
            return;
        }
        sleep.sleep(3);
        let output = "";
        try {
            output = fs.readFileSync(`/tmp/mc-${this.SCREEN_NAME}-command`, 'utf8');
        } catch(err) {
            this.logError(err.message);
        }
        try {
            child_process.execSync(`screen -S ${this.SCREEN_NAME} -X log off`);
        } catch(err) {}
        if (output.length < 1) {
            return;
        }
        const lines = output.split(/\r|\n/g);
        output = lines.slice(4, -1).join('\n');
        output = output.replace(/\x1b\[[0-9;]*m/g, '');
        output = output.trimStart().substr(0, 2000).trimEnd();
        if (output.length < 1) {
            return;
        }
        channel.send(output);
    }

    // Is the author of a message an admin?
    isAdmin(author) {
        if (!author || (typeof author == 'undefined') || !author.username || (typeof author.username === 'undefined')) {
            return false;
        }
        const discriminator = (author.discriminator && (typeof author.discriminator !== 'undefined')) ? ('#' + author.discriminator) : '';
        const user = author.username + discriminator;
        if (!this.ADMINS.includes(user)) {
            return false;
        }
        return true;
    }

}
