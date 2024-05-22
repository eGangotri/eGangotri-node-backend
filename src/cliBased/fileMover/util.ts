import { exec } from 'child_process';

export const launchWinExplorer = (_path: string) => {
    exec(`explorer.exe ${_path}`, (err) => {
        if (err) {
            console.error(`exec error: ${err}`);
            return;
        }
    });
}