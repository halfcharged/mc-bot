'use strict';

require('dotenv').config();

// Load settings from .env file.
const TOKEN = process.env.TOKEN;
const ADMINS = (process.env.ADMINS && (typeof process.env.ADMINS !== 'undefined')) ? process.env.ADMINS.split(" ") : [];
const SCREEN_NAME = (process.env.SCREEN_NAME && (typeof process.env.SCREEN_NAME !== 'undefined')) ? process.env.SCREEN_NAME : "minecraft_server";
const MC_COMMAND = (process.env.MC && (typeof process.env.MC !== 'undefined')) ? process.env.MC : "mc";

// Create the discord bot.
const Discord = require('discord.js');
const bot = new Discord.Client();

// Start monitoring the minecraft server.
const MC = require('./MC');
const mc = new MC(bot, TOKEN, ADMINS, SCREEN_NAME, MC_COMMAND);
mc.startMonitoring();
