import unittest

import pandas as pd

import fetch_data


class FetchDataExtractionTests(unittest.TestCase):
    def test_extracts_current_akshare_column_names(self):
        self.assertEqual(
            fetch_data.extract_pmi(
                pd.DataFrame(
                    {"月份": ["2026年04月份"], "制造业-指数": [50.3]}
                )
            ),
            50.3,
        )
        self.assertEqual(
            fetch_data.extract_cpi(
                pd.DataFrame(
                    {"月份": ["2026年03月份"], "全国-同比增长": [1.0]}
                )
            ),
            1.0,
        )
        self.assertEqual(
            fetch_data.extract_ppi(
                pd.DataFrame(
                    {"月份": ["2026年03月份"], "当月同比增长": [0.5]}
                )
            ),
            0.5,
        )
        self.assertEqual(
            fetch_data.extract_m1m2(
                pd.DataFrame(
                    {
                        "月份": ["2026年03月份"],
                        "货币(M1)-同比增长": [5.1],
                        "货币和准货币(M2)-同比增长": [8.5],
                    }
                )
            ),
            -3.4,
        )
        self.assertEqual(
            fetch_data.extract_bond_yield(
                pd.DataFrame(
                    {
                        "日期": ["2026-04-30", "2026-04-29"],
                        "中国国债收益率10年": [1.82, 1.81],
                    }
                )
            ),
            1.82,
        )

    def test_fetch_indicator_records_item_error_and_uses_default(self):
        result = fetch_data.fetch_indicator(
            key="pmi",
            label="制造业PMI",
            default=51.2,
            fetcher=lambda: pd.DataFrame({"wrong": [1]}),
            extractor=fetch_data.extract_pmi,
        )

        self.assertEqual(result.value, 51.2)
        self.assertFalse(result.success)
        self.assertIn("制造业PMI", result.error)
        self.assertIn("缺少可用列", result.error)

    def test_extract_turnover_momentum_uses_weighted_rolling_qoq(self):
        amounts = list(range(100, 140))
        df = pd.DataFrame(
            {
                "日期": pd.date_range("2026-01-01", periods=40, freq="B"),
                "成交金额": amounts,
            }
        )

        recent_5 = pd.Series(amounts[-5:]).mean()
        prior_5 = pd.Series(amounts[-10:-5]).mean()
        recent_20 = pd.Series(amounts[-20:]).mean()
        prior_20 = pd.Series(amounts[-40:-20]).mean()
        expected = round(
            (0.7 * (recent_5 / prior_5 - 1) + 0.3 * (recent_20 / prior_20 - 1))
            * 100,
            2,
        )

        self.assertEqual(fetch_data.extract_turnover_momentum(df), expected)

    def test_extract_erp_percentile_uses_csi_pe_and_bond_yield_history(self):
        index_df = pd.DataFrame(
            {
                "日期": pd.date_range("2026-01-01", periods=4, freq="B"),
                "滚动市盈率": [20.0, 10.0, 25.0, 12.5],
            }
        )
        bond_df = pd.DataFrame(
            {
                "日期": pd.date_range("2026-01-01", periods=4, freq="B"),
                "中国国债收益率10年": [2.0, 2.0, 2.0, 2.0],
            }
        )

        self.assertEqual(
            fetch_data.extract_erp_percentile(
                {"index": index_df, "bond": bond_df}
            ),
            75.0,
        )

    def test_extract_erp_percentile_reports_missing_pe_column(self):
        index_df = pd.DataFrame(
            {
                "日期": ["2026-01-01"],
                "收盘": [5000],
            }
        )
        bond_df = pd.DataFrame(
            {
                "日期": ["2026-01-01"],
                "中国国债收益率10年": [2.0],
            }
        )

        with self.assertRaisesRegex(
            KeyError,
            "stock_zh_index_hist_csindex.*滚动市盈率.*当前列",
        ):
            fetch_data.extract_erp_percentile({"index": index_df, "bond": bond_df})

    def test_extract_growth_value_dispersion_uses_weighted_relative_returns(self):
        dates = pd.date_range("2026-01-01", periods=61, freq="B")
        growth = pd.DataFrame(
            {
                "日期": dates,
                "收盘": [100] + [110] * 40 + [120] * 20,
            }
        )
        value = pd.DataFrame(
            {
                "日期": dates,
                "收盘": [100] + [105] * 40 + [110] * 20,
            }
        )

        expected_20 = 120 / 110 - 110 / 105
        expected_60 = 120 / 100 - 110 / 100
        expected = round((0.4 * expected_20 + 0.6 * expected_60) * 100, 2)

        self.assertEqual(
            fetch_data.extract_growth_value_dispersion(
                {"growth": growth, "value": value}
            ),
            expected,
        )

    def test_extract_growth_value_dispersion_reports_missing_close_column(self):
        growth = pd.DataFrame({"日期": ["2026-01-01"], "最新价": [100]})
        value = pd.DataFrame({"日期": ["2026-01-01"], "收盘": [100]})

        with self.assertRaisesRegex(
            KeyError,
            "成长指数.*收盘.*当前列",
        ):
            fetch_data.extract_growth_value_dispersion(
                {"growth": growth, "value": value}
            )

    def test_extract_growth_valuation_percentile_uses_csi_800_growth_pe(self):
        dates = pd.date_range("2025-01-01", periods=252, freq="B")
        df = pd.DataFrame(
            {
                "日期": dates,
                "滚动市盈率": list(range(10, 262)),
            }
        )

        self.assertEqual(fetch_data.extract_growth_valuation_percentile(df), 100.0)

    def test_extract_growth_valuation_percentile_reports_missing_pe_column(self):
        df = pd.DataFrame(
            {
                "日期": pd.date_range("2025-01-01", periods=252, freq="B"),
                "收盘": range(252),
            }
        )

        with self.assertRaisesRegex(
            KeyError,
            "中证800成长.*滚动市盈率.*当前列",
        ):
            fetch_data.extract_growth_valuation_percentile(df)

    def test_build_data_keeps_manual_defaults_out_of_errors(self):
        dates = pd.date_range("2025-01-01", periods=260, freq="B")

        class FakeAk:
            def macro_china_pmi(self):
                return pd.DataFrame({"制造业-指数": [50.3]})

            def macro_china_shrzgm(self):
                return pd.DataFrame({"社会融资规模增量": [100] * 12 + [110]})

            def macro_china_cpi(self):
                return pd.DataFrame({"全国-同比增长": [1.0]})

            def macro_china_ppi(self):
                return pd.DataFrame({"当月同比增长": [0.5]})

            def macro_china_money_supply(self):
                return pd.DataFrame(
                    {
                        "货币(M1)-同比增长": [5.1],
                        "货币和准货币(M2)-同比增长": [8.5],
                    }
                )

            def bond_zh_us_rate(self):
                return pd.DataFrame(
                    {
                        "日期": dates,
                        "中国国债收益率10年": [2.0] * len(dates),
                    }
                )

            def stock_zh_index_hist_csindex(self, symbol, start_date, end_date):
                if symbol == fetch_data.CSI_800_GROWTH_SYMBOL:
                    return pd.DataFrame(
                        {
                            "日期": dates,
                            "收盘": range(100, 360),
                            "滚动市盈率": range(10, 270),
                        }
                    )
                if symbol == fetch_data.CSI_800_VALUE_SYMBOL:
                    return pd.DataFrame({"日期": dates, "收盘": range(100, 360)})
                return pd.DataFrame(
                    {
                        "日期": dates,
                        "成交金额": range(100, 360),
                        "滚动市盈率": [20.0] * len(dates),
                    }
                )

        data = fetch_data.build_data(FakeAk())

        self.assertIn("growthValuationPercentile", data["indicators"])
        self.assertEqual(
            data["indicators"]["growthPEPercentile"],
            data["indicators"]["growthValuationPercentile"],
        )
        self.assertEqual(data["sources"]["growthValuationPercentile"], "akshare")
        self.assertEqual(data["sources"]["growthPEPercentile"], "akshare")
        self.assertNotIn("growthValuationPercentile", data["errors"])
        self.assertNotIn("growthPEPercentile", data["errors"])
        self.assertNotIn("dividendYield", data["errors"])
        self.assertNotIn("commodityMomentum", data["errors"])
        self.assertNotIn("growthPEPercentile", data["notes"])


if __name__ == "__main__":
    unittest.main()
