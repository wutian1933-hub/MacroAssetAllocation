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

function updateTurnoverMomentumCopy() {
    const label = document.getElementById('turnover-momentum-label')
        || document.querySelector('#turnover')?.parentElement?.querySelector('label');
    const method = document.getElementById('turnover-momentum-method')
        || document.querySelector('#turnover')?.parentElement?.querySelector('.text-xs.text-gray-500.mt-1');
    const trendLabel = document.getElementById('turnover-momentum-trend-label')
        || document.querySelector('#turnover-trend')?.parentElement?.querySelector('label');
    const trendSelect = document.getElementById('turnover-trend');

    if (label) {
        label.textContent = '中证全指成交额滚动环比动量 (%)';
    }
    if (method) {
        method.textContent = '获取方法: ak.stock_zh_index_hist_csindex("000985")，0.7×5日滚动环比 + 0.3×20日滚动环比';
    }
    if (trendLabel) {
        trendLabel.textContent = '成交额动量趋势';
    }
    if (trendSelect && trendSelect.options.length >= 3) {
        trendSelect.options[0].textContent = '继续增强';
        trendSelect.options[1].textContent = '稳定';
        trendSelect.options[2].textContent = '转弱';
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
        setMetricInput('cpi', data.cpi);
        setMetricInput('ppi', data.ppi);
        setMetricInput('m1m2', data.m1m2);
        setMetricInput('bond-yield', data.bondYield);
        setMetricInput('turnover', data.turnoverMomentum ?? data.turnover ?? data.turnoverYoY);
        setMetricInput('erp', data.erp);

        // 填充派生指标
        setMetricInput('growth-pe', data.growthPEPercentile);
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
            alert('数据获取失败，使用的是默认数据。请检查网络连接或手动更新数据。');
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
    const turnoverTrend = document.getElementById('turnover-trend').value;
    
    // 获取ETF标的数据
    const growthPe = parseFloat(document.getElementById('growth-pe').value) || 50;
    const dividendDy = parseFloat(document.getElementById('dividend-dy').value) || 4.5;
    const commodityMomentum = parseFloat(document.getElementById('commodity-momentum').value) || 0.5;
    
    // 计算四维得分
    const growthScore = calculateGrowthScore(pmi, sfTrend);
    const inflationScore = calculateInflationScore(cpi, ppi, ppiTrend);
    const liquidityScore = calculateLiquidityScore(m1m2, bondTrend);
    const sentimentScore = calculateSentimentScore(turnoverMomentum, erp, turnoverTrend);
    
    // 显示得分
    document.getElementById('growth-score').textContent = growthScore;
    document.getElementById('inflation-score').textContent = inflationScore;
    document.getElementById('liquidity-score').textContent = liquidityScore;
    document.getElementById('sentiment-score').textContent = sentimentScore;
    
    // 判定宏观阶段
    const stage = determineStage(growthScore, inflationScore, liquidityScore, sentimentScore, turnoverMomentum, erp);
    
    // 显示阶段信息
    document.getElementById('stage-result').textContent = stageDescriptions[stage].name;
    document.getElementById('stage-desc').textContent = stageDescriptions[stage].desc;
    
    // 计算资产配置
    const allocation = calculateAssetAllocation(stage, turnoverMomentum, erp);
    
    // 计算ETF标的因子得分
    const etfScores = calculateEtfScores(growthPe, dividendDy, commodityMomentum);
    
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
    } else {
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
    } else {
        score -= 1;
    }
    return score;
}

// 计算市场情绪得分
function calculateSentimentScore(turnoverMomentum, erp, turnoverTrend) {
    let score = 0;
    if (turnoverMomentum > 50) {
        score += 2;
    } else if (turnoverMomentum > 0) {
        score += 1;
    } else if (turnoverMomentum < -20) {
        score -= 2;
    } else {
        score -= 1;
    }
    if (turnoverTrend === 'up' && turnoverMomentum > 0) {
        score += 1;
    } else if (turnoverTrend === 'down' && turnoverMomentum < 0) {
        score -= 1;
    }
    if (erp > 80) {
        score -= 1;
    } else if (erp < 20) {
        score += 1;
    }
    return score;
}

// 判定宏观阶段
function determineStage(growthScore, inflationScore, liquidityScore, sentimentScore, turnoverMomentum, erp) {
    // 新的四维得分计算（0或1）
    const G = growthScore > 0 ? 1 : 0;
    const I = inflationScore > 0 ? 1 : 0;
    const L = liquidityScore > 0 ? 1 : 0;
    const S = sentimentScore > 0 ? 1 : 0;
    
    // 情绪过热保护：中证全指成交额动量显著升温
    if (turnoverMomentum > 50 && S === 1) {
        return 4; // 过热初期
    }

    // 情绪冰点保护：成交额动量快速降温且股票相对债券极便宜
    if (turnoverMomentum < -20 && erp > 80) {
        return 6; // 衰退初期
    }
    
    // 基于四维得分判定阶段（新规则）
    const stageMap = {
        '0,0,1,0': 1, // 复苏初期
        '0,0,1,1': 2, // 复苏中期
        '1,0,0,1': 3, // 复苏后期
        '1,1,0,0': 4, // 过热初期
        '1,1,0,0': 5, // 过热后期（需额外判断）
        '0,0,1,0': 6  // 衰退初期（需额外判断）
    };
    
    const key = `${G},${I},${L},${S}`;
    return stageMap[key] || 2; // 默认返回复苏中期
}

// 计算资产配置
function calculateAssetAllocation(stage, turnoverMomentum, erp) {
    let allocation = { ...allocationMatrix[stage] };
    
    // 双封顶约束
    allocation.dividend = Math.min(allocation.dividend, 30); // 红利≤30%
    allocation.commodity = Math.min(allocation.commodity, 20); // 商品≤20%
    
    // 情绪过热保护
    if (turnoverMomentum > 50) {
        allocation.total = Math.min(allocation.total, 60);
        allocation.bond = Math.max(allocation.bond, 40);
    }

    // 情绪冰点保护
    if (turnoverMomentum < -20 && erp > 80) {
        allocation.growth = Math.max(allocation.growth, 15);
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
function calculateEtfScores(growthPe, dividendDy, commodityMomentum) {
    const scores = {};
    
    // 成长股因子得分
    const growthEtfs = [...etfPool.growth.wide, ...etfPool.growth.tech, ...etfPool.growth.cross];
    growthEtfs.forEach(etf => {
        // 估值因子：PE分位数越低，得分越高
        const valuation = 1 - (growthPe / 100);
        // 动量因子：假设为0.5（实际应根据20日收益率计算）
        const momentum = 0.5;
        // 风险因子：假设为0.5（实际应根据波动率计算）
        const risk = 0.5;
        // 综合得分
        const score = 0.35 * valuation + 0.45 * momentum + 0.20 * risk;
        scores[etf.code] = {
            name: etf.name,
            category: etf.category,
            valuation: valuation.toFixed(2),
            momentum: momentum.toFixed(2),
            risk: risk.toFixed(2),
            score: score.toFixed(2)
        };
    });
    
    // 红利股因子得分
    etfPool.dividend.forEach(etf => {
        // 股息率因子：股息率越高，得分越高
        const dyScore = (dividendDy - 3) / (6 - 3); // 假设股息率范围3%-6%
        const dyScoreClamped = Math.max(0, Math.min(1, dyScore));
        // 股息率历史分位：假设为0.7
        const dyPercentile = 0.7;
        // 动量因子：假设为0.3
        const momentum = 0.3;
        // 风险因子：假设为0.8（红利股波动率较低）
        const risk = 0.8;
        // 综合得分
        const score = 0.50 * dyScoreClamped + 0.20 * dyPercentile + 0.20 * momentum + 0.10 * risk;
        scores[etf.code] = {
            name: etf.name,
            category: etf.category,
            valuation: dyScoreClamped.toFixed(2),
            momentum: momentum.toFixed(2),
            risk: risk.toFixed(2),
            score: score.toFixed(2)
        };
    });
    
    // 商品ETF因子得分
    etfPool.commodity.forEach(etf => {
        // 估值因子：商品不适用PE，设为0.5
        const valuation = 0.5;
        // 动量因子：使用输入的商品动量得分
        const momentum = commodityMomentum;
        // 风险因子：假设为0.4（商品波动率较高）
        const risk = 0.4;
        // 综合得分
        const score = 0.20 * valuation + 0.50 * momentum + 0.30 * risk;
        scores[etf.code] = {
            name: etf.name,
            category: etf.category,
            valuation: valuation.toFixed(2),
            momentum: momentum.toFixed(2),
            risk: risk.toFixed(2),
            score: score.toFixed(2)
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
            score: 'N/A'
        };
    });
    
    return scores;
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
    const growthTotalScore = growthScores.reduce((sum, etf) => sum + etf.score, 0);
    
    growthScores.forEach(etf => {
        const weight = (etf.score / growthTotalScore) * baseWeights.growth;
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
    const dividendTotalScore = dividendScores.reduce((sum, etf) => sum + etf.score, 0);
    
    dividendScores.forEach(etf => {
        const weight = (etf.score / dividendTotalScore) * baseWeights.dividend;
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
    const commodityTotalScore = commodityScores.reduce((sum, etf) => sum + etf.score, 0);
    
    commodityScores.forEach(etf => {
        const weight = (etf.score / commodityTotalScore) * baseWeights.commodity;
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
