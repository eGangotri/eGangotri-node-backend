export const callAksharamukha = async (body: AksharaMukhaGetProps) => {
    const response = await fetch(`http://aksharamukha-plugin.appspot.com/api/public?source=${body.source}&target=${body.target}&text=${body.text}&nativize=${body.nativize}`)
    const result = await response.text();
    //console.log(result);
    return result;
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
  

const jsonBody:AksharaMukhaGetProps = {
    "source": "IAST",
    "target": "RomanColloquial",
    "text": "Kriyā-Prayoga $ \nTantra-Kriyā \nĀgama-Nibandha \nKośa \nĀgama-Kriyā \nKriyā-Prayoga Āgama",
    "nativize": true,
    "postOptions": [],
    "preOptions": []
}

callAksharamukha(jsonBody);


//yarn run aksharamukha