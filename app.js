const express = require('express');
const bodyParser = require('body-parser');
const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup');
const _ = require('lodash');

const app = express();
const jsonParser = bodyParser.json();

const bot = new VkBot({
    token: process.env.TOKEN,
    confirmation: process.env.CONFIRMATION
});

const playQuestions = [
    { id: 1, text: 'Киты регулярно и очень плотно питаются, поглощая примерно тонну пищи в день', answer: false },
    { id: 2, text: 'Жираф умывается во время водопоя, низко наклоняя голову к воде и подставляя ее под течение', answer: false },
    { id: 3, text: 'Акулы - самые страшные хищники на свете. Но оказывается, они боятся дельфинов!', answer: true },
    { id: 4, text: 'Хамелеон может вращать каждым глазом независимо друг от друга', answer: true },
    { id: 5, text: 'Самка богомола всегда съедает самца после спаривания', answer: false },
    { id: 6, text: 'Когда крокодил ест свою добычу, он плачет', answer: true },
    { id: 7, text: 'Если разрезать червяка пополам, то получится два самостоятельных живых червяка', answer: false },
    { id: 8, text: 'Быков страшно бесит красный цвет, именно он приводит их в иступление', answer: false },
    { id: 9, text: 'Дельфины спят с одним открытым глазом', answer: true },
    { id: 10, text: 'Пчела всегда умирает после того, как кого-то ужалит', answer: false },
    { id: 11, text: 'У тигра полосатая не только шерсть, но и кожа', answer: true },
    { id: 12, text: 'Страус прячет голову в песок', answer: false }
];

const users = [];
const plays = {};
const playKeyboard = Markup
    .keyboard([
        Markup.button('Правда', 'positive'),
        Markup.button('Ложь', 'negative')
    ])
    .oneTime();


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

bot.command('/play', (ctx) => {
    const userId = ctx.message.user_id;

    if (plays[userId]) {
        const { questions, current } = plays[userId];
        const currentQuestion = questions[current].text;

        ctx.reply(`Текущий вопрос: ${currentQuestion}`, null, playKeyboard);

        return;
    }

    const userQuestions = _.shuffle(playQuestions);

    plays[userId] = {
        current: 0,
        questions: userQuestions
    };

    ctx.reply(userQuestions[0].text, null, playKeyboard);
});

function checkAnswer(answer, userId) {
    if (!plays[userId]) {
        return {
            text: 'Нет текущих игр',
            keyboard: false
        };
    }

    const { current, questions } = plays[userId];
    const currentQuestion = questions[current];

    currentQuestion.isRight = currentQuestion.answer === answer;
    const answerText = currentQuestion.isRight ? 'Верно' : 'Не верно';

    if (current >= questions.length - 1) {
        const result = questions.reduce((sum, question) => sum + Number(question.isRight), 0);

        delete plays[userId];

        return {
            text: `${answerText}.\nНа этом все! Ваш результат: ${result} из ${questions.length}`,
            keyboard: false
        };
    }

    plays[userId].current += 1;

    return {
        text: `${answerText}.\n${questions[current + 1].text}`,
        keyboard: true
    };
}

bot.on((ctx) => {
    const body = ctx.message.body;
    const userId = ctx.message.user_id;

    if (body.includes('Меня зовут')) {
        const answer = saveUser(ctx.message);

        ctx.reply(answer);

        return;
    }

    switch (body) {
        case 'Правда': {
            const answer = checkAnswer(true, userId);

            ctx.reply(answer.text, null, answer.keyboard ? playKeyboard : null);

            return;
        }
        case 'Ложь': {
            const answer = checkAnswer(false, userId);

            ctx.reply(answer.text, null, answer.keyboard ? playKeyboard : null);

            return;
        }
        default: ctx.reply('Я вас не понял');
    }
});

app.use(jsonParser);

app.post('/', bot.webhookCallback);


module.exports = app;
