import { TurboFactory, USD, WinstonToTokenAmount } from "@ardrive/turbo-sdk";
import fs from "fs";
import path from "path";

async function uploadFileToTurbo() {
  try {
    // Load your JWK (JSON Web Key)
    const jwk = JSON.parse(fs.readFileSync('/Users/nischalnaik/Documents/permadeploy/backend/Wallet .json', 'utf-8'));

    // Create an authenticated Turbo client
    const turbo = TurboFactory.authenticated({ privateKey: jwk });

    // Check balance
    const { winc: balance } = await turbo.getBalance();
    console.log(`Current balance: ${balance} winc`);

    // Specify the file to upload
    const filePath = '/Users/nischalnaik/Documents/permadeploy/backend/builds/preact-test-template/dist/index.html';
    const fileSize = fs.statSync(filePath).size;
    console.log(`File size: ${fileSize} bytes`);
    // Get the cost of uploading the file
    const [{ winc: uploadCost }] = await turbo.getUploadCosts({ bytes: [fileSize] });
    console.log(`Upload cost: ${uploadCost} winc`);

    // Check if balance is sufficient
    // if (balance < uploadCost) {
    //   console.log("Insufficient balance. Topping up...");
      
    // //   // Top up with 0.10 USD worth of credits
    // //   const topUpResult = await turbo.topUpWithTokens({
    // //     tokenAmount: WinstonToTokenAmount(await turbo.getWincForFiat({ amount: USD(0.10) })),
    // //   });
    // //   console.log("Top up successful:", topUpResult);

    //   // Check new balance
    //   const { winc: newBalance } = await turbo.getBalance();
    //   console.log(`New balance after top-up: ${newBalance} winc`);
    // }

    console.log(`Uploading file: ${filePath}`);

    // Upload the file
    const uploadResult = await turbo.uploadFile({
      fileStreamFactory: () => fs.createReadStream(filePath),
      fileSizeFactory: () => fileSize,
      signal: AbortSignal.timeout(60000), // 60 seconds timeout
    });

    console.log('Upload successful!');
    console.log('Transaction ID:', uploadResult.id);
    console.log('Data caches:', uploadResult.dataCaches);
    console.log('View your file at:', `https://arweave.net/${uploadResult.id}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the upload function
uploadFileToTurbo();