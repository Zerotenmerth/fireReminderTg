import { Random } from "./features.js";
import { FireMethods } from "./fireMethods.js";
const fireMethods = new FireMethods();

export class GameSet{
    #choosenLang='ru';
    #hiddenLang = 'eng';

    #changeLanguage()
    {
        const temp = this.choosenLang;
        this.choosenLang = this.hiddenLang;
        this.hiddenLang = temp;
    }
    selectStyle()
    {
        const style = Random(1,2);
        if(style==2)
        this.#changeLanguage();
        return{ choosenLang:this.#choosenLang, hiddenLang: this.#hiddenLang}
    }
    async fillWords()
    {
        const wordArr = await fireMethods.readDataFromTable('EngWords');
        const gameWordArr =[];
        let selectedWord;

        let filteredArr;
        for(let i=1; i<4; i++)
        {
            filteredArr= wordArr.filter(x => x.priority == i);
            if(filteredArr.length<1)
            {
                if(i==3)
                    filteredArr= wordArr.filter(x => x.priority >= i);
                else
                    continue;
            }     
            else
                break;
        }
        gameWordArr.push(filteredArr[Random(0, filteredArr.length-1)]);
        selectedWord = gameWordArr[0];

        for(; ;)
        {
            const oneObj = wordArr[Random(0, wordArr.length-1)];
            if(!gameWordArr.find(x=> x== oneObj))
                gameWordArr.push(oneObj);

            if(gameWordArr.length==4)
                break;
        }
        gameWordArr.sort(() => Math.random() - 0.5);
        return {words:gameWordArr, selectedWord}
    }
    
} 