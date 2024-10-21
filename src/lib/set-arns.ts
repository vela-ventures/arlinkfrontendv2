import { ANT, ArweaveSigner } from '@ar.io/sdk/web';
import { createDataItemSigner } from "@permaweb/aoconnect";



export async function setArnsName(antProcess: string, manifestId: string, latestCommit='', undername='@') {
try {
    const signer = (window.arweaveWallet as any)?.signDataItem ? createDataItemSigner(window.arweaveWallet) : undefined;
    const ant = ANT.init({ processId: antProcess, signer: signer as unknown as ArweaveSigner });

    
    await ant.setRecord({
            undername: undername || '@',
            transactionId: manifestId,
            ttlSeconds: 3600,
        },{
            tags: [
                {
                    name: 'GIT-HASH',
                    value: `${latestCommit || 'not-set'}`, 
                },
                {
                    name: 'App-Name',
                    value: `ARlink-App`,
                },
            ]
        }
    );

    console.log(`Deployed TxId [${manifestId}] to ANT [${antProcess}] undername [${undername || '@'}]`);
} catch (e) {
    console.error(e);
}

}
