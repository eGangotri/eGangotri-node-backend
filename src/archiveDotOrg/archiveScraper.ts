import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus, LinkData } from './types';
import { extractArchiveAcctName, extractEmail, extractLinkedData, generateExcel } from './utils';
import * as _ from 'lodash';

const callGenericArchiveApi = async (username: string, pageIndex = 1) => {
    try {
        const _url =
            `https://archive.org/services/search/beta/page_production/?user_query=&page_type=account_details&page_target=@${username}&page_elements=[%22uploads%22]&hits_per_page=1000&page=${pageIndex}&sort=publicdate:desc&aggregations=false&client_url=https://archive.org/details/@${username}`;
        console.log(`_url ${_url}`);
        const response = await fetch(_url);
        const data = await response.json();

        const _hits = data?.response?.body?.page_elements?.uploads?.hits || [];
        console.log(`callGenericArchiveApi _hits.total ${_hits?.total}`)
        return _hits;
    }
    catch (err) {
        console.log(`Error in callGenericArchiveApi ${err.message}`);
        throw err;
    }
};

const fetchArchiveMetadata = async (username: string, limitedFields = false): Promise<LinkData[]> => {
    username = username.startsWith('@') ? username.slice(1) : username;
    try {
        let pageIndex = 1
        let _hits = await callGenericArchiveApi(username, pageIndex++);

        let totalHitsPickedCounter = _hits?.total;
        let _hitsHits = _hits.hits;
        let email = '';
        if (_hitsHits?.length >= 0) {
            email = await extractEmail(_hitsHits[0].fields.identifier);
        }

        const _linkData: LinkData[] = [];
        if (totalHitsPickedCounter > 0) {
            const extractedData = await extractLinkedData(_hitsHits, email, username, limitedFields);
            _linkData.push(...extractedData);
        }
        totalHitsPickedCounter = totalHitsPickedCounter - _hitsHits?.length;
        while (totalHitsPickedCounter > 0) {
            _hits = await callGenericArchiveApi(username, pageIndex++);
            _hitsHits = _hits.hits;
            if (_hitsHits?.length > 0) {
                const extractedData = await extractLinkedData(_hitsHits, email, username, limitedFields);
                _linkData.push(...extractedData);
            }
            totalHitsPickedCounter = totalHitsPickedCounter - _hitsHits?.length;
        }
        return _linkData;
    }
    catch (err) {
        console.log(`Error in fetchArchiveMetadata ${err.message}`);
        throw err;
    };
}

const checkValidArchiveUrl = async (archiveIdentifier: string) => {
    const isValid = await fetch(`https://archive.org/services/users/@${archiveIdentifier}/lists`);
    console.log(`isValid ${isValid.ok}`)
    return isValid.ok
}
export const scrapeArchiveOrgProfiles = async (archiveUrlsOrAcctNamesAsCSV: string,
    onlyLinks: boolean = false,
    limitedFields: boolean = false): Promise<ArchiveDataRetrievalMsg> => {
    const archiveUrlsOrAcctNames = archiveUrlsOrAcctNamesAsCSV.includes(",") ? archiveUrlsOrAcctNamesAsCSV.split(",").map((link: string) => link.trim().replace(/['"]/g, "")) : [archiveUrlsOrAcctNamesAsCSV.trim().replace(/['"]/g, "")];

    console.log(`archiveUrlsOrAcctNames ${archiveUrlsOrAcctNames} onlyLinks ${onlyLinks}`);
    const _status: ArchiveDataRetrievalStatus[] = []
    for (let i = 0; i < archiveUrlsOrAcctNames.length; i++) {
        console.log(`Scraping Link # ${i + 1}. ${archiveUrlsOrAcctNames[i]}`)
        const _archiveAcctName = extractArchiveAcctName(archiveUrlsOrAcctNames[i]);
        if (!checkValidArchiveUrl(_archiveAcctName)) {
            _status.push({
                success: false,
                archiveAcctName: _archiveAcctName,
                error: "Invalid archive account name",
            });
            continue;
        }

        try {
            const _linkData = await fetchArchiveMetadata(_archiveAcctName, limitedFields);
            console.log(`_linkData ${JSON.stringify(_linkData.length)}`);
            if (onlyLinks) {
                _status.push({
                    archiveAcctName: _archiveAcctName,
                    archiveItemCount: _linkData.length,
                    success: true,
                    links: _linkData
                });
            }
            else {
                const excelPath = await generateExcel(_linkData, limitedFields);
                _status.push({
                    excelPath,
                    success: true,
                    archiveAcctName: _archiveAcctName,
                    archiveItemCount: _linkData.length,
                });
            }
        }
        catch (e) {
            console.log(`Error in fetchUploads ${e.message}`);
            _status.push({
                success: false,
                archiveAcctName: _archiveAcctName,
                error: e.message,
            });
        }
    }
    console.log(`_status ${JSON.stringify(_status)}`)
    const numFailures = _status.filter(item => item.success === false).length;
    return {
        msg: `
              Total: ${_status.length}
              Success: ${_status.length - numFailures},
              Failures: ${numFailures}
              ${limitedFields === true ? "Limited Fields Only" : "No Restrictions. All fields were generated"}
              `,
        scrapedMetadata: _status,
        numFailures,
        numSuccess: _status.length - numFailures,
    };
}
