import { ANT, ArweaveSigner} from '@ar.io/sdk';
import fsPromises from "fs/promises";
import { config } from 'dotenv';
config();

async function resetSystem()     {
try {
    
    const jwk = JSON.parse(await fsPromises.readFile("Wallet.json", "utf-8"));
    const signer = new ArweaveSigner(jwk);
    const antProcess = process.env.ANT_PROCESS || 'MdCZCs8_H-pg04uQWID1AR4lu0XZyKlU0TPMNM_da4k';
    const ant = ANT.init({ processId: antProcess, signer });
    const records = await ant.getRecords();

   
    console.log("Records: ",records, "\n");


      //for each keyname, NOT key value, in the records object, remove the record
        for (const key in records) {
            if(key !== '@'){
            await ant.removeRecord(
                { undername: key },
                // optional additional tags
                { tags: [{ name: 'App-Name', value: `${key}` }] },
            );
            console.log(`Removed record with undername ${key}`);
        }
        }
        // remove all the contents of the file file buildRegistry.json and overwrite it with an empty object []
        const buildRegistry = './buildRegistry.json';
        await fsPromises.writeFile(buildRegistry, JSON.stringify([])); 
        console.log(`Cleared buildRegistry`);

        // remove the entire contents of the builds folder 
        const buildFolder = './builds';
        await fsPromises.rm(buildFolder, { recursive: true });
        console.log(`Cleared builds folder`);


} catch (e) {
    console.error(e);
}

}

resetSystem();