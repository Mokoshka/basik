const express = require('express');
const bodyParser = require('body-parser');
const VkBot = require('node-vk-bot-api');

const app = express();
const jsonParser = bodyParser.json();

const bot = new VkBot({
    token: process.env.TOKEN,
    confirmation: process.env.CONFIRMATION
});

bot.on((ctx) => {
    ctx.reply('Hello!');
});

app.use(jsonParser);

app.post('/', bot.webhookCallback);


module.exports = app;
