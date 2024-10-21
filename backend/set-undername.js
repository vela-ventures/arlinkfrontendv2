import { ANT, ArweaveSigner } from '@ar.io/sdk';
import fsPromises from "fs/promises";

export async function setUnderName(undername, manifestId, latestCommit)     {
try {
    const jwk = JSON.parse(await fsPromises.readFile("Wallet.json", "utf-8"));
    const signer = new ArweaveSigner(jwk);
    const antProcess = process.env.ANT_PROCESS || 'MdCZCs8_H-pg04uQWID1AR4lu0XZyKlU0TPMNM_da4k';
    const ant = ANT.init({ processId: antProcess, signer });

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
} catch (e) {
    console.error(e);
}

}