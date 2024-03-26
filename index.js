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
  {command: '/info', description: notiObj.info}
])

const gameData =[];

async function startGame(chatId, startMsg, delay=60000)
{
      const {choosenLang, hiddenLang}= gameSet.selectStyle();
      const {words, selectedWord} = await gameSet.fillWords();
      const Msg = await bot.sendMessage(chatId, startMsg + selectedWord[`${choosenLang}_sense`] + ` [${Random(1,100)}]`, 
      control.createGameOptions(control.createGameArrForOptions(words, hiddenLang)));
      
      gameData.push({selectedWord, 
        messageId: Msg.message_id, 
        countOfClick: 0, alreadyUpPriority: false,
        answers:[], relatedPosts: [Msg.message_id]});

        const date = new Date();
        gameData[gameData.length-1].deleteEvent  = startJob(new Date(date.getTime() + delay), ()=>{endGame(gameData[gameData.length-1], chatId)});
}

async function endGame(ourQuiz, chatId)
{
  let messaguage = ChooseEndMsg(ourQuiz.answers);
  const resultMsg = await bot.sendMessage(chatId, messaguage, control.createGameOptions([[{text: notiObj.repeat, callback_data: 'repeat'}]]));
  ourQuiz.relatedPosts.push(resultMsg.message_id);
  
  gameData.splice(gameData.indexOf(ourQuiz), 1);

  //Remove Messages
  control.deleteMsg(bot, chatId, ourQuiz.relatedPosts, 180000);
}

bot.on('text', async (msg)=>
{
    const chatId = msg.chat.id;
    const text = msg.text;

    if(text.startsWith('/add'))
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

    if(text.startsWith('/start'))
    {
      startGame(chatId, notiObj.game_start[Random(0, notiObj.game_start.length-1)]);
    }
  
});

bot.on('callback_query', async msg =>{

  const pickedByUserWord = msg.data;
  const chatId = msg.message.chat.id;
  const username = msg.from.username;
  const msgId = msg.message.message_id;

  if(pickedByUserWord =='repeat')
    startGame(chatId, notiObj.game_start[Random(0, notiObj.game_start.length-1)]);
  else {
      try{
        const ourQuiz = gameData.find(x=>x.messageId == msgId);

        const userObj={username, correctAnswer: false};
        if(!ourQuiz.answers.find(x=>x.username == userObj.username))
        {
          if(pickedByUserWord == ourQuiz.selectedWord.eng_sense)
          {
            if(!ourQuiz.alreadyUpPriority){
              ourQuiz.selectedWord.priority++;
              fireMethods.updateRecordInTable('EngWords', ourQuiz.selectedWord.eng_sense, ourQuiz.selectedWord);
              ourQuiz.alreadyUpPriority = true;
            }
            userObj.correctAnswer= true;
          }

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
      }catch(e){console.log(e);}
  }
})

startJob('10 00 11-23/1 * * *', ()=>{
  startGame(mainChatId, notiObj.everyThreeHour, 1800000);
});

startJob('0 0 09 * * 1', ()=>{
  fireMethods.updateAllRecords('EngWords');
});

