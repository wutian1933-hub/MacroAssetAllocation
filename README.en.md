# Automatic Macro Cycle Determination and Asset Allocation System

## System Overview

This system is a quantitative decision-making tool built on the **"Pring Six-Stage" theory**, designed to achieve a complete closed-loop process from "data input" to "asset allocation ratio output" through the automated processing of **8 raw macro observations**; turnover momentum and ERP are combined into one market sentiment score. The system follows a **four-dimension scoring framework**, and incorporates **"Dividend ≤ 30% / Commodity ≤ 20%" double ceiling constraints** and **sentiment overheating/ice point protection mechanisms** to help investors maintain disciplined allocation in complex macro environments and avoid subjective emotional interference.

## Core Features

- **Macro Cycle Determination**: Automatically determines the current macroeconomic stage based on four dimensions: economic growth, inflation, liquidity, and market sentiment
- **Asset Allocation Recommendations**: Automatically outputs allocation ratios for various asset classes based on the determined macro stage, including growth stocks, dividend stocks, commodity ETFs, and bonds/cash
- **ETF Allocation**: Shows category-level representative factor scores; missing ETF-level momentum/risk data is explicitly marked neutral, and ETFs within the same bucket default to equal weight
- **Automatic Data Fetching**: Regularly fetches the latest macro data through GitHub Actions to ensure data timeliness
- **Settings Management**: Supports editing and management of system basic data, including allocation matrix, stage descriptions, ETF pool, etc.
- **History Records**: Saves the latest 12 allocation records for review and analysis

## Technical Implementation

- **Frontend Technology**: HTML5 + CSS3 + JavaScript
- **Styling Framework**: Tailwind CSS
- **Data Visualization**: Chart.js
- **Data Storage**: localStorage
- **Data Fetching**: Python + AkShare + GitHub Actions
- **Deployment**: Static website, supports GitHub Pages, Gitee Pages and other static hosting services

## System Architecture

1. **Data Input Layer**: Users input raw macro observations and market factors; the system combines turnover momentum and ERP into the market sentiment score
2. **Logic Engine Layer**: Calculates four-dimensional scores and determines the macro stage
3. **Allocation Calculation Layer**: Calculates asset allocation ratios based on the macro stage, applies double ceiling constraints and sentiment protection mechanisms
4. **ETF Allocation Layer**: Shows category-level representative factor scores and defaults to equal weight when ETF-level real factors are missing
5. **Result Display Layer**: Displays allocation results, detailed ETF allocation, ETF scoring methodology, and historical records

## Deployment Steps

### 1. Clone or Download the Project

### 2. Deploy to Static Hosting Service

#### GitHub Pages

1. Create a new repository on GitHub
2. Upload project files (including the `.github` directory)
3. Go to repository settings and enable GitHub Pages
4. Manually trigger a data fetch workflow
5. Access the generated URL

#### Gitee Pages

1. Create a new repository on Gitee
2. Upload project files (including the `.github` directory)
3. Go to repository settings and enable Gitee Pages
4. Manually trigger a data fetch workflow
5. Access the generated URL

### 3. Configure GitHub Actions

The project already includes the `.github/workflows/fetch-data.yml` file, which will:

- Automatically run the data fetch script every day
- Use AkShare to fetch the latest macro data
- Save the data as a `data.json` file
- Automatically commit updates to the repository

### 4. First Use

1. Access the system URL
2. Click the "Auto Fetch Data" button, the system will load the latest data from the `data.json` file
3. Click the "Calculate Allocation" button to get asset allocation recommendations
4. To modify system settings, click the "System Settings" link and log in with the default password `admin123`

## Data Description

### Core Macro Indicators

| Dimension            | Core Indicator                           | Data Source | Determination Logic and Thresholds                                                                                                                                                                                                         |
| :------------------- | :--------------------------------------- | :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Economic Growth**  | **Manufacturing PMI**                    | AkShare     | **>50**: Expansion (score +1)**<50**: Contraction (score -1)                                                                                                                                                                               |
| <br />               | **Social Financing YoY Growth / Trend** | AkShare + Calculated | Uses 12-month YoY growth of monthly social financing increment as an automated proxy; trend uses the latest 3-month direction, treats changes under `0.5pct` as stable, and classifies improving/weakening paths as rising/falling |
| **Inflation**        | **CPI Year-on-Year**                     | AkShare     | **Rapid rise**: Overheating/stagflation risk**Low/negative**: Recession/early recovery                                                                                                                                                     |
| <br />               | **PPI YoY / Trend**                     | AkShare + Calculated | YoY locates the inflation cycle; trend prefers PPI month-on-month, classifies 3 consecutive positive months as rising, 3 consecutive negative months as falling, and 3 months around `±0.1%` as stable; falls back to YoY direction when MoM is unavailable |
| **Liquidity**        | **M1-M2 Spread**                         | AkShare     | **Widening (M1>M2)**: Capital activation (stock market active/overheating)**Narrowing/negative**: Capital regularization (risk aversion)                                                                                                   |
| <br />               | **10-Year Treasury Yield / Trend**               | AkShare + Calculated | The yield level is fetched automatically; trend uses the latest 20 trading-day move, classifying `>=10bp` as rising, `<=-15bp` as falling, and smaller moves as stable |
| **Market Sentiment** | **Market Sentiment Score (Turnover + ERP)** | AkShare + Calculated | `S = turnover momentum contribution + inverse ERP contribution`; turnover: `>50%` = `+2`, `>0` = `+1`, `<-20%` = `-2`, otherwise `-1`; ERP: `>80%` = `-1`, `<20%` = `+1`, otherwise `0`; only the composite `S` enters four-dimension stage determination |
| <br />               | **Raw Inputs: Turnover Momentum / ERP**              | AkShare + Calculated | Turnover momentum uses CSI All Share `000985` daily turnover, `0.7 × 5-day rolling QoQ + 0.3 × 20-day rolling QoQ`; ERP uses CSI All Share rolling PE and 10-year Treasury yield to build a daily historical percentile |
| **Market Factors** | **Growth/Value Dispersion** | AkShare + Calculated | Uses CSI 800 Growth `H30355` and CSI 800 Value `H30356` daily closes, `0.4 × 20-day excess return + 0.6 × 60-day excess return`; only tilts growth/dividend equity allocation and does not change the stock-bond ratio |
| <br /> | **Growth Style Valuation Percentile** | AkShare + Calculated | Uses CSI 800 Growth `H30355` daily rolling PE to calculate the current PE historical percentile; replaces the inconsistent valuation basis across multiple growth ETFs, and lower percentile means a higher growth ETF valuation score |
| <br /> | **Dividend Style Yield** | AkShare | Uses CSI Dividend `000922` index valuation data and takes the latest `股息率2`, falling back to `股息率1` when needed; replaces inconsistent distribution-yield bases across multiple dividend ETFs |
| <br /> | **Commodity Price Momentum** | AkShare/CCIDX + Calculated | Uses daily closing levels of the CSI Commodity Futures Price Index, `0.4 × 20-day return + 0.6 × 60-day return`; calls AkShare `futures_index_ccidx` first and falls back to the same CCIDX source if AkShare parsing changes |

### Dynamic Dimension Weights

The existing six-stage asset allocation matrix remains unchanged. Stage determination first uses exact four-dimension rules; only uncovered four-dimension combinations are classified by dynamic dimension weights based on the nearest current stage.

| Stage | Weight Focus | G | I | L | S |
| :-- | :-- | --: | --: | --: | --: |
| 1 | Bottom confirmation: liquidity first | 25% | 15% | 40% | 20% |
| 2 | Recovery validation: growth first | 35% | 15% | 30% | 20% |
| 3 | Expansion confirmation: inflation and growth | 25% | 30% | 25% | 20% |
| 4 | Overheating confirmation: inflation first | 20% | 35% | 25% | 20% |
| 5 | Top warning: inflation and sentiment | 15% | 35% | 20% | 30% |
| 6 | Recession observation: liquidity and sentiment | 25% | 15% | 35% | 25% |

### ETF Pool

- **Growth Stock ETFs**: Broad-based growth, tech growth, cross-border growth
- **Dividend Stock ETFs**: Dividend ETF, dividend low-volatility ETF
- **Commodity ETFs**: Gold ETF, crude oil fund, non-ferrous metal ETF
- **Bond ETFs**: 10-year Treasury ETF
- **Cash ETFs**: Yinhua Rili

### ETF Internal Scoring Method

The ETF layer currently uses only category-level representative factors and no longer presents fixed assumptions as real factor weights:

- **Growth ETFs**: Use the growth style valuation percentile as the category valuation score; ETF-level momentum and risk are marked `Neutral 0.50`.
- **Dividend ETFs**: Use CSI Dividend yield as the category income score; ETF-level momentum and risk are marked `Neutral 0.50`.
- **Commodity ETFs**: Use CSI commodity price momentum as the category trend score; valuation is not applicable and risk is marked `Neutral 0.50`.
- **Internal Allocation**: Until real ETF-level momentum, risk, volatility, or similar data is available, ETFs within the same asset bucket default to equal weight.

## Risk Warning

1. **Data Lag**: Macro indicators have publication lag, and system determination reflects the "past month" status
2. **Threshold Adaptability**: Some thresholds are set based on historical data, and need to be manually adjusted if market conditions change
3. **Black Swan Events**: The system is built based on historical patterns and may lag in response to sudden events
4. **Non-listed Company Data**: This system only applies to public market assets

## System Maintenance

1. **Data Updates**: GitHub Actions automatically updates data daily to ensure data timeliness
2. **System Settings**: Basic data such as allocation matrix, stage descriptions, and ETF pool can be modified through the settings page
3. **Password Management**: The default password for the settings page is `admin123` for first login, it is recommended to change the password after login

## Contact and Support

If you have any questions or suggestions, please feel free to contact us.
