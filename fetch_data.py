#!/usr/bin/env python3
"""
使用 AkShare 获取宏观经济数据。

脚本会逐项抓取指标；单个指标失败时只回退该指标默认值，并在
data.json 的 errors 字段中记录原因，避免一次列名变化导致整包默认。
"""

from __future__ import annotations

import datetime
import json
from dataclasses import dataclass
from typing import Callable

import pandas as pd


DEFAULT_INDICATORS = {
    "pmi": 51.2,
    "socialFinance": 9.8,
    "cpi": 2.1,
    "ppi": -0.5,
    "m1m2": -1.2,
    "bondYield": 2.65,
    "turnover": 15.3,
    "turnoverYoY": 15.3,
    "erp": 65,
    "growthPEPercentile": 45,
    "dividendYield": 3.2,
    "commodityMomentum": 2.5,
}


@dataclass
class IndicatorResult:
    key: str
    value: float
    success: bool
    source: str
    error: str | None = None


def _latest_non_null(df: pd.DataFrame, column: str) -> float:
    if df.empty:
        raise ValueError("数据为空")
    if column not in df.columns:
        raise KeyError(f"缺少可用列: {column}; 当前列: {', '.join(map(str, df.columns))}")

    values = pd.to_numeric(df[column], errors="coerce").dropna()
    if values.empty:
        raise ValueError(f"列 {column} 没有可用数值")
    return float(values.iloc[0])


def extract_pmi(df: pd.DataFrame) -> float:
    return _latest_non_null(df, "制造业-指数")


def extract_social_finance(df: pd.DataFrame) -> float:
    # 当前 AkShare 的 macro_china_shrzgm 返回社融规模增量，不含“存量同比”。
    # 暂用最新社融增量近 12 个月同比作为可自动计算的代理指标。
    if df.empty:
        raise ValueError("数据为空")
    column = "社会融资规模增量"
    if column not in df.columns:
        raise KeyError(f"缺少可用列: {column}; 当前列: {', '.join(map(str, df.columns))}")

    values = pd.to_numeric(df[column], errors="coerce")
    if len(values.dropna()) < 13:
        raise ValueError("社融增量数据不足 13 个月，无法计算同比")

    latest = values.iloc[-1]
    prior_year = values.iloc[-13]
    if pd.isna(latest) or pd.isna(prior_year) or prior_year == 0:
        raise ValueError("社融增量最新值或去年同期值不可用")
    return round((float(latest) / float(prior_year) - 1) * 100, 2)


def extract_cpi(df: pd.DataFrame) -> float:
    return _latest_non_null(df, "全国-同比增长")


def extract_ppi(df: pd.DataFrame) -> float:
    return _latest_non_null(df, "当月同比增长")


def extract_m1m2(df: pd.DataFrame) -> float:
    m1 = _latest_non_null(df, "货币(M1)-同比增长")
    m2 = _latest_non_null(df, "货币和准货币(M2)-同比增长")
    return round(m1 - m2, 2)


def extract_bond_yield(df: pd.DataFrame) -> float:
    if "日期" in df.columns:
        df = df.copy()
        df["日期"] = pd.to_datetime(df["日期"], errors="coerce")
        df = df.sort_values("日期", ascending=False)
    return _latest_non_null(df, "中国国债收益率10年")


def fetch_indicator(
    *,
    key: str,
    label: str,
    default: float,
    fetcher: Callable[[], pd.DataFrame],
    extractor: Callable[[pd.DataFrame], float],
) -> IndicatorResult:
    print(f"获取{label}...")
    try:
        value = extractor(fetcher())
        print(f"  成功: {value}")
        return IndicatorResult(key=key, value=value, success=True, source="akshare")
    except Exception as exc:
        message = f"{label}获取失败: {exc}"
        print(f"  失败，使用默认值 {default}: {exc}")
        return IndicatorResult(
            key=key,
            value=float(default),
            success=False,
            source="default",
            error=message,
        )


def build_data(ak_module) -> dict:
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    specs = [
        ("pmi", "制造业PMI", ak_module.macro_china_pmi, extract_pmi),
        ("socialFinance", "社融同比代理指标", ak_module.macro_china_shrzgm, extract_social_finance),
        ("cpi", "CPI同比", ak_module.macro_china_cpi, extract_cpi),
        ("ppi", "PPI同比", ak_module.macro_china_ppi, extract_ppi),
        ("m1m2", "M1-M2剪刀差", ak_module.macro_china_money_supply, extract_m1m2),
        ("bondYield", "10年期国债收益率", ak_module.bond_zh_us_rate, extract_bond_yield),
    ]

    indicators: dict[str, float] = {}
    errors: dict[str, str] = {}
    sources: dict[str, str] = {}

    for key, label, fetcher, extractor in specs:
        result = fetch_indicator(
            key=key,
            label=label,
            default=DEFAULT_INDICATORS[key],
            fetcher=fetcher,
            extractor=extractor,
        )
        indicators[result.key] = result.value
        sources[result.key] = result.source
        if result.error:
            errors[result.key] = result.error

    # 尚未实现实时计算的因子保持默认值，但明确标注来源。
    manual_defaults = {
        "turnover": "全A成交额同比增速",
        "turnoverYoY": "全A成交额同比增速",
        "erp": "股债利差ERP",
        "growthPEPercentile": "成长股ETF PE分位数",
        "dividendYield": "红利股ETF股息率",
        "commodityMomentum": "商品ETF动量得分",
    }
    for key, label in manual_defaults.items():
        indicators[key] = DEFAULT_INDICATORS[key]
        sources[key] = "default"
        errors[key] = f"{label}暂未实现自动计算，使用默认值"

    return {
        "update_date": current_date,
        "indicators": indicators,
        "sources": sources,
        "errors": errors,
    }


def main() -> None:
    import akshare as ak

    data = build_data(ak)

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("数据已保存到data.json文件")
    if data["errors"]:
        print("以下指标使用默认值或代理算法：")
        for key, error in data["errors"].items():
            print(f"  - {key}: {error}")


if __name__ == "__main__":
    main()
