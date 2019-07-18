const express = require('express');
const bodyParser = require('body-parser');
const VkBot = require('node-vk-bot-api');

const app = express();
const jsonParser = bodyParser.json();

const bot = new VkBot({
    token: process.env.TOKEN,
    confirmation: process.env.CONFIRMATION
});

const users = [];

function saveUser(message) {
    const { body: msg, user_id: userId } = message;
    const user = users.find(user => user.vkId === userId);

    if (user) {
        return `Мы уже знакомы, ${user.name}`;
    }

    const parts = msg.split(' ');
    const name = parts.slice(2).join(' ');

    if (!name) {
        return 'Ты не указал имя';
    }

    users.push({ vkId: userId, name });

    return `Приятно познакомиться, ${name}`;
}

bot.on((ctx) => {
    if (ctx.message.body.includes('Меня зовут')) {
        const answer = saveUser(ctx.message);

        ctx.reply(answer);

        return;
    }

    ctx.reply('Я вас не понял');
});

app.use(jsonParser);

app.post('/', bot.webhookCallback);


module.exports = app;
