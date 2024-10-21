#!/usr/bin/env node

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import mime from "mime";
import { TurboFactory } from "@ardrive/turbo-sdk";
import { runBuild } from "./buildManager.js";
import { getLatestCommitHash } from './gitUtils.js';
import { initRegistry, addToRegistry, updateRegistry, getIndividualConfig, getDeployCount, getGlobalRegistry, incrementDeployCount } from './buildRegistry.js';
import axios from 'axios';
import { config } from "dotenv";
import { Webhooks } from '@octokit/webhooks';
import { Octokit } from "@octokit/rest";
import { setUnderName } from "./set-undername.js";
import kebabCase from "kebab-case";

config();


const PORT = 3050;

const webhookSecret = process.env.WEBHOOK_SECRET;

const webhooks = new Webhooks({ secret: webhookSecret });


const app = express();
app.use(express.json());
app.use(cors());

export async function deployFolder(folderPath) {
  try {
    console.log("Deploying folder at", folderPath);

    // Load your JWK
    const jwk = JSON.parse(await fsPromises.readFile("Wallet.json", "utf-8"));
    console.log("JWK loaded");

    // Initialize Turbo
    const turbo = TurboFactory.authenticated({ privateKey: jwk });
    console.log("Turbo initialized");

    // Get the wallet balance
    const { winc: balance } = await turbo.getBalance();
    console.log(`Current balance: ${balance} winc`);

    // Read and modify index.html paths
    const indexPath = path.join(folderPath, "index.html");
    if (fs.existsSync(indexPath)) {
      let indexContent = await fsPromises.readFile(indexPath, "utf-8");
      const modifiedContent = indexContent
        .replace(/ src="\//g, ' src="./')
        .replace(/ href="\//g, ' href="./');
      if (indexContent !== modifiedContent) {
        await fsPromises.writeFile(indexPath, modifiedContent, "utf-8");
        console.log("index.html paths modified");
      } else {
        console.log("index.html paths are already correct");
      }
    } else {
      throw new Error("index.html not found in the target folder.");
    }

    // Prepare files for upload
    const files = [];
    const readDir = async (dir) => {
      const items = await fsPromises.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const itemPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          await readDir(itemPath);
        } else {
          const relativePath = path.relative(folderPath, itemPath);
          const stats = await fsPromises.stat(itemPath);
          files.push({ path: relativePath, size: stats.size });
        }
      }
    };
    await readDir(folderPath);

    // Calculate total upload cost
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const [{ winc: uploadCost }] = await turbo.getUploadCosts({
      bytes: [totalSize],
    });
    console.log(`Total upload cost: ${uploadCost} winc`);

    // Upload files
    const uploadedFiles = [];
    for (const file of files) {
      const filePath = path.join(folderPath, file.path);
      try {
        console.log(`Uploading file: ${file.path}`);

        // Determine the content type using mime package
        const contentType =
          mime.getType(filePath) || "application/octet-stream";

        const uploadResult = await turbo.uploadFile({
          fileStreamFactory: () => fs.createReadStream(filePath),
          fileSizeFactory: () => file.size,
          signal: AbortSignal.timeout(60000),
          dataItemOpts: {
            tags: [
              {
                name: "Content-Type",
                value: contentType,
              },
            ],
          },
        });
        console.log(contentType);
        uploadedFiles.push({ path: file.path, id: uploadResult.id });
        console.log(`Uploaded ${file.path}: ${uploadResult.id}`);
      } catch (error) {
        console.error(`Failed to upload ${file.path}:`, error);
      }
    }
    // Create and upload manifest
    const manifest = {
      manifest: "arweave/paths",
      version: "0.2.0",
      index: {
        path: "index.html",
      },
      paths: {},
    };

    for (const file of uploadedFiles) {
      manifest.paths[file.path] = { id: file.id };
    }

    const manifestJson = JSON.stringify(manifest, null, 2);
    const manifestFilePath = path.join(folderPath, "manifest.json");
    await fsPromises.writeFile(manifestFilePath, manifestJson);
    console.log("Manifest saved:", manifestFilePath);
    const fileSize = fs.statSync(manifestFilePath).size;
    console.log(`Manifest size: ${fileSize} bytes`);

    // Upload the saved manifest file
    console.log("Uploading manifest...");
    const manifestUpload = await turbo.uploadFile({
      fileStreamFactory: () => fs.createReadStream(manifestFilePath),
      fileSizeFactory: () => fileSize,
      signal: AbortSignal.timeout(10_000),
      dataItemOpts: {
        tags: [
          {
            name: "Content-Type",
            value: "application/x.arweave-manifest+json",
          },
        ],
      },
    });
    console.log("Manifest uploaded:", manifestUpload.id);
    console.log(
      "Deployment complete. Access at:",
      `https://arweave.net/${manifestUpload.id}`,
    );
    // Delete the folder after deployment
    await fsPromises.rm(folderPath, { recursive: true, force: true });
    console.log("Deleted folder:", folderPath);

    return manifestUpload.id;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}


app.post('/github-webhook', async (req, res) => {

  try {

    const signature = req.headers["x-hub-signature-256"];
    const body = JSON.stringify(req.body);
    
    if (req.headers["x-github-event"] !== "push") {
      console.log(`Webhook is not pushed event`);
      res.status(200).send("Invalid event");
      return;
    }

    if (!(await webhooks.verify(body, signature))) {
      console.log(`Received invalid webhook signature`);
      res.status(401).send("Unauthorized");
      return;
    }
    console.log(`Received valid webhook signature`);
    const repository = `${req.body.repository.url}`;
    const branch = req.body.ref.split("/").pop();
    const owner = repository.split("/").reverse()[1];
    const folderName = `${repository}`
      .replace(/\.git|\/$/, "")
      .split("/")
      .pop();
  
    console.log ("Repository:", repository, "Owner :", owner, "Folder Name: ", folderName, "Branch: ", branch);
  
    const config = await getIndividualConfig(owner, folderName);
  
    if (!config) {
      console.log(`Configuration not found for ${owner}/${folderName}`);
      res.status(404).send("Configuration not found");
      return;
    }
    
    if(config.branch != branch){
      console.log("Branch mismatch");
      res.status(200).send("Branch mismatch");
      return;
    }
    
    console.log(`Checking for updates: ${config.owner}/${config.repoName}`);
    
    const deployCount = config.deployCount || 0;
    const maxDailyDeploys = config.maxDailyDeploys || 1000; // Default to 2 if not set
    
    if (deployCount >= maxDailyDeploys) {
      console.log(`Skipping ${config.owner}/${config.repoName}: Daily deployment limit reached`);
      return res.status(200).send("Daily deployment limit reached");
    }

    // Use the existing /deploy endpoint to trigger a build
    const response = await axios.post('http://localhost:3050/deploy', config);
    
    if (response.status === 200) {
      console.log(`Build triggered successfully for ${config.owner}/${config.repoName}`);
      await incrementDeployCount(config.owner, config.repoName);
    } else {
      console.log(`No update needed for ${config.owner}/${config.repoName}`);
    }
  } catch (error) {
    console.error(`Error processing ${config.owner}/${config.repoName}:`, error.message);
  }
  // The rest of your logic here
});

app.get("/check-github-app", async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const octokit = new Octokit({ auth: token });

    // Fetch the authenticated user's information
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const username = user.login;

    // Fetch installations for the authenticated user
    const { data } = await octokit.rest.apps.listInstallationsForAuthenticatedUser();
    
    const isInstalled = data.installations.some(installation => 
      installation.account.login.toLowerCase() === username.toLowerCase()
    );
    
    console.log('Authenticated user:', username);
    console.log('Is installed:', isInstalled);
    console.log('Installations data:', data);
    data.installations.forEach((installation) => {
      console.log('Installation:', installation.account);
    });

    res.status(200).json({ installed: isInstalled, username });
  } catch (error) {
    console.error('Error checking GitHub App installation:', error);
    res.status(500).json({ error: 'Failed to check GitHub App installation', details: error.message });
  }
});


app.get("/", (req, res) => {
  res.send("<pre>permaDeploy Builder Running!</pre>");
});

app.post("/deploy", async (req, res) => {
  console.log("Request:", req.body);
  const {
    repository,
    installCommand,
    buildCommand,
    outputDir,
    branch,
    subDirectory,
    protocolLand,
    walletAddress,
    repoName
  } = req.body;

  if (!repository) {
    console.error("Repository is required");
    return res.status(400).send("Repository is required");
  }
  if (!installCommand) {
    console.error("Install Command is required");
    return res.status(400).send("Install Command is required");
  }
  if (!buildCommand) {
    console.error("Build Command is required");
    return res.status(400).send("Build Command is required");
  }
  if (!outputDir) {
    console.error("Output Directory is required");
    return res.status(400).send("Output Directory is required");
  }
  const outputDist = outputDir.startsWith("./") ? outputDir.slice(2) : outputDir;

  if (!branch) {
    console.error("Branch is required");
    return res.status(400).send("Branch is required");
  }

  let owner, folderName;
  if (protocolLand) {
    owner = walletAddress;
    folderName = repoName;
  } else {
    owner = `${repository}`.split("/").reverse()[1];
    folderName = `${repository}`
      .replace(/\.git|\/$/, "")
      .split("/")
      .pop();
  }
  console.log("Folder name:", folderName);

  // Check if the owner already has a repository deployed
  const ownerPath = `./builds/${owner}`;
  if (fs.existsSync(ownerPath)) {
    const deployedRepos = fs.readdirSync(ownerPath);
    if (deployedRepos.length > 0) {
      if (deployedRepos.includes(folderName)) {
        console.log("Repo Already Deployed, proceeding with update");
        await updateRegistry(owner, folderName, { installCommand: installCommand, buildCommand: buildCommand, outputDir: outputDist, subDirectory: subDirectory });
        
      } else {
        console.error("User already has a different repository deployed");
        return res.status(400).send("You can only have one repository deployed at a time. Please remove the existing repository before deploying a new one.");
      }
    }
  }


  try {

    const latestCommit = await getLatestCommitHash(repository, branch);
    
    const buildConfig = {
      owner,
      repoName: folderName,
      repository,
      branch,
      installCommand,
      buildCommand,
      outputDir: outputDist,
      subDirectory,
      protocolLand,
      walletAddress,
      lastBuiltCommit: latestCommit,
      maxDailyDeploys: 10000000, // Default value
      deployCount: 0, // Initialize deploy count
      url: "",
      arnsUnderName:"",
    }
    

    
    // Check if this is a new deployment or an update
    const existingConfigs = await getGlobalRegistry();
    const existingConfig = existingConfigs.find(config => config.owner === owner && config.repoName === folderName);

    if (!existingConfig) {
      
      const result = await handleBuild(req, outputDist);
      if (result === false) {
        fs.rmSync(`./builds/${owner}/${folderName}`, { recursive: true, force: true });
        return res.status(500).send(`Deployment failed:`);
      }else {
        buildConfig.url = result;
        res.status(200).send(result);
        // if repoName is not provided, use the owner name and folder name
        const undernamePre = repoName ? repoName : `${folderName}`;
        buildConfig.arnsUnderName = kebabCase(`${undernamePre.toLowerCase()}`, false);;
        await setUnderName(buildConfig.arnsUnderName, result, latestCommit, owner);
        await addToRegistry(buildConfig);
        return
      }
    } else {
      const deployCount = await getDeployCount(owner, folderName);
      const maxDailyDeploys = buildConfig.maxDailyDeploys;
      
      if (deployCount >= maxDailyDeploys) {
        console.log(`Deployment limit reached for ${owner}/${folderName}`);
        return res.status(429).send("Daily deployment limit reached");
      }
      // Existing deployment, check for updates
      const individualConfig = await getIndividualConfig(owner, folderName);
      if (latestCommit !== individualConfig.lastBuiltCommit) {
        console.log(`New commit detected for ${owner}/${folderName}. Building...`);
        
        const buildResult = await handleBuild(req, outputDist);
        
        // Update registry with new commit hash
        await updateRegistry(owner, folderName, { lastBuiltCommit: latestCommit, url: buildResult });
        
        return res.status(200).send(buildResult);
      } else {
        console.log(`No new commits for ${owner}/${folderName}. Skipping build.`);
        return res.status(204).send("No new commits");
      }
    }
  } catch (error) {
    console.error("Build failed:", error);
    const logPathFolder = `./builds/${owner}/${folderName}/build.log`;

    fs.readFile(logPathFolder, "utf-8", (err, data) => {
      if (err) {
        console.error(`Error reading log: ${err.message}`);
        return res.status(404).send("Log not found");
      } else {
        fs.rmSync(`./builds/${owner}/${folderName}`, { recursive: true, force: true });
        return res.status(500).send(data);
      }
    });
    
    return res.status(500).send(error.message);
  }
});

async function handleBuild(req, outputDist) {
  const { repository, branch, installCommand, buildCommand, subDirectory, protocolLand, walletAddress, repoName } = req.body;

  const buildParams = {
    repository,
    branch,
    installCommand,
    buildCommand,
    outputDist,
    subDirectory,
    protocolLand,
    walletAddress,
    repoName
  };

  try {
    const { result, buildPath } = await runBuild(buildParams);

    console.log("Build completed:", result);

    try {
      const deployResult = await deployFolder(buildPath);
      console.log(deployResult)
      return deployResult;
    } catch (deployError) {
      return false;
    } finally {
      // Clean up the build folder
      fs.rmSync(buildPath, { recursive: true, force: true });
    }
  } catch (buildError) {
    console.error("Build failed:", buildError);
    return false ;
  }
}

app.get("/logs/:owner/:repo", (req, res) => {
  const { owner, repo } = req.params;
  const logPath = `./builds/${owner}/${repo}/build.log`;

  fs.readFile(logPath, "utf-8", (err, data) => {
    if (err) {
      console.error(`Error reading log: ${err.message}`);
      return res.status(404).send("Log not found");
    } else {
      return res.status(200).send(data);
    }
  });
});

app.get("/config/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params;

  try {
    const config = await getIndividualConfig(owner, repo);
    if (config) {
      return res.status(200).json(config);
    } else {
      return res.status(404).send("Configuration not found");
    }
  } catch (error) {
    console.error(`Error fetching config for ${owner}/${repo}:`, error);
    return res.status(500).send("Internal server error");
  }
});

app.post("/github/callback", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      client_secret: process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: 'application/json' }
    });

    console.log ('Response:', response.data);

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
});

// app.post("/update-max-deploys", async (req, res) => {
//   const { owner, repoName, maxDailyDeploys } = req.body;

//   if (!owner || !repoName || !maxDailyDeploys) {
//     return res.status(400).send("Missing required parameters");
//   }

//   try {
//     await updateMaxDailyDeploys(owner, repoName, maxDailyDeploys);
//     return res.status(200).send("Max daily deploys updated successfully");
//   } catch (error) {
//     console.error("Error updating max daily deploys:", error);
//     return res.status(500).send(error.message);
//   }
// });

const server = app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});

initRegistry().catch(console.error);

server.setTimeout(60 * 60 * 1000);
server.keepAliveTimeout = 60 * 60 * 1000;