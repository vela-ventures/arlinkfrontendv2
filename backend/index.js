#!/usr/bin/env node

import express from "express";
import cors from "cors";
import dockerode from "dockerode";
import fs from "fs";
import Irys from "@irys/sdk";
import { createClient } from "redis";
import  removeDanglingImages  from "./rmdockerimg.js";


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

export async function deployFolder(path) {
    console.log("Deploying folder at", path);

     const jwk = JSON.parse(fs.readFileSync('/Users/nischalnaik/Documents/permadeploy/backend/Wallet .json', 'utf-8'));
    
    const irys = new Irys({ url: 'https://turbo.ardrive.io', token: 'arweave', key: jwk });
    irys.uploader.useChunking = false;

    const txResult = await irys.uploadFolder(path, {
        indexFile: 'index.html',
        interactivePreflight: false,
        logFunction: (log) => {
            console.log(log);
            fs.appendFileSync(`${path}/../log.txt`, log + '\n');
        }
    });
    console.log('Transaction ID:', txResult.id);

    if (fs.existsSync(`${path}/../out-errors.txt`)) {
        const errors = fs.readFileSync(`${path}/../out-errors.txt`, 'utf-8');
        console.log('Errors:', errors);
        fs.appendFileSync(`${path}/../log.txt`, errors + '\n');
        throw new Error(errors);
    } else {
        console.log('No errors found');
        console.log('Transaction ID:', txResult.id);
        return txResult.id;
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