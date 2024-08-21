
import Irys from "@irys/sdk";
import dotenv from 'dotenv';
dotenv.config();

const getIrys = async () => {
	const network = "devnet";
	const token = "ethereum";
	// Devnet RPC URLs change often, use a recent one from https://chainlist.org/
	const providerUrl = `https://sepolia.infura.io/v3/${process.env.INFURAAPIKEY}`;
    const gatewayUrl = 'https://lawde.net'; // Specify your custom gateway URL here

    //console.log(providerUrl);

 
	const irys = new Irys({
		network, // URL of the node you want to connect to
		token, // Token used for payment
		key: process.env.EVM_PRIVATE_KEY, // EVM private key
		config: { providerUrl , gatewayUrl }, // Provider URL, only required when using devnet
	});
	return irys;
};
//const irys = await getIrys();

//console.log(irys.address);
const fundNode = async () => {
	const irys = await getIrys();
	try {
		const fundTx = await irys.fund(irys.utils.toAtomic(0.05));
		console.log(`Successfully funded ${irys.utils.fromAtomic(fundTx.quantity)} ${irys.token}`);
	} catch (e) {
		console.log("Error uploading data ", e);
	}
};
//await fundNode();
const uploadFile = async () => {
	const irys = await getIrys();
	// Your file
	const fileToUpload = "./Image 391x391.webp";
 
	const tags = [{ name: "application-id", value: "MyNFTDrop" }];
 
	try {
		const receipt = await irys.uploadFile(fileToUpload, { tags: tags });
		console.log(`File uploaded ==> https://arweave.net/${receipt.id}`);
	} catch (e) {
		console.log("Error uploading file ", e);
	}
};
await uploadFile();
