
const AKSHARA_MUKHA = "http://aksharamukha-plugin.appspot.com/api/public"
export const callAksharamukhaWithSpecifics = async (body: AksharaMukhaGetProps) => {
    const result = await callAksharamukha(body);
    const e_macronRemoval = result.replace(/ē/g, 'e')
    const n_tildaRemoval = e_macronRemoval.replace(/Jṭ/ig, 'gy')

    // console.log(`For input: ${body.text} \nResult: ${n_tildaRemoval}`);
    return n_tildaRemoval;
}
export const callAksharamukha = async (body: AksharaMukhaGetProps) => {
    const response = await fetch(`${AKSHARA_MUKHA}?source=${body.source}&target=${body.target}&text=${body.text}&nativize=${body.nativize}`)
    const result = await response.text();
    // console.log(`For input: ${body.text} \nResult: ${n_tildaRemoval}`);
    return result;
}

export const aksharamukhaIastToRomanColloquial = async (text: string, nativize = false) => {
    const body = {
        "source": "IAST",
        "target": "RomanColloquial",
        "text": text,
        "nativize": nativize,
    }
    return callAksharamukhaWithSpecifics(body);
}

export const aksharamukhaHKToRomanColloquial = async (text: string, nativize = false) => {
    const body = {
        "source": "Velthuis",
        "target": "RomanColloquial",
        "text": text,
        "nativize": nativize,
    }
    return callAksharamukhaWithSpecifics(body);
}
///􀁂􀀏􀁎􀀃􀁔􀁖􀁎􀁂􀁅􀁂􀁂􀁈􀁂􀁎􀁂􀀍􀀁􀁂􀀏􀁎􀀃􀁔􀁖􀁎􀁂􀁕􀁌􀁂􀁂􀀃􀁔􀁚􀁂􀁑􀁂􀁂􀁈􀁂􀁎􀁂􀀁
//a.m"sumadaagama

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