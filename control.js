import { startJob } from "./features.js";

export class Control
{
    deleteMsg(bot, chatId, arr, delay)
    {
        const date = new Date();
        return startJob(new Date(date.getTime()  + delay), ()=>{
            arr.forEach(x=> bot.deleteMessage(chatId, x));
        });
    }
    createGameArrForOptions(arr, lang)
    {
        return[
            [{text: arr[0][`${lang}_sense`], callback_data: arr[0].eng_sense}, {text: arr[1][`${lang}_sense`], callback_data: arr[1].eng_sense}],
            [{text: arr[2][`${lang}_sense`], callback_data: arr[2].eng_sense}, {text: arr[3][`${lang}_sense`], callback_data: arr[3].eng_sense}]
        ]
    }
    createGameOptions(arr) {
        return {
          reply_markup: JSON.stringify({
            inline_keyboard: arr
          }),
          parse_mode: 'HTML'
        }
      }
}