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
    
    // 获取制造业PMI
    async getPMI() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicator(result.data.indicators, ['pmi'], 51.2);
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
                return this.getIndicator(
                    result.data.indicators,
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
    
    // 获取成长股ETF PE分位数
    async getGrowthPEPercentile() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicator(result.data.indicators, ['growthPEPercentile'], 45);
            }
            return { value: 45, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取成长股ETF PE分位数失败:', error);
            return { value: 45, error: error.message }; // 默认数据
        }
    }
    
    // 获取红利股ETF股息率
    async getDividendYield() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicator(result.data.indicators, ['dividendYield'], 3.2);
            }
            return { value: 3.2, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取红利股ETF股息率失败:', error);
            return { value: 3.2, error: error.message }; // 默认数据
        }
    }
    
    // 获取商品ETF动量得分
    async getCommodityMomentum() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicator(result.data.indicators, ['commodityMomentum'], 2.5);
            }
            return { value: 2.5, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取商品ETF动量得分失败:', error);
            return { value: 2.5, error: error.message }; // 默认数据
        }
    }
    
    // 获取社融存量同比
    async getSocialFinance() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators) {
                return this.getIndicator(result.data.indicators, ['socialFinance'], 9.8);
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
                return this.getIndicator(result.data.indicators, ['cpi'], 2.1);
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
                return this.getIndicator(result.data.indicators, ['ppi'], -0.5);
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
                return this.getIndicator(result.data.indicators, ['m1m2'], -1.2);
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
                return this.getIndicator(result.data.indicators, ['bondYield'], 2.65);
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
                return this.getIndicator(result.data.indicators, ['erp'], 65);
            }
            return { value: 65, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取ERP失败:', error);
            return { value: 65, error: error.message }; // 默认数据
        }
    }
    
    // 获取所有宏观数据
    async getAllMacroData() {
        // 并行获取所有数据
        const [pmiResult, socialFinanceResult, cpiResult, ppiResult, m1m2Result, bondYieldResult, turnoverMomentumResult, erpResult, growthPEPercentileResult, dividendYieldResult, commodityMomentumResult] = await Promise.all([
            this.getPMI(),
            this.getSocialFinance(),
            this.getCPI(),
            this.getPPI(),
            this.getM1M2(),
            this.getBondYield(),
            this.getTurnoverMomentum(),
            this.getERP(),
            this.getGrowthPEPercentile(),
            this.getDividendYield(),
            this.getCommodityMomentum()
        ]);

        // 提取值并检查错误
        const results = [pmiResult, socialFinanceResult, cpiResult, ppiResult, m1m2Result, bondYieldResult, turnoverMomentumResult, erpResult, growthPEPercentileResult, dividendYieldResult, commodityMomentumResult];
        const hasError = results.some(result => typeof result === 'object' && result.error);

        // 提取值
        const pmi = typeof pmiResult === 'object' ? pmiResult.value : pmiResult;
        const socialFinance = typeof socialFinanceResult === 'object' ? socialFinanceResult.value : socialFinanceResult;
        const cpi = typeof cpiResult === 'object' ? cpiResult.value : cpiResult;
        const ppi = typeof ppiResult === 'object' ? ppiResult.value : ppiResult;
        const m1m2 = typeof m1m2Result === 'object' ? m1m2Result.value : m1m2Result;
        const bondYield = typeof bondYieldResult === 'object' ? bondYieldResult.value : bondYieldResult;
        const turnoverMomentum = typeof turnoverMomentumResult === 'object' ? turnoverMomentumResult.value : turnoverMomentumResult;
        const erp = typeof erpResult === 'object' ? erpResult.value : erpResult;
        const growthPEPercentile = typeof growthPEPercentileResult === 'object' ? growthPEPercentileResult.value : growthPEPercentileResult;
        const dividendYield = typeof dividendYieldResult === 'object' ? dividendYieldResult.value : dividendYieldResult;
        const commodityMomentum = typeof commodityMomentumResult === 'object' ? commodityMomentumResult.value : commodityMomentumResult;
        
        const data = {
            pmi,
            socialFinance,
            cpi,
            ppi,
            m1m2,
            bondYield,
            turnover: turnoverMomentum,
            turnoverMomentum,
            erp,
            turnoverYoY: turnoverMomentum,
            growthPEPercentile,
            dividendYield,
            commodityMomentum,
            hasError // 添加错误标志
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
