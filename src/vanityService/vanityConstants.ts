import sharp from 'sharp';

export const MAX_IMG_WIDTH = 700;
export const MAX_IMG_HEIGHT = 700;
export const DEFAULT_FONT_SIZE = 12


const text_Peerzada = `This PDF you are browsing is in a series of several scanned documents containing 
the collection of Peerzada Muhammad Ashraf Sahib. b 1958<br>
CV:<br>
Residence: Towheed Abad Bemina, Srinagar<br>
https://www.facebook.com/peerzadamohd.ashraf.16<br>

Former Deputy Director Archives, Archaeology and Museums Deptt. J&K Govt.<br>
Former State Coordinator National Manuscripts Mission GoI.<br>
Former Registering Officer Antiquities, Jammu and Kashmir Govt.<br>
Former Registar National Records, Jammu and Kashmir Govt.<br>
Worked as Lecturer Arabic in Higher Education Department.<br>
Studied at Aligarh Muslim University.<br>
Lives in Srinagar, Jammu and Kashmir.<br>
From Anantnag.<br>

Peerzada Muhammad Ashraf Sahib has an ancestral Collection of Rare Books and Manuscripts in Sharada, Sanskrit, Persian, Arabic, Urdu, Kashmiri in his Home Town Srinagar.<br>
Besides manuscripts, he also has many rare paintings (60+).<br>
Collectors and Art/Literature  Lovers can contact him if they wish through his facebook page<br><br>
Scanning and upload by eGangotri Trust.<br>`

const text3_SGhulati = `This PDF you are browsing is in a series of several scanned documents containing 
 the personal colleciton of Shailendra Ghulati ji from Jammu.<br>
 CV:<br>
 Shailendra Gulhati who is a Shaivite author of 6 books, used to learn finer aspects of Kashmir Shaiv Darsana from 
 B N Panditji in the year 1995 in panditji’s Jammu residence. <br>
 Ballajinath ji gave Shailendra a photocopy of his hand written notes on Siva sutras.<br>
 He also reviewed Shailendra’s first book "The Yogi and the Snake".<br>
 Shailendra is an online guide for Shaivism and may be reached on his Facebook page
https://www.facebook.com/shailgulhatishivapage<br>
Whilst his books are available on Amazon.<br>
Scanning and upload by eGangotri Trust.<br>`

const text2_Mohtra = `This PDF you are browsing is in a series of several scanned documents containing 
the collation of all research material of Prof. Kul Bhushan Mohtra ji.Mohtra ji is currently the State 
Incharge Library and Documentation Department, J&K BJP Headquarters, Nanaji 
Deshmukh Library..This material was gathered while he was working on his multiple books on J&K History.
All this rare material is now offered to the Community freely.<br>

CV:<br>
Kul Bhushan Mohtra was born on 9th Sep, 1957 in a village Amuwala in Kathua district.<br>
Matric from BOSE, Jammu and Adeeb from AMU. Has been awarded Honorary Professor by School of Liberal Art & Languages, Shobhit University, Gangoh, Distt. Saharanpur, U.P.<br>
Director General, Raja Ram Mohan Roy Library Trust nominated him as his nominee in the Committee for purchasing of Books for UT Jammu & Kashmir. Incharge of Nanaji Deshmukh Library & Documentation Department at BJP state HQ in J&K.<br>
Actively engaged in political, social, charitable and religious activities. Always striving to serve the poor and downtrodden of the society.<br>
Main works-<br>
A saga of Sacrifices: Praja Parishad Movement in J&K<br>
100 Documents: A reference book J&K, Mission Accomplished<br>
A Compendium of Icons of Jammu & Kashmir & our Inspiration (English)<br>
Jammu Kashmir ki Sangarsh Gatha (Hindi)<br><br><br>
Scanning and upload by eGangotri Trust.<br>`

const text_chambal = `This PDF you are browsing is in a series of several scanned documents from 
the Chambal Archives Collection in Etawah, UP<br>
The Archive was collected over a lifetime through the efforts of Shri Krishna Porwal ji (b. 27 July 1951) s/o Shri Jamuna Prasad, Hindi Poet. Archivist and Knowledge Aficianado<br>
The Archives contains around 80,000 books including old newspapers and pre-Independence Journals predominantly in Hindi and Urdu.<br>
Several Books are from the 17th Century. Atleast two manuscripts are also in the Archives - 1786 Copy of Rama Charit Manas and another Bengali Manuscript.
Also included are antique painitings, antique maps, coins, and stamps from all over the World.<br>
Chambal Archives also has old cameras, typewriters, TVs, VCR/VCPs, Video Cassettes, Lanterns and several other Cultural and Technological Paraphernelia<br>
Collectors and Art/Literature  Lovers can contact him if they wish through his facebook page<br><br><br><br><br><br>
Scanning and uploading by eGangotri Digital Preservation Trust and Sarayu Trust Foundation.<br>`

const text_csds = `This PDF you are browsing now is in a series of several scanned documents by the Centre for the Study of Developing Societies (CSDS), Delhi<br>
CSDS gratefully acknowledges the enterprise of the following savants/institutions in making the digitzation possible:<br>
Historian, Writer and Editor Priyamvad of Kanpur for the Hindi periodicals (Bhavishya, Chand, Madhuri)<br>
Mr. Fuwad Khwaja for the Urdu weekly newspaper Sadaqat, edited by his grandfather and father.<br>
Historian Shahid Amin for faciliating the donation.<br>
British Library’s Endangered Archives Programme (EAP-1435) for funding the project that involved rescue, scan, sharing and metadata creation.<br>
ICAS-MP and India Habitat Centre for facilitating exhibitions.<br>
Digital Upload by eGangotri Digital Preservation Trust.<br>
`

const text_csds2 = `The collection was obtained from Kanpur and has been uploaded by the Centre for the Study of Developing Societies (CSDS), Delhi.<br>
We are grateful to historian, writer and editor, Priyamvad for the Hindi periodicals (Bhavishya, Chand, Madhuri) and to Mr. Fuwad Khwaja for the Urdu weekly newspaper Sadaqat, edited by his grandfather and father. To historian Shahid Amin for enabling the donation.<br>
Thanks are also due to the British Library’s Endangered Archives Programme (1435) for funding the project that involved rescue, scan, sharing and metadata creation. We also thank ICAS-MP and India Habitat Centre for facilitating exhibitions.<br>
`

// Function to get image dimensions
export const getImageDimensions = async (imagePath: string): Promise<{ width: number, height: number }> => {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    return { width: metadata.width, height: metadata.height };
};

export const formatIntroText = (_text: string) => _text.replace(/\n/g, '').replace(/<br>/g, '\n\n');

export const getProfileVanityInfo = (profile: string, folder: string) => {
    let _tmpProfile = profile;
    let vanityIntro = profileVanityTextMap[`${_tmpProfile}`]?.text || "";
    if (vanityIntro.length === 0) {
        _tmpProfile = profile.split("-")[0]
        vanityIntro = profileVanityTextMap[`${_tmpProfile}`]?.text || "";
    }

    const imgFile = folder + "\\" + profileVanityTextMap[`${_tmpProfile}`].imgFile;
    const fontSize = profileVanityTextMap[`${_tmpProfile}`]?.fontSize || DEFAULT_FONT_SIZE;
    const singlePage = profileVanityTextMap[`${_tmpProfile}`]?.singlePage || false;
    return [vanityIntro, imgFile, fontSize, singlePage]
}

export const profileVanityTextMap = {
    "PZ": {
        text: text_Peerzada,
        imgFile: "peerzada2.jpg"
    },
    "CHAMBAL": {
        text: text_chambal,
        imgFile: "KrishnaPorwal.jpg",
        //seems the image dimensions forces the font size to behave differently in the generated pdf
        fontSize: 14,
    },
    "SR": {
        text: text_csds,
        imgFile: "..\\csdsBL.jpeg",
        fontSize: 14,
        singlePage: true
    },
    "TMP": {
        text: text_csds,
        imgFile: "..\\csdsBL.jpeg",
        fontSize: 14,
        singlePage: true
    },
    "TMP2": {
        text: text_csds,
        imgFile: "..\\csdsBL.jpeg",
        fontSize: 14,
        singlePage: true
    },
}

