<<<<<<< HEAD

const AKSHARA_MUKHA = "http://aksharamukha-plugin.appspot.com/api/public"
export const DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL = "RomanColloquial";
=======
import axios from 'axios';

const AKSHARA_MUKHA_URL = 
"https://www.aksharamukha.com/api/convert"

//"http://aksharamukha-plugin.appspot.com/api/public"
//Script Names: https://www.aksharamukha.com/explore
export const DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL = "RomanColloquial";
export const AKSHARA_MUKHA_DEVANAGARI = "Devanagari";
export const AKSHARAMUKHA_IAST = "IAST";
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3

export const callAksharamukhaWithSpecifics = async (body: AksharaMukhaGetProps) => {
    const result = await callAksharamukha(body);
    const e_macronRemoval = result.replace(/ē/g, 'e')
    const n_tildaRemoval = e_macronRemoval.replace(/Jṭ/ig, 'gy')

    // console.log(`For input: ${body.text} \nResult: ${n_tildaRemoval}`);
    return n_tildaRemoval;
}

<<<<<<< HEAD
export const callAksharamukha = async (body: AksharaMukhaGetProps) => {
    const response = await fetch(`${AKSHARA_MUKHA}?source=${body.source}&target=${body.target}&text=${body.text}&nativize=${body.nativize}`)
    const result = await response.text();
    // console.log(`For input: ${body.text} \nResult: ${n_tildaRemoval}`);
    return result;
}

export const callAksharamukhaToRomanColloquial = async (sourceScript:string, text:string) => {
=======
//Record<string, unknown>
export const callAksharamukha = async (body: AksharaMukhaGetProps, asPost = false):Promise<string> => {
    if (asPost) {
        const url = `${AKSHARA_MUKHA_URL}`;
        console.log(`POSTing to ${url} with body: ${JSON.stringify(body)}`);
        try {
         
            const x: Record<string, unknown> = {
                "source": "Devanagari",
                "target": "IAST",
                "text": "ॐ नमः शिवाय शिवाय \n\n",
                "nativize": true,
                "postOptions": [],
                "preOptions": []
            }
            // const response = await fetch(url, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(x)
            // });
            const response = await axios.post(AKSHARA_MUKHA_URL, body, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            const responseText = await response.data;
            console.log('Raw response:', responseText);
            return responseText;
        } catch (error) {
            console.error('Error making POST request:', error);
            throw error;
        }
    }

    else {
        const response = await fetch(`${AKSHARA_MUKHA_URL}?source=${body.source}&target=${body.target}&text=${body.text}&nativize=${body.nativize}`)
        const result = await response.text();
        console.log(`For input: ${body?.text}`);
        return result;
    }
}

export const callAksharamukhaToRomanColloquial = async (sourceScript: string, text: string) => {
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
    const body = {
        "source": sourceScript,
        "target": DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL,
        "text": text,
        "nativize": true,
    }
    return callAksharamukha(body);
}


export const aksharamukhaIastToRomanColloquial = async (text: string, nativize = false) => {
    const body = {
        "source": "IAST",
        "target": DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL,
        "text": text,
        "nativize": nativize,
    }
    return callAksharamukhaWithSpecifics(body);
}

export const aksharamukhaHKToRomanColloquial = async (text: string, nativize = false) => {
    const body = {
        "source": "Velthuis",
        "target": DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL,
        "text": text,
        "nativize": nativize,
    }
    return callAksharamukhaWithSpecifics(body);
}
///􀁂􀀏􀁎􀀃􀁔􀁖􀁎􀁂􀁅􀁂􀁂􀁈􀁂􀁎􀁂􀀍􀀁􀁂􀀏􀁎􀀃􀁔􀁖􀁎􀁂􀁕􀁌􀁂􀁂􀀃􀁔􀁚􀁂􀁑􀁂􀁂􀁈􀁂􀁎􀁂􀀁
//a.m"sumadaagama

<<<<<<< HEAD
export interface AksharaMukhaGetProps {
    source: string;
=======
export const aksharaMukhaAutoDetectScriptToRomanColloguial = async (text: string, nativize = false) => {
    const body = {
        "target": DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL,
        "text": text,
        "nativize": nativize,
    }
    return callAksharamukha(body,true);
}

export interface AksharaMukhaGetProps {
    source?: string;
>>>>>>> 94ae3b987dd0a3e988dbdea22162cc68a699ace3
    target: string;
    text: string;
    nativize: boolean;
    postOptions?: (null)[] | null;
    preOptions?: (null)[] | null;
}


const jsonBody: AksharaMukhaGetProps = {
    "source": "IAST",
    "target": DEFAULT_TARGET_SCRIPT_ROMAN_COLLOQUIAL,
    "text": "Tamilē rayar vaittiya nul    Kriyā-Prayoga $ \nTantra-Kriyā \nĀgama-Nibandha \nKośa \nĀgama-Kriyā \nKriyā-Prayoga Āgama",
    "nativize": true,
    "postOptions": [],
    "preOptions": []
}
// aksharamukhaHKToRomanColloquial(`a.m"sumadaagama`)
// callAksharamukha({
//     ...jsonBody,
//     "source": "Velthuis",
//     "target": "Devanagari",
//     "text":`a.m"sumadaagama`
// }).then((res) => {
//     console.log(res)
// })

//yarn run aksharamukha