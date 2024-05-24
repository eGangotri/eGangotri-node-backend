import { exec } from 'child_process';

export const launchWinExplorer = async (_path: string) => {
    exec(`explorer.exe ${_path}`, (err) => {
        if (err) {
            console.error(`launchWinExplorer:exec error: ${err}`);
            return;
        }
    });
}