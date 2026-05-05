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
from typing import Callable, Optional

import pandas as pd


CSI_ALL_SHARE_SYMBOL = "000985"
CSI_ALL_SHARE_ERP_START_DATE = "20041231"
CSI_800_GROWTH_SYMBOL = "H30355"
CSI_800_VALUE_SYMBOL = "H30356"
BOND_YIELD_10Y_COLUMN = "中国国债收益率10年"
CSI_ROLLING_PE_COLUMNS = (
    "滚动市盈率",
    "滚动PE",
    "市盈率TTM",
    "PE_TTM",
    "pe_ttm",
)


DEFAULT_INDICATORS = {
    "pmi": 51.2,
    "socialFinance": 9.8,
    "cpi": 2.1,
    "ppi": -0.5,
    "m1m2": -1.2,
    "bondYield": 2.65,
    "turnoverMomentum": 15.3,
    "turnover": 15.3,
    "turnoverYoY": 15.3,
    "erp": 65,
    "growthValueDispersion": 0.0,
    "growthValuationPercentile": 45,
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
    error: Optional[str] = None


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
    return _latest_non_null(df, BOND_YIELD_10Y_COLUMN)


def _rolling_qoq(values: pd.Series, window: int) -> float:
    if len(values) < window * 2:
        raise ValueError(f"成交金额数据不足 {window * 2} 个交易日，无法计算 {window} 日滚动环比")

    recent = values.iloc[-window:].mean()
    prior = values.iloc[-window * 2 : -window].mean()
    if pd.isna(recent) or pd.isna(prior) or prior == 0:
        raise ValueError(f"{window} 日成交金额均值不可用")
    return float(recent / prior - 1)


def extract_turnover_momentum(df: pd.DataFrame) -> float:
    if df.empty:
        raise ValueError("数据为空")

    amount_column = next((column for column in ("成交金额", "成交额", "amount") if column in df.columns), None)
    if amount_column is None:
        raise KeyError(f"缺少可用成交额列; 当前列: {', '.join(map(str, df.columns))}")

    if "日期" in df.columns:
        df = df.copy()
        df["日期"] = pd.to_datetime(df["日期"], errors="coerce")
        df = df.sort_values("日期", ascending=True)
    elif "date" in df.columns:
        df = df.copy()
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.sort_values("date", ascending=True)

    amounts = pd.to_numeric(df[amount_column], errors="coerce").dropna()
    amounts = amounts[amounts > 0]
    if len(amounts) < 40:
        raise ValueError("成交金额数据不足 40 个交易日，无法计算 5日/20日滚动环比动量")

    momentum = 0.7 * _rolling_qoq(amounts, 5) + 0.3 * _rolling_qoq(amounts, 20)
    return round(momentum * 100, 2)


def _date_column(df: pd.DataFrame, label: str) -> str:
    column = next((name for name in ("日期", "date") if name in df.columns), None)
    if column is None:
        raise KeyError(f"{label}缺少日期列; 当前列: {', '.join(map(str, df.columns))}")
    return column


def _first_existing_column(df: pd.DataFrame, candidates: tuple[str, ...], label: str) -> str:
    column = next((name for name in candidates if name in df.columns), None)
    if column is None:
        raise KeyError(f"{label}缺少可用列: {', '.join(candidates)}; 当前列: {', '.join(map(str, df.columns))}")
    return column


def _prepare_index_valuation(df: pd.DataFrame, label: str, purpose: str) -> pd.DataFrame:
    if df.empty:
        raise ValueError(f"{label}返回数据为空，无法{purpose}")

    date_column = _date_column(df, label)
    pe_column = _first_existing_column(
        df,
        CSI_ROLLING_PE_COLUMNS,
        label,
    )

    prepared = pd.DataFrame(
        {
            "date": pd.to_datetime(df[date_column], errors="coerce"),
            "pe": pd.to_numeric(df[pe_column], errors="coerce"),
        }
    ).dropna()
    prepared = prepared[prepared["pe"] > 0].sort_values("date")
    if prepared.empty:
        raise ValueError(f"{label}滚动市盈率没有可用正数值，无法{purpose}")
    return prepared


def _prepare_csi_valuation(df: pd.DataFrame) -> pd.DataFrame:
    return _prepare_index_valuation(
        df,
        "AkShare stock_zh_index_hist_csindex 中证全指日频数据",
        "计算中证全指ERP",
    )


def _prepare_bond_yield(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        raise ValueError("AkShare bond_zh_us_rate 返回数据为空，无法计算中证全指ERP")

    date_column = _date_column(df, "AkShare bond_zh_us_rate 国债收益率数据")
    if BOND_YIELD_10Y_COLUMN not in df.columns:
        raise KeyError(
            f"AkShare bond_zh_us_rate 国债收益率数据缺少可用列: {BOND_YIELD_10Y_COLUMN}; "
            f"当前列: {', '.join(map(str, df.columns))}"
        )

    prepared = pd.DataFrame(
        {
            "date": pd.to_datetime(df[date_column], errors="coerce"),
            "bond_yield": pd.to_numeric(df[BOND_YIELD_10Y_COLUMN], errors="coerce"),
        }
    ).dropna()
    prepared = prepared.sort_values("date")
    if prepared.empty:
        raise ValueError("10年期国债收益率没有可用数值，无法计算ERP")
    return prepared


def _prepare_index_close(df: pd.DataFrame, label: str) -> pd.DataFrame:
    if df.empty:
        raise ValueError(f"{label}返回数据为空，无法计算成长/价值分化度")

    date_column = _date_column(df, label)
    close_column = _first_existing_column(df, ("收盘", "close"), label)
    prepared = pd.DataFrame(
        {
            "date": pd.to_datetime(df[date_column], errors="coerce"),
            "close": pd.to_numeric(df[close_column], errors="coerce"),
        }
    ).dropna()
    prepared = prepared[prepared["close"] > 0].sort_values("date")
    if prepared.empty:
        raise ValueError(f"{label}收盘价没有可用正数值，无法计算成长/价值分化度")
    return prepared


def _index_return(close: pd.Series, window: int, label: str) -> float:
    if len(close) < window + 1:
        raise ValueError(f"{label}数据不足 {window + 1} 个交易日，无法计算 {window} 日收益率")

    latest = close.iloc[-1]
    base = close.iloc[-window - 1]
    if pd.isna(latest) or pd.isna(base) or base == 0:
        raise ValueError(f"{label}{window}日收益率所需收盘价不可用")
    return float(latest / base - 1)


def extract_growth_value_dispersion(inputs: dict[str, pd.DataFrame]) -> float:
    growth = _prepare_index_close(inputs["growth"], "成长指数")
    value = _prepare_index_close(inputs["value"], "价值指数")
    merged = pd.merge(growth, value, on="date", how="inner", suffixes=("_growth", "_value"))
    if len(merged) < 61:
        raise ValueError("成长指数与价值指数可对齐数据不足 61 个交易日，无法计算20日/60日分化度")

    growth_20 = _index_return(merged["close_growth"], 20, "成长指数")
    value_20 = _index_return(merged["close_value"], 20, "价值指数")
    growth_60 = _index_return(merged["close_growth"], 60, "成长指数")
    value_60 = _index_return(merged["close_value"], 60, "价值指数")
    dispersion = 0.4 * (growth_20 - value_20) + 0.6 * (growth_60 - value_60)
    return round(dispersion * 100, 2)


def extract_growth_valuation_percentile(df: pd.DataFrame) -> float:
    valuation = _prepare_index_valuation(
        df,
        f"AkShare stock_zh_index_hist_csindex 中证800成长({CSI_800_GROWTH_SYMBOL})日频数据",
        "计算成长风格估值分位数",
    )
    if len(valuation) < 252:
        raise ValueError("中证800成长滚动市盈率历史数据不足 252 个交易日，无法计算成长风格估值分位数")

    current_pe = valuation["pe"].iloc[-1]
    percentile = (valuation["pe"] <= current_pe).mean() * 100
    return round(float(percentile), 2)


def extract_erp_percentile(inputs: dict[str, pd.DataFrame]) -> float:
    index_df = _prepare_csi_valuation(inputs["index"])
    bond_df = _prepare_bond_yield(inputs["bond"])
    merged = pd.merge_asof(index_df, bond_df, on="date", direction="backward")
    merged = merged.dropna(subset=["pe", "bond_yield"])
    if merged.empty:
        raise ValueError("中证全指滚动市盈率与10年期国债收益率没有可对齐的日频数据")

    erp = 100 / merged["pe"] - merged["bond_yield"]
    erp = erp.dropna()
    if erp.empty:
        raise ValueError("ERP历史序列为空，无法计算分位数")

    current_erp = erp.iloc[-1]
    percentile = (erp <= current_erp).mean() * 100
    return round(float(percentile), 2)


def fetch_csi_all_share_history(ak_module, start_date: Optional[str] = None) -> pd.DataFrame:
    end_date = datetime.datetime.now()
    if start_date is None:
        start = end_date - datetime.timedelta(days=180)
        start_date = start.strftime("%Y%m%d")
    return ak_module.stock_zh_index_hist_csindex(
        symbol=CSI_ALL_SHARE_SYMBOL,
        start_date=start_date,
        end_date=end_date.strftime("%Y%m%d"),
    )


def fetch_erp_inputs(ak_module) -> dict[str, pd.DataFrame]:
    return {
        "index": fetch_csi_all_share_history(
            ak_module,
            start_date=CSI_ALL_SHARE_ERP_START_DATE,
        ),
        "bond": ak_module.bond_zh_us_rate(),
    }


def fetch_growth_value_inputs(ak_module) -> dict[str, pd.DataFrame]:
    end_date = datetime.datetime.now()
    start_date = (end_date - datetime.timedelta(days=150)).strftime("%Y%m%d")
    end_date_text = end_date.strftime("%Y%m%d")
    return {
        "growth": ak_module.stock_zh_index_hist_csindex(
            symbol=CSI_800_GROWTH_SYMBOL,
            start_date=start_date,
            end_date=end_date_text,
        ),
        "value": ak_module.stock_zh_index_hist_csindex(
            symbol=CSI_800_VALUE_SYMBOL,
            start_date=start_date,
            end_date=end_date_text,
        ),
    }


def fetch_growth_valuation_history(ak_module) -> pd.DataFrame:
    end_date = datetime.datetime.now()
    return ak_module.stock_zh_index_hist_csindex(
        symbol=CSI_800_GROWTH_SYMBOL,
        start_date=CSI_ALL_SHARE_ERP_START_DATE,
        end_date=end_date.strftime("%Y%m%d"),
    )


def fetch_indicator(
    *,
    key: str,
    label: str,
    default: float,
    fetcher: Callable[[], object],
    extractor: Callable[[object], float],
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
        (
            "turnoverMomentum",
            "中证全指成交额滚动环比动量",
            lambda: fetch_csi_all_share_history(ak_module),
            extract_turnover_momentum,
        ),
        (
            "erp",
            "中证全指ERP历史分位数",
            lambda: fetch_erp_inputs(ak_module),
            extract_erp_percentile,
        ),
        (
            "growthValueDispersion",
            "中证800成长/价值分化度",
            lambda: fetch_growth_value_inputs(ak_module),
            extract_growth_value_dispersion,
        ),
        (
            "growthValuationPercentile",
            "中证800成长估值历史分位数",
            lambda: fetch_growth_valuation_history(ak_module),
            extract_growth_valuation_percentile,
        ),
    ]

    indicators: dict[str, float] = {}
    errors: dict[str, str] = {}
    notes: dict[str, str] = {}
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

    # 兼容旧前端字段名：旧 turnover/turnoverYoY 输入框现在承载成交额动量。
    for legacy_key in ("turnover", "turnoverYoY"):
        indicators[legacy_key] = indicators["turnoverMomentum"]
        sources[legacy_key] = sources["turnoverMomentum"]
        if "turnoverMomentum" in errors:
            errors[legacy_key] = errors["turnoverMomentum"]

    indicators["growthPEPercentile"] = indicators["growthValuationPercentile"]
    sources["growthPEPercentile"] = sources["growthValuationPercentile"]
    if "growthValuationPercentile" in errors:
        errors["growthPEPercentile"] = errors["growthValuationPercentile"]

    # 尚未实现实时计算的因子保持默认值，但明确标注来源。
    manual_defaults = {
        "dividendYield": "红利股ETF股息率",
        "commodityMomentum": "商品ETF动量得分",
    }
    for key, label in manual_defaults.items():
        indicators[key] = DEFAULT_INDICATORS[key]
        sources[key] = "manual_default"
        notes[key] = f"{label}暂未实现自动计算，保留默认/手动值"

    return {
        "update_date": current_date,
        "indicators": indicators,
        "sources": sources,
        "errors": errors,
        "notes": notes,
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
