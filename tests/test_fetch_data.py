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


if __name__ == "__main__":
    unittest.main()
