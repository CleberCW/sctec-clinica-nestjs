import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

console.log('tsconfigRootDir:', tsconfigRootDir);
