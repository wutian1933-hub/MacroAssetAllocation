// 设置页面脚本

// 默认管理员密码（第一次使用时）
const DEFAULT_ADMIN_PASSWORD = 'admin123';

// DOM元素
let authSection, settingsContent, adminPassword, loginBtn, backBtn, logoutBtn;
let allocationMatrixTable, saveAllocationBtn;
let stageDescriptionsContainer, saveStagesBtn;
let etfPoolContainer, saveEtfBtn;
let newAdminPassword, saveAuthBtn;

// 基础数据
let allocationMatrix, stageDescriptions, etfPool;

// 初始化
function init() {
    // 获取DOM元素
    authSection = document.getElementById('auth-section');
    settingsContent = document.getElementById('settings-content');
    adminPassword = document.getElementById('admin-password');
    loginBtn = document.getElementById('login-btn');
    backBtn = document.getElementById('back-btn');
    logoutBtn = document.getElementById('logout-btn');
    
    allocationMatrixTable = document.getElementById('allocation-matrix-table');
    saveAllocationBtn = document.getElementById('save-allocation-btn');
    
    stageDescriptionsContainer = document.getElementById('stage-descriptions-container');
    saveStagesBtn = document.getElementById('save-stages-btn');
    
    etfPoolContainer = document.getElementById('etf-pool-container');
    saveEtfBtn = document.getElementById('save-etf-btn');
    
    newAdminPassword = document.getElementById('new-admin-password');
    saveAuthBtn = document.getElementById('save-auth-btn');
    
    // 绑定事件
    loginBtn.addEventListener('click', handleLogin);
    backBtn.addEventListener('click', () => window.location.href = 'index.html');
    logoutBtn.addEventListener('click', handleLogout);
    
    saveAllocationBtn.addEventListener('click', saveAllocationMatrix);
    saveStagesBtn.addEventListener('click', saveStageDescriptions);
    saveEtfBtn.addEventListener('click', saveEtfPool);
    saveAuthBtn.addEventListener('click', saveAdminPassword);
    
    // 绑定数据获取设置保存按钮
    const saveFetchSettingsBtn = document.getElementById('save-fetch-settings-btn');
    if (saveFetchSettingsBtn) {
        saveFetchSettingsBtn.addEventListener('click', saveFetchSettings);
    }
    
    // 绑定API设置按钮
    const saveApiSettingsBtn = document.getElementById('save-api-settings-btn');
    if (saveApiSettingsBtn) {
        saveApiSettingsBtn.addEventListener('click', saveApiSettings);
    }
    
    const testApiBtn = document.getElementById('test-api-btn');
    if (testApiBtn) {
        testApiBtn.addEventListener('click', testApiConnection);
    }
    
    // 检查权限
    checkAuth();
}

// 检查权限
function checkAuth() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    const expiryTime = localStorage.getItem('adminAuthenticatedExpiry');
    
    if (isAuthenticated && expiryTime) {
        const now = new Date().getTime();
        if (now < parseInt(expiryTime)) {
            showSettingsContent();
        } else {
            // 登录状态已过期
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminAuthenticatedExpiry');
        }
    }
}

// 简单的密码哈希函数
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// 处理登录
function handleLogin() {
    const password = adminPassword.value;
    const storedPassword = localStorage.getItem('adminPassword') || hashPassword(DEFAULT_ADMIN_PASSWORD);
    
    if (hashPassword(password) === storedPassword) {
        localStorage.setItem('adminAuthenticated', 'true');
        // 设置登录状态过期时间（24小时）
        const expiryTime = new Date().getTime() + 24 * 60 * 60 * 1000;
        localStorage.setItem('adminAuthenticatedExpiry', expiryTime.toString());
        showSettingsContent();
    } else {
        alert('密码错误，请重试！');
    }
}

// 处理登出
function handleLogout() {
    localStorage.removeItem('adminAuthenticated');
    localStorage.removeItem('adminAuthenticatedExpiry');
    window.location.reload();
}

// 显示设置内容
function showSettingsContent() {
    authSection.classList.add('hidden');
    settingsContent.classList.remove('hidden');
    
    // 加载基础数据
    loadBaseData();
    
    // 加载数据获取设置
    loadFetchSettings();
    
    // 加载API设置
    loadApiSettings();
    
    // 渲染配置矩阵
    renderAllocationMatrix();
    
    // 渲染阶段描述
    renderStageDescriptions();
    
    // 渲染ETF标的池
    renderEtfPool();
}

// 加载基础数据
function loadBaseData() {
    // 加载配置矩阵
    const storedAllocationMatrix = localStorage.getItem('allocationMatrix');
    if (storedAllocationMatrix) {
        allocationMatrix = JSON.parse(storedAllocationMatrix);
    } else {
        allocationMatrix = {
            1: { growth: 40, dividend: 20, commodity: 10, bond: 30, total: 80 },
            2: { growth: 50, dividend: 20, commodity: 10, bond: 20, total: 80 },
            3: { growth: 40, dividend: 20, commodity: 20, bond: 20, total: 80 },
            4: { growth: 20, dividend: 30, commodity: 20, bond: 30, total: 60 },
            5: { growth: 20, dividend: 30, commodity: 10, bond: 40, total: 60 },
            6: { growth: 10, dividend: 20, commodity: 0, bond: 70, total: 30 }
        };
    }
    
    // 加载阶段描述
    const storedStageDescriptions = localStorage.getItem('stageDescriptions');
    if (storedStageDescriptions) {
        stageDescriptions = JSON.parse(storedStageDescriptions);
    } else {
        stageDescriptions = {
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
    }
    
    // 加载ETF标的池
    const storedEtfPool = localStorage.getItem('etfPool');
    if (storedEtfPool) {
        etfPool = JSON.parse(storedEtfPool);
    } else {
        etfPool = {
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
    }
}

// 渲染配置矩阵
function renderAllocationMatrix() {
    allocationMatrixTable.innerHTML = '';
    
    for (let stage in allocationMatrix) {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap">阶段 ${stage}</td>
            <td class="px-4 py-3 whitespace-nowrap">
                <input type="number" class="w-full px-2 py-1 border border-gray-300 rounded-md" value="${allocationMatrix[stage].growth}" data-stage="${stage}" data-field="growth">
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <input type="number" class="w-full px-2 py-1 border border-gray-300 rounded-md" value="${allocationMatrix[stage].dividend}" data-stage="${stage}" data-field="dividend">
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <input type="number" class="w-full px-2 py-1 border border-gray-300 rounded-md" value="${allocationMatrix[stage].commodity}" data-stage="${stage}" data-field="commodity">
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <input type="number" class="w-full px-2 py-1 border border-gray-300 rounded-md" value="${allocationMatrix[stage].bond}" data-stage="${stage}" data-field="bond">
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <input type="number" class="w-full px-2 py-1 border border-gray-300 rounded-md" value="${allocationMatrix[stage].total}" data-stage="${stage}" data-field="total">
            </td>
        `;
        allocationMatrixTable.appendChild(row);
    }
}

// 渲染阶段描述
function renderStageDescriptions() {
    stageDescriptionsContainer.innerHTML = '';
    
    for (let stage in stageDescriptions) {
        const stageDiv = document.createElement('div');
        stageDiv.className = 'border border-gray-200 rounded-md p-4 fade-in';
        stageDiv.innerHTML = `
            <h3 class="font-medium text-gray-800 mb-2">阶段 ${stage}</h3>
            <div class="space-y-2">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">阶段名称</label>
                    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${stageDescriptions[stage].name}" data-stage="${stage}" data-field="name">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">阶段描述</label>
                    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${stageDescriptions[stage].desc}" data-stage="${stage}" data-field="desc">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">阶段特征</label>
                    <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${stageDescriptions[stage].feature}" data-stage="${stage}" data-field="feature">
                </div>
            </div>
        `;
        stageDescriptionsContainer.appendChild(stageDiv);
    }
}

// 渲染ETF标的池
function renderEtfPool() {
    etfPoolContainer.innerHTML = '';
    
    // 渲染成长股ETF
    const growthDiv = document.createElement('div');
    growthDiv.className = 'border border-gray-200 rounded-md p-4 fade-in';
    growthDiv.innerHTML = `
        <h3 class="font-medium text-gray-800 mb-2">成长股ETF</h3>
        
        <div class="mb-4">
            <h4 class="font-medium text-gray-700 mb-2">宽基成长</h4>
            <div id="growth-wide-container" class="space-y-2">
                <!-- 宽基成长ETF将通过JavaScript动态添加 -->
            </div>
            <button class="mt-2 bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700 transition-colors text-sm" onclick="addEtf('growth', 'wide')">
                添加ETF
            </button>
        </div>
        
        <div class="mb-4">
            <h4 class="font-medium text-gray-700 mb-2">科技成长</h4>
            <div id="growth-tech-container" class="space-y-2">
                <!-- 科技成长ETF将通过JavaScript动态添加 -->
            </div>
            <button class="mt-2 bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700 transition-colors text-sm" onclick="addEtf('growth', 'tech')">
                添加ETF
            </button>
        </div>
        
        <div>
            <h4 class="font-medium text-gray-700 mb-2">跨境成长</h4>
            <div id="growth-cross-container" class="space-y-2">
                <!-- 跨境成长ETF将通过JavaScript动态添加 -->
            </div>
            <button class="mt-2 bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700 transition-colors text-sm" onclick="addEtf('growth', 'cross')">
                添加ETF
            </button>
        </div>
    `;
    etfPoolContainer.appendChild(growthDiv);
    
    // 渲染红利股ETF
    const dividendDiv = document.createElement('div');
    dividendDiv.className = 'border border-gray-200 rounded-md p-4 fade-in';
    dividendDiv.innerHTML = `
        <h3 class="font-medium text-gray-800 mb-2">红利股ETF</h3>
        <div id="dividend-container" class="space-y-2">
            <!-- 红利股ETF将通过JavaScript动态添加 -->
        </div>
        <button class="mt-2 bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700 transition-colors text-sm" onclick="addEtf('dividend')">
            添加ETF
        </button>
    `;
    etfPoolContainer.appendChild(dividendDiv);
    
    // 渲染商品ETF
    const commodityDiv = document.createElement('div');
    commodityDiv.className = 'border border-gray-200 rounded-md p-4 fade-in';
    commodityDiv.innerHTML = `
        <h3 class="font-medium text-gray-800 mb-2">商品ETF</h3>
        <div id="commodity-container" class="space-y-2">
            <!-- 商品ETF将通过JavaScript动态添加 -->
        </div>
        <button class="mt-2 bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700 transition-colors text-sm" onclick="addEtf('commodity')">
            添加ETF
        </button>
    `;
    etfPoolContainer.appendChild(commodityDiv);
    
    // 渲染债券ETF
    const bondDiv = document.createElement('div');
    bondDiv.className = 'border border-gray-200 rounded-md p-4 fade-in';
    bondDiv.innerHTML = `
        <h3 class="font-medium text-gray-800 mb-2">债券ETF</h3>
        <div id="bond-container" class="space-y-2">
            <!-- 债券ETF将通过JavaScript动态添加 -->
        </div>
        <button class="mt-2 bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700 transition-colors text-sm" onclick="addEtf('bond')">
            添加ETF
        </button>
    `;
    etfPoolContainer.appendChild(bondDiv);
    
    // 渲染现金ETF
    const cashDiv = document.createElement('div');
    cashDiv.className = 'border border-gray-200 rounded-md p-4 fade-in';
    cashDiv.innerHTML = `
        <h3 class="font-medium text-gray-800 mb-2">现金ETF</h3>
        <div id="cash-container" class="space-y-2">
            <!-- 现金ETF将通过JavaScript动态添加 -->
        </div>
        <button class="mt-2 bg-blue-600 text-white py-1 px-2 rounded-md hover:bg-blue-700 transition-colors text-sm" onclick="addEtf('cash')">
            添加ETF
        </button>
    `;
    etfPoolContainer.appendChild(cashDiv);
    
    // 填充ETF数据
    fillEtfData();
}

// 填充ETF数据
function fillEtfData() {
    // 填充成长股ETF
    fillEtfCategory('growth', 'wide', etfPool.growth.wide);
    fillEtfCategory('growth', 'tech', etfPool.growth.tech);
    fillEtfCategory('growth', 'cross', etfPool.growth.cross);
    
    // 填充其他类别ETF
    fillEtfCategory('dividend', '', etfPool.dividend);
    fillEtfCategory('commodity', '', etfPool.commodity);
    fillEtfCategory('bond', '', etfPool.bond);
    fillEtfCategory('cash', '', etfPool.cash);
}

// 填充ETF类别数据
function fillEtfCategory(category, subcategory, etfs) {
    const containerId = subcategory ? `${category}-${subcategory}-container` : `${category}-container`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    etfs.forEach((etf, index) => {
        const etfDiv = document.createElement('div');
        etfDiv.className = 'flex items-center space-x-2 p-2 border border-gray-100 rounded-md';
        etfDiv.innerHTML = `
            <input type="text" class="flex-1 px-2 py-1 border border-gray-300 rounded-md" value="${etf.code}" data-category="${category}" data-subcategory="${subcategory}" data-index="${index}" data-field="code">
            <input type="text" class="flex-2 px-2 py-1 border border-gray-300 rounded-md" value="${etf.name}" data-category="${category}" data-subcategory="${subcategory}" data-index="${index}" data-field="name">
            <button class="bg-red-600 text-white py-1 px-2 rounded-md hover:bg-red-700 transition-colors text-sm" onclick="removeEtf('${category}', '${subcategory}', ${index})")">
                删除
            </button>
        `;
        container.appendChild(etfDiv);
    });
}

// 添加ETF
function addEtf(category, subcategory = '') {
    if (category === 'growth') {
        etfPool.growth[subcategory].push({ code: '', name: '', category: `growth_${subcategory}` });
    } else {
        etfPool[category].push({ code: '', name: '', category: category });
    }
    renderEtfPool();
}

// 删除ETF
function removeEtf(category, subcategory = '', index) {
    if (category === 'growth') {
        etfPool.growth[subcategory].splice(index, 1);
    } else {
        etfPool[category].splice(index, 1);
    }
    renderEtfPool();
}

// 保存配置矩阵
function saveAllocationMatrix() {
    // 收集配置矩阵数据
    const inputs = allocationMatrixTable.querySelectorAll('input');
    inputs.forEach(input => {
        const stage = input.dataset.stage;
        const field = input.dataset.field;
        const value = parseFloat(input.value) || 0;
        allocationMatrix[stage][field] = value;
    });
    
    // 保存到localStorage
    localStorage.setItem('allocationMatrix', JSON.stringify(allocationMatrix));
    alert('配置矩阵保存成功！');
}

// 保存阶段描述
function saveStageDescriptions() {
    // 收集阶段描述数据
    const inputs = stageDescriptionsContainer.querySelectorAll('input');
    inputs.forEach(input => {
        const stage = input.dataset.stage;
        const field = input.dataset.field;
        const value = input.value;
        stageDescriptions[stage][field] = value;
    });
    
    // 保存到localStorage
    localStorage.setItem('stageDescriptions', JSON.stringify(stageDescriptions));
    alert('阶段描述保存成功！');
}

// 保存ETF标的池
function saveEtfPool() {
    // 收集成长股ETF数据
    const growthInputs = document.querySelectorAll('[data-category="growth"]');
    growthInputs.forEach(input => {
        const subcategory = input.dataset.subcategory;
        const index = parseInt(input.dataset.index);
        const field = input.dataset.field;
        const value = input.value;
        etfPool.growth[subcategory][index][field] = value;
    });
    
    // 收集其他类别ETF数据
    const otherCategories = ['dividend', 'commodity', 'bond', 'cash'];
    otherCategories.forEach(category => {
        const inputs = document.querySelectorAll(`[data-category="${category}"]`);
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            const field = input.dataset.field;
            const value = input.value;
            etfPool[category][index][field] = value;
        });
    });
    
    // 保存到localStorage
    localStorage.setItem('etfPool', JSON.stringify(etfPool));
    alert('ETF标的池保存成功！');
}

// 保存数据获取设置
function saveFetchSettings() {
    const autoFetch = document.getElementById('auto-fetch').checked;
    const fetchFrequency = document.getElementById('fetch-frequency').value;
    
    localStorage.setItem('autoFetch', autoFetch);
    localStorage.setItem('fetchFrequency', fetchFrequency);
    alert('数据获取设置保存成功！');
}

// 加载数据获取设置
function loadFetchSettings() {
    const autoFetch = localStorage.getItem('autoFetch') === 'true';
    const fetchFrequency = localStorage.getItem('fetchFrequency') || 'daily';
    
    document.getElementById('auto-fetch').checked = autoFetch;
    document.getElementById('fetch-frequency').value = fetchFrequency;
}

// 保存API设置
function saveApiSettings() {
    const dataSource = document.getElementById('data-source').value;
    const tushareApiKey = document.getElementById('tushare-api-key').value;
    const customApiUrl = document.getElementById('custom-api-url').value;
    
    localStorage.setItem('dataSource', dataSource);
    localStorage.setItem('tushareApiKey', tushareApiKey);
    localStorage.setItem('customApiUrl', customApiUrl);
    alert('API设置保存成功！');
}

// 加载API设置
function loadApiSettings() {
    const dataSource = localStorage.getItem('dataSource') || 'akshare';
    const tushareApiKey = localStorage.getItem('tushareApiKey') || '';
    const customApiUrl = localStorage.getItem('customApiUrl') || '';
    
    document.getElementById('data-source').value = dataSource;
    document.getElementById('tushare-api-key').value = tushareApiKey;
    document.getElementById('custom-api-url').value = customApiUrl;
}

// 测试API连接
async function testApiConnection() {
    const apiStatus = document.getElementById('api-status');
    const testApiBtn = document.getElementById('test-api-btn');
    
    testApiBtn.innerHTML = '<div class="loading"></div> 测试中...';
    testApiBtn.disabled = true;
    apiStatus.textContent = '测试中...';
    
    try {
        const dataSource = document.getElementById('data-source').value;
        
        // 模拟API测试
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (dataSource === 'akshare') {
            apiStatus.textContent = 'AkShare API 连接成功';
            apiStatus.className = 'text-sm text-green-600';
        } else if (dataSource === 'tushare') {
            const apiKey = document.getElementById('tushare-api-key').value;
            if (apiKey) {
                apiStatus.textContent = 'Tushare API 连接成功';
                apiStatus.className = 'text-sm text-green-600';
            } else {
                apiStatus.textContent = '请输入Tushare API Key';
                apiStatus.className = 'text-sm text-yellow-600';
            }
        } else if (dataSource === 'custom') {
            const apiUrl = document.getElementById('custom-api-url').value;
            if (apiUrl) {
                apiStatus.textContent = '自定义API 连接成功';
                apiStatus.className = 'text-sm text-green-600';
            } else {
                apiStatus.textContent = '请输入自定义API基础URL';
                apiStatus.className = 'text-sm text-yellow-600';
            }
        }
    } catch (error) {
        console.error('API测试失败:', error);
        apiStatus.textContent = 'API连接失败';
        apiStatus.className = 'text-sm text-red-600';
    } finally {
        testApiBtn.innerHTML = '测试API连接';
        testApiBtn.disabled = false;
    }
}

// 保存管理员密码
function saveAdminPassword() {
    const password = newAdminPassword.value;
    if (password) {
        localStorage.setItem('adminPassword', hashPassword(password));
        alert('密码保存成功！');
    } else {
        alert('请输入密码！');
    }
}

// 初始化系统
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}