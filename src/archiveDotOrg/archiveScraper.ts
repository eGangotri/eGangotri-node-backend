import { ArchiveDataRetrievalMsg, ArchiveDataRetrievalStatus, ArchiveScrapReport, Hits, HitsEntity, ArchiveLinkData } from './types';
import { extractArchiveAcctName, extractEmail, extractLinkedData as extractLinkedDataAndSpecificFieldsFromAPI, generateExcel } from './utils';
import * as _ from 'lodash';

export const MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG = 10000;
export const DEFAULT_HITS_PER_PAGE = 1000;
const ARCHIVE_SEARCH_FIELDS = [
    "identifier",
    "title",
    "description",
    "subject",
    "creator",
    "collection",
    "mediatype",
    "licenseurl",
    "item_size",
    "files_count",
    "downloads",
    "week",
    "month",
    "addeddate",
    "publicdate",
    "num_favorites"
];

const normalizeAdvancedSearchDoc = (doc: any): HitsEntity => {
    return {
        index: "archive",
        service_backend: "archive",
        hit_type: "item",
        fields: {
            identifier: doc.identifier,
            title: doc.title || "",
            description: Array.isArray(doc.description) ? doc.description.join(" ") : doc.description || "",
            subject: Array.isArray(doc.subject) ? doc.subject : doc.subject ? [doc.subject] : [],
            creator: Array.isArray(doc.creator) ? doc.creator : doc.creator ? [doc.creator] : [],
            collection: Array.isArray(doc.collection) ? doc.collection : doc.collection ? [doc.collection] : [],
            mediatype: doc.mediatype || "",
            licenseurl: doc.licenseurl || "",
            item_size: Number(doc.item_size || 0),
            files_count: Number(doc.files_count || 0),
            downloads: Number(doc.downloads || 0),
            week: Number(doc.week || 0),
            month: Number(doc.month || 0),
            addeddate: doc.addeddate || "",
            publicdate: doc.publicdate || "",
            num_favorites: doc.num_favorites || null
        }
    };
}

const buildAdvancedSearchQuery = (username: string, startDate: number = 0, endDate: number = 0) => {
    const queryParts = [`uploader:${username}`];
    if (startDate > 0 && endDate > 0) {
        const startDateOnly = new Date(startDate).toISOString().slice(0, 10);
        const endDateOnly = new Date(endDate).toISOString().slice(0, 10);
        queryParts.push(`publicdate:[${startDateOnly} TO ${endDateOnly}]`);
    }
    return queryParts.join(" AND ");
}

const callArchiveAdvancedSearchApi = async (username: string,
    pageIndex = 1,
    startDate: number = 0,
    endDate: number = 0,
    ascOrder: boolean = false,
    rows: number = DEFAULT_HITS_PER_PAGE): Promise<Hits> => {
    const SORT_ORDER = ascOrder === true ? "publicdate asc" : "publicdate desc";
    if (!rows || isNaN(rows) || rows <= 0) {
        rows = DEFAULT_HITS_PER_PAGE;
    }
    if (rows > DEFAULT_HITS_PER_PAGE) {
        rows = DEFAULT_HITS_PER_PAGE;
    }
    try {
        const params = new URLSearchParams();
        params.append("q", buildAdvancedSearchQuery(username, startDate, endDate));
        ARCHIVE_SEARCH_FIELDS.forEach(field => params.append("fl[]", field));
        params.append("sort[]", SORT_ORDER);
        params.append("rows", rows.toString());
        params.append("page", pageIndex.toString());
        params.append("output", "json");
        const _url = `https://archive.org/advancedsearch.php?${params.toString()}`;
        console.log(`callArchiveAdvancedSearchApi:${username} PageIndex: ${pageIndex} ${username}
        ${_url}`);
        const response = await fetch(_url);
        if (!response.ok) {
            throw new Error(`Archive advancedsearch failed with ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const docs = data?.response?.docs || [];
        return {
            total: data?.response?.numFound || 0,
            returned: docs.length,
            hits: docs.map(normalizeAdvancedSearchDoc)
        };
    }
    catch (err) {
        console.log(`Error in callArchiveAdvancedSearchApi ${err.message}`);
        return callGenericArchiveApi(username, pageIndex, startDate, endDate, ascOrder, rows);
    }
};
//https://archive.org/services/search/beta/page_production/?user_query=&page_type=account_details&page_target=@drnaithani&page_elements=[%22uploads%22]&hits_per_page=1000&page=1&sort=publicdate:desc&aggregations=false&client_url=https://archive.org/details/@drnaithani
const callGenericArchiveApi = async (username: string,
    pageIndex = 1,
    startDate: number = 0,
    endDate: number = 0,
    ascOrder: boolean = false,
    hitsPerPage: number = DEFAULT_HITS_PER_PAGE): Promise<Hits> => {
    const SORT_ORDER = ascOrder === true ? "publicdate:asc" : "publicdate:desc";
    if (!hitsPerPage || isNaN(hitsPerPage) || hitsPerPage <= 0) {
        hitsPerPage = DEFAULT_HITS_PER_PAGE;
    }
    if (hitsPerPage > DEFAULT_HITS_PER_PAGE) {
        hitsPerPage = DEFAULT_HITS_PER_PAGE;
    }
    try {
        const _url =
            `https://archive.org/services/search/beta/page_production/?user_query=&page_type=account_details&page_target=@${username}&page_elements=[%22uploads%22]&hits_per_page=${hitsPerPage}&page=${pageIndex}&sort=${SORT_ORDER}&aggregations=false&client_url=https://archive.org/details/@${username}`;
        console.log(`callGenericArchiveApi:${username} PageIndex: ${pageIndex} ${username}
        ${_url}`);
        const response = await fetch(_url);
        if (!response.ok) {
            throw new Error(`Archive generic search failed with ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const _hits: Hits = data?.response?.body?.page_elements?.uploads?.hits || { total: 0, returned: 0, hits: [] };
        if (startDate > 0 && endDate > 0) {
            const _filteredHits = (_hits.hits || []).filter((item: HitsEntity) => {
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
        return { total: 0, returned: 0, hits: [] };
    }
};

export const FETCH_ACRHIVE_METADATA_COUNTER = {
    value: 0,
    hitsTotal: 0,
    reset: () => {
        FETCH_ACRHIVE_METADATA_COUNTER.value = 0;
        FETCH_ACRHIVE_METADATA_COUNTER.hitsTotal = 0;
    },
    increment: () => {
        FETCH_ACRHIVE_METADATA_COUNTER.value++;
    }
}

const fetchArchiveMetadata = async (username: string,
    dateRange: [number, number] = [0, 0],
    limitedFields = false,
    ascOrder = false,
    maxItemsOrRange: number | [number, number] = MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG): Promise<ArchiveScrapReport> => {

    username = username.startsWith('@') ? username.slice(1) : username;
    FETCH_ACRHIVE_METADATA_COUNTER.reset();

    let start = 1;
    let end = MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG + 1;

    if (Array.isArray(maxItemsOrRange)) {
        start = maxItemsOrRange[0];
        end = maxItemsOrRange[1];
    } else {
        end = maxItemsOrRange + 1;
    }

    if (start < 1) start = 1;

    console.log(`fetchArchiveMetadata: ${username} ${dateRange} Range: [${start}, ${end})`);

    try {
        let currentPageIndex = 1;
        let _hits: Hits = await callArchiveAdvancedSearchApi(username, currentPageIndex, dateRange[0], dateRange[1], ascOrder, DEFAULT_HITS_PER_PAGE);
        let hitsTotal = _hits?.total || 0;
        // Use the actual returned page size (Archive.org caps at 100 regardless of hits_per_page)
        const actualPageSize = _hits?.returned || _hits?.hits?.length || DEFAULT_HITS_PER_PAGE;
        console.log(`fetchArchiveMetadata: hitsTotal=${hitsTotal}, actualPageSize=${actualPageSize}`);
        const _allCollectedHits: HitsEntity[] = [];

        if (hitsTotal > 0) {
            FETCH_ACRHIVE_METADATA_COUNTER.hitsTotal = hitsTotal;

            // Adjust range bounds based on hitsTotal
            const actualEnd = Math.min(end, hitsTotal + 1);
            if (start > hitsTotal) {
                return { linkData: [], stats: `Start index ${start} exceeds total items ${hitsTotal}` };
            }

            const startIndex = start - 1;
            const startPageIndex = Math.floor(startIndex / actualPageSize) + 1;
            const endIndex = actualEnd - 1;
            const endPageIndex = Math.floor((endIndex - 1) / actualPageSize) + 1;

            // If the first page we fetched isn't the page we need, re-fetch the correct starting page
            if (startPageIndex !== 1) {
                currentPageIndex = startPageIndex;
                const startPageHits = await callArchiveAdvancedSearchApi(username, currentPageIndex, dateRange[0], dateRange[1], ascOrder, DEFAULT_HITS_PER_PAGE);
                if (startPageHits?.hits?.length > 0) {
                    _allCollectedHits.push(...startPageHits.hits);
                }
            } else {
                _allCollectedHits.push(...(_hits.hits || []));
            }

            // Fetch subsequent pages if needed
            while (currentPageIndex < endPageIndex) {
                currentPageIndex++;
                const nextHits = await callArchiveAdvancedSearchApi(username, currentPageIndex, dateRange[0], dateRange[1], ascOrder, DEFAULT_HITS_PER_PAGE);
                if (nextHits?.hits?.length > 0) {
                    _allCollectedHits.push(...nextHits.hits);
                } else {
                    break;
                }
            }

            // Slice to exact range
            const offsetInFirstPage = startIndex - (startPageIndex - 1) * actualPageSize;
            const countToTake = actualEnd - start;
            const finalHits = _allCollectedHits.slice(offsetInFirstPage, offsetInFirstPage + countToTake);

            if (finalHits.length === 0) {
                return { linkData: [], stats: "No items found in specified range" };
            }

            const email = await extractEmail(finalHits[0].fields.identifier);
            const _linkData = await extractLinkedDataAndSpecificFieldsFromAPI(finalHits, email, username, limitedFields);

            console.log(`Equality:
             _linkData ${_linkData.length}
             FETCH_ACRHIVE_METADATA_COUNTER ${FETCH_ACRHIVE_METADATA_COUNTER.value}
             hitsTotal: ${hitsTotal}`);

            return {
                linkData: _linkData,
                stats: `Total Gen: () === ItemsInArchive(${FETCH_ACRHIVE_METADATA_COUNTER.hitsTotal})
                === ItemsCounter(${FETCH_ACRHIVE_METADATA_COUNTER.value}) `
            }
        }
        return { linkData: [], stats: "No items found" };
    }
    catch (err) {
        console.log(`Error in fetchArchiveMetadata ${err.message}`);
        return { linkData: [], error: err, stats: "Error in fetchArchiveMetadata" };
    }
}

const checkValidArchiveUrlAndUpdateStatus = async (archiveIdentifier: string, _status: {}[]) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 5000); // Set timeout to 5 seconds

    const _link = `https://archive.org/services/users/@${archiveIdentifier}/lists`;
    try {
        const isValid = await fetch(_link, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!isValid.ok) {
            _status.push({
                success: false,
                archiveAcctName: archiveIdentifier,
                error: "Invalid archive account name",
            });
        }
        return isValid.ok;
    } catch (error) {
        if (error.name === 'AbortError') {
            _status.push({
                success: false,
                archiveAcctName: archiveIdentifier,
                error: `Connection timeout while invoking ${_link}`,
            });
        } else {
            _status.push({
                success: false,
                archiveAcctName: archiveIdentifier,
                error: error.message,
            });
        }
    }
};
const checkValidArchiveUrlAndUpdateStatusx = async (archiveIdentifier: string, _status: {}[]) => {
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
    maxItemsOrRange: number | [number, number] = MAX_ITEMS_RETRIEVABLE_IN_ARCHIVE_ORG
): Promise<ArchiveDataRetrievalMsg> => {
    const archiveUrlsOrAcctNames = archiveUrlsOrAcctNamesAsCSV.includes(",") ? archiveUrlsOrAcctNamesAsCSV.split(",").map((link: string) => link.trim().replace(/['"]/g, "")) : [archiveUrlsOrAcctNamesAsCSV.trim().replace(/['"]/g, "")];

    console.log(`archiveUrlsOrAcctNames ${archiveUrlsOrAcctNames} onlyLinks ${onlyLinks}`);
    const _status: ArchiveDataRetrievalStatus[] = []
    for (let i = 0; i < archiveUrlsOrAcctNames.length; i++) {
        const _archiveAcctName = extractArchiveAcctName(archiveUrlsOrAcctNames[i]);
        try {
            console.log(`Scraping Link # ${i + 1}. ${archiveUrlsOrAcctNames[i]}`)
            if (!(await checkValidArchiveUrlAndUpdateStatus(_archiveAcctName, _status))) {
                continue;
            }

            const archiveReport: ArchiveScrapReport = await fetchArchiveMetadata(_archiveAcctName, dateRange, limitedFields, ascOrder, maxItemsOrRange);
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
            ``
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
