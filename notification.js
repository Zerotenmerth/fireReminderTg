import { Random } from "./features.js";
export const notiObj =
{
    game_start: ['Загаданное слово - ', 'Напомни слово - '],
    everyHour: 'Закрепление слова - ',
    add: 'Новое слово добавлено!',
    error: 'Неверно набрана команда!',
    start: 'Запустить повторение слов',
    stat: 'Показать статистику ответов',
    info: 'Вся информация о боте',
    repeat: 'Еще один раунд!',
    alreadyAnswered: 'Вы уже ответили!',
    falseAnswerTimeOver: 'Никто не ответил за заданное время',
    rightAnswerArr: [' выполнил(а) Domain Expansion!\n', ' превозмог(ла) свой предел!\n', 'ответил(а) верно!\n'],
    falseAnswerArr: [' допустил(а) ошибку!\n', ' нужно повторить данное слово!\n'],
    falseAnswerAll: 'Увы, никто не знает данное слово!',
    oneAnswer: 'Ответ зафиксирован, ждем второго, или окончание времени!',
    know: 'Я знаю слово!',
    good_know: 'Я хорошо знаю слово!'
}

export function ChooseEndMsg(arr)
{
    let endMsg=''; let k=2;
    if(arr.find(x=>x.correctAnswer))
    {
        arr.forEach(x=>{
            if(x.correctAnswer)
            endMsg +=`${x.username} ${notiObj.rightAnswerArr[Random(0, notiObj.rightAnswerArr.length-1)]}`;
            else {
                endMsg +=`${x.username} ${notiObj.falseAnswerArr[Random(0, notiObj.falseAnswerArr.length-1)]}`;
                k--;
            }
        });

        if(k==0)
            endMsg = notiObj.falseAnswerAll;
    }
    else
        endMsg = notiObj.falseAnswerTimeOver;
    return endMsg;
}   