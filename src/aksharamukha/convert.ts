export const callAksharamukha = async (body: AksharaMukhaGetProps) => {
    const response = await fetch(`http://aksharamukha-plugin.appspot.com/api/public?source=${body.source}&target=${body.target}&text=${body.text}&nativize=${body.nativize}`)
    const result = await response.text();
    const e_macronRemoval = result.replace(/ē/g, 'e')
    const n_tildaRemoval = e_macronRemoval.replace(/Jṭ/ig, 'gy')
    
    console.log(`For input: ${body.text} \nResult: ${n_tildaRemoval}`);
    return n_tildaRemoval;
}

export const aksharamukhaIastToRomanColloquial = async (text: string, nativize = false) => {
    const body = {
        "source": "IAST",
        "target": "RomanColloquial",
        "text": text,
        "nativize": nativize,
    }
    return callAksharamukha(body);
}

export interface AksharaMukhaGetProps {
    source: string;
    target: string;
    text: string;
    nativize: boolean;
    postOptions?: (null)[] | null;
    preOptions?: (null)[] | null;
}


const jsonBody: AksharaMukhaGetProps = {
    "source": "IAST",
    "target": "RomanColloquial",
    "text": "Tamilē rayar vaittiya nul    Kriyā-Prayoga $ \nTantra-Kriyā \nĀgama-Nibandha \nKośa \nĀgama-Kriyā \nKriyā-Prayoga Āgama",
    "nativize": true,
    "postOptions": [],
    "preOptions": []
}
callAksharamukha(jsonBody).then((res) => {
    console.log(res)
})

//yarn run aksharamukha