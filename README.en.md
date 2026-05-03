# Automatic Macro Cycle Determination and Asset Allocation System

## System Overview

This system is a quantitative decision-making tool built on the **"Pring Six-Stage" theory**, designed to achieve a complete closed-loop process from "data input" to "asset allocation ratio output" through the automated processing of **8 core macro indicators**. The system strictly follows the **"Four-Dimension Six-Indicator" determination system**, and incorporates **"Dividend ≤ 30% / Commodity ≤ 20%" double ceiling constraints** and **sentiment overheating/ice point protection mechanisms** to help investors maintain disciplined allocation in complex macro environments and avoid subjective emotional interference.

## Core Features

- **Macro Cycle Determination**: Automatically determines the current macroeconomic stage based on four dimensions: economic growth, inflation, liquidity, and market sentiment
- **Asset Allocation Recommendations**: Automatically outputs allocation ratios for various asset classes based on the determined macro stage, including growth stocks, dividend stocks, commodity ETFs, and bonds/cash
- **Smart ETF Allocation**: Allocates weights to 15 core ETFs based on a multi-factor scoring model
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

1. **Data Input Layer**: Users input 8 core macro indicators and ETF data
2. **Logic Engine Layer**: Calculates four-dimensional scores and determines the macro stage
3. **Allocation Calculation Layer**: Calculates asset allocation ratios based on the macro stage, applies double ceiling constraints and sentiment protection mechanisms
4. **ETF Allocation Layer**: Allocates weights to ETFs based on a multi-factor scoring model
5. **Result Display Layer**: Displays allocation results, detailed ETF allocation, multi-factor scoring results, and historical records

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
| <br />               | **Social Financing Year-on-Year Growth** | AkShare     | **Rising**: Credit easing (leading economic 1-2 quarters)**Falling**: Credit tightening                                                                                                                                                    |
| **Inflation**        | **CPI Year-on-Year**                     | AkShare     | **Rapid rise**: Overheating/stagflation risk**Low/negative**: Recession/early recovery                                                                                                                                                     |
| <br />               | **PPI Year-on-Year**                     | AkShare     | **Upward cycle**: Commodity bull market (beneficial for commodity ETFs)**Downward cycle**: Industrial deflation                                                                                                                            |
| **Liquidity**        | **M1-M2 Spread**                         | AkShare     | **Widening (M1>M2)**: Capital activation (stock market active/overheating)**Narrowing/negative**: Capital regularization (risk aversion)                                                                                                   |
| <br />               | **10-Year Treasury Yield**               | AkShare     | **Falling**: Beneficial for bonds/growth stocks**Rapidly rising**: Beneficial for value/commodities, negative for high valuations                                                                                                          |
| **Market Sentiment** | **CSI All Share Turnover Rolling QoQ Momentum** | AkShare     | `turnoverMomentum = 0.7 × 5-day rolling QoQ + 0.3 × 20-day rolling QoQ`; **>0 and strengthening**: Sentiment recovery; **>50%**: Sentiment overheating; **< -20%**: Sentiment ice point |
| <br />               | **Stock-Bond Spread (ERP)**              | Calculated  | **>80% quantile**: Stocks extremely cheap (left-side layout)**<20% quantile**: Stocks extremely expensive (right-side reduction)                                                                                                           |

### ETF Pool

- **Growth Stock ETFs**: Broad-based growth, tech growth, cross-border growth
- **Dividend Stock ETFs**: Dividend ETF, dividend low-volatility ETF
- **Commodity ETFs**: Gold ETF, crude oil fund, non-ferrous metal ETF
- **Bond ETFs**: 10-year Treasury ETF
- **Cash ETFs**: Yinhua Rili

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
