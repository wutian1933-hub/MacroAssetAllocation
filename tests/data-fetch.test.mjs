import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../data-fetch.js', import.meta.url), 'utf8');

function loadFetcher(fetchImpl) {
    const storage = new Map();
    const context = {
        console,
        fetch: fetchImpl,
        localStorage: {
            getItem(key) {
                return storage.has(key) ? storage.get(key) : null;
            },
            setItem(key, value) {
                storage.set(key, value);
            },
        },
    };
    vm.createContext(context);
    vm.runInContext(`${source}\nglobalThis.MacroDataFetcherForTest = MacroDataFetcher;`, context);
    return new context.MacroDataFetcherForTest();
}

test('getAllMacroData compares Pages and raw data and extracts all indicators', async () => {
    let fetchCount = 0;
    const fetcher = loadFetcher(async () => {
        fetchCount += 1;
        return {
            ok: true,
            async json() {
                return {
                    indicators: {
                        pmi: 50.3,
                        socialFinance: -22.56,
                        socialFinanceTrend: 'down',
                        cpi: 1,
                        ppi: 0.5,
                        ppiTrend: 'up',
                        m1m2: -3.4,
                        bondYield: 1.7473,
                        bondYieldTrend: 'stable',
                        turnoverMomentum: 3.27,
                        erp: 49.1,
                        growthValueDispersion: 7.89,
                        growthValuationPercentile: 97.59,
                        dividendYield: 5.2,
                        commodityMomentum: 3.6,
                    },
                    sources: {},
                    errors: {},
                    notes: {},
                };
            },
        };
    });

    const data = await fetcher.getAllMacroData();

    assert.equal(fetchCount, 2);
    assert.equal(data.growthValuationPercentile, 97.59);
    assert.equal(data.growthPEPercentile, 97.59);
    assert.equal(data.dividendYield, 5.2);
    assert.equal(data.commodityMomentum, 3.6);
    assert.equal(data.marketSentimentScore, 1);
    assert.equal(data.socialFinanceTrend, 'down');
    assert.equal(data.ppiTrend, 'up');
    assert.equal(data.bondYieldTrend, 'stable');
    assert.equal(data.hasError, false);
});

test('getAllMacroData prefers GitHub raw data when it is newer than Pages data', async () => {
    const requestedUrls = [];
    const fetcher = loadFetcher(async (url) => {
        requestedUrls.push(url);
        const isRaw = String(url).includes('raw.githubusercontent.com');
        return {
            ok: true,
            async json() {
                return {
                    update_date: isRaw ? '2026-05-13' : '2026-05-06',
                    indicators: {
                        pmi: 50.3,
                        socialFinance: -22.56,
                        socialFinanceTrend: 'down',
                        cpi: isRaw ? 1.2 : 1,
                        ppi: isRaw ? 2.8 : 0.5,
                        ppiTrend: 'up',
                        m1m2: -3.4,
                        bondYield: 1.7473,
                        bondYieldTrend: 'stable',
                        turnoverMomentum: 3.27,
                        erp: 49.1,
                        growthValueDispersion: 7.89,
                        growthValuationPercentile: 97.59,
                        dividendYield: 5.2,
                        commodityMomentum: 3.6,
                    },
                    sources: {},
                    errors: {},
                    notes: {},
                };
            },
        };
    });

    const data = await fetcher.getAllMacroData();

    assert.deepEqual(requestedUrls, [
        'data.json',
        'https://raw.githubusercontent.com/wutian1933-hub/MacroAssetAllocation/master/data.json',
    ]);
    assert.equal(data.ppi, 2.8);
    assert.equal(data.cpi, 1.2);
    assert.equal(data.hasError, false);
});

test('getAllMacroData reports one clear error when data file cannot be read', async () => {
    let fetchCount = 0;
    const fetcher = loadFetcher(async () => {
        fetchCount += 1;
        throw new Error('Failed to fetch');
    });

    const data = await fetcher.getAllMacroData();

    assert.equal(fetchCount, 2);
    assert.equal(data.hasError, true);
    assert.equal(data.socialFinanceTrend, 'stable');
    assert.equal(data.ppiTrend, 'stable');
    assert.equal(data.bondYieldTrend, 'stable');
    assert.equal(data.marketSentimentScore, 1);
    assert.equal(data.errors.length, 1);
    assert.match(data.errors[0], /无法读取 data\.json/);
    assert.match(data.errors[0], /GitHub Pages/);
    assert.match(data.errors[0], /raw\.githubusercontent\.com/);
});
