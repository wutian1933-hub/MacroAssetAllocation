// 系统核心逻辑

// 新的配置矩阵（v2.0）
const allocationMatrix = {
    1: { // 阶段1：复苏初期
        growth: 40,
        dividend: 20,
        commodity: 10,
        bond: 30,
        total: 80
    },
    2: { // 阶段2：复苏中期
        growth: 50,
        dividend: 20,
        commodity: 10,
        bond: 20,
        total: 80
    },
    3: { // 阶段3：复苏后期
        growth: 40,
        dividend: 20,
        commodity: 20,
        bond: 20,
        total: 80
    },
    4: { // 阶段4：过热初期
        growth: 20,
        dividend: 30,
        commodity: 20,
        bond: 30,
        total: 60
    },
    5: { // 阶段5：过热后期
        growth: 20,
        dividend: 30,
        commodity: 10,
        bond: 40,
        total: 60
    },
    6: { // 阶段6：衰退初期
        growth: 10,
        dividend: 20,
        commodity: 0,
        bond: 70,
        total: 30
    }
};

// 阶段描述（v2.0）
const stageDescriptions = {
    1: {
        name: "阶段 1：复苏初期",
        desc: "增长触底、通胀低位、流动性宽松、情绪冰点",
        feature: "增长触底、通胀低位、流动性宽松、情绪冰点"
    },
    2: {
        name: "阶段 2：复苏中期",
        desc: "增长回暖、通胀低位、流动性宽松、情绪复苏",
        feature: "增长回暖、通胀低位、流动性宽松、情绪复苏"
    },
    3: {
        name: "阶段 3：复苏后期",
        desc: "增长扩张、通胀回升、流动性收紧、情绪乐观",
        feature: "增长扩张、通胀回升、流动性收紧、情绪乐观"
    },
    4: {
        name: "阶段 4：过热初期",
        desc: "增长见顶、通胀上行、流动性收紧、情绪谨慎",
        feature: "增长见顶、通胀上行、流动性收紧、情绪谨慎"
    },
    5: {
        name: "阶段 5：过热后期",
        desc: "增长放缓、通胀高企、流动性紧张、情绪悲观",
        feature: "增长放缓、通胀高企、流动性紧张、情绪悲观"
    },
    6: {
        name: "阶段 6：衰退初期",
        desc: "增长下滑、通胀回落、流动性宽松、情绪低迷",
        feature: "增长下滑、通胀回落、流动性宽松、情绪低迷"
    }
};

// ETF标的池
const etfPool = {
    growth: {
        wide: [
            { code: '159352.SZ', name: '南方中证A500ETF', category: 'growth_wide' },
            { code: '561300.SH', name: '国泰沪深300增强', category: 'growth_wide' },
            { code: '159680.SZ', name: '招商中证1000增强', category: 'growth_wide' },
            { code: '159552.SZ', name: '招商中证2000增强', category: 'growth_wide' }
        ],
        tech: [
            { code: '588640.SH', name: '华夏科创50ETF', category: 'growth_tech' },
            { code: '159915.SZ', name: '易方达创业板ETF', category: 'growth_tech' }
        ],
        cross: [
            { code: '159740.SZ', name: '大成恒生科技ETF', category: 'growth_cross' },
            { code: '513050.SH', name: '易方达中概互联', category: 'growth_cross' }
        ]
    },
    dividend: [
        { code: '510880.SH', name: '华泰柏瑞红利ETF', category: 'dividend' },
        { code: '512890.SH', name: '华泰柏瑞红利低波', category: 'dividend' }
    ],
    commodity: [
        { code: '518880.SH', name: '华安黄金ETF', category: 'commodity' },
        { code: '501018.SH', name: '汇添富原油基金', category: 'commodity' },
        { code: '512400.SH', name: '南方有色金属ETF', category: 'commodity' }
    ],
    bond: [
        { code: '511260.SH', name: '10年国债ETF', category: 'bond' }
    ],
    cash: [
        { code: '511880.SH', name: '银华日利', category: 'cash' }
    ]
};

// 因子注册表：集中定义每个因子的唯一主用途，后续去重和动态权重都以此为准。
const factorRegistry = {
    pmi: {
        id: 'pmi',
        label: '制造业 PMI',
        dataKeys: ['pmi'],
        inputId: 'pmi',
        layer: 'macro_cycle',
        dimension: 'growth',
        primaryUse: 'growth_score',
        role: 'score_input',
        currentDimensionWeight: 0.5,
        overlapGroup: null,
    },
    socialFinance: {
        id: 'socialFinance',
        label: '社融存量同比增速代理',
        dataKeys: ['socialFinance'],
        inputId: 'social-finance',
        layer: 'raw_data',
        dimension: 'growth',
        primaryUse: 'derive_social_finance_trend',
        role: 'derived_source',
        derivedFor: ['socialFinanceTrend'],
        currentDimensionWeight: 0,
        overlapGroup: 'credit',
    },
    socialFinanceTrend: {
        id: 'socialFinanceTrend',
        label: '社融趋势',
        dataKeys: ['socialFinanceTrend'],
        inputId: 'sf-trend',
        layer: 'macro_cycle',
        dimension: 'growth',
        primaryUse: 'growth_score',
        role: 'score_input',
        currentDimensionWeight: 0.5,
        dependsOn: ['socialFinance'],
        overlapGroup: 'credit',
    },
    cpi: {
        id: 'cpi',
        label: 'CPI 同比',
        dataKeys: ['cpi'],
        inputId: 'cpi',
        layer: 'macro_cycle',
        dimension: 'inflation',
        primaryUse: 'inflation_score',
        role: 'score_input',
        currentDimensionWeight: 0.4,
        overlapGroup: null,
    },
    ppi: {
        id: 'ppi',
        label: 'PPI 同比',
        dataKeys: ['ppi'],
        inputId: 'ppi',
        layer: 'raw_data',
        dimension: 'inflation',
        primaryUse: 'derive_ppi_trend',
        role: 'derived_source',
        derivedFor: ['ppiTrend'],
        currentDimensionWeight: 0,
        overlapGroup: 'industrial_inflation',
    },
    ppiTrend: {
        id: 'ppiTrend',
        label: 'PPI 趋势',
        dataKeys: ['ppiTrend'],
        inputId: 'ppi-trend',
        layer: 'macro_cycle',
        dimension: 'inflation',
        primaryUse: 'inflation_score',
        role: 'score_input',
        currentDimensionWeight: 0.6,
        dependsOn: ['ppi'],
        overlapGroup: 'industrial_inflation',
    },
    m1m2: {
        id: 'm1m2',
        label: 'M1-M2 剪刀差',
        dataKeys: ['m1m2'],
        inputId: 'm1m2',
        layer: 'macro_cycle',
        dimension: 'liquidity',
        primaryUse: 'liquidity_score',
        role: 'score_input',
        currentDimensionWeight: 0.6,
        overlapGroup: 'money_supply',
    },
    bondYield: {
        id: 'bondYield',
        label: '10 年期国债收益率',
        dataKeys: ['bondYield'],
        inputId: 'bond-yield',
        layer: 'raw_data',
        dimension: 'liquidity',
        primaryUse: 'derive_bond_yield_trend_and_erp',
        role: 'derived_source',
        derivedFor: ['bondYieldTrend', 'erp'],
        currentDimensionWeight: 0,
        overlapGroup: 'interest_rate',
    },
    bondYieldTrend: {
        id: 'bondYieldTrend',
        label: '国债收益率趋势',
        dataKeys: ['bondYieldTrend'],
        inputId: 'bond-trend',
        layer: 'macro_cycle',
        dimension: 'liquidity',
        primaryUse: 'liquidity_score',
        role: 'score_input',
        currentDimensionWeight: 0.4,
        dependsOn: ['bondYield'],
        overlapGroup: 'interest_rate',
    },
    turnoverMomentum: {
        id: 'turnoverMomentum',
        label: '中证全指成交额滚动环比动量',
        dataKeys: ['turnoverMomentum', 'turnover', 'turnoverYoY'],
        inputId: 'turnover',
        layer: 'raw_data',
        dimension: 'sentiment',
        primaryUse: 'derive_market_sentiment_score',
        role: 'derived_source',
        derivedFor: ['marketSentimentScore'],
        currentDimensionWeight: 0,
        overlapGroup: 'market_sentiment',
    },
    erp: {
        id: 'erp',
        label: '股债利差 ERP 分位数',
        dataKeys: ['erp'],
        inputId: 'erp',
        layer: 'raw_data',
        dimension: 'sentiment',
        primaryUse: 'derive_market_sentiment_score',
        role: 'derived_source',
        derivedFor: ['marketSentimentScore'],
        currentDimensionWeight: 0,
        dependsOn: ['bondYield'],
        overlapGroup: 'interest_rate',
        overlapNote: '与国债收益率趋势共享利率底层数据，但只作为市场情绪分数的风险溢价输入。',
    },
    marketSentimentScore: {
        id: 'marketSentimentScore',
        label: '市场情绪分数',
        dataKeys: ['marketSentimentScore'],
        layer: 'macro_cycle',
        dimension: 'sentiment',
        primaryUse: 'sentiment_score',
        role: 'score_input',
        dependsOn: ['turnoverMomentum', 'erp'],
        currentDimensionWeight: 1,
        overlapGroup: 'market_sentiment',
    },
    growthValueDispersion: {
        id: 'growthValueDispersion',
        label: '成长/价值分化度',
        dataKeys: ['growthValueDispersion'],
        inputId: 'growth-value-dispersion',
        layer: 'tactical_adjustment',
        dimension: 'equity_style',
        primaryUse: 'equity_internal_tilt',
        role: 'tactical_input',
        currentDimensionWeight: null,
        overlapGroup: 'equity_style',
    },
    growthValuationPercentile: {
        id: 'growthValuationPercentile',
        label: '成长风格估值分位数',
        dataKeys: ['growthValuationPercentile', 'growthPEPercentile'],
        inputId: 'growth-valuation',
        layer: 'etf_selection',
        dimension: 'growth_etf',
        primaryUse: 'growth_etf_score',
        role: 'selection_input',
        currentDimensionWeight: 0.35,
        overlapGroup: 'equity_style',
    },
    dividendYield: {
        id: 'dividendYield',
        label: '红利风格股息率',
        dataKeys: ['dividendYield'],
        inputId: 'dividend-dy',
        layer: 'etf_selection',
        dimension: 'dividend_etf',
        primaryUse: 'dividend_etf_score',
        role: 'selection_input',
        currentDimensionWeight: 0.5,
        overlapGroup: 'equity_style',
    },
    commodityMomentum: {
        id: 'commodityMomentum',
        label: '商品价格动量',
        dataKeys: ['commodityMomentum'],
        inputId: 'commodity-momentum',
        layer: 'etf_selection',
        dimension: 'commodity_etf',
        primaryUse: 'commodity_etf_score',
        role: 'selection_input',
        currentDimensionWeight: 0.5,
        overlapGroup: 'commodity_trend',
        overlapNote: '当前代表商品整体趋势，暂不区分黄金、原油、有色内部相对强弱。',
    },
};

const factorDimensionRegistry = {
    growth: ['pmi', 'socialFinanceTrend'],
    inflation: ['cpi', 'ppiTrend'],
    liquidity: ['m1m2', 'bondYieldTrend'],
    sentiment: ['marketSentimentScore'],
    equityStyle: ['growthValueDispersion'],
    growthEtf: ['growthValuationPercentile'],
    dividendEtf: ['dividendYield'],
    commodityEtf: ['commodityMomentum'],
};

const factorOverlapRegistry = {
    credit: {
        factors: ['socialFinance', 'socialFinanceTrend'],
        handling: '社融数值仅作为趋势计算底层数据，不直接参与宏观打分。',
    },
    industrial_inflation: {
        factors: ['ppi', 'ppiTrend'],
        handling: 'PPI 同比用于展示和趋势回退，PPI 趋势参与通胀维度打分。',
    },
    interest_rate: {
        factors: ['bondYield', 'bondYieldTrend', 'erp'],
        handling: '10Y 国债收益率仅作底层数据；趋势进入流动性维度，ERP 进入市场情绪分数。',
    },
    market_sentiment: {
        factors: ['turnoverMomentum', 'erp', 'marketSentimentScore'],
        handling: '成交额动量和 ERP 合成为单一市场情绪分数，只以合成结果参与四维阶段判定。',
    },
    equity_style: {
        factors: ['growthValueDispersion', 'growthValuationPercentile', 'dividendYield'],
        handling: '风格分化只调股票内部结构；成长估值和红利股息率只用于对应 ETF 内部选择。',
    },
    commodity_trend: {
        factors: ['commodityMomentum'],
        handling: '商品动量代表商品整体趋势，当前不作为商品 ETF 内部分化依据。',
    },
};

const stageSignalRules = [
    { key: '0,0,1,0', stage: 1, label: '复苏初期' },
    { key: '0,0,1,1', stage: 2, label: '复苏中期' },
    { key: '1,0,1,1', stage: 2, label: '复苏中期' },
    { key: '1,0,0,1', stage: 3, label: '复苏后期' },
    { key: '1,1,0,1', stage: 3, label: '复苏后期' },
    { key: '1,1,0,0', stage: 4, label: '过热初期' },
    { key: '0,1,0,0', stage: 5, label: '过热后期' },
    { key: '0,0,0,0', stage: 6, label: '衰退初期' },
];

function validateStageSignalRules(rules = stageSignalRules) {
    const errors = [];
    const keys = new Set();
    rules.forEach((rule, index) => {
        if (!rule.key) {
            errors.push(`第 ${index + 1} 条阶段规则缺少 key`);
        } else if (keys.has(rule.key)) {
            errors.push(`${rule.key}: 阶段规则 key 重复`);
        }
        keys.add(rule.key);

        if (!Number.isInteger(rule.stage) || rule.stage < 1 || rule.stage > 6) {
            errors.push(`${rule.key || `第 ${index + 1} 条`}: 阶段编号无效`);
        }
    });
    return errors;
}

function createStageSignalMap(rules = stageSignalRules) {
    const errors = validateStageSignalRules(rules);
    if (errors.length > 0) {
        throw new Error(`阶段判定规则无效: ${errors.join('; ')}`);
    }

    return rules.reduce((map, rule) => {
        map[rule.key] = rule.stage;
        return map;
    }, {});
}

const stageSignalMap = createStageSignalMap();
const dimensionKeys = ['growth', 'inflation', 'liquidity', 'sentiment'];
const neutralDimensionWeights = {
    growth: 0.25,
    inflation: 0.25,
    liquidity: 0.25,
    sentiment: 0.25,
};
const dynamicDimensionWeightRules = {
    1: {
        label: '底部确认期：流动性优先',
        weights: { growth: 0.25, inflation: 0.15, liquidity: 0.4, sentiment: 0.2 },
    },
    2: {
        label: '复苏验证期：增长优先',
        weights: { growth: 0.35, inflation: 0.15, liquidity: 0.3, sentiment: 0.2 },
    },
    3: {
        label: '扩张确认期：通胀与增长并重',
        weights: { growth: 0.25, inflation: 0.3, liquidity: 0.25, sentiment: 0.2 },
    },
    4: {
        label: '过热确认期：通胀优先',
        weights: { growth: 0.2, inflation: 0.35, liquidity: 0.25, sentiment: 0.2 },
    },
    5: {
        label: '顶部预警期：通胀与情绪优先',
        weights: { growth: 0.15, inflation: 0.35, liquidity: 0.2, sentiment: 0.3 },
    },
    6: {
        label: '衰退观察期：流动性与情绪优先',
        weights: { growth: 0.25, inflation: 0.15, liquidity: 0.35, sentiment: 0.25 },
    },
};
const stagePrototypeSignals = {
    1: { growth: 0, inflation: 0, liquidity: 1, sentiment: 0 },
    2: { growth: 1, inflation: 0, liquidity: 1, sentiment: 1 },
    3: { growth: 1, inflation: 1, liquidity: 1, sentiment: 1 },
    4: { growth: 1, inflation: 1, liquidity: 0, sentiment: 0 },
    5: { growth: 0, inflation: 1, liquidity: 0, sentiment: 0 },
    6: { growth: 0, inflation: 0, liquidity: 0, sentiment: 0 },
};

function validateDynamicDimensionWeightRules(rules = dynamicDimensionWeightRules) {
    const errors = [];
    Object.entries(rules).forEach(([stage, config]) => {
        if (!stageDescriptions[stage]) {
            errors.push(`${stage}: 未定义阶段描述`);
        }
        if (!config.label) {
            errors.push(`${stage}: 缺少动态权重说明`);
        }
        const weights = config.weights || {};
        dimensionKeys.forEach(dimension => {
            if (typeof weights[dimension] !== 'number' || weights[dimension] <= 0) {
                errors.push(`${stage}: ${dimension} 权重无效`);
            }
        });
        const totalWeight = dimensionKeys.reduce((sum, dimension) => sum + (weights[dimension] || 0), 0);
        if (Math.abs(totalWeight - 1) > 0.0001) {
            errors.push(`${stage}: 权重合计必须为 1`);
        }
    });
    return errors;
}

function getDynamicDimensionWeights(stage) {
    return dynamicDimensionWeightRules[stage]?.weights || neutralDimensionWeights;
}

function getDynamicDimensionWeightLabel(stage) {
    return dynamicDimensionWeightRules[stage]?.label || '默认等权';
}

function getFactorRegistry() {
    return factorRegistry;
}

function getFactorDimensionRegistry() {
    return factorDimensionRegistry;
}

function getFactorOverlapRegistry() {
    return factorOverlapRegistry;
}

function getScoringFactors() {
    return Object.values(factorRegistry).filter(factor => factor.role === 'score_input');
}

function getStageSignalRules() {
    return stageSignalRules;
}

function validateFactorRegistry(registry = factorRegistry) {
    const errors = [];
    const ids = new Set();
    Object.entries(registry).forEach(([key, factor]) => {
        if (factor.id !== key) {
            errors.push(`${key}: id 与注册表键不一致`);
        }
        if (ids.has(factor.id)) {
            errors.push(`${key}: id 重复`);
        }
        ids.add(factor.id);
        ['label', 'layer', 'dimension', 'primaryUse', 'role'].forEach(field => {
            if (!factor[field]) {
                errors.push(`${key}: 缺少 ${field}`);
            }
        });
        if (!Array.isArray(factor.dataKeys) || factor.dataKeys.length === 0) {
            errors.push(`${key}: 缺少 dataKeys`);
        }
        if (factor.dependsOn) {
            factor.dependsOn.forEach(dependency => {
                if (!registry[dependency]) {
                    errors.push(`${key}: dependsOn 未注册 ${dependency}`);
                }
            });
        }
        if (factor.derivedFor) {
            factor.derivedFor.forEach(derivedFactor => {
                if (!registry[derivedFactor]) {
                    errors.push(`${key}: derivedFor 未注册 ${derivedFactor}`);
                }
            });
        }
    });

    Object.entries(factorDimensionRegistry).forEach(([dimension, factorIds]) => {
        factorIds.forEach(factorId => {
            if (!registry[factorId]) {
                errors.push(`${dimension}: 维度引用未注册因子 ${factorId}`);
            }
        });
    });

    Object.entries(factorOverlapRegistry).forEach(([group, config]) => {
        if (!config.handling) {
            errors.push(`${group}: 缺少重叠处理说明`);
        }
        config.factors.forEach(factorId => {
            if (!registry[factorId]) {
                errors.push(`${group}: 重叠组引用未注册因子 ${factorId}`);
            }
        });
    });

    return errors;
}

// DOM元素
let calculateBtn, historyTable, etfTable, factorTable;

// 图表实例
let allocationChart;

function hasMetricValue(value) {
    return value !== null && value !== undefined && value !== '';
}

function setMetricInput(id, value) {
    if (hasMetricValue(value)) {
        document.getElementById(id).value = value;
    }
}

function setSelectValue(id, value) {
    if (!hasMetricValue(value)) {
        return;
    }
    const select = document.getElementById(id);
    if (!select) {
        return;
    }
    const normalizedValue = String(value);
    if (Array.from(select.options).some(option => option.value === normalizedValue)) {
        select.value = normalizedValue;
    }
}

function formatFetchErrors(errors) {
    if (!Array.isArray(errors) || errors.length === 0) {
        return '数据获取失败，使用的是默认数据。请检查网络连接或手动更新数据。';
    }
    return `部分数据获取失败，已使用默认值：\n${errors.map(error => `- ${error}`).join('\n')}`;
}

function formatFetchNotes(notes) {
    if (!Array.isArray(notes) || notes.length === 0) {
        return '数据获取成功！';
    }
    return `自动数据获取成功。\n以下因子暂未自动化，已保留默认/手动值：\n${notes.map(note => `- ${note}`).join('\n')}`;
}

function setFactorLabelText(label, text) {
    const helpIcon = label.querySelector?.('.factor-help');
    if (!helpIcon) {
        label.textContent = text;
        return;
    }

    const textNode = Array.from(label.childNodes || [])
        .find(node => node.nodeType === 3 && node.textContent.trim());
    if (textNode) {
        textNode.textContent = text;
        return;
    }

    label.appendChild(document.createTextNode(text));
}

function updateTurnoverMomentumCopy() {
    const label = document.getElementById('turnover-momentum-label')
        || document.querySelector('#turnover')?.parentElement?.querySelector('label');
    const method = document.getElementById('turnover-momentum-method')
        || document.querySelector('#turnover')?.parentElement?.querySelector('.text-xs.text-gray-500.mt-1');

    if (label) {
        setFactorLabelText(label, '中证全指成交额滚动环比动量 (%)');
    }
    if (method) {
        method.textContent = '获取方法: ak.stock_zh_index_hist_csindex("000985")，0.7×5日滚动环比 + 0.3×20日滚动环比';
    }
}

// 加载基础数据
function loadBaseData() {
    // 加载配置矩阵
    const storedAllocationMatrix = localStorage.getItem('allocationMatrix');
    if (storedAllocationMatrix) {
        allocationMatrix = JSON.parse(storedAllocationMatrix);
    }
    
    // 加载阶段描述
    const storedStageDescriptions = localStorage.getItem('stageDescriptions');
    if (storedStageDescriptions) {
        stageDescriptions = JSON.parse(storedStageDescriptions);
    }
    
    // 加载ETF标的池
    const storedEtfPool = localStorage.getItem('etfPool');
    if (storedEtfPool) {
        etfPool = JSON.parse(storedEtfPool);
    }
}

// 更新数据获取状态
function updateFetchStatus(status, time = null) {
    const statusElement = document.getElementById('fetch-status');
    const timeElement = document.getElementById('last-fetch-time');
    
    if (statusElement) {
        statusElement.textContent = `数据获取状态：${status}`;
    }
    
    if (timeElement && time) {
        timeElement.textContent = `最后获取时间：${time}`;
    }
}

// 检查缓存状态
function checkCacheStatus() {
    const lastFetchTime = localStorage.getItem('lastFetchTime');
    if (lastFetchTime) {
        const fetchTime = new Date(lastFetchTime);
        const formattedTime = fetchTime.toLocaleString();
        updateFetchStatus('已缓存', formattedTime);
    }
}

// 自动获取数据
async function autoFetchData() {
    const autoFetchBtn = document.getElementById('auto-fetch-btn');
    autoFetchBtn.innerHTML = '<div class="loading"></div> 获取中...';
    autoFetchBtn.disabled = true;
    
    updateFetchStatus('获取中');
    
    try {
        // 每次点击按钮都重新获取数据，确保数据是最新的
        const data = await macroDataFetcher.getAllMacroData();
        
        // 填充数据到输入字段
        setMetricInput('pmi', data.pmi);
        setMetricInput('social-finance', data.socialFinance);
        setSelectValue('sf-trend', data.socialFinanceTrend);
        setMetricInput('cpi', data.cpi);
        setMetricInput('ppi', data.ppi);
        setSelectValue('ppi-trend', data.ppiTrend);
        setMetricInput('m1m2', data.m1m2);
        setMetricInput('bond-yield', data.bondYield);
        setSelectValue('bond-trend', data.bondYieldTrend);
        setMetricInput('turnover', data.turnoverMomentum ?? data.turnover ?? data.turnoverYoY);
        setMetricInput('erp', data.erp);

        // 填充派生指标
        setMetricInput('growth-value-dispersion', data.growthValueDispersion);
        setMetricInput('growth-valuation', data.growthValuationPercentile ?? data.growthPEPercentile);
        setMetricInput('dividend-dy', data.dividendYield);
        setMetricInput('commodity-momentum', data.commodityMomentum);
        
        // 更新状态
        const lastFetchTime = localStorage.getItem('lastFetchTime');
        if (lastFetchTime) {
            const fetchTime = new Date(lastFetchTime);
            const formattedTime = fetchTime.toLocaleString();
            updateFetchStatus('获取成功', formattedTime);
        }
        
        // 显示成功消息或错误提示
        if (data.hasError) {
            alert(formatFetchErrors(data.errors));
        } else if (data.hasNotes) {
            alert(formatFetchNotes(data.notes));
        } else {
            alert('数据获取成功！');
        }
    } catch (error) {
        console.error('自动获取数据失败:', error);
        updateFetchStatus('获取失败');
        alert('数据获取失败，请检查网络连接或手动输入数据。');
    } finally {
        autoFetchBtn.innerHTML = '自动获取数据';
        autoFetchBtn.disabled = false;
    }
}

// 初始化
function init() {
    // 获取DOM元素
    calculateBtn = document.getElementById('calculate-btn');
    historyTable = document.getElementById('history-table');
    etfTable = document.getElementById('etf-table');
    factorTable = document.getElementById('factor-table');
    updateTurnoverMomentumCopy();

    // 加载基础数据
    loadBaseData();
    
    // 初始化图表
    initChart();
    
    // 加载历史记录
    loadHistory();
    
    // 检查缓存状态
    checkCacheStatus();
    
    // 绑定事件
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateAllocation);
    }
    
    // 绑定自动获取按钮
    const autoFetchBtn = document.getElementById('auto-fetch-btn');
    if (autoFetchBtn) {
        autoFetchBtn.addEventListener('click', autoFetchData);
    }
    
    // 检查是否启用自动获取
    const autoFetch = localStorage.getItem('autoFetch') === 'true';
    if (autoFetch) {
        // 页面加载时自动获取数据
        autoFetchData();
    }
}

// 初始化图表
function initChart() {
    const ctx = document.getElementById('allocation-chart');
    if (!ctx) return;
    
    const chartCtx = ctx.getContext('2d');
    allocationChart = new Chart(chartCtx, {
        type: 'pie',
        data: {
            labels: ['成长股', '红利股', '商品 ETF', '债券/现金'],
            datasets: [{
                data: [0, 0, 0, 100],
                backgroundColor: [
                    '#3b82f6', // 蓝色 - 成长股
                    '#10b981', // 绿色 - 红利股
                    '#f59e0b', // 黄色 - 商品ETF
                    '#8b5cf6'  // 紫色 - 债券/现金
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

// 计算配置
function calculateAllocation() {
    // 获取输入数据
    const pmi = parseFloat(document.getElementById('pmi').value) || 0;
    const socialFinance = parseFloat(document.getElementById('social-finance').value) || 0;
    const sfTrend = document.getElementById('sf-trend').value;
    const cpi = parseFloat(document.getElementById('cpi').value) || 0;
    const ppi = parseFloat(document.getElementById('ppi').value) || 0;
    const ppiTrend = document.getElementById('ppi-trend').value;
    const m1m2 = parseFloat(document.getElementById('m1m2').value) || 0;
    const bondYield = parseFloat(document.getElementById('bond-yield').value) || 0;
    const bondTrend = document.getElementById('bond-trend').value;
    const turnoverMomentum = parseFloat(document.getElementById('turnover').value) || 0;
    const erp = parseFloat(document.getElementById('erp').value) || 0;
    // 获取市场因子
    const growthValueDispersion = parseFloat(document.getElementById('growth-value-dispersion').value) || 0;
    const growthValuationPercentile = parseFloat(document.getElementById('growth-valuation').value) || 50;
    const dividendDy = parseFloat(document.getElementById('dividend-dy').value) || 4.5;
    const commodityMomentum = parseFloat(document.getElementById('commodity-momentum').value) || 0;
    
    // 计算四维得分
    const growthScore = calculateGrowthScore(pmi, sfTrend);
    const inflationScore = calculateInflationScore(cpi, ppi, ppiTrend);
    const liquidityScore = calculateLiquidityScore(m1m2, bondTrend);
    const marketSentiment = getMarketSentimentState(turnoverMomentum, erp);
    const sentimentScore = marketSentiment.score;
    const stageDecision = getStageDecisionState(
        growthScore,
        inflationScore,
        liquidityScore,
        sentimentScore,
        turnoverMomentum,
        erp,
    );

    // 显示得分
    document.getElementById('growth-score').textContent = growthScore;
    document.getElementById('inflation-score').textContent = inflationScore;
    document.getElementById('liquidity-score').textContent = liquidityScore;
    document.getElementById('sentiment-score').textContent = sentimentScore;
    updateDimensionWeightDisplay(stageDecision);

    // 判定宏观阶段
    const stage = stageDecision.stage;

    // 显示阶段信息
    document.getElementById('stage-result').textContent = stageDescriptions[stage].name;
    document.getElementById('stage-desc').textContent = stageDescriptions[stage].desc;

    // 计算资产配置
    const allocation = calculateAssetAllocation(stage, turnoverMomentum, erp, growthValueDispersion);
    
    // 计算ETF标的因子得分
    const etfScores = calculateEtfScores(growthValuationPercentile, dividendDy, commodityMomentum);
    
    // 计算智能权重分配
    const etfAllocations = calculateEtfAllocations(stage, allocation, etfScores);
    
    // 显示配置结果
    updateAllocationDisplay(allocation);
    
    // 更新图表
    updateChart(allocation);
    
    // 显示ETF标的详细配置
    updateEtfTable(etfAllocations);
    
    // 显示多因子评分结果
    updateFactorTable(etfScores);
    
    // 保存历史记录
    saveHistory(stage, allocation, etfAllocations);
    
    // 刷新历史记录
    loadHistory();
}

// 计算经济增长得分
function calculateGrowthScore(pmi, sfTrend) {
    let score = 0;
    if (pmi > 50) {
        score += 1;
    } else {
        score -= 1;
    }
    if (sfTrend === 'up') {
        score += 1;
    } else if (sfTrend === 'down') {
        score -= 1;
    }
    return score;
}

// 计算通货膨胀得分
function calculateInflationScore(cpi, ppi, ppiTrend) {
    let score = 0;
    if (cpi > 3) {
        score += 1;
    } else if (cpi < 1) {
        score -= 1;
    }
    if (ppiTrend === 'up') {
        score += 1;
    } else if (ppiTrend === 'down') {
        score -= 1;
    }
    return score;
}

// 计算流动性得分
function calculateLiquidityScore(m1m2, bondTrend) {
    let score = 0;
    if (m1m2 > 0) {
        score += 1;
    } else {
        score -= 1;
    }
    if (bondTrend === 'down') {
        score += 1;
    } else if (bondTrend === 'up') {
        score -= 1;
    }
    return score;
}
function calculateTurnoverSentimentContribution(turnoverMomentum) {
    if (turnoverMomentum > 50) {
        return 2;
    }
    if (turnoverMomentum > 0) {
        return 1;
    }
    if (turnoverMomentum < -20) {
        return -2;
    }
    return -1;
}

function calculateErpSentimentContribution(erp) {
    if (erp > 80) {
        return -1;
    }
    if (erp < 20) {
        return 1;
    }
    return 0;
}

// 计算市场情绪分数：成交额动量 + ERP 风险溢价逆向信号
function calculateMarketSentimentScore(turnoverMomentum, erp) {
    return calculateTurnoverSentimentContribution(turnoverMomentum)
        + calculateErpSentimentContribution(erp);
}

function getMarketSentimentState(turnoverMomentum, erp) {
    const turnoverContribution = calculateTurnoverSentimentContribution(turnoverMomentum);
    const erpContribution = calculateErpSentimentContribution(erp);
    const score = turnoverContribution + erpContribution;

    return {
        score,
        turnoverContribution,
        erpContribution,
        isOverheated: turnoverContribution >= 2 && score > 0,
        isIcePoint: score <= -3,
    };
}

// 兼容旧函数名，内部已改为单一市场情绪分数
function calculateSentimentScore(turnoverMomentum, erp) {
    return calculateMarketSentimentScore(turnoverMomentum, erp);
}

function getDimensionSignals(growthScore, inflationScore, liquidityScore, sentimentScore) {
    return {
        growth: growthScore > 0 ? 1 : 0,
        inflation: inflationScore > 0 ? 1 : 0,
        liquidity: liquidityScore > 0 ? 1 : 0,
        sentiment: sentimentScore > 0 ? 1 : 0,
    };
}

function getDimensionSignalKey(signals) {
    return [
        signals.growth,
        signals.inflation,
        signals.liquidity,
        signals.sentiment,
    ].join(',');
}

function scoreStagePrototype(signals, prototype, weights) {
    return dimensionKeys.reduce((score, dimension) => (
        score + (signals[dimension] === prototype[dimension] ? weights[dimension] : 0)
    ), 0);
}

function selectClosestStageByWeights(signals, weights, preferredStage = 2) {
    return Object.entries(stagePrototypeSignals)
        .map(([stage, prototype]) => ({
            stage: Number(stage),
            confidence: scoreStagePrototype(signals, prototype, weights),
        }))
        .sort((left, right) => (
            right.confidence - left.confidence
            || Math.abs(left.stage - preferredStage) - Math.abs(right.stage - preferredStage)
            || left.stage - right.stage
        ))[0];
}

function getStageDecisionState(growthScore, inflationScore, liquidityScore, sentimentScore, turnoverMomentum, erp) {
    const signals = getDimensionSignals(growthScore, inflationScore, liquidityScore, sentimentScore);
    const key = getDimensionSignalKey(signals);
    const sentimentState = getMarketSentimentState(turnoverMomentum, erp);

    if (sentimentState.isOverheated) {
        return {
            stage: 4,
            baseStage: 4,
            method: 'sentiment_overheated',
            key,
            signals,
            weights: getDynamicDimensionWeights(4),
            weightLabel: getDynamicDimensionWeightLabel(4),
            confidence: 1,
        };
    }

    if (sentimentState.isIcePoint) {
        return {
            stage: 6,
            baseStage: 6,
            method: 'sentiment_ice_point',
            key,
            signals,
            weights: getDynamicDimensionWeights(6),
            weightLabel: getDynamicDimensionWeightLabel(6),
            confidence: 1,
        };
    }

    const exactStage = stageSignalMap[key];
    if (exactStage !== undefined) {
        return {
            stage: exactStage,
            baseStage: exactStage,
            method: 'exact',
            key,
            signals,
            weights: getDynamicDimensionWeights(exactStage),
            weightLabel: getDynamicDimensionWeightLabel(exactStage),
            confidence: 1,
        };
    }

    const baseMatch = selectClosestStageByWeights(signals, neutralDimensionWeights);
    const weights = getDynamicDimensionWeights(baseMatch.stage);
    const dynamicMatch = selectClosestStageByWeights(signals, weights, baseMatch.stage);

    return {
        stage: dynamicMatch.stage,
        baseStage: baseMatch.stage,
        method: 'dynamic_weighted',
        key,
        signals,
        weights,
        weightLabel: getDynamicDimensionWeightLabel(baseMatch.stage),
        confidence: Number(dynamicMatch.confidence.toFixed(2)),
    };
}

function formatDimensionWeights(weights) {
    return [
        `G ${Math.round(weights.growth * 100)}%`,
        `I ${Math.round(weights.inflation * 100)}%`,
        `L ${Math.round(weights.liquidity * 100)}%`,
        `S ${Math.round(weights.sentiment * 100)}%`,
    ].join(' / ');
}

function updateDimensionWeightDisplay(stageDecision) {
    const summary = document.getElementById('dimension-weight-summary');
    const note = document.getElementById('dimension-weight-note');
    if (summary) {
        summary.textContent = formatDimensionWeights(stageDecision.weights);
    }
    if (note) {
        const methodText = stageDecision.method === 'dynamic_weighted'
            ? `未命中精确规则，按动态权重归类为阶段 ${stageDecision.stage}`
            : `精确/保护规则命中阶段 ${stageDecision.stage}`;
        note.textContent = `${stageDecision.weightLabel}；${methodText}；资产配置矩阵保持不变。`;
    }
}

// 判定宏观阶段
function determineStage(growthScore, inflationScore, liquidityScore, sentimentScore, turnoverMomentum, erp) {
    return getStageDecisionState(
        growthScore,
        inflationScore,
        liquidityScore,
        sentimentScore,
        turnoverMomentum,
        erp,
    ).stage;
}

// 计算资产配置
function calculateAssetAllocation(stage, turnoverMomentum, erp, growthValueDispersion = 0) {
    let allocation = { ...allocationMatrix[stage] };
    const sentimentState = getMarketSentimentState(turnoverMomentum, erp);

    // 双封顶约束
    allocation.dividend = Math.min(allocation.dividend, 30); // 红利≤30%
    allocation.commodity = Math.min(allocation.commodity, 20); // 商品≤20%
    
    // 情绪过热保护
    if (sentimentState.isOverheated) {
        allocation.total = Math.min(allocation.total, 60);
        allocation.bond = Math.max(allocation.bond, 40);
    }

    // 情绪冰点保护
    if (sentimentState.isIcePoint) {
        allocation.growth = Math.max(allocation.growth, 15);
    }

    const styleTilt = Math.min(5, Math.abs(growthValueDispersion) * 0.5);
    if (growthValueDispersion > 5) {
        const shift = Math.min(styleTilt, allocation.dividend);
        allocation.growth += shift;
        allocation.dividend -= shift;
    } else if (growthValueDispersion < -5) {
        const shift = Math.min(styleTilt, allocation.growth);
        allocation.growth -= shift;
        allocation.dividend += shift;
    }

    return allocation;
}

// 更新配置显示
function updateAllocationDisplay(allocation) {
    document.getElementById('growth-stock').textContent = allocation.growth + '%';
    document.getElementById('dividend-stock').textContent = allocation.dividend + '%';
    document.getElementById('commodity-etf').textContent = allocation.commodity + '%';
    document.getElementById('bond-cash').textContent = allocation.bond + '%';
    document.getElementById('total-position').textContent = allocation.total + '%';
    
    // 更新进度条
    document.getElementById('growth-stock-bar').style.width = allocation.growth + '%';
    document.getElementById('dividend-stock-bar').style.width = allocation.dividend + '%';
    document.getElementById('commodity-etf-bar').style.width = allocation.commodity + '%';
    document.getElementById('bond-cash-bar').style.width = allocation.bond + '%';
}

// 更新图表
function updateChart(allocation) {
    if (!allocationChart) return;
    
    allocationChart.data.datasets[0].data = [
        allocation.growth,
        allocation.dividend,
        allocation.commodity,
        allocation.bond
    ];
    allocationChart.update();
}

// 计算ETF标的因子得分
const neutralFactorDisplay = '中性 0.50';

function clampScore(value) {
    return Math.max(0, Math.min(1, value));
}

function formatFactorScore(value) {
    return value.toFixed(2);
}

function calculateEtfScores(growthValuationPercentile, dividendDy, commodityMomentum) {
    const scores = {};

    // 成长股因子得分
    const growthEtfs = [...etfPool.growth.wide, ...etfPool.growth.tech, ...etfPool.growth.cross];
    growthEtfs.forEach(etf => {
        const valuation = clampScore(1 - (growthValuationPercentile / 100));
        scores[etf.code] = {
            name: etf.name,
            category: etf.category,
            valuation: formatFactorScore(valuation),
            momentum: neutralFactorDisplay,
            risk: neutralFactorDisplay,
            score: formatFactorScore(valuation),
            allocationMode: 'equal',
            scoreMethod: '类别估值因子；ETF内部等权；动量/风险为中性占位'
        };
    });

    // 红利股因子得分
    etfPool.dividend.forEach(etf => {
        // 股息率因子：股息率越高，得分越高
        const dyScore = clampScore((dividendDy - 3) / (6 - 3));
        scores[etf.code] = {
            name: etf.name,
            category: etf.category,
            valuation: formatFactorScore(dyScore),
            momentum: neutralFactorDisplay,
            risk: neutralFactorDisplay,
            score: formatFactorScore(dyScore),
            allocationMode: 'equal',
            scoreMethod: '类别股息率因子；ETF内部等权；动量/风险为中性占位'
        };
    });

    // 商品ETF因子得分
    etfPool.commodity.forEach(etf => {
        // 动量因子：商品价格动量百分比转换为0-1得分，-10%为0，0%为0.5，+10%为1
        const momentum = clampScore(0.5 + commodityMomentum / 20);
        scores[etf.code] = {
            name: etf.name,
            category: etf.category,
            valuation: '不适用',
            momentum: formatFactorScore(momentum),
            risk: neutralFactorDisplay,
            score: formatFactorScore(momentum),
            allocationMode: 'equal',
            scoreMethod: '类别商品动量因子；ETF内部等权；估值不适用、风险为中性占位'
        };
    });

    // 债券和现金得分
    [...etfPool.bond, ...etfPool.cash].forEach(etf => {
        scores[etf.code] = {
            name: etf.name,
            category: etf.category,
            valuation: 'N/A',
            momentum: 'N/A',
            risk: 'N/A',
            score: 'N/A',
            allocationMode: 'fixed',
            scoreMethod: '不参与ETF内部评分'
        };
    });

    return scores;
}

function calculateInternalWeights(etfs, baseWeight, etfScores) {
    if (etfs.length === 0) {
        return [];
    }

    const equalWeight = baseWeight / etfs.length;
    const shouldUseEqualWeight = etfs.every(etf => etfScores[etf.code]?.allocationMode === 'equal');
    if (shouldUseEqualWeight) {
        return etfs.map(() => equalWeight);
    }

    const scoreValues = etfs.map(etf => parseFloat(etfScores[etf.code].score));
    const totalScore = scoreValues.reduce((sum, score) => sum + (Number.isFinite(score) ? score : 0), 0);
    if (totalScore <= 0) {
        return etfs.map(() => equalWeight);
    }

    return scoreValues.map(score => ((Number.isFinite(score) ? score : 0) / totalScore) * baseWeight);
}

// 计算ETF标的智能权重分配
function calculateEtfAllocations(stage, allocation, etfScores) {
    const totalPosition = allocation.total;
    const baseWeights = {
        growth: allocation.growth / 100 * totalPosition,
        dividend: allocation.dividend / 100 * totalPosition,
        commodity: allocation.commodity / 100 * totalPosition,
        bond: allocation.bond / 100 * totalPosition
    };
    
    const etfAllocations = [];
    let totalAllocated = 0;
    
    // 成长股内部分配
    const growthEtfs = [...etfPool.growth.wide, ...etfPool.growth.tech, ...etfPool.growth.cross];
    const growthScores = growthEtfs.map(etf => ({
        ...etf,
        score: parseFloat(etfScores[etf.code].score)
    }));
    const growthWeights = calculateInternalWeights(growthEtfs, baseWeights.growth, etfScores);

    growthScores.forEach((etf, index) => {
        const weight = growthWeights[index];
        etfAllocations.push({
            assetClass: '成长股',
            code: etf.code,
            name: etf.name,
            baseWeight: (baseWeights.growth / growthEtfs.length).toFixed(2),
            score: etf.score.toFixed(2),
            weight: weight.toFixed(2),
            change: (weight - baseWeights.growth / growthEtfs.length).toFixed(2)
        });
        totalAllocated += weight;
    });
    
    // 红利股内部分配
    const dividendScores = etfPool.dividend.map(etf => ({
        ...etf,
        score: parseFloat(etfScores[etf.code].score)
    }));
    const dividendWeights = calculateInternalWeights(etfPool.dividend, baseWeights.dividend, etfScores);

    dividendScores.forEach((etf, index) => {
        const weight = dividendWeights[index];
        etfAllocations.push({
            assetClass: '红利股',
            code: etf.code,
            name: etf.name,
            baseWeight: (baseWeights.dividend / etfPool.dividend.length).toFixed(2),
            score: etf.score.toFixed(2),
            weight: weight.toFixed(2),
            change: (weight - baseWeights.dividend / etfPool.dividend.length).toFixed(2)
        });
        totalAllocated += weight;
    });
    
    // 商品ETF内部分配
    const commodityScores = etfPool.commodity.map(etf => ({
        ...etf,
        score: parseFloat(etfScores[etf.code].score)
    }));
    const commodityWeights = calculateInternalWeights(etfPool.commodity, baseWeights.commodity, etfScores);

    commodityScores.forEach((etf, index) => {
        const weight = commodityWeights[index];
        etfAllocations.push({
            assetClass: '商品ETF',
            code: etf.code,
            name: etf.name,
            baseWeight: (baseWeights.commodity / etfPool.commodity.length).toFixed(2),
            score: etf.score.toFixed(2),
            weight: weight.toFixed(2),
            change: (weight - baseWeights.commodity / etfPool.commodity.length).toFixed(2)
        });
        totalAllocated += weight;
    });
    
    // 债券分配
    etfPool.bond.forEach(etf => {
        etfAllocations.push({
            assetClass: '债券',
            code: etf.code,
            name: etf.name,
            baseWeight: baseWeights.bond.toFixed(2),
            score: 'N/A',
            weight: baseWeights.bond.toFixed(2),
            change: '0.00'
        });
        totalAllocated += baseWeights.bond;
    });
    
    // 现金分配
    etfPool.cash.forEach(etf => {
        const cashWeight = totalPosition - totalAllocated;
        etfAllocations.push({
            assetClass: '现金',
            code: etf.code,
            name: etf.name,
            baseWeight: cashWeight.toFixed(2),
            score: 'N/A',
            weight: cashWeight.toFixed(2),
            change: '0.00'
        });
    });
    
    return etfAllocations;
}

// 更新ETF标的详细配置表格
function updateEtfTable(etfAllocations) {
    if (!etfTable) return;
    
    etfTable.innerHTML = '';
    
    etfAllocations.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap">${item.assetClass}</td>
            <td class="px-4 py-3 whitespace-nowrap">${item.code}</td>
            <td class="px-4 py-3 whitespace-nowrap">${item.name}</td>
            <td class="px-4 py-3 whitespace-nowrap">${item.baseWeight}%</td>
            <td class="px-4 py-3 whitespace-nowrap">${item.score}</td>
            <td class="px-4 py-3 whitespace-nowrap">${item.weight}%</td>
            <td class="px-4 py-3 whitespace-nowrap ${parseFloat(item.change) >= 0 ? 'text-green-600' : 'text-red-600'}">${parseFloat(item.change) >= 0 ? '↑' : '↓'} ${Math.abs(item.change)}%</td>
        `;
        etfTable.appendChild(row);
    });
}

// 更新多因子评分结果表格
function updateFactorTable(etfScores) {
    if (!factorTable) return;
    
    factorTable.innerHTML = '';
    
    Object.entries(etfScores).forEach(([code, scoreData]) => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap">${code}</td>
            <td class="px-4 py-3 whitespace-nowrap">${scoreData.name}</td>
            <td class="px-4 py-3 whitespace-nowrap">${scoreData.valuation}</td>
            <td class="px-4 py-3 whitespace-nowrap">${scoreData.momentum}</td>
            <td class="px-4 py-3 whitespace-nowrap">${scoreData.risk}</td>
            <td class="px-4 py-3 whitespace-nowrap">${scoreData.score}</td>
            <td class="px-4 py-3 text-xs text-gray-500">${scoreData.scoreMethod || '-'}</td>
        `;
        factorTable.appendChild(row);
    });
}

// 保存历史记录
function saveHistory(stage, allocation, etfAllocations) {
    try {
        const history = JSON.parse(localStorage.getItem('macroAllocationHistory') || '[]');
        const record = {
            date: new Date().toISOString().split('T')[0],
            stage: stage,
            stageName: stageDescriptions[stage].name,
            allocation: allocation,
            etfAllocations: etfAllocations
        };
        history.unshift(record);
        // 只保留最近12条记录
        if (history.length > 12) {
            history.pop();
        }
        localStorage.setItem('macroAllocationHistory', JSON.stringify(history));
    } catch (error) {
        console.error('保存历史记录失败:', error);
    }
}

// 加载历史记录
function loadHistory() {
    if (!historyTable) return;
    
    try {
        const history = JSON.parse(localStorage.getItem('macroAllocationHistory') || '[]');
        historyTable.innerHTML = '';
        
        history.forEach(record => {
            const row = document.createElement('tr');
            row.className = 'fade-in';
            row.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap">${record.date}</td>
                <td class="px-4 py-3 whitespace-nowrap">${record.stageName}</td>
                <td class="px-4 py-3 whitespace-nowrap">${record.allocation.growth}%</td>
                <td class="px-4 py-3 whitespace-nowrap">${record.allocation.dividend}%</td>
                <td class="px-4 py-3 whitespace-nowrap">${record.allocation.commodity}%</td>
                <td class="px-4 py-3 whitespace-nowrap">${record.allocation.bond}%</td>
                <td class="px-4 py-3 whitespace-nowrap">${record.allocation.total}%</td>
            `;
            historyTable.appendChild(row);
        });
    } catch (error) {
        console.error('加载历史记录失败:', error);
    }
}

// 初始化系统
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
