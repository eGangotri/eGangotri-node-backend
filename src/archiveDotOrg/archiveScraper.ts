import { LinkData } from './types';
import { extractArchiveAcctName, extractEmail, extractLinkedData, generateExcel } from './utils';

const ARCHIVE_ORG_METADATA_API = 'https://archive.org/metadata';

const callArchiveApi = async (username: string, pageIndex = 1) => {
    const _url =
        `https://archive.org/services/search/beta/page_production/?user_query=&page_type=account_details&page_target=@${username}&page_elements=[%22uploads%22]&hits_per_page=1000&page=${pageIndex}&sort=publicdate:desc&aggregations=false&client_url=https://archive.org/details/@${username}`;

    const response = await fetch(_url);
    const data = await response.json();
    const _hits = data.response.body.page_elements.uploads.hits;
    return _hits;
};

const fetchUploads = async (username: string): Promise<LinkData[]> => {
    username = username.startsWith('@') ? username.slice(1) : username;
    let pageIndex = 1
    let _hits = await callArchiveApi(username, pageIndex++);

    const totalHits = _hits.total;
    let totalHitsPickedCounter = _hits.total;
    let _hitsHits = _hits.hits;
    let email = '';
    if (_hitsHits.length >= 0) {
        email = await extractEmail(_hitsHits[0].fields.identifier);
    }

    const _linkData: LinkData[] = [];
    if (totalHitsPickedCounter > 0) {
        _linkData.push(...extractLinkedData(_hitsHits, email));
    }
    totalHitsPickedCounter = totalHitsPickedCounter - _hitsHits.length;
    while (totalHitsPickedCounter > 0) {
        _hits = await callArchiveApi(username, pageIndex++);
        _hitsHits = _hits.hits;
        if (_hitsHits.length > 0) {
            _linkData.push(...extractLinkedData(_hitsHits, email));
        }
        totalHitsPickedCounter = totalHitsPickedCounter - _hitsHits.length;
    }
    return _linkData
};

export const scrapeArchiveOrgProfiles = async (archiveUrlsOrAcctNamesAsCSV: string, onlyLinks: boolean = false): Promise<any> => {
    const archiveUrlsOrAcctNames = archiveUrlsOrAcctNamesAsCSV.includes(",") ? archiveUrlsOrAcctNamesAsCSV.split(",").map((link: string) => link.trim()) : [archiveUrlsOrAcctNamesAsCSV.trim()];

    console.log(`archiveUrlsOrAcctNames ${archiveUrlsOrAcctNames} onlyLinks ${onlyLinks}`);
    const _status = []

    for (let i = 0; i < archiveUrlsOrAcctNames.length; i++) {
        console.log(`Scraping Link # ${i}. ${archiveUrlsOrAcctNames[i]}`)
        const _archiveAcctName = extractArchiveAcctName(archiveUrlsOrAcctNames[i]);
        try {
            const _linkData = await fetchUploads(_archiveAcctName);
            //console.log(`_linkData ${JSON.stringify(_linkData)}`);
            if (onlyLinks) {
                _status.push({
                    msg: {
                        archiveAcctName: _archiveAcctName,
                        archiveItemCount: _linkData.length,
                        success: true,
                        links: _linkData
                    }
                });
            }
            else {
                const excelPath = await generateExcel(_linkData, _archiveAcctName);
                _status.push({
                    msg: {
                        excelPath,
                        success: true,
                        archiveAcctName: _archiveAcctName,
                        archiveItemCount: _linkData.length,
                    }
                });
            }
        }
        catch (e) {
            console.log(`Error in fetchUploads ${e}`);
            _status.push({
                msg: {
                    success: false,
                    archiveAcctName: _archiveAcctName,
                    error: e.message,
                }
            });
        }
    }
    console.log(`_status ${JSON.stringify(_status)}`)
    return _status;
}
