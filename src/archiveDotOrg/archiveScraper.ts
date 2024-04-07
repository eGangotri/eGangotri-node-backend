import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus, ArchiveScrapReport, LinkData } from './types';
import { extractArchiveAcctName, extractEmail, extractLinkedData as extractLinkedDataAndSpecificFieldsFromAPI, generateExcel } from './utils';
import * as _ from 'lodash';

const callGenericArchiveApi = async (username: string, pageIndex = 1) => {
    try {
        const _url =
            `https://archive.org/services/search/beta/page_production/?user_query=&page_type=account_details&page_target=@${username}&page_elements=[%22uploads%22]&hits_per_page=1000&page=${pageIndex}&sort=publicdate:desc&aggregations=false&client_url=https://archive.org/details/@${username}`;
        console.log(`callGenericArchiveApi:username(${pageIndex}) ${username}`);
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

export const FETCH_ACRHIVE_METADATA_COUNTER = {
    value: 0,
    hitsTotal: 0,
    reset: () => {
        FETCH_ACRHIVE_METADATA_COUNTER.value = 0;
        FETCH_ACRHIVE_METADATA_COUNTER.hitsTotal = 0;
    }
}
const fetchArchiveMetadata = async (username: string, limitedFields = false): Promise<ArchiveScrapReport> => {
    username = username.startsWith('@') ? username.slice(1) : username;
    FETCH_ACRHIVE_METADATA_COUNTER.reset();
    try {
        let _hits = await callGenericArchiveApi(username, 1);
        let hitsTotal = _hits?.total;
        FETCH_ACRHIVE_METADATA_COUNTER.hitsTotal = hitsTotal;

        let _hitsHits = _hits.hits;
        let email = '';
        const _linkData: LinkData[] = [];
        if (_hitsHits?.length >= 0) {
            email = await extractEmail(_hitsHits[0].fields.identifier);
            const extractedData = await extractLinkedDataAndSpecificFieldsFromAPI(_hitsHits, email, username, limitedFields);
            _linkData.push(...extractedData);
        }
        for (let i = 1; i < Math.ceil(hitsTotal / 1000); i++) {
            _hits = await callGenericArchiveApi(username, (i + 1));
            _hitsHits = _hits.hits;
            if (_hitsHits?.length > 0) {
                const extractedData = await extractLinkedDataAndSpecificFieldsFromAPI(_hitsHits, email, username, limitedFields);
                _linkData.push(...extractedData);
            }
        }
        console.log(`Equality:
         _linkData ${JSON.stringify(_linkData.length)}
         FETCH_ACRHIVE_METADATA_COUNTER ${FETCH_ACRHIVE_METADATA_COUNTER.value}
         hitsTotal: ${hitsTotal}`);
        return {
            linkData: _linkData,
            stats: `Total Gen: () === ItemsInArchive(${FETCH_ACRHIVE_METADATA_COUNTER.hitsTotal})
            === ItemsCounter(${FETCH_ACRHIVE_METADATA_COUNTER.value}) `
        }
    }
    catch (err) {
        console.log(`Error in fetchArchiveMetadata ${err.message}`);
        throw err;
    };
}

const checkValidArchiveUrlAndUpdateStatus = async (archiveIdentifier: string, _status: {}[]) => {
    const isValid = await fetch(`https://archive.org/services/users/@${archiveIdentifier}/lists`);
    if (!isValid.ok) {
        _status.push({
            success: false,
            archiveAcctName: archiveIdentifier,
            error: "Invalid archive account name",
        });
    }
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
        if (!checkValidArchiveUrlAndUpdateStatus(_archiveAcctName, _status)) {
            continue;
        }

        try {
            const archiveReport: ArchiveScrapReport = await fetchArchiveMetadata(_archiveAcctName, limitedFields);
            console.log(`Equality _linkData ${JSON.stringify(archiveReport.linkData.length)} === ${FETCH_ACRHIVE_METADATA_COUNTER.value}`);
            if (onlyLinks) {
                _status.push({
                    archiveAcctName: _archiveAcctName,
                    archiveItemCount: archiveReport.linkData.length,
                    success: true,
                    archiveReport: archiveReport
                });
            }
            else {
                const excelPath = await generateExcel(archiveReport.linkData, limitedFields);
                _status.push({
                    excelPath,
                    success: true,
                    archiveAcctName: _archiveAcctName,
                    archiveItemCount: archiveReport.linkData.length,
                });
            }
        }
        catch (e) {
            console.log(`Error in fetchUploads ${e.message}`);
            _status.push({
                success: false,
                archiveAcctName: _archiveAcctName,
                error: `${e}: ${e.message}`,
            });
        }
    }
    console.log(`_status ${JSON.stringify(_status)}`)
    const numFailures = _status.filter(item => item.success === false).length;
    return {
        msg: {
            "Total": `${_status.length}`,
            "Success": `${_status.length - numFailures}`,
            "Failures": `${numFailures}`,
            "All-Fields?": `${limitedFields === true ? "No" : "YES"}`
        },
        scrapedMetadata: _status,
        numFailures,
        numSuccess: _status.length - numFailures,
    };
}
