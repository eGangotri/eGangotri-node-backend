import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus, ArchiveScrapReport, Hits, HitsEntity, LinkData } from './types';
import { extractArchiveAcctName, extractEmail, extractLinkedData as extractLinkedDataAndSpecificFieldsFromAPI, generateExcel } from './utils';
import * as _ from 'lodash';

export const MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG = 10000;
export const DEFAULT_HITS_PER_PAGE = 1000;
//https://archive.org/services/search/beta/page_production/?user_query=&page_type=account_details&page_target=@drnaithani&page_elements=[%22uploads%22]&hits_per_page=1000&page=1&sort=publicdate:desc&aggregations=false&client_url=https://archive.org/details/@drnaithani
const callGenericArchiveApi = async (username: string,
    pageIndex = 1,
    startDate: number = 0,
    endDate: number = 0,
    ascOrder: boolean = false,
    hitsPerPage: number = DEFAULT_HITS_PER_PAGE): Promise<Hits> => {
    const SORT_ORDER = ascOrder === true ? "publicdate:asc" : "publicdate:desc";
    if (hitsPerPage > DEFAULT_HITS_PER_PAGE) {
        hitsPerPage = DEFAULT_HITS_PER_PAGE;
    }
    try {
        const _url =
            `https://archive.org/services/search/beta/page_production/?user_query=&page_type=account_details&page_target=@${username}&page_elements=[%22uploads%22]&hits_per_page=${hitsPerPage}&page=${pageIndex}&sort=${SORT_ORDER}&aggregations=false&client_url=https://archive.org/details/@${username}`;
        console.log(`callGenericArchiveApi:${username}(${pageIndex}) ${username}
        ${_url}`);
        const response = await fetch(_url);
        const data = await response.json();
        const _hits: Hits = data?.response?.body?.page_elements?.uploads?.hits || {};
        if (startDate > 0 && endDate > 0) {
            const _filteredHits = _hits.hits.filter((item: HitsEntity) => {
                const _date = new Date(item?.fields?.publicdate).getTime();
                return _date >= startDate && _date <= endDate;
            });
            return {
                ..._hits,
                hits: _filteredHits || []
            }
        }
        console.log(`callGenericArchiveApi _hits.total ${_hits?.total}`)
        return _hits;
    }
    catch (err) {
        console.log(`Error in callGenericArchiveApi ${err.message}`);
        //throw err;
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

const fetchArchiveMetadata = async (username: string,
    dateRange: [number, number] = [0, 0],
    limitedFields = false,
    ascOrder = false,
    maxItems: number = MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG): Promise<ArchiveScrapReport> => {

    username = username.startsWith('@') ? username.slice(1) : username;
    FETCH_ACRHIVE_METADATA_COUNTER.reset();
    console.log(`fetchArchiveMetadata: ${username} ${dateRange} ${maxItems}`);

    if (maxItems != MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG) {
        console.log(`maxItems is Custom data: ${username} ${dateRange} ${maxItems}`);
    }
    let maxItemsCounter = maxItems > MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG ? MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG : maxItems;;

    try {
        let _hits: Hits = await callGenericArchiveApi(username, 1, dateRange[0], dateRange[1], ascOrder, maxItemsCounter);
        maxItemsCounter -= DEFAULT_HITS_PER_PAGE;
        let hitsTotal = _hits?.total;
        const _linkData: LinkData[] = [];

        if (hitsTotal > 0) {
            FETCH_ACRHIVE_METADATA_COUNTER.hitsTotal = hitsTotal;
            let _hitsHits = _hits.hits;
            let email = '';
            if (_hitsHits?.length > 0) {
                email = await extractEmail(_hitsHits[0].fields.identifier);
                const extractedData = await extractLinkedDataAndSpecificFieldsFromAPI(_hitsHits, email, username, limitedFields);
                _linkData.push(...extractedData);
            }

            for (let i = 1; i < Math.ceil(hitsTotal / 1000); i++) {
                console.log(`maxItemsCounter ${maxItemsCounter}`)
                if (maxItemsCounter > 0) {
                    _hits = await callGenericArchiveApi(username, (i + 1), dateRange[0], dateRange[1], ascOrder, maxItemsCounter);

                    _hitsHits = _hits.hits;
                    if (_hitsHits?.length > 0) {
                        if (email.length === 0) {
                            email = await extractEmail(_hitsHits[0].fields.identifier);
                        }
                        const extractedData = await extractLinkedDataAndSpecificFieldsFromAPI(_hitsHits, email, username, limitedFields);
                        _linkData.push(...extractedData);
                    }
                }
                else {
                    break;
                }
                maxItemsCounter -= DEFAULT_HITS_PER_PAGE;
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
        //throw err;
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
    dateRange: [number, number] = [0, 0],
    onlyLinks: boolean = false,
    limitedFields: boolean = false,
    ascOrder: boolean = false,
    maxItems: number = MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG
): Promise<ArchiveDataRetrievalMsg> => {
    const archiveUrlsOrAcctNames = archiveUrlsOrAcctNamesAsCSV.includes(",") ? archiveUrlsOrAcctNamesAsCSV.split(",").map((link: string) => link.trim().replace(/['"]/g, "")) : [archiveUrlsOrAcctNamesAsCSV.trim().replace(/['"]/g, "")];

    console.log(`archiveUrlsOrAcctNames ${archiveUrlsOrAcctNames} onlyLinks ${onlyLinks}`);
    const _status: ArchiveDataRetrievalStatus[] = []
    for (let i = 0; i < archiveUrlsOrAcctNames.length; i++) {
        const _archiveAcctName = extractArchiveAcctName(archiveUrlsOrAcctNames[i]);
        try {
            console.log(`Scraping Link # ${i + 1}. ${archiveUrlsOrAcctNames[i]}`)
            if (!checkValidArchiveUrlAndUpdateStatus(_archiveAcctName, _status)) {
                continue;
            }

            const archiveReport: ArchiveScrapReport = await fetchArchiveMetadata(_archiveAcctName, dateRange, limitedFields, ascOrder, maxItems);
            console.log(`Equality _linkData ${JSON.stringify(archiveReport.linkData.length)} === ${FETCH_ACRHIVE_METADATA_COUNTER.value}`);
            if (onlyLinks) {
                _status.push({
                    order: ascOrder === true ? "Asc. Order" : "Desc. Order",
                    archiveAcctName: _archiveAcctName,
                    archiveItemCount: archiveReport.linkData.length,
                    success: true,
                    archiveReport: archiveReport
                });
            }
            else {
                if (archiveReport?.linkData?.length === 0) {
                    _status.push({
                        excelPath: "NONE. No links found in the archive account",
                        success: false,
                        order: ascOrder === true ? "Asc. Order" : "Desc. Order",
                        archiveAcctName: _archiveAcctName,
                        archiveItemCount: archiveReport.linkData.length,
                    });
                }
                else {
                    const excelPath = await generateExcel(archiveReport.linkData, limitedFields, ascOrder);
                    _status.push({
                        excelPath,
                        success: true,
                        order: ascOrder === true ? "Asc. Order" : "Desc. Order",
                        archiveAcctName: _archiveAcctName,
                        archiveItemCount: archiveReport.linkData.length,
                    });
                }
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
