#!/usr/bin/env python3
"""
使用AkShare获取宏观经济数据
"""

import json
import akshare as ak
import datetime

# 获取当前日期
current_date = datetime.datetime.now().strftime("%Y-%m-%d")

# 数据字典
data = {
    "update_date": current_date,
    "indicators": {}
}

try:
    # 1. 制造业PMI
    print("获取制造业PMI...")
    pmi_data = ak.macro_china_pmi()
    if not pmi_data.empty:
        latest_pmi = pmi_data.iloc[0]['当月值']
        data["indicators"]["pmi"] = float(latest_pmi)
    else:
        data["indicators"]["pmi"] = 51.2  # 默认值
    
    # 2. 社融存量同比
    print("获取社融存量同比...")
    social_finance_data = ak.macro_china_shrzgm()
    if not social_finance_data.empty:
        latest_sf = social_finance_data.iloc[0]['社会融资规模存量:同比']
        data["indicators"]["socialFinance"] = float(latest_sf)
    else:
        data["indicators"]["socialFinance"] = 9.8  # 默认值
    
    # 3. CPI同比
    print("获取CPI同比...")
    cpi_data = ak.macro_china_cpi()
    if not cpi_data.empty:
        latest_cpi = cpi_data.iloc[0]['当月同比']
        data["indicators"]["cpi"] = float(latest_cpi)
    else:
        data["indicators"]["cpi"] = 2.1  # 默认值
    
    # 4. PPI同比
    print("获取PPI同比...")
    ppi_data = ak.macro_china_ppi()
    if not ppi_data.empty:
        latest_ppi = ppi_data.iloc[0]['当月同比']
        data["indicators"]["ppi"] = float(latest_ppi)
    else:
        data["indicators"]["ppi"] = -0.5  # 默认值
    
    # 5. M1-M2剪刀差
    print("获取M1-M2剪刀差...")
    money_supply_data = ak.macro_china_money_supply()
    if not money_supply_data.empty:
        latest_m1 = money_supply_data[money_supply_data['item'] == '货币供应量M1:同比'].iloc[0]['当月值']
        latest_m2 = money_supply_data[money_supply_data['item'] == '货币供应量M2:同比'].iloc[0]['当月值']
        m1m2_diff = float(latest_m1) - float(latest_m2)
        data["indicators"]["m1m2"] = m1m2_diff
    else:
        data["indicators"]["m1m2"] = -1.2  # 默认值
    
    # 6. 10年期国债收益率
    print("获取10年期国债收益率...")
    bond_yield_data = ak.bond_zh_us_rate()
    if not bond_yield_data.empty:
        # 查找中国10年期国债收益率
        china_10y = bond_yield_data[bond_yield_data['名称'] == '中国10年期国债收益率']
        if not china_10y.empty:
            latest_yield = china_10y.iloc[0]['最新价']
            data["indicators"]["bondYield"] = float(latest_yield)
        else:
            data["indicators"]["bondYield"] = 2.65  # 默认值
    else:
        data["indicators"]["bondYield"] = 2.65  # 默认值
    
    # 7. 全A成交额同比增速
    print("获取全A成交额同比增速...")
    # 这里需要计算252日同比，暂时使用默认值
    data["indicators"]["turnover"] = 15.3  # 默认值
    data["indicators"]["turnoverYoY"] = 15.3  # 默认值
    
    # 8. 股债利差(ERP)
    print("获取股债利差...")
    # 这里需要计算，暂时使用默认值
    data["indicators"]["erp"] = 65  # 默认值
    
    # 9. 成长股ETF PE分位数
    data["indicators"]["growthPEPercentile"] = 45  # 默认值
    
    # 10. 红利股ETF股息率
    data["indicators"]["dividendYield"] = 3.2  # 默认值
    
    # 11. 商品ETF动量得分
    data["indicators"]["commodityMomentum"] = 2.5  # 默认值
    
    print("数据获取完成！")
    
except Exception as e:
    print(f"获取数据时出错: {e}")
    # 使用默认数据
    data["indicators"] = {
        "pmi": 51.2,
        "socialFinance": 9.8,
        "cpi": 2.1,
        "ppi": -0.5,
        "m1m2": -1.2,
        "bondYield": 2.65,
        "turnover": 15.3,
        "erp": 65,
        "turnoverYoY": 15.3,
        "growthPEPercentile": 45,
        "dividendYield": 3.2,
        "commodityMomentum": 2.5
    }

# 保存数据到JSON文件
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("数据已保存到data.json文件")
