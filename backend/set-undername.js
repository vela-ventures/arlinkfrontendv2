import { ANT, ArweaveSigner, IO } from '@ar.io/sdk';
import fsPromises from "fs/promises";
import { config } from 'dotenv';
import { getIndividualConfig } from './buildRegistry.js';
config();

export async function setUnderName(undernamePre, manifestId, latestCommit, owner, folder)     {
try {
    
    const jwk = JSON.parse(await fsPromises.readFile("Wallet.json", "utf-8"));
    const signer = new ArweaveSigner(jwk);
    const antProcess = process.env.ANT_PROCESS || 'MdCZCs8_H-pg04uQWID1AR4lu0XZyKlU0TPMNM_da4k';
    const ant = ANT.init({ processId: antProcess, signer });
    const records = await ant.getRecords();
    const userConfig = await getIndividualConfig(owner, folder);
    const userUnderName = userConfig["arnsUnderName"];
    const doesUserOwnUnderName = userUnderName == undernamePre && userUnderName !== "";
    const doesUserOwnOwnerUnderName = userUnderName == `${owner}-${undernamePre}` && userUnderName !== "";

    let undername = undernamePre ? undernamePre : folder;
   
    console.log("Records: ",records, "\n");
    console.log(`Deploying TxId [${manifestId}] to ANT [${antProcess}] using undername [${undername}]`);


    if (records[undernamePre] && !doesUserOwnUnderName) {
        console.error(`Undername [${undernamePre}] is already in use`);
        undername = `${owner}-${undernamePre}`;
        console.log(`Using undername [${undername}]`);
    }
    else if (records[undername] && !doesUserOwnOwnerUnderName && !doesUserOwnUnderName) {
        console.error(`Manifest [${undername}] is also already in use`);
        return { checkArns: false, finalUnderName: '' };
    }


    // Update the ANT record (assumes the JWK is a controller or owner)
    await ant.setRecord(
        {
            undername: undername,
            transactionId: manifestId,
            ttlSeconds: 3600,
        },{
            tags: [
                {
                    name: 'GIT-HASH',
                    value: `${latestCommit}`,
                },
                {
                    name: 'App-Name',
                    value: `${undername}`,
                },
            ]
        }
    );

    console.log(`Deployed TxId [${manifestId}] to ANT [${antProcess}] using undername [${undername}]`);
    return { checkArns: true, finalUnderName: undername };

} catch (e) {
    console.error(e);
}

}