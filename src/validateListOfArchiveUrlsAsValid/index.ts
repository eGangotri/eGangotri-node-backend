import { checkArchiveUrlValidity } from "../utils/utils";


const urlData = `
(1). Adhunik Bharatiya Arya Bhashao Ka Punarvargikaran By Ghanshyam Vyas 1981 - Gurukul Kangri Collection
        https://archive.org/details/2430_20250817
        
(2). Ahle Hindi Ki Jismani Kamzori Or Thfuz Ki Taabir G.K.V Urdu - Gurukul Kangri Collection
        https://archive.org/details/2434_20250817
`;

(async () => {
    const lines = urlData.split('\n');
    for (const line of lines) {
       console.log(`Opening ${line}: `);

        if (line?.trim().startsWith('http')) {
            const result = await checkArchiveUrlValidity(line,0,0);
            console.log(`Opening ${line}: ${result}`);
        }
    }
})()
