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
    
    // 获取制造业PMI
    async getPMI() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators && result.data.indicators.pmi) {
                return result.data.indicators.pmi;
            }
            return { value: 51.2, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取PMI失败:', error);
            return { value: 51.2, error: error.message }; // 默认数据
        }
    }
    
    // 获取全A成交额同比增速
    async getTurnoverYoY() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators && result.data.indicators.turnoverYoY) {
                return result.data.indicators.turnoverYoY;
            }
            return { value: 15.3, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取全A成交额同比增速失败:', error);
            return { value: 15.3, error: error.message }; // 默认数据
        }
    }
    
    // 获取成长股ETF PE分位数
    async getGrowthPEPercentile() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators && result.data.indicators.growthPEPercentile) {
                return result.data.indicators.growthPEPercentile;
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
            if (result.success && result.data && result.data.indicators && result.data.indicators.dividendYield) {
                return result.data.indicators.dividendYield;
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
            if (result.success && result.data && result.data.indicators && result.data.indicators.commodityMomentum) {
                return result.data.indicators.commodityMomentum;
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
            if (result.success && result.data && result.data.indicators && result.data.indicators.socialFinance) {
                return result.data.indicators.socialFinance;
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
            if (result.success && result.data && result.data.indicators && result.data.indicators.cpi) {
                return result.data.indicators.cpi;
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
            if (result.success && result.data && result.data.indicators && result.data.indicators.ppi) {
                return result.data.indicators.ppi;
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
            if (result.success && result.data && result.data.indicators && result.data.indicators.m1m2) {
                return result.data.indicators.m1m2;
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
            if (result.success && result.data && result.data.indicators && result.data.indicators.bondYield) {
                return result.data.indicators.bondYield;
            }
            return { value: 2.65, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取国债收益率失败:', error);
            return { value: 2.65, error: error.message }; // 默认数据
        }
    }
    
    // 获取全A成交额同比
    async getTurnover() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators && result.data.indicators.turnover) {
                return result.data.indicators.turnover;
            }
            return { value: 15.3, error: !result.success ? result.error : null }; // 默认数据
        } catch (error) {
            console.error('获取成交额失败:', error);
            return { value: 15.3, error: error.message }; // 默认数据
        }
    }
    
    // 获取股债利差ERP
    async getERP() {
        try {
            const result = await this.fetchDataFromJson();
            if (result.success && result.data && result.data.indicators && result.data.indicators.erp) {
                return result.data.indicators.erp;
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
        const [pmiResult, socialFinanceResult, cpiResult, ppiResult, m1m2Result, bondYieldResult, turnoverResult, erpResult, turnoverYoYResult, growthPEPercentileResult, dividendYieldResult, commodityMomentumResult] = await Promise.all([
            this.getPMI(),
            this.getSocialFinance(),
            this.getCPI(),
            this.getPPI(),
            this.getM1M2(),
            this.getBondYield(),
            this.getTurnover(),
            this.getERP(),
            this.getTurnoverYoY(),
            this.getGrowthPEPercentile(),
            this.getDividendYield(),
            this.getCommodityMomentum()
        ]);
        
        // 提取值并检查错误
        const results = [pmiResult, socialFinanceResult, cpiResult, ppiResult, m1m2Result, bondYieldResult, turnoverResult, erpResult, turnoverYoYResult, growthPEPercentileResult, dividendYieldResult, commodityMomentumResult];
        const hasError = results.some(result => typeof result === 'object' && result.error);
        
        // 提取值
        const pmi = typeof pmiResult === 'object' ? pmiResult.value : pmiResult;
        const socialFinance = typeof socialFinanceResult === 'object' ? socialFinanceResult.value : socialFinanceResult;
        const cpi = typeof cpiResult === 'object' ? cpiResult.value : cpiResult;
        const ppi = typeof ppiResult === 'object' ? ppiResult.value : ppiResult;
        const m1m2 = typeof m1m2Result === 'object' ? m1m2Result.value : m1m2Result;
        const bondYield = typeof bondYieldResult === 'object' ? bondYieldResult.value : bondYieldResult;
        const turnover = typeof turnoverResult === 'object' ? turnoverResult.value : turnoverResult;
        const erp = typeof erpResult === 'object' ? erpResult.value : erpResult;
        const turnoverYoY = typeof turnoverYoYResult === 'object' ? turnoverYoYResult.value : turnoverYoYResult;
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
            turnover,
            erp,
            turnoverYoY,
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
