import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function loadDashboardScript() {
    const context = {
        console,
        document: {
            readyState: 'loading',
            addEventListener() {},
            getElementById() {
                return null;
            },
            querySelector() {
                return null;
            },
        },
        localStorage: {
            getItem() {
                return null;
            },
            setItem() {},
        },
        Chart: function Chart() {},
    };
    vm.createContext(context);
    vm.runInContext(script, context);
    return context;
}

function toPlainObject(value) {
    return Object.fromEntries(Object.entries(value));
}

test('market factor input explains source and calculation method', () => {
    assert.match(html, /市场情绪 \(Sentiment\)：成交额 \+ ERP 合成/);
    assert.match(html, /市场情绪分数 \(S\):/);
    assert.match(html, /动态维度权重/);
    assert.match(html, /id="dimension-weight-summary"/);
    assert.match(html, /id="dimension-weight-note"/);
    assert.match(html, /评分口径/);
    assert.match(html, /ETF 内部默认等权/);
    assert.match(html, /市场因子 \(Market Factors\)/);
    assert.match(html, /成长\/价值分化度 \(%\)/);
    assert.match(html, /成长风格估值分位数 \(%\)/);
    assert.match(html, /来源: AkShare \+ 计算/);
    assert.match(html, /0\.4×20日超额收益 \+ 0\.6×60日超额收益/);
    assert.match(html, /中证800成长\(H30355\)日频滚动市盈率/);
    assert.match(html, /替代多个成长ETF的估值口径/);
    assert.match(html, /红利风格股息率 \(%\)/);
    assert.match(html, /中证红利\(000922\)指数估值数据/);
    assert.match(html, /最新股息率2/);
    assert.match(html, /商品价格动量 \(%\)/);
    assert.match(html, /来源: AkShare\/中证商品指数 \+ 计算/);
    assert.match(html, /优先 AkShare futures_index_ccidx/);
    assert.match(html, /失败时回退同源中证商品指数接口/);
    assert.match(html, /中证商品期货价格指数日频收盘点位/);
    assert.match(html, /0\.4×20日收益率 \+ 0\.6×60日收益率/);
    assert.match(html, /仅微调成长\/红利，不改变股债比例/);
    assert.doesNotMatch(html, /id="turnover-trend"/);
    assert.doesNotMatch(html, /成长股ETF PE分位数/);
    assert.doesNotMatch(html, /红利股ETF股息率/);
    assert.doesNotMatch(html, /商品ETF动量得分/);
});

test('factor labels expose hover explanations', () => {
    const helpIcons = html.match(/class="factor-help"/g) ?? [];
    assert.equal(helpIcons.length, 15);

    [
        '制造业 PMI 说明',
        '社融存量同比增速说明',
        '社融趋势说明',
        'CPI 同比说明',
        'PPI 同比说明',
        'PPI 趋势说明',
        'M1-M2 剪刀差说明',
        '10 年期国债收益率说明',
        '国债收益率趋势说明',
        '中证全指成交额滚动环比动量说明',
        '股债利差 ERP 分位数说明',
        '成长/价值分化度说明',
        '成长风格估值分位数说明',
        '红利风格股息率说明',
        '商品价格动量说明',
    ].forEach((label) => {
        assert.match(html, new RegExp(`aria-label="${label}"`));
    });

    assert.match(html, /data-tooltip="制造业 PMI 衡量制造业景气度/);
    assert.match(html, /社融增量 12 个月同比代理指标最近 3 个月方向/);
    assert.match(html, /PPI 环比：连续 3 个月为正判上行/);
    assert.match(html, /最近 20 个交易日 10 年期国债收益率变化/);
    assert.match(html, /data-tooltip="ERP 使用中证全指滚动 PE/);
    assert.match(html, /与成交额动量合成为市场情绪分数/);
    assert.match(html, /data-tooltip="商品价格动量使用中证商品期货价格指数/);
    assert.match(html, /\.factor-help:hover::after/);
    assert.match(html, /\.factor-help:focus::after/);
});

test('factor registry defines unique roles and overlap handling', () => {
    const {
        getFactorRegistry,
        getFactorDimensionRegistry,
        getFactorOverlapRegistry,
        getScoringFactors,
        validateFactorRegistry,
    } = loadDashboardScript();

    const registry = getFactorRegistry();
    const dimensions = getFactorDimensionRegistry();
    const overlaps = getFactorOverlapRegistry();

    assert.equal(validateFactorRegistry().length, 0);
    assert.deepEqual(Object.keys(registry), [
        'pmi',
        'socialFinance',
        'socialFinanceTrend',
        'cpi',
        'ppi',
        'ppiTrend',
        'm1m2',
        'bondYield',
        'bondYieldTrend',
        'turnoverMomentum',
        'erp',
        'marketSentimentScore',
        'growthValueDispersion',
        'growthValuationPercentile',
        'dividendYield',
        'commodityMomentum',
    ]);
    assert.deepEqual(Array.from(getScoringFactors(), factor => factor.id), [
        'pmi',
        'socialFinanceTrend',
        'cpi',
        'ppiTrend',
        'm1m2',
        'bondYieldTrend',
        'marketSentimentScore',
    ]);

    assert.equal(registry.socialFinance.currentDimensionWeight, 0);
    assert.equal(registry.ppi.currentDimensionWeight, 0);
    assert.equal(registry.bondYield.currentDimensionWeight, 0);
    assert.equal(registry.turnoverMomentum.currentDimensionWeight, 0);
    assert.equal(registry.erp.currentDimensionWeight, 0);
    assert.equal(registry.marketSentimentScore.currentDimensionWeight, 1);
    assert.equal(registry.growthValueDispersion.role, 'tactical_input');
    assert.equal(registry.growthValuationPercentile.role, 'selection_input');
    assert.equal(registry.dividendYield.role, 'selection_input');
    assert.equal(registry.commodityMomentum.role, 'selection_input');

    assert.deepEqual(Array.from(dimensions.growth), ['pmi', 'socialFinanceTrend']);
    assert.deepEqual(Array.from(dimensions.inflation), ['cpi', 'ppiTrend']);
    assert.deepEqual(Array.from(dimensions.liquidity), ['m1m2', 'bondYieldTrend']);
    assert.deepEqual(Array.from(dimensions.sentiment), ['marketSentimentScore']);
    assert.deepEqual(Array.from(overlaps.interest_rate.factors), ['bondYield', 'bondYieldTrend', 'erp']);
    assert.match(overlaps.interest_rate.handling, /ERP 进入市场情绪分数/);
    assert.deepEqual(Array.from(overlaps.market_sentiment.factors), ['turnoverMomentum', 'erp', 'marketSentimentScore']);
    assert.match(overlaps.market_sentiment.handling, /合成为单一市场情绪分数/);
});

test('market sentiment score combines turnover and ERP once', () => {
    const {
        calculateMarketSentimentScore,
        calculateSentimentScore,
        getMarketSentimentState,
        determineStage,
        calculateAssetAllocation,
    } = loadDashboardScript();

    assert.equal(calculateMarketSentimentScore(3.27, 49.1), 1);
    assert.equal(calculateMarketSentimentScore(60, 10), 3);
    assert.equal(calculateMarketSentimentScore(60, 85), 1);
    assert.equal(calculateMarketSentimentScore(-25, 85), -3);
    assert.equal(calculateSentimentScore(-25, 85), -3);

    const overheated = getMarketSentimentState(60, 85);
    assert.deepEqual(
        {
            score: overheated.score,
            turnoverContribution: overheated.turnoverContribution,
            erpContribution: overheated.erpContribution,
            isOverheated: overheated.isOverheated,
            isIcePoint: overheated.isIcePoint,
        },
        {
            score: 1,
            turnoverContribution: 2,
            erpContribution: -1,
            isOverheated: true,
            isIcePoint: false,
        }
    );

    const icePoint = getMarketSentimentState(-25, 85);
    assert.equal(icePoint.score, -3);
    assert.equal(icePoint.isIcePoint, true);
    assert.equal(determineStage(-1, -1, 1, icePoint.score, -25, 85), 6);
    assert.equal(calculateAssetAllocation(6, -25, 85).growth, 15);
});

test('dynamic dimension weights classify ambiguous stage without changing exact mappings', () => {
    const {
        determineStage,
        formatDimensionWeights,
        getDynamicDimensionWeights,
        getStageDecisionState,
        validateDynamicDimensionWeightRules,
    } = loadDashboardScript();

    assert.equal(validateDynamicDimensionWeightRules().length, 0);
    assert.deepEqual(toPlainObject(getDynamicDimensionWeights(1)), {
        growth: 0.25,
        inflation: 0.15,
        liquidity: 0.4,
        sentiment: 0.2,
    });
    assert.deepEqual(toPlainObject(getDynamicDimensionWeights(2)), {
        growth: 0.35,
        inflation: 0.15,
        liquidity: 0.3,
        sentiment: 0.2,
    });
    assert.deepEqual(toPlainObject(getDynamicDimensionWeights(5)), {
        growth: 0.15,
        inflation: 0.35,
        liquidity: 0.2,
        sentiment: 0.3,
    });

    const exactState = getStageDecisionState(1, 1, -1, -1, 0, 50);
    assert.equal(exactState.stage, 4);
    assert.equal(exactState.method, 'exact');
    assert.equal(determineStage(1, 1, -1, -1, 0, 50), 4);

    const dynamicState = getStageDecisionState(1, 1, 1, 1, 0, 50);
    assert.equal(dynamicState.stage, 3);
    assert.equal(dynamicState.method, 'dynamic_weighted');
    assert.equal(dynamicState.baseStage, 3);
    assert.deepEqual(toPlainObject(dynamicState.signals), {
        growth: 1,
        inflation: 1,
        liquidity: 1,
        sentiment: 1,
    });
    assert.equal(determineStage(1, 1, 1, 1, 0, 50), 3);
    assert.equal(
        formatDimensionWeights(dynamicState.weights),
        'G 25% / I 30% / L 25% / S 20%'
    );
});

test('stage signal rules are unique and cover ambiguous phase states', () => {
    const {
        determineStage,
        getStageSignalRules,
        validateStageSignalRules,
    } = loadDashboardScript();

    const rules = Array.from(getStageSignalRules());
    const keys = rules.map(rule => rule.key);

    assert.equal(validateStageSignalRules().length, 0);
    assert.equal(new Set(keys).size, keys.length);
    assert.deepEqual(keys, [
        '0,0,1,0',
        '0,0,1,1',
        '1,0,1,1',
        '1,0,0,1',
        '1,1,0,1',
        '1,1,0,0',
        '0,1,0,0',
        '0,0,0,0',
    ]);

    assert.equal(determineStage(-1, -1, 1, -1, 0, 50), 1);
    assert.equal(determineStage(1, -1, 1, 1, 0, 50), 2);
    assert.equal(determineStage(1, 1, -1, 1, 0, 50), 3);
    assert.equal(determineStage(1, 1, -1, 0, 0, 50), 4);
    assert.equal(determineStage(-1, 1, -1, -1, 0, 50), 5);
    assert.equal(determineStage(-1, -1, -1, -1, 0, 50), 6);

    assert.equal(determineStage(1, 1, -1, 1, 51, 50), 4);
    assert.equal(determineStage(-1, -1, 1, -1, -21, 81), 6);
});

test('trend selectors support automatic stable state', () => {
    assert.match(html, /<select id="sf-trend"[\s\S]*<option value="stable">稳定<\/option>[\s\S]*<option value="up">回升<\/option>[\s\S]*<option value="down">下降<\/option>/);
    assert.match(html, /<select id="ppi-trend"[\s\S]*<option value="stable">稳定<\/option>[\s\S]*<option value="up">上行<\/option>[\s\S]*<option value="down">下行<\/option>/);
    assert.match(html, /<select id="bond-trend"[\s\S]*<option value="stable">稳定<\/option>[\s\S]*<option value="up">上行<\/option>[\s\S]*<option value="down">下行<\/option>/);
});

test('turnover label refresh preserves hover explanation icon', () => {
    const context = loadDashboardScript();
    const helpIcon = { className: 'factor-help' };
    const labelText = { nodeType: 3, textContent: '旧成交额标签' };
    const label = {
        childNodes: [helpIcon, labelText],
        textContentWasAssigned: false,
        querySelector(selector) {
            return selector === '.factor-help' ? helpIcon : null;
        },
        appendChild(node) {
            this.childNodes.push(node);
        },
        set textContent(value) {
            this.textContentWasAssigned = true;
            this.childNodes = [{ nodeType: 3, textContent: value }];
        },
    };
    const method = { textContent: '' };

    context.document = {
        getElementById(id) {
            if (id === 'turnover-momentum-label') {
                return label;
            }
            if (id === 'turnover-momentum-method') {
                return method;
            }
            return null;
        },
        querySelector() {
            return null;
        },
        createTextNode(text) {
            return { nodeType: 3, textContent: text };
        },
    };

    context.updateTurnoverMomentumCopy();

    assert.equal(label.textContentWasAssigned, false);
    assert.equal(label.childNodes[0], helpIcon);
    assert.equal(labelText.textContent, '中证全指成交额滚动环比动量 (%)');
    assert.match(method.textContent, /0\.7×5日滚动环比 \+ 0\.3×20日滚动环比/);
});

test('automatic trend values can fill manual selectors', () => {
    const context = loadDashboardScript();
    const select = {
        value: 'stable',
        options: [{ value: 'stable' }, { value: 'up' }, { value: 'down' }],
    };

    context.document = {
        getElementById() {
            return select;
        },
    };

    context.setSelectValue('sf-trend', 'down');
    assert.equal(select.value, 'down');

    context.setSelectValue('sf-trend', 'unknown');
    assert.equal(select.value, 'down');
});

test('stable trends do not force directional macro scores', () => {
    const { calculateGrowthScore, calculateInflationScore, calculateLiquidityScore } = loadDashboardScript();

    assert.equal(calculateGrowthScore(51, 'up'), 2);
    assert.equal(calculateGrowthScore(51, 'stable'), 1);
    assert.equal(calculateGrowthScore(51, 'down'), 0);

    assert.equal(calculateInflationScore(2, 0, 'up'), 1);
    assert.equal(calculateInflationScore(2, 0, 'stable'), 0);
    assert.equal(calculateInflationScore(2, 0, 'down'), -1);

    assert.equal(calculateLiquidityScore(1, 'down'), 2);
    assert.equal(calculateLiquidityScore(1, 'stable'), 1);
    assert.equal(calculateLiquidityScore(1, 'up'), 0);
});

test('growth value dispersion only tilts internal equity allocation', () => {
    const { calculateAssetAllocation } = loadDashboardScript();

    const base = calculateAssetAllocation(2, 0, 50, 0);
    const growthTilt = calculateAssetAllocation(2, 0, 50, 12);
    const valueTilt = calculateAssetAllocation(2, 0, 50, -12);

    assert.equal(growthTilt.growth, base.growth + 5);
    assert.equal(growthTilt.dividend, base.dividend - 5);
    assert.equal(growthTilt.commodity, base.commodity);
    assert.equal(growthTilt.bond, base.bond);
    assert.equal(growthTilt.total, base.total);

    assert.equal(valueTilt.growth, base.growth - 5);
    assert.equal(valueTilt.dividend, base.dividend + 5);
    assert.equal(valueTilt.commodity, base.commodity);
    assert.equal(valueTilt.bond, base.bond);
    assert.equal(valueTilt.total, base.total);
});

test('manual notes are not reported as fetch failures', () => {
    const { formatFetchNotes } = loadDashboardScript();

    assert.match(
        formatFetchNotes(['commodityMomentum: 暂未实现自动计算，保留默认/手动值']),
        /自动数据获取成功/
    );
    assert.doesNotMatch(
        formatFetchNotes(['commodityMomentum: 暂未实现自动计算，保留默认/手动值']),
        /获取失败/
    );
});

test('commodity momentum percent is converted to bounded score', () => {
    const { calculateEtfScores } = loadDashboardScript();

    const neutral = calculateEtfScores(50, 4.5, 0)['518880.SH'];
    const strong = calculateEtfScores(50, 4.5, 12)['518880.SH'];
    const weak = calculateEtfScores(50, 4.5, -12)['518880.SH'];

    assert.equal(neutral.momentum, '0.50');
    assert.equal(strong.momentum, '1.00');
    assert.equal(weak.momentum, '0.00');
});

test('ETF placeholder factors are marked neutral and internal allocation is equal-weighted', () => {
    const { calculateEtfScores, calculateEtfAllocations } = loadDashboardScript();

    const scores = calculateEtfScores(80, 4.5, 12);
    const growth = scores['159352.SZ'];
    const dividend = scores['510880.SH'];
    const commodity = scores['518880.SH'];

    assert.equal(growth.valuation, '0.20');
    assert.equal(growth.momentum, '中性 0.50');
    assert.equal(growth.risk, '中性 0.50');
    assert.equal(growth.score, '0.20');
    assert.equal(growth.allocationMode, 'equal');
    assert.match(growth.scoreMethod, /ETF内部等权/);

    assert.equal(dividend.valuation, '0.50');
    assert.equal(dividend.momentum, '中性 0.50');
    assert.equal(dividend.risk, '中性 0.50');
    assert.equal(dividend.score, '0.50');
    assert.match(dividend.scoreMethod, /股息率/);

    assert.equal(commodity.valuation, '不适用');
    assert.equal(commodity.momentum, '1.00');
    assert.equal(commodity.risk, '中性 0.50');
    assert.equal(commodity.score, '1.00');
    assert.match(commodity.scoreMethod, /商品动量/);

    const allocations = calculateEtfAllocations(2, {
        growth: 50,
        dividend: 20,
        commodity: 10,
        bond: 20,
        total: 80,
    }, scores);

    const growthAllocations = allocations.filter(item => item.assetClass === '成长股');
    assert.equal(new Set(growthAllocations.map(item => item.weight)).size, 1);
    assert.equal(new Set(growthAllocations.map(item => item.change)).size, 1);
    assert.equal(growthAllocations[0].change, '0.00');
});
