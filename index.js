import fs from 'fs';
import TelegramBot from 'node-telegram-bot-api';

import { FireMethods } from './fireMethods.js';
const fireMethods = new FireMethods();

import { Random, startJob} from './features.js';
import { notiObj, ChooseEndMsg } from './notification.js';
import { Control } from './control.js';
const control = new Control();

import { GameSet } from './gameSettings.js';

const gameSet = new GameSet();

const token = fs.readFileSync('./data/tokenTg.ini', 'utf-8');
const bot = new TelegramBot(token, {polling: true});

const mainChatId = JSON.parse(fs.readFileSync('./data/config.json', 'utf8')).chatID;


bot.setMyCommands([
  {command: '/start', description: notiObj.start},
  {command: '/info', description: notiObj.info},
  {command: '/stat', description: notiObj.stat}
])

const gameData =[];

async function startGame(chatId, startMsg, delay=60000)
{
      const {choosenLang, hiddenLang}= gameSet.selectStyle();
      const {words, selectedWord} = await gameSet.fillWords();
      const Msg = await bot.sendMessage(chatId, startMsg + selectedWord[`${choosenLang}_sense`], 
      control.createGameOptions(control.createGameArrForOptions(words, hiddenLang)));
      
      gameData.push({selectedWord, 
        messageId : Msg.message_id,
        countOfClick: 0, alreadyUpPriority: false,
        answers:[], relatedPosts: [Msg.message_id]});

        const date = new Date();
        gameData[gameData.length-1].deleteEvent  = startJob(new Date(date.getTime() + delay), ()=>{endGame(gameData[gameData.length-1], chatId)});
}

async function endGame(ourQuiz, chatId)
{
  let messaguage = ChooseEndMsg(ourQuiz.answers);

  //Remove Messages
  control.deleteMsg(bot, chatId, ourQuiz.relatedPosts, 1000);
  
  const resultMsg = await bot.sendMessage(chatId, `<pre>${ourQuiz.selectedWord.eng_sense}</pre> ${messaguage}`, control.createGameOptions([[{text: notiObj.know, callback_data: '^know'}, {text: notiObj.good_know, callback_data: '^good_know'}],[{text: notiObj.repeat, callback_data: '^new_game'}]]));
  ourQuiz.messageId = resultMsg.message_id;
  
  control.deleteMsg(bot, chatId, [resultMsg.message_id], 180000);
  control.deleteQuizFromArray(gameData, ourQuiz, 180000);
}

function updatePriority(ourQuiz, value)
{
  ourQuiz.selectedWord.priority=ourQuiz.selectedWord.priority + value;
  fireMethods.updateRecordInTable('EngWords', ourQuiz.selectedWord.eng_sense, ourQuiz.selectedWord);
}

bot.on('text', async (msg)=>
{
    const chatId = msg.chat.id;
    const text = msg.text;
    const username = msg.from.username;

    if(text.startsWith('/add') && chatId == mainChatId)
    { 
      try{
       let textData = text.substring(5).split(' | ');
       fireMethods.addDataToTable('EngWords', textData[0], {ru_sense: textData[1], eng_sense: textData[0], priority: 1});
       bot.sendMessage(chatId, notiObj.add);

       const date = new Date();
         startJob(new Date(date.getTime()  + 43200000), ()=>{
           fireMethods.updateRecordInTable('EngWords', textData[0], {priority: 1});
        });       
      }
      catch(e){
        console.log(e);
        bot.sendMessage(chatId, notiObj.error);
      }
    }

    if(text.startsWith('/start') && chatId == mainChatId)
    {
      startGame(chatId, notiObj.game_start[Random(0, notiObj.game_start.length-1)]);
    }

    if(text.startsWith('/stat') && chatId == mainChatId)
    {
      const statData = await fireMethods.findOneItemByKey('EngStat', username);

      let templateMsg =`<blockquote><code>Personal @${username} stat</code>\nВсего ответов - <code>${statData.all_count}</code>\nВерных ответов - <code>${statData.win_count}</code>\nНеверных ответов - <code>${statData.lose_count}</code></blockquote>`;
          
          const statMsg = await bot.sendMessage(mainChatId, 
          templateMsg, control.createGameOptions([]));
        control.deleteMsg(bot, mainChatId, [statMsg], 1800000);
    }
  
});

bot.on('callback_query', async msg =>{

  const pickedByUserWord = msg.data;
  const chatId = msg.message.chat.id;
  const username = msg.from.username;
  const msgId = msg.message.message_id;
  const ourQuiz = gameData.find(x=>x.messageId == msgId);

  switch (pickedByUserWord) {
    case '^new_game':
      startGame(chatId, notiObj.game_start[Random(0, notiObj.game_start.length-1)]);
    break;
    
    case '^know':
      updatePriority(ourQuiz, 3);
    break;

    case '^good_know':
      updatePriority(ourQuiz, 6);
    break;

    default:
        const userObj={username, correctAnswer: false};
        if(!ourQuiz.answers.find(x=>x.username == userObj.username))
        {
          const statData = await fireMethods.findOneItemByKey('EngStat', username);
          statData.all_count++;
          if(pickedByUserWord == ourQuiz.selectedWord.eng_sense)
          {
            if(!ourQuiz.alreadyUpPriority){
              ourQuiz.selectedWord.priority++;
              fireMethods.updateRecordInTable('EngWords', ourQuiz.selectedWord.eng_sense, ourQuiz.selectedWord);
              ourQuiz.alreadyUpPriority = true;
            }
            userObj.correctAnswer= true;
            
            statData.daily_count++;
            statData.win_count++;
          }
          else
            statData.lose_count++;

          fireMethods.updateRecordInTable('EngStat', username, statData);

          ourQuiz.answers.push(userObj)
        
          ourQuiz.countOfClick++;

          if(ourQuiz.countOfClick==1)
          {
            const OneMsg = await bot.sendMessage(chatId, notiObj.oneAnswer);
            ourQuiz.relatedPosts.push(OneMsg.message_id);
          }
          if(ourQuiz.countOfClick==2)
          {
            ourQuiz.deleteEvent.stop();
            endGame(ourQuiz, chatId);
          }
        }
        else{
          const repeatMsg = await bot.sendMessage(chatId, notiObj.alreadyAnswered);
          ourQuiz.relatedPosts.push(repeatMsg.message_id);
        }
      break;
  }
})

startJob('10 00 11-23/1 * * *', ()=>{
  startGame(mainChatId, notiObj.everyHour, 1800000);
});

startJob('0 0 09 * * 1', ()=>{
  fireMethods.updateAllRecords('EngWords');
});

startJob('0 55 23 * * *', async ()=>{
  const dailyData = await fireMethods.readDataFromTable('EngStat');

  let templateMsg =`<pre>Daily Statistics</pre>`;
    dailyData.forEach(x=>{
      templateMsg+=`@${x.username} за день набрал(а) - <code>${x.daily_count}</code> верных ответов\n`
    });

  const dailyMsg = await bot.sendMessage(mainChatId, 
    templateMsg, control.createGameOptions([]));
    control.deleteMsg(bot, mainChatId, [dailyMsg], 1800000);

  fireMethods.updateRecordInTable('EngStat', 'Risu_21', {daily_count: 0});
  fireMethods.updateRecordInTable('EngStat', 'Zerotenmerth', {daily_count: 0});
});

