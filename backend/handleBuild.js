import { runBuild } from "./buildManager.js";
import { promises as fs } from 'fs';
import deployFolder from "./turbo.js";
import getFolderSizeInMB from "./sizeCheck.js";

export default async function handleBuild(req, outputDist, owner, folderName) {

  
    try {


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

      const { result, buildPath } = await runBuild(buildParams);
  
      console.log("Build completed:", result);
  
      try {

        const maxSize = 60;

        // Check folder size before deploying
        const folderSize = await getFolderSizeInMB(buildPath, owner, folderName);
        
        if (folderSize > maxSize) {
          console.error(`Build size (${folderSize}MB) exceeds ${maxSize}MB limit`);
          return false;
        }

        const deployResult = await deployFolder(buildPath);
        console.log(deployResult)
        return deployResult;
      } catch (deployError) {
        return false;
      } finally {
        // Clean up the build folder
        await fs.rm(buildPath, { recursive: true, force: true });
      }
    } catch (buildError) {
      console.error("Build failed:", buildError);
      return false ;
    }
  }
