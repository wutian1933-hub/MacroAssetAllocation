// 数据获取模块

class MacroDataFetcher {
    constructor() {
        this.dataCache = {};
        this.lastFetchTime = {};
    }
    
    // 从data.json文件获取数据
    async fetchDataFromJson() {
        try {
            // 首先尝试从当前目录获取
            let response = await fetch('data.json');
            if (!response.ok) {
                // 如果失败，尝试从GitHub原始文件URL获取
                const githubRawUrl = 'https://raw.githubusercontent.com/wutian1933-hub/MacroAssetAllocation/master/data.json';
                response = await fetch(githubRawUrl);
                if (!response.ok) {
                    throw new Error('获取数据文件失败');
                }
            }
            const data = await response.json();
            return { success: true, data: data };
        } catch (error) {
            console.error('从data.json获取数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    getIndicator(indicators, keys, defaultValue) {
        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(indicators || {}, key)) {
                const value = indicators[key];
                if (value !== null && value !== undefined && value !== '') {
                    return value;
                }
            }
        }
        return defaultValue;
    }

    getIndicatorResult(data, keys, defaultValue) {
        const value = this.getIndicator(data && data.indicators, keys, defaultValue);
        const errors = data && data.errors ? data.errors : {};
        const notes = data && data.notes ? data.notes : {};
        const sources = data && data.sources ? data.sources : {};
        const errorKey = keys.find(key => errors[key]);
        const noteKey = keys.find(key => notes[key]);
        const sourceKey = keys.find(key => sources[key]);
        if (errorKey) {
            return {
                value,
                error: `${errorKey}: ${errors[errorKey]}`,
                source: sourceKey ? sources[sourceKey] : null,
            };
        }
        if (noteKey) {
            return {
                value,
                note: `${noteKey}: ${notes[noteKey]}`,
                source: sourceKey ? sources[sourceKey] : null,
            };
        }
        return value;
    }

    calculateTurnoverSentimentContribution(turnoverMomentum) {
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

    calculateErpSentimentContribution(erp) {
        if (erp > 80) {
            return -1;
        }
        if (erp < 20) {
            return 1;
        }
        return 0;
    }

    calculateMarketSentimentScore(turnoverMomentum, erp) {
        return this.calculateTurnoverSentimentContribution(turnoverMomentum)
            + this.calculateErpSentimentContribution(erp);
    }
    
    // 获取制造业PMI
    async getPMI() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['pmi'], 51.2);
            }
            return { value: 51.2, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取PMI失败:', error);
            return { value: 51.2, error: error.message }; // 默认数据
        }
    }
    
    // 获取中证全指成交额滚动环比动量
    async getTurnoverMomentum() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(
                    result.data,
                    ['turnoverMomentum', 'turnover', 'turnoverYoY'],
                    15.3
                );
            }
            return { value: 15.3, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取中证全指成交额动量失败:', error);
            return { value: 15.3, error: error.message }; // 默认数据
        }
    }

    // 兼容旧方法名
    async getTurnoverYoY() {
        return this.getTurnoverMomentum();
    }
    
    // 获取成长风格估值分位数
    async getGrowthValuationPercentile() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(
                    result.data,
                    ['growthValuationPercentile', 'growthPEPercentile'],
                    45
                );
            }
            return { value: 45, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取成长风格估值分位数失败:', error);
            return { value: 45, error: error.message }; // 默认数据
        }
    }

    // 兼容旧方法名
    async getGrowthPEPercentile() {
        return this.getGrowthValuationPercentile();
    }

    // 获取成长/价值分化度
    async getGrowthValueDispersion() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['growthValueDispersion'], 0);
            }
            return { value: 0, error: !result.success ? result.error : null }; // 默认中性
        } catch (error) {
            console.error('获取成长/价值分化度失败:', error);
            return { value: 0, error: error.message }; // 默认中性
        }
    }
    
    // 获取红利风格股息率
    async getDividendYield() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['dividendYield'], 3.2);
            }
            return { value: 3.2, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取红利风格股息率失败:', error);
            return { value: 3.2, error: error.message }; // 默认数据
        }
    }
    
    // 获取商品价格动量
    async getCommodityMomentum() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['commodityMomentum'], 0);
            }
            return { value: 0, error: !result.success ? result.error : null }; // 默认中性
        } catch (error) {
            console.error('获取商品价格动量失败:', error);
            return { value: 0, error: error.message }; // 默认中性
        }
    }
    
    // 获取社融存量同比
    async getSocialFinance() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['socialFinance'], 9.8);
            }
            return { value: 9.8, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取社融失败:', error);
            return { value: 9.8, error: error.message }; // 默认数据
        }
    }
    
    // 获取CPI同比
    async getCPI() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['cpi'], 2.1);
            }
            return { value: 2.1, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取CPI失败:', error);
            return { value: 2.1, error: error.message }; // 默认数据
        }
    }
    
    // 获取PPI同比
    async getPPI() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['ppi'], -0.5);
            }
            return { value: -0.5, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取PPI失败:', error);
            return { value: -0.5, error: error.message }; // 默认数据
        }
    }
    
    // 获取M1-M2剪刀差
    async getM1M2() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['m1m2'], -1.2);
            }
            return { value: -1.2, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取M1-M2剪刀差失败:', error);
            return { value: -1.2, error: error.message }; // 默认数据
        }
    }
    
    // 获取10年期国债收益率
    async getBondYield() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['bondYield'], 2.65);
            }
            return { value: 2.65, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取国债收益率失败:', error);
            return { value: 2.65, error: error.message }; // 默认数据
        }
    }
    
    // 获取中证全指成交额滚动环比动量
    async getTurnover() {
        return this.getTurnoverMomentum();
    }
    
    // 获取股债利差ERP
    async getERP() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicatorResult(result.data, ['erp'], 65);
            }
            return { value: 65, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取ERP失败:', error);
            return { value: 65, error: error.message }; // 默认数据
        }
    }
    
    // 获取所有宏观数据
    async getAllMacroData() {
        const result = await this.fetchDataFromJson();
        if (!result.success || !result.data || !result.data.indicators) {
            const errorMessage = `无法读取 data.json：${result.error || '数据文件格式异常'}。请确认通过 GitHub Pages 页面访问，并检查网络或浏览器拦截。`;
            const fallbackData = {
                pmi: 51.2,
                socialFinance: 9.8,
                socialFinanceTrend: 'stable',
                cpi: 2.1,
                ppi: -0.5,
                ppiTrend: 'stable',
                m1m2: -1.2,
                bondYield: 2.65,
                bondYieldTrend: 'stable',
                turnover: 15.3,
                turnoverMomentum: 15.3,
                erp: 65,
                marketSentimentScore: this.calculateMarketSentimentScore(15.3, 65),
                turnoverYoY: 15.3,
                growthValueDispersion: 0,
                growthValuationPercentile: 45,
                growthPEPercentile: 45,
                dividendYield: 3.2,
                commodityMomentum: 0,
                hasError: true,
                errors: [errorMessage],
                hasNotes: false,
                notes: []
            };

            this.dataCache = fallbackData;
            this.lastFetchTime = new Date().toISOString();
            localStorage.setItem('macroDataCache', JSON.stringify(fallbackData));
            localStorage.setItem('lastFetchTime', this.lastFetchTime);
            return fallbackData;
        }

        const sourceData = result.data;
        const pmiResult = this.getIndicatorResult(sourceData, ['pmi'], 51.2);
        const socialFinanceResult = this.getIndicatorResult(sourceData, ['socialFinance'], 9.8);
        const socialFinanceTrendResult = this.getIndicatorResult(sourceData, ['socialFinanceTrend'], 'stable');
        const cpiResult = this.getIndicatorResult(sourceData, ['cpi'], 2.1);
        const ppiResult = this.getIndicatorResult(sourceData, ['ppi'], -0.5);
        const ppiTrendResult = this.getIndicatorResult(sourceData, ['ppiTrend'], 'stable');
        const m1m2Result = this.getIndicatorResult(sourceData, ['m1m2'], -1.2);
        const bondYieldResult = this.getIndicatorResult(sourceData, ['bondYield'], 2.65);
        const bondYieldTrendResult = this.getIndicatorResult(sourceData, ['bondYieldTrend'], 'stable');
        const turnoverMomentumResult = this.getIndicatorResult(sourceData, ['turnoverMomentum', 'turnover', 'turnoverYoY'], 15.3);
        const erpResult = this.getIndicatorResult(sourceData, ['erp'], 65);
        const growthValueDispersionResult = this.getIndicatorResult(sourceData, ['growthValueDispersion'], 0);
        const growthValuationPercentileResult = this.getIndicatorResult(sourceData, ['growthValuationPercentile', 'growthPEPercentile'], 45);
        const dividendYieldResult = this.getIndicatorResult(sourceData, ['dividendYield'], 3.2);
        const commodityMomentumResult = this.getIndicatorResult(sourceData, ['commodityMomentum'], 0);

        // 提取值并检查错误
        const results = [
            pmiResult,
            socialFinanceResult,
            socialFinanceTrendResult,
            cpiResult,
            ppiResult,
            ppiTrendResult,
            m1m2Result,
            bondYieldResult,
            bondYieldTrendResult,
            turnoverMomentumResult,
            erpResult,
            growthValueDispersionResult,
            growthValuationPercentileResult,
            dividendYieldResult,
            commodityMomentumResult,
        ];
        const errors = results
            .filter(result => typeof result === 'object' && result.error)
            .map(result => result.error);
        const notes = results
            .filter(result => typeof result === 'object' && result.note)
            .map(result => result.note);
        const hasError = errors.length > 0;
        const hasNotes = notes.length > 0;

        // 提取值
        const pmi = typeof pmiResult === 'object' ? pmiResult.value : pmiResult;
        const socialFinance = typeof socialFinanceResult === 'object' ? socialFinanceResult.value : socialFinanceResult;
        const socialFinanceTrend = typeof socialFinanceTrendResult === 'object' ? socialFinanceTrendResult.value : socialFinanceTrendResult;
        const cpi = typeof cpiResult === 'object' ? cpiResult.value : cpiResult;
        const ppi = typeof ppiResult === 'object' ? ppiResult.value : ppiResult;
        const ppiTrend = typeof ppiTrendResult === 'object' ? ppiTrendResult.value : ppiTrendResult;
        const m1m2 = typeof m1m2Result === 'object' ? m1m2Result.value : m1m2Result;
        const bondYield = typeof bondYieldResult === 'object' ? bondYieldResult.value : bondYieldResult;
        const bondYieldTrend = typeof bondYieldTrendResult === 'object' ? bondYieldTrendResult.value : bondYieldTrendResult;
        const turnoverMomentum = typeof turnoverMomentumResult === 'object' ? turnoverMomentumResult.value : turnoverMomentumResult;
        const erp = typeof erpResult === 'object' ? erpResult.value : erpResult;
        const marketSentimentScore = this.calculateMarketSentimentScore(turnoverMomentum, erp);
        const growthValueDispersion = typeof growthValueDispersionResult === 'object' ? growthValueDispersionResult.value : growthValueDispersionResult;
        const growthValuationPercentile = typeof growthValuationPercentileResult === 'object' ? growthValuationPercentileResult.value : growthValuationPercentileResult;
        const dividendYield = typeof dividendYieldResult === 'object' ? dividendYieldResult.value : dividendYieldResult;
        const commodityMomentum = typeof commodityMomentumResult === 'object' ? commodityMomentumResult.value : commodityMomentumResult;
        
        const data = {
            pmi,
            socialFinance,
            socialFinanceTrend,
            cpi,
            ppi,
            ppiTrend,
            m1m2,
            bondYield,
            bondYieldTrend,
            turnover: turnoverMomentum,
            turnoverMomentum,
            erp,
            marketSentimentScore,
            turnoverYoY: turnoverMomentum,
            growthValueDispersion,
            growthValuationPercentile,
            growthPEPercentile: growthValuationPercentile,
            dividendYield,
            commodityMomentum,
            hasError, // 添加错误标志
            errors,
            hasNotes,
            notes
        };
        
        // 缓存数据
        this.dataCache = data;
        this.lastFetchTime = new Date().toISOString();
        
        // 保存到localStorage
        localStorage.setItem('macroDataCache', JSON.stringify(data));
        localStorage.setItem('lastFetchTime', this.lastFetchTime);
        
        return data;
    }
    
    // 获取缓存数据
    getCachedData() {
        const cachedData = localStorage.getItem('macroDataCache');
        const lastFetchTime = localStorage.getItem('lastFetchTime');
        
        if (cachedData && lastFetchTime) {
            const fetchTime = new Date(lastFetchTime);
            const now = new Date();
            const hoursSinceFetch = (now - fetchTime) / (1000 * 60 * 60);
            
            // 如果数据在24小时内，使用缓存
            if (hoursSinceFetch < 24) {
                return JSON.parse(cachedData);
            }
        }
        
        return null;
    }
}

// 导出实例
const macroDataFetcher = new MacroDataFetcher();
