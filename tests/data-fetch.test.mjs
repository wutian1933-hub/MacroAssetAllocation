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

test('getAllMacroData reads data.json once and extracts all indicators', async () => {
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
                        cpi: 1,
                        ppi: 0.5,
                        m1m2: -3.4,
                        bondYield: 1.7473,
                        turnoverMomentum: 3.27,
                        erp: 49.1,
                        growthValueDispersion: 7.89,
                        growthValuationPercentile: 97.59,
                        dividendYield: 3.2,
                        commodityMomentum: 2.5,
                    },
                    sources: {},
                    errors: {},
                    notes: {},
                };
            },
        };
    });

    const data = await fetcher.getAllMacroData();

    assert.equal(fetchCount, 1);
    assert.equal(data.growthValuationPercentile, 97.59);
    assert.equal(data.growthPEPercentile, 97.59);
    assert.equal(data.hasError, false);
});

test('getAllMacroData reports one clear error when data file cannot be read', async () => {
    let fetchCount = 0;
    const fetcher = loadFetcher(async () => {
        fetchCount += 1;
        throw new Error('Failed to fetch');
    });

    const data = await fetcher.getAllMacroData();

    assert.equal(fetchCount, 1);
    assert.equal(data.hasError, true);
    assert.equal(data.errors.length, 1);
    assert.match(data.errors[0], /无法读取 data\.json/);
    assert.match(data.errors[0], /GitHub Pages/);
});
