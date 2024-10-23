import { promises as fs } from 'fs';
import { join } from 'path';
import { getIndividualConfig } from './buildRegistry';

export default async function getFolderSizeInMB(folderPath) {
    let totalSize = 0;
    
    try {
        const user = await getIndividualConfig('user');
        const checkSize = user?.noSizeCheck;

        if (checkSize) {
            console.log('Skipping size check');
            return 1;
        }

        const files = await fs.readdir(folderPath);
        
        for (const file of files) {
            const filePath = join(folderPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.isDirectory()) {
                totalSize += await getFolderSizeInMB(filePath) * 1024 * 1024;
            } else {
                totalSize += stats.size;
            }
        }
        
        return Number((totalSize / 1024 / 1024).toFixed(2));
    } catch (error) {
        console.error('Error reading folder:', error);
        return 0;
    }
}