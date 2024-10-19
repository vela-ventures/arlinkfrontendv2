import axios from 'axios';

interface ArnsName {
  name: string;
  processId: string;
}

export async function getWalletOwnedNames(walletAddress: string): Promise<ArnsName[]> {
  const registryUrl = 'https://cu138.ao-testnet.xyz/dry-run?process-id=i_le_yKKPVstLTDSmkHRqf-wYphMnwB9OhleiTgMkWc';
  const namesUrl = 'https://cu.ar-io.dev/dry-run?process-id=agYcCFJtrMG6cqMuZfskIkFTGvUPddICmtQSBIoPdiA';
  
  const headers = {
    'accept': '*/*',
    'content-type': 'application/json',
    'origin': 'https://arns.app',
    'referer': 'https://arns.app/'
  };

  try {
    // First API call to get owned process IDs
    const registryBody = JSON.stringify({
      Id: "1234",
      Target: "i_le_yKKPVstLTDSmkHRqf-wYphMnwB9OhleiTgMkWc",
      Owner: "1234",
      Anchor: "0",
      Data: "1234",
      Tags: [
        { name: "Action", value: "Access-Control-List" },
        { name: "Address", value: walletAddress },
        { name: "Data-Protocol", value: "ao" },
        { name: "Type", value: "Message" },
        { name: "Variant", value: "ao.TN.1" }
      ]
    });

    const registryResponse = await axios.post(registryUrl, registryBody, { headers });
    const registryData = registryResponse.data;

    let ownedProcessIds: string[] = [];
    if (registryData.Messages && registryData.Messages.length > 0) {
      const ownedData = JSON.parse(registryData.Messages[0].Data);
      ownedProcessIds = ownedData.Owned || [];
    }

    // Second API call to get names
    const namesBody = JSON.stringify({
      Id: "1234",
      Target: "agYcCFJtrMG6cqMuZfskIkFTGvUPddICmtQSBIoPdiA",
      Owner: "1234",
      Anchor: "0",
      Data: "1234",
      Tags: [
        { name: "Action", value: "Paginated-Records" },
        { name: "Limit", value: "50000" },
        { name: "Data-Protocol", value: "ao" },
        { name: "Type", value: "Message" },
        { name: "Variant", value: "ao.TN.1" }
      ]
    });

    const namesResponse = await axios.post(namesUrl, namesBody, { headers });
    const namesData = namesResponse.data;

    const processIdToName = new Map<string, string>();
    if (namesData.Messages && namesData.Messages.length > 0) {
      const items = JSON.parse(namesData.Messages[0].Data).items || [];
      for (const item of items) {
        if (ownedProcessIds.includes(item.processId)) {
          processIdToName.set(item.processId, item.name);
        }
      }
    }

    // Match process IDs with names
    return ownedProcessIds.map(processId => ({
      name: processIdToName.get(processId) || processId,
      processId
    }));

  } catch (error) {
    console.error("Error fetching wallet owned names:", error);
    throw error;
  }
}