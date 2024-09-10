#!/usr/bin/env node

import express from "express";
import cors from "cors";
import dockerode from "dockerode";
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises'; // Import the fs/promises module for async methods

import {
    TurboFactory,
    developmentTurboConfiguration,
  } from "@ardrive/turbo-sdk";


import { createClient } from "redis";
import removeDanglingImages from "./rmdockerimg.js";
import { concatBuffers } from "arweave/node/lib/utils.js";

const PORT = 3001;
const MAX_CONTAINERS = 3;
let activeContainers = 0;

const redisClient = createClient();
redisClient.on("error", (err) => console.error("Redis Client Error", err));
(async () => {
    try {
        await redisClient.connect();
        console.log("Connected to Redis");
    } catch (err) {
        console.error("Failed to connect to Redis do you have redis installed????", err);
    }
})();

const app = express();
app.use(express.json());
app.use(cors());

// Gets MIME types for each file to tag the upload
async function getContentType(filePath) {
    return mime.lookup(filePath);
}

export async function deployFolder(folderPath) {
    try {
        console.log("Deploying folder at", folderPath);

        // Load your JWK
        const jwk = JSON.parse(await fsPromises.readFile('/Users/nischalnaik/Documents/permadeploy/backend/Wallet .json', 'utf-8'));
        console.log('JWK loaded');

        // Initialize Turbo
        const turbo = TurboFactory.authenticated({ privateKey: jwk });
        console.log('Turbo initialized');

        // Get the wallet balance
        const { winc: balance } = await turbo.getBalance();
        console.log(`Current balance: ${balance} winc`);

        // Initialize the manifest
        let manifest = {
            manifest: 'arweave/paths',
            version: '0.2.0',
            index: { path: 'index.html' },
            fallback: {},
            paths: {},
        };

        async function processFiles(dir) {
            const files = await fsPromises.readdir(dir);
            for (const file of files) {
                try {
                    const filePath = path.join(dir, file);
                    const relativePath = path.relative(folderPath, filePath);
                    const stat = await fsPromises.stat(filePath);

                    if (stat.isDirectory()) {
                        // Recursively process all files in a directory
                        await processFiles(filePath);
                    } else {
                        console.log(`Uploading file: ${relativePath}`);
                        try {
                            const fileSize = stat.size;
                            const contentType = await getContentType(filePath);
                            const uploadResult = await turbo.uploadFile({
                                fileStreamFactory: () => fs.createReadStream(filePath),
                                fileSizeFactory: () => fileSize,
                                signal: AbortSignal.timeout(60000), // Cancel the upload after 60 seconds
                                dataItemOpts: {
                                    tags: [
                                        { name: 'Content-Type', value: contentType },
                                        { name: 'App-Name', value: 'Permaweb-Deploy' },
                                    ],
                                },
                            });
                            console.log(`Uploaded ${relativePath} with id:`, uploadResult.id);
                            // Add uploaded file txId to the manifest
                            manifest.paths[relativePath] = { id: uploadResult.id };
                            if (file === '404.html') {
                                // Set manifest fallback to 404.html if found
                                manifest.fallback.id = uploadResult.id;
                            }
                        } catch (err) {
                            console.error(`Error uploading file ${relativePath}:`, err);
                        }
                    }
                } catch (err) {
                    console.error('ERROR:', err);
                }
            }
        }

        async function uploadManifest(manifest) {
            try {
                const manifestString = JSON.stringify(manifest);
                const uploadResult = await turbo.uploadFile({
                    fileStreamFactory: () => Readable.from(Buffer.from(manifestString)),
                    fileSizeFactory: () => Buffer.byteLength(manifestString),
                    signal: AbortSignal.timeout(60000),
                    dataItemOpts: {
                        tags: [
                            {
                                name: 'Content-Type',
                                value: 'application/x.arweave-manifest+json',
                            },
                            {
                                name: 'App-Name',
                                value: 'Permaweb-Deploy',
                            },
                        ],
                    },
                });
                return uploadResult.id;
            } catch (error) {
                console.error('Error uploading manifest:', error);
                return null;
            }
        }

        // Start processing files in the selected directory
        await processFiles(folderPath);

        if (!manifest.fallback.id) {
            // If no 404.html file is found, set manifest fallback to the txId of index.html
            manifest.fallback.id = manifest.paths['index.html'].id;
        }

        const manifestId = await uploadManifest(manifest);
        if (manifestId) {
            console.log(`Manifest uploaded with Id: ${manifestId}`);
            console.log('Deployment complete. Access at:', `https://arweave.net/${manifestId}`);
            return manifestId;
        } else {
            throw new Error('Failed to upload manifest');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

app.get('/', (req, res) => {
    res.send('<pre>permaDeploy Builder Running!</pre>');
});

app.post('/deploy', async (req, res) => {
    console.log('Request:', req.body);
    const { repository, installCommand, buildCommand, outputDir, branch } = req.body;

    if (!repository) {
        console.error('Repository is required');
        return res.status(400).send('Repository is required');
    }
    if (!installCommand) {
        console.error('Install Command is required');
        return res.status(400).send('Install Command is required');
    }
    if (!buildCommand) {
        console.error('Build Command is required');
        return res.status(400).send('Build Command is required');
    }
    if (!outputDir) {
        console.error('Output Directory is required');
        return res.status(400).send('Output Directory is required');
    }
    if (!branch) {
        console.error('Branch is required');
        return res.status(400).send('Branch is required');
    }

    const folderName = `${repository}`.replace(/\.git|\/$/, '').split('/').pop();
    console.log('Folder name:', folderName);

    if (activeContainers >= MAX_CONTAINERS) {
        await redisClient.rPush("deployQueue", JSON.stringify({ req: req.body, res: res }));
        console.log('Added to queue');
    } else {
        activeContainers++;
        handleDeployment({ req, res, folderName, repository, installCommand, buildCommand, outputDir, branch });
    }
});

async function handleDeployment({ req, res, folderName, repository, installCommand, buildCommand, outputDir, branch }) {
    if (!fs.existsSync(`./builds/${folderName}`)) {
        fs.rmSync(`./builds/${folderName}`, { recursive: true, force: true });
        fs.mkdirSync(`./builds/${folderName}`, { recursive: true });
    }
    fs.writeFileSync(`./builds/${folderName}/log.txt`, '');

    const docker = new dockerode({ socketPath: '/var/run/docker.sock' });

    await docker.pull('node');
    console.log('Pulled node image');

    const container = await docker.createContainer({
        Image: 'node',
        Cmd: ['sh'],
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        OpenStdin: true,
        HostConfig: {
            Binds: [`${process.cwd()}/builds:/home/node/builds`]
        }
    });
    console.log('Created container');
    await container.start();

    var containerCommand = `cd /home/node;
    rm -rf /home/node/${folderName}/${outputDir};
    echo "" > /home/node/${folderName}/log.txt;
    git clone -b ${branch} ${repository} ${folderName};
    cd /home/node/${folderName};
    ${installCommand};
    ${buildCommand};
    cp -r /home/node/${folderName}/${outputDir} /home/node/builds/${folderName}`;

    if (installCommand.startsWith('pnpm')) {
        containerCommand = `npm i -g pnpm; ${containerCommand}`;
    } else if (installCommand.startsWith('yarn')) {
        containerCommand = `npm i -g yarn; ${containerCommand}`;
    }

    fs.rmSync(`./builds/${folderName}`, { recursive: true, force: true });
    fs.mkdirSync(`./builds/${folderName}`, { recursive: true });

    const exec = await container.exec({
        Cmd: ['sh', '-c', containerCommand],
        AttachStderr: true,
        AttachStdout: true,
        Tty: true
    });

    exec.start({
        hijack: true,
        stdin: true,
        Detach: false
    }, (err, stream) => {
        if (err) {
            console.log('Exec error:', err);
            return;
        }

        container.modem.demuxStream(stream, process.stdout, process.stderr);
        const fileStream = fs.createWriteStream(`./builds/${folderName}/log.txt`);
        container.modem.demuxStream(stream, fileStream, fileStream);

        stream.on('end', async (err) => {
            console.log('Exec end');
            await container.commit();
            if (!fs.existsSync(`./builds/${folderName}/${outputDir}/index.html`)) {
                res.status(500).send('index.html does not exist in build');
            } else {
                try {
                    const dres = await deployFolder(`./builds/${folderName}/${outputDir}`);
                    res.send(dres);
                } catch (e) {
                    res.status(400).send(e.message);
                }
            }

            await container.stop();
            await container.remove();
            await removeDanglingImages();
          
            activeContainers--;
            processQueue();
        });
    });
}

async function processQueue() {
    if (activeContainers < MAX_CONTAINERS) {
        const queueItem = await redisClient.lPop("deployQueue");
        if (queueItem) {
            const { req, res } = JSON.parse(queueItem);
            activeContainers++;
            const { repository, installCommand, buildCommand, outputDir, branch } = req;
            const folderName = `${repository}`.replace(/\.git|\/$/, '').split('/').pop();
            handleDeployment({ req, res, folderName, repository, installCommand, buildCommand, outputDir, branch });
        }
    }
}

app.get('/logs/:folder', (req, res) => {
    const { folder } = req.params;
    try {
        const log = fs.readFileSync(`./builds/${folder}/log.txt`, 'utf-8');
        res.send(log);
    } catch (e) {
        res.status(200).send('Log not found');
    }
}); 

const server = app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
});
server.setTimeout(60 * 60 * 1000);
server.keepAliveTimeout = 60 * 60 * 1000;