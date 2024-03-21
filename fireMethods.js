import admin from "firebase-admin";
import fs from 'fs';
const  serviceAccount = JSON.parse(fs.readFileSync('./data/serviceAccountKey.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

export class FireMethods
{
    #CreateOneDocRef(table, id)
    {
      const tableRef = db.collection(table).doc(id);
      return tableRef;
    }
    async findOneItemByKey(table, id)  // await findOneItemByKey('Users','480180656303898624'));
    {
        const doc = await this.#CreateOneDocRef(table, id).get();
        if (!doc.exists)
        console.log('No such document!');
         else return doc.data();
    }

    addDataToTable(tableName, ID, data) // addDataToTable('G_character', 660, 
    //{"id_character": 660, "img_url":'https://desu.shikimori.org/system/characters/original/145238.jpg?1512522958', "name": 'Yuna'})
    {
        db.collection(tableName).doc(ID.toString()).set(data);
    }

    async readDataFromTable(tableName) // await readDataFromTable('Users');
    {
        const resultArr=[];
        await db.collection(tableName).get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => resultArr.push(doc.data()));
        });
        return resultArr;
    }

    deleteRecordFromTable (tableName, ID) // DeleteRecordFromTable('G_character', '660');
    {
        const deleteRow = this.#CreateOneDocRef(tableName, ID);
        deleteRow.delete()
        // .then(() => {
        //   console.log("Delete was success!");
        // })
        .catch(error => {
          console.error("Error:", error);
        });
    }
    updateRecordInTable(tableName, ID, obj)
    {
      const updateRef = this.#CreateOneDocRef(tableName, ID);
      updateRef.update(obj)
      // .then(() => {
      //   console.log("Data success updated!");
      // })
      .catch(error => {
        console.error("Error:", error);
      });
    }
    async updateAllRecords(tableName)
    {
        try {
          const collectionRef = db.collection(tableName);
          const snapshot = await collectionRef.get();
          const updatedArr = [];
      
          snapshot.forEach(doc => {
            const data = doc.data();
            if(data.priority >=3)
            {
              data.priority -= 1; 
              updatedArr.push({ id: doc.id, data: data });
            }
          });
      
          // Массовая запись обновлённых данных в Firestore
          await Promise.all(updatedArr.map(update => collectionRef.doc(update.id).set(update.data, { merge: true })));
      
        } catch (error) {
          console.error('Ошибка при массовом обновлении данных:', error);
        }
    }
    
}