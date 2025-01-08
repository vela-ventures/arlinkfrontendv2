import { promises as fs } from 'fs';
import { join } from 'path';
import { getIndividualConfig } from './buildRegistry.js';

export default async function getFolderSizeInMB(directoryPath, owner, folderName) {
    try {
        const user = await getIndividualConfig(owner, folderName);
        const checkSize = user?.noSizeCheck;

        if (checkSize) {
            console.log('Skipping size check');
            return 1;
        }
        // Convert bytes to MB helper function
        const bytesToMB = bytes => bytes / (1024 * 1024);

        // Recursive function to calculate size
        async function calculateSize(currentPath) {
            const stats = await fs.stat(currentPath);

            if (stats.isFile()) {
                return stats.size;
            }

            if (stats.isDirectory()) {
                const files = await fs.readdir(currentPath);
                const sizes = await Promise.all(
                    files.map(file => 
                        calculateSize(join(currentPath, file))
                    )
                );

                return sizes.reduce((total, size) => total + size, 0);
            }

            return 0;
        }

        
        // Get total size in bytes
        const totalBytes = await calculateSize(directoryPath);
        
        // Return size in MB rounded to 2 decimal places
        return Number(bytesToMB(totalBytes).toFixed(2));
    } catch (error) {
        throw new Error(`Error calculating directory size: ${error.message}`);
    }
}