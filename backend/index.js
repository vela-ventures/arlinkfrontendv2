#!/usr/bin/env node

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import mime from "mime";
import { TurboFactory } from "@ardrive/turbo-sdk";
import { runBuild } from "./buildManager.js";

const PORT = 3050;

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
  //const outputDist =  a function which checks if outputDir is prefixed with ./ if it is removes it
  const outputDist = outputDir.startsWith("./") ? outputDir.slice(2) : outputDir;


  if (!branch) {
    console.error("Branch is required");
    return res.status(400).send("Branch is required");
  }

  //owner will be the github username, extracted from the repository url, index it from reverse so it's compatible with all git urls
  const owner = `${repository}`.split("/").reverse()[1];

  const folderName = `${repository}`
    .replace(/\.git|\/$/, "")
    .split("/")
    .pop();
  console.log("Folder name:", folderName);

  // Check if the owner already has a repository deployed
  const ownerPath = `./builds/${owner}`;
  if (fs.existsSync(ownerPath)) {
    const deployedRepos = fs.readdirSync(ownerPath);
    if (deployedRepos.length > 0) {
      if (deployedRepos.includes(folderName)) {
        console.log("Repo Already Deployed, proceeding with rebuild");
      } else {
        console.error("User already has a different repository deployed");
        return res.status(400).send("You can only have one repository deployed at a time. Please remove the existing repository before deploying a new one.");
      }
    }
  }

await handleBuild(req, res, outputDist);

});

async function handleBuild(req, res, outputDist) {
  const { repository, branch, installCommand, buildCommand, subDirectory } = req.body;

  const buildParams = {
    repository,
    branch,
    installCommand,
    buildCommand,
    outputDist,  // Use outputDist instead of outputDir
    subDirectory
  };

  try {
    const { result, buildPath } = await runBuild(buildParams);

    console.log("Build completed:", result);

    try {
      const deployResult = await deployFolder(buildPath);
      res.send(deployResult);
    } catch (deployError) {
      return res.status(400).send(deployError.message);
    } finally {
      // Clean up the build folder
      fs.rmSync(buildPath, { recursive: true, force: true });
    }
  } catch (buildError) {
    console.error("Build failed:", buildError);
    return res.status(500).send(buildError.message);
  }
}

app.get("/logs/:owner/:repo", (req, res) => {
  const { owner, repo } = req.params;
  const logPath = `./builds/${owner}/${repo}/build.log`;

  fs.readFile(logPath, "utf-8", (err, data) => {
    if (err) {
      console.error(`Error reading log: ${err.message}`);
      res.status(404).send("Log not found");
    } else {
      res.status(200).send(data);
    }
  });
});

const server = app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
server.setTimeout(60 * 60 * 1000);
server.keepAliveTimeout = 60 * 60 * 1000;
