---
title: "Probabilistic Forecasts of Existing-Home Prices in 70 Chinese Cities: Rolling Backtests and the Limits of Forecast Horizons"
description: "Using existing-home price indices for 70 cities from 2011 to 2026, this study compares forecasts across horizons with an unchanged-price baseline, evaluates interval coverage, and examines the limits of retrospective model selection and long-range forecasting."
createdAt: 2026-11-05
version: '0.3'
status: preprint
repositoryUrl: https://github.com/Liyuk/cn-housing-price-training
paperUrl: https://github.com/Liyuk/cn-housing-price-training/blob/main/docs/paper-probabilistic-housing-price-forecast.md
locale: en
translationStatus: reviewed
translationKey: 2026/11/china-housing-price-probabilistic-forecast
draft: false
tags: [housing, forecasting, time-series, china]
citationUrls:
  - https://arxiv.org/abs/2510.15821
  - https://doi.org/10.2307/3008764
  - https://doi.org/10.3386/w9262
  - https://doi.org/10.3386/w2506
  - https://doi.org/10.3386/w21112
  - https://doi.org/10.1287/mnsc.31.10.1237
  - https://doi.org/10.3386/w21037
  - https://doi.org/10.1016/j.ijforecast.2019.04.014
  - https://doi.org/10.1016/j.ijforecast.2021.03.004
  - https://doi.org/10.3386/w14669
  - https://doi.org/10.1016/j.ijforecast.2009.01.009
  - https://doi.org/10.1016/S1574-0706(05)01004-9
  - https://doi.org/10.1007/s11146-013-9416-1
---

**Version:** 0.3 (preprint)

**Data through:** 2026-09. The backtests and scenarios use data available through this date and do not update automatically with the page.

## Abstract

For how long can a model forecast urban home prices in China, and how often do its prediction intervals contain the realized outcomes? Using the National Bureau of Statistics' existing-home price indices for 70 cities, this paper constructs forecasts for horizons of 1 to 60 months and evaluates them in rolling backtests against an unchanged-price baseline. The modeling data cover February 2011 through September 2026; origins from 2019 onward are scored, and earlier origins are used for learning.

In the city-level backtest, the 12-month forecast has 38% lower mean absolute error than the unchanged-price baseline, and its nominal 80% interval covers 80% of realized outcomes. At 24 months, the corresponding figures are 28% lower error and 82% coverage. At 48 and 60 months, errors are 12% and 33% higher, while coverage of the 80% interval falls to 64% and 59%. The global model's multi-horizon labels have been corrected, and 210 cells in the 2021 new-home index inferred from future year-on-year values have been masked. Interpretation is limited by horizon-specific, overlapping origins; retrospective model selection; unavailable historical data snapshots; and an unverified Chronos-2 pretraining boundary. The first saved ledger records the pre-correction model (§6.1).

This paper also finds an implementation error in the mean-reversion component of the author's earlier v0.2 method, whose weight-selection objective differs from the five-year cumulative outcome reported. At matched origins, errors for Beijing fall by approximately 19% and 28% at 12 and 24 months, respectively; model-selection boundaries are summarized in §6.1.

**Keywords:** house price indices; probabilistic forecasting; rolling backtests; interval coverage; forecast combinations; China

## 1. Introduction

Households and researchers care about future house prices, but a single long-range number does not show how large forecast errors may be. This paper asks whether forecasts constructed from historical price indices improve on the simple unchanged-price baseline at different horizons, and how their prediction intervals have covered historical outcomes. The outcome is the cumulative change in city existing-home price indices.

The paper combines several base models and builds intervals from realized historical errors. The global model also uses recent changes in the new-home price index as a feature. Error, direction, and coverage are reported separately by horizon. The author's previous five-year forecast paper provides an additional comparison. This paper presents the data, method, and results first, then examines the earlier implementation error and differences between the methods. The backtest design and interpretation are discussed in §6.1.

## 2. Related Work

**Damped trends and forecast combinations.** Damped trends (Gardner & McKenzie, 1985) attenuate extrapolated trends; forecast combinations have been studied by Bates and Granger (1969), among others. The top-k average and the fixed use of a damped trend at long horizons follow these approaches.

**Information across series.** Global modeling and modeling each series separately are alternative ways to forecast a group of time series (Montero-Manso & Hyndman, 2021). This paper uses cross-series information in two ways: a gradient-boosting model pooled across 70 cities and shrinkage of each city's momentum toward its tier's mean (first-, second-, or third-tier cities).

**Foundation models.** Zero-shot time-series foundation models can forecast without training on the target data (Ansari et al., 2025, Chronos-2). Chronos-2 is included as an optional base model.

**House price momentum and reversion.** For US repeat-sales indices, Case and Shiller (1989) found that annual changes in citywide indices were followed by changes in the same direction, amounting to one-quarter to one-half of the previous year's change, with weak evidence of seasonality. Glaeser and Nathanson's (2017) extrapolative-expectations model produces one-year momentum, five-year mean reversion, and excess volatility relative to fundamentals. Capozza et al. (2002) estimated serial-correlation and reversion coefficients for 62 US metropolitan areas; both varied with city size, income growth, population growth, and construction costs. These studies suggest that short-term momentum and long-term reversion can coexist. US findings do not by themselves establish the same pattern for China's 70 cities. This paper uses an unchanged-price baseline to examine historical performance at different horizons.

**China.** Fang, Gu, Xiong, and Zhou (2016) constructed a 120-city price index from developers' successive sales of new homes for 2003 to 2013; Wu, Deng, and Liu (2014) examined the construction of Chinese house price indices. This paper uses an equal-weighted average of the National Bureau of Statistics' 70-city indices and does not examine measurement error in those indices, a limitation discussed in §6.3.

## 3. Data and Methods

### 3.1 Data

The data are the National Bureau of Statistics' month-on-month and year-on-year existing-home sales price indices for 70 large and medium-sized cities. Official pages were collected directly from February 2011 onward. Earlier data come from a third-party mirror; all 13,580 comparable cells match the official pages, but official pages are unavailable to check 2006 through 2010 themselves. **Data quality check:** chaining monthly indices should reproduce the year-on-year index. The identity has no violations from 2013 onward and passes from 2008, but **fails in 2006 and 2007** (median difference about 4 index points). Modeling therefore uses only the current methodology from February 2011 onward. From 2021, the mirror swapped Xuzhou with Yangzhou and Huizhou with Shaoguan; the same identity established that the official pages were correct, so the mirror is not used from 2021 onward.

The modeling sample covers 188 months from 2011-02 to 2026-09 across 70 cities, with no missing or imputed cells. “National” means the **equal-weighted mean** of the 70 city month-on-month indices, chained over time and aggregated bottom-up from city forecasts.

Figure 1 shows the research flow. City point forecasts are combined at the city level and then aggregated monthly into the equal-weighted 70-city index; city and national intervals use their respective historical errors.

```mermaid
flowchart LR
    accTitle: Research data and forecast flow
    accDescr: Official data passes quality checks, city forecasts branch into city and national calibration, and realized outcomes feed the rolling evaluation and ledger.
    A["Official city indices"] --> B["Quality checks and city returns"]
    B --> C["Base forecasts by city"]
    C --> D["Horizon-specific combination"]
    B --> M["Realized historical outcomes"]
    M --> G
    M --> H
    D --> E["City point forecasts"]
    E --> F["70-city aggregate"]
    E --> G["City residual calibration"]
    F --> H["Aggregate residual calibration"]
    G --> I["City intervals"]
    H --> J["Aggregate interval"]
    I --> K["Rolling evaluation"]
    J --> L["Forecast ledger"]
```
**Figure 1:** Main paths from data through models to evaluation. The rolling backtest replays history; the forecast ledger records predictions awaiting assessment.

### 3.2 Forecast Target

For each city and each horizon h = 1…60, the target is the cumulative log change over h months after the origin. Outputs are a point forecast and four endpoints for the 80% and 95% intervals.

Let $I_{c,t}$ be the month-on-month index for city c in month t. Monthly log change is $r_{c,t}=\log(I_{c,t}/100)$, and the target at origin o and horizon h is $y_{c,o,h}=\sum_{j=1}^{h}r_{c,o+j}$. City results are converted back to a cumulative index using $100\exp(y)$.

### 3.3 Base Models

| Model | Meaning |
|---|---|
| naive | Continues the previous month's change |
| drift12 | Continues the mean monthly change over the previous 12 months (the “trend” component in v0.2) |
| ar1 | AR(1) on monthly changes, reverting toward the mean of the most recent 60 months |
| damped | Damped trend: EWMA level over 24 months with a two-month half-life, multiplied by 0.96 each month |
| damped_shrunk | As damped, with each city level equal to 0.6 × its own level + 0.4 × its tier mean |
| global | Gradient boosting pooled across 70 cities (direct multi-horizon, trained through 36 months) |
| chronos2 | Zero-shot foundation model (forecasts through 12 months only) |

The global model uses the city's own lagged values, rolling means and volatility, 70-city aggregate features, city tier, and the three-month mean for new homes. It fits targets separately at 1, 2, 3, 6, 9, 12, 18, 24, and 36 months and interpolates other horizons. Training selection is cut off by target maturity; fewer than 1,500 observations means that model does not provide a forecast. City tiers use the fixed list in the code and are not reconstructed for each historical year. Previously, training labels at h≥2 were misaligned and could introduce data after the forecast origin; the labels have now been corrected and the model retrained and backtested. The 210 cells in the 2021 new-home index bridged using future year-on-year values have been masked and are no longer used as model features. Forecasts for an origin month are assumed to be made after that month's statistics are released; historical input availability is discussed in §6.1.

### 3.4 Combination

- **+1 to +12 months:** For each horizon, select the two available models with the lowest mean squared error (MSE) in cumulative log changes over cities and origins realized before the decision origin, and average them equally (top-2). This selection criterion differs from the mean absolute error (MAE) used in the result tables.
- **From +13 months:** Use damped_shrunk with fixed weight and no further learning. Learning long-horizon weights can use only origins at least h months old, which may belong to another market regime. In the backtest, weighting historical errors through 36 months produced 36% higher error than “unchanged price” at +36 months. Both the long-horizon rule and shrinkage strength of 0.6 were selected using the same backtest (§6.1).

The damped trend is implemented as follows. The last 24 monthly log changes for a city are averaged with exponential weights with a two-month half-life; call the result $L_c$. Let $\bar L_{tier(c)}$ be the mean across cities in the same tier. The model computes $\widetilde L_c=0.6L_c+0.4\bar L_{tier(c)}$, then the cumulative forecast $\widehat y_{c,o,h}=\sum_{j=1}^{h}0.96^j\widetilde L_c$. City tiers follow the project's classification table.

Each backtest proceeds in this order:

```text
for each origin o and horizon h:
    generate each base forecast using the corrected labels and data through o
    select historical origins u whose h-month outcomes are available by o
    if h <= 12 and at least 3 such origins are available:
        rank available models by pooled city-and-origin MSE; average the best 2
    else if h > 12:
        use the shrunk damped model
    else:
        use naive and mark the horizon as not yet scoreable
    recombine historical base forecasts with the selected current weights
    standardize the realized errors and calculate recency-weighted quantiles
    score the forecast only when its outcome is available
```
Model weights are chosen by horizon, not by city. If fewer than 100 standardized city errors are available, the interval uses preset normal quantiles; the same fallback applies when fewer than three national residual origins are available. When too few models are available, the combination is renormalized over the paths present.

### 3.5 Intervals

For city c and horizon h, the interval scale is

> s(c, h) = σ_c · √h + τ_c · h

Here σ_c is the standard deviation of monthly log changes over the last 24 months, and τ_c is the standard deviation over the last 36 months of the 12-month mean change, measuring the instability of the trend itself. The first term accumulates monthly noise as a random walk; the second grows linearly with uncertainty about the trend. The base-model forecasts at historical origins are recombined using the weights chosen at the current decision origin, producing realized errors that are divided by s. These errors differ from those of the combined forecasts actually issued at each historical origin; the implication is discussed in §6.1. For each horizon, the **empirical quantiles** of standardized errors are calculated with greater weight on recent origins (a half-life of four origins, or 12 months). The interval is point forecast + quantile × s. Standardized residual quantiles are adjusted for monotonicity across horizons; final interval endpoints need not be monotonic. The center is the model point forecast, not a forecast median corrected by the empirical residual median.

The national series first takes an equal-weighted average of the monthly forecast indices across cities and then chains those averages. Its interval does not average city intervals directly. At each historical origin, actual and forecast paths are aggregated separately; their difference in national cumulative log change is divided by the median scale across the 70 cities at that origin. National quantiles use the same recency weights. For output, the national point forecast is increased by “national quantile × current median city scale” and converted back to an index. Table 2 reports city coverage; national interval coverage under the same protocol is not reported.

This construction replaces the v0.2 band based on the magnitude of historical five-year cumulative change. The v0.2 width is unrelated to forecast error; here the width comes from realized forecast errors.

### 3.6 Evaluation Protocol

- **Origins:** Every three months from 2016-01, 43 in total. Scoring starts in 2019-01 (31 origins); earlier origins are used only for learning.
- **Information boundary for model selection and intervals:** Origin o enters horizon h weight and quantile learning only when o + h ≤ the decision origin. Regression tests protect the corrected target windows and feature information boundaries.
- **Metrics:** MAE improvement relative to “unchanged price” (skill), direction hit rate, and realized coverage of 80% and 95% intervals. The unchanged-price baseline predicts zero cumulative change.
- **Repeat runs:** The original project reports point-by-point identical pipeline results for the same input; its complete environment and data snapshot still need independent verification.

The following illustrates the information boundary for a forecast origin o and a 12-month horizon. The 12-month outcome from a historical origin u must be realized by o to enter model selection and interval calculation. Under the selection and interval rules, outcomes after o do not enter those two steps.

```mermaid
flowchart LR
    accTitle: Rolling evaluation information boundary
    accDescr: Only historical forecasts whose 12-month outcomes have been observed by the decision origin enter model selection and calibration; later outcomes are used for scoring.
    A["Historical origin u"] --> B["Outcome at u plus 12 months"]
    B --> C["Decision origin o"]
    C --> D["Forecast at o plus 12 months"]
    D --> E["Score after outcome is observed"]
    F["Model design after reviewing backtests"] -.-> C
```
**Figure 2:** Information boundary used in model selection and interval learning. The dotted line indicates that the overall method was determined after examining backtests; that design step was not part of the decision made at each historical origin.

### 3.7 Forecast Ledger

Each update saves all current forecasts to a file for automatic scoring after the next data release. The repository’s first ledger, with origin 2026-09, used the pre-correction model. Its creation time and immutable record have not been verified; its entries are not forecasts from the corrected model (see §4.5).

## 4. Results

### 4.1 Backtest Performance

![Two panels compare forecast-combination and unchanged-price errors across eight horizons and coverage of 80% and 95% city intervals; the horizontal axis places horizons at their actual months.](/images/research/housing-forecast/backtest.webp)

**Figure 3:** Errors and city interval coverage of the corrected combination at the eight reported horizons. Dotted lines indicate nominal coverage. Horizons are positioned at their actual month values on the horizontal axis; each point is one evaluated horizon, and intervening months were not tested individually.

**Table 1. Corrected rolling backtest (70 cities, realized scoring origins from 2019-01; mean absolute error of cumulative log change × 100)**

The global model’s labels have been corrected, and results recalculated using the corrected model. Interpretation of these backtests is discussed in §6.1.

| Model | +1 | +3 | +6 | +12 | +24 | +36 | +48 | +60 |
|---|---|---|---|---|---|---|---|---|
| Unchanged price | 0.49 | 1.38 | 2.62 | 4.97 | 9.31 | 12.66 | 15.11 | 16.92 |
| naive | 0.29 | 0.87 | 1.92 | 4.18 | 9.11 | 15.15 | 22.95 | 34.27 |
| drift12 | 0.36 | 0.97 | 1.91 | 3.85 | 8.51 | 15.57 | 24.91 | 36.44 |
| ar1 | 0.29 | 0.89 | 1.99 | 4.62 | 11.53 | 20.23 | 29.09 | 38.05 |
| damped | 0.30 | 0.80 | 1.63 | 3.20 | 6.95 | 12.16 | 17.10 | 22.60 |
| damped_shrunk | 0.30 | 0.79 | 1.58 | 3.03 | 6.73 | 11.94 | 16.85 | 22.46 |
| global (through 36) | 0.27 | 0.91 | 2.44 | 6.27 | 16.18 | 23.65 | — | — |
| Chronos-2 (through 12) | 0.27 | 0.76 | 1.62 | 3.36 | — | — | — | — |
| **Combination** | **0.27** | **0.79** | **1.58** | **3.07** | **6.73** | **11.94** | **16.85** | **22.46** |

From +13 months, the combination equals damped_shrunk, so their values are identical. Global and Chronos-2 are not reported beyond the horizons for which they were trained.

Each horizon includes only outcomes realized by 2026-09; 31 is the total number of scoring origins, not the number in each column. In the order shown, the scoreable origins number 31, 30, 29, 27, 23, 19, 15, and 11. Cities and adjacent origins are correlated, and statistical uncertainty is not estimated in the table. Table 1 reports log errors, while Table 3 reports ordinary cumulative percentage-change errors; the metrics use different scales.

**Table 2. Improvement over “unchanged price,” direction hit rate, and interval coverage**

| Horizon | +1 | +3 | +6 | +12 | +24 | +36 | +48 | +60 |
|---|---|---|---|---|---|---|---|---|
| Improvement over unchanged price | 46% | 43% | 40% | 38% | 28% | 6% | −12% | −33% |
| Direction hit rate | 83% | 84% | 83% | 81% | 76% | 65% | 50% | 26% |
| Realized 80% interval coverage | 80% | 78% | 76% | 80% | 82% | 71% | 64% | 59% |
| Realized 95% interval coverage | 95% | 94% | 94% | 96% | 95% | 91% | 86% | 85% |

**Reading the results.** (1) At the reported +1, +3, +6, and +12 months, improvement is 38% to 46%, 80% interval coverage is 76% to 80%, and 95% interval coverage is 94% to 96%, close to nominal values. (2) At +24 months, improvement is 28% and coverage is 82%; the corresponding rule was selected using the same backtests (§6.1). (3) By +36 months the improvement has nearly disappeared; it becomes negative at +48 and +60 months, with coverage also below nominal. Direction accuracy is 26% at +60 months: momentum at the scoring origins was upward, while 90% of cities fell cumulatively over the following 60 months.

![Dot distributions of the forecast combination’s error advantage averaged across origins for each of 70 cities at 12, 24, and 60 months; the first two groups lie above zero, while most at 60 months lie below zero.](/images/research/housing-forecast/city-distribution.webp)

**Figure 4:** Differences in error across cities. Each point represents a city. The mean of each forecast's error is calculated for the same realized origins in that city; improvement is “unchanged-price MAE − combination MAE.” A positive value means the combination has lower error, and the short orange line is the median across 70 cities. The vertical axis is absolute error in cumulative log change multiplied by 100. The 12-, 24-, and 60-month horizons use 27, 23, and 11 origins respectively, with results for all 70 cities at each horizon. All 70 cities have positive values at 12 and 24 months, and two are positive at 60 months. Origin overlap and sample dependence are discussed in §6.1.

![Three panels show the difference in mean error across 70 cities between the combination and the unchanged-price baseline for each backtest origin at 12, 24, and 60 months.](/images/research/housing-forecast/origin-errors.webp)

**Figure 5:** Error broken down by backtest origin. For each point, the combination and unchanged-price MAE are first calculated across 70 cities at the same origin and horizon; improvement is “unchanged-price MAE − combination MAE,” with positive values indicating lower combination error. The horizontal axis is forecast origin o, and the realized target window runs from the month after o through month o + h. The panels show horizons of 12, 24, and 60 months. Adjacent origins are three months apart and their target windows overlap heavily, so the points are correlated. The number and range of scoreable origins differ by horizon, and the panels cover different time samples.

Both figures recalculate combination weights and errors for each origin from the saved backtest cache. The same cache is first used to recalculate Tables 1 and 2 and verify agreement with the original report, then the results are aggregated by city or origin. Cache and algorithm versions are listed in the evidence index below.

**Excluding Chronos-2 alone.** The Chronos-2 paper appeared in 2025, whereas backtest origins start in 2019. The full time boundary of its pretraining data and any overlap with the target series have not been verified, so these early-origin results are retrospective evaluations of the model. Using saved base-model backtest records, the original report is first recalculated; Chronos-2 is then removed and both the combination and interval calibration are reselected:

| Horizon | Original combination MAE × 100 | Without Chronos-2 | Improvement over unchanged price without Chronos-2 | 80% coverage without Chronos-2 |
|---|---:|---:|---:|---:|
| +1 | 0.267 | 0.275 | 43.9% | 79.5% |
| +3 | 0.789 | 0.814 | 40.8% | 79.0% |
| +6 | 1.584 | 1.722 | 34.3% | 76.6% |
| +12 | 3.073 | 3.086 | 38.0% | 80.4% |

From +13 months, the shrunk damped trend is fixed; removing Chronos-2 does not change its point forecasts. This comparison reused saved base-model records and did not recollect data or retrain every base model. Recalculation from the cache matched the original report's backtest metrics.

### 4.2 Credibility Bands

Using the eight evaluated horizons of 1, 3, 6, 12, 24, 36, 48, and 60 months, this paper makes a retrospective division into three ranges to summarize the reported scenarios. Unreported months were not evaluated individually. The bands follow these criteria: within the learning horizon, 80% interval coverage within 0.80 ± 0.05 and improvement ≥ 20% are labeled “better backtest performance”; thereafter, improvement ≥ 15% and coverage ≥ 70% are labeled “cautious reference”:

| Band | Horizon | Meaning |
|---|---|---|
| Better backtest performance | +1 to +12 months | Weights learned from realized errors; sample coverage close to nominal |
| Cautious reference | +13 to +24 months | Fixed rule selected from backtest results; interpretation is subject to retrospective design (§6.1) |
| Scenario only | From +25 months | Coverage falls below nominal from +36 months; errors exceed baseline at +48 and +60 months |

### 4.3 Replay from the June 2026 Origin

Using 2026-06 as origin and learning weights and quantiles only from that month and earlier, the model is compared with the next three months of published data. The national cumulative index (origin month = 100) was 99.71, 99.40, and 99.14; model point forecasts were 99.66, 99.29, and 98.96; and the 80% intervals were [99.53, 99.82], [99.00, 99.85], and [98.37, 99.97]. All three actual values fell within the intervals. Across 70 cities, MAE in the +3-month cumulative log change × 100 was 0.35 (unchanged price: 0.94). For v0.2 over the same period, Beijing was above its interval's upper bound in all three months, while the national value was close to the upper bound. The model was finalized after those three months were published, so this is a replay.

### 4.4 Side-by-Side Comparison with v0.2 at Matched Origins

**Table 3. Cumulative-change error at matched origins from 2019-01, percentage points**

| Region | Horizon | Origins | v0.2 algorithm | This model | Unchanged price |
|---|---|---|---|---|---|
| National | +12 | 27 | 4.13 | **2.09** | 4.24 |
| | +24 | 23 | 9.43 | **4.93** | 7.75 |
| | +36 | 19 | 15.75 | 10.04 | 9.93 |
| | +60 | 11 | 28.69 | 20.71 | 14.22 |
| Beijing | +12 | 27 | 5.32 | **4.30** | 5.05 |
| | +24 | 23 | 10.96 | **7.89** | 9.82 |
| | +36 | 19 | 18.09 | 13.80 | 12.36 |
| | +60 | 11 | 35.94 | 15.35 | 8.92 |

At +12 and +24 months, this model's national error is about half that of v0.2; Beijing's is 19% to 28% lower. **From +36 months, neither model beats “unchanged price.”** Scoring origins begin in 2019 because model learning requires realized history.

### 4.5 Historical Scenario from the Pre-Correction Ledger

![Historical path of the equal-weighted 70-city index and the model point forecast and 80% interval from September 2026, with a wide long-range interval.](/images/research/housing-forecast/scenario.webp)

**Figure 6:** Historical equal-weighted 70-city index and pre-correction model ledger output from origin 2026-09, with the origin set to 100. The shading is the model's 80% interval; long-horizon city intervals undercovered in backtests, and national interval backtest coverage has not been reported separately.

The following is the saved pre-correction model ledger (origin 2026-09, point forecasts and 80% intervals for cumulative index change). These figures and Figure 6 are preserved as a historical record, not forecasts from the corrected model; the ledger creation time has not been verified. The bands in the table use the corrected city backtest only as a rough reference and do not validate the pre-correction national interval:

| Horizon | Point forecast | 80% interval | Band |
|---|---|---|---|
| +12 months (2027-09) | −2.8% | −6.3% ~ −0.4% | Better backtest performance |
| +24 months (2028-09) | −4.5% | −11.4% ~ −0.1% | Cautious reference |
| +36 months (2029-09) | −5.5% | −17.1% ~ +0.7% | Scenario only |
| +60 months (2031-09) | −6.5% | −24.3% ~ +3.5% | Scenario only |

The v0.2 five-year baseline of −22.1% lies near the lower end of the pre-correction ledger’s five-year interval (−24.3% to +3.5%). The interval is wide, and backtests have not demonstrated five-year skill. The ledger's −6.5% is a scenario center under damped momentum extrapolation without mean reversion.

## 5. Comparison with and Corrections to the Earlier Method

The comparison is the author's earlier [v0.2 five-year forecast paper](https://github.com/Liyuk/cn-housing-price-training/blob/main/docs/paper-five-year-housing-price-forecast.md). Methods and results for the following calculations are in the repository's [audit script](https://github.com/Liyuk/cn-housing-price-training/blob/main/scripts/paper_algorithm_audit.py) and [audit record](https://github.com/Liyuk/cn-housing-price-training/blob/main/docs/review-forecast-paper-algorithm-2026-11.md).

### 5.1 Replication

On the v0.2 data (2019-01 to 2026-06, 90 months), all v0.2 figures are fully reproduced: national weights 1/0/0 and Beijing weights 0.25/0.50/0.25; ρ = 0.958 and 0.695; five-year baselines of −22.1% (−33.5% to −10.6%) and −4.6% (−9.0% to −0.1%); and all 12 rows of the weight-sensitivity table in §3.2 of that paper.

### 5.2 An Implementation Error

The v0.2 mean-reversion component retained 1 − ρ of the gap each month (`five_year_forecast.py:74`), whereas an AR(1) should retain ρ. As a result, the component closed ρ of the gap in the first step (96% nationally and 69% for Beijing), effectively jumping straight to the sample mean. The half-lives reported in v0.2, 16.1 and 1.9 months, were not those actually used. After correction, the national result is unchanged because the reversion weight is zero. Beijing's weights change from 0.25/0.50/0.25 to 0/0.75/0.25, **the five-year baseline changes from −4.6% to −7.0%**, and its interval changes from −9.0% to −0.1% to −11.5% to −2.6%.

### 5.3 Methodological Weaknesses

- **Small weight-selection sample.** In 90 months of data, weights came from only seven overlapping windows, each 12 months long and three months apart, from 2022-01 to 2024-06. They represent roughly 2.5 independent years, all in the same downturn. The first and second national models differ in error by only 0.6%, and the Beijing models by only 0.1%.
- **Selection objective differs from the reported quantity.** Weights were selected on MAE for 12 months of monthly indices and then used to report a 60-month cumulative change.
- **Headline sensitivity to one hyperparameter.** Changing only the training cutoff fraction from 0.55 to 0.9 moves the Beijing five-year baseline between −0.6% and −9.6%, a span wider than the v0.2 low/high interval of −9.0% to −0.1%.
- **The low/high band is not an error interval.** Its width is 0.5 × the absolute value of the past five-year cumulative change, unrelated to forecast error and constant across horizons.
- **The reversion anchor changes with the window.** The “long-run mean” implies an annualized −2.45% in the window starting in 2019, +0.09% from 2011-02, and +0.68% from 2008-01.

### 5.4 Testing the v0.2 Algorithm over a Longer History

For the national and Beijing series from 2011-02, the v0.2 algorithm is rerun at each of 22 origins from 2016-06 to 2021-09 using data available at that time, including reselection of weights. Forecasts are compared with subsequent realized cumulative change.

**Table 4. Rolling test of the v0.2 algorithm (MAE of cumulative change, percentage points)**

| Region | Horizon | v0.2 algorithm | Unchanged price | v0.2 improvement over unchanged | Realized v0.2 interval coverage |
|---|---|---|---|---|---|
| National | +12 | 2.90 | 4.13 | +30% | 41% |
| | +24 | 6.14 | 7.30 | +16% | 36% |
| | +36 | 10.60 | 9.91 | −7% | 14% |
| | +60 | 19.59 | 14.45 | −36% | 23% |
| Beijing | +12 | 6.65 | 4.76 | −40% | 41% |
| | +24 | 12.08 | 8.17 | −48% | 41% |
| | +36 | 19.16 | 10.64 | −80% | 50% |
| | +60 | 40.72 | 12.61 | −223% | 36% |

**Limitations.** All origins fall in the 2016 to 2021 rising market. The test examines extrapolation from an upswing into the subsequent downturn, not the downturn extrapolation v0.2 actually faced. The 22 origins overlap heavily; at +60 months there is only about one effectively independent origin. Beijing also experienced a policy shock in 2016 and 2017. Table 4 reports this algorithm's error during that market turn and does not determine whether v0.2's −22% result is correct.

### 5.5 Citation Check

The v0.2 references were checked against their original abstracts. Its descriptions of Capozza et al. (2002) and Fang et al. (2016) were accurate. Piazzesi and Schneider (2009) described a “small cluster” of households, not “many”; v0.2 **overstated** this. Glaeser and Nathanson (2017) found **one-year momentum and five-year mean reversion**, contrary to v0.2's five-year approach. Case and Shiller (1989) found weak evidence of seasonality, yet v0.2 assigned seasonality a 25% weight. For Rapach and Strauss (2009) and a few other references, only existence was confirmed; contents were not checked.

## 6. Discussion and Limitations

### 6.1 Retrospective Design and Data Boundaries

Retrospective design enters in four main places: (1) the model was finalized after the most recent three months were published, so §4.3 is a replay; (2) the long-horizon damped rule was fixed after it performed best among single models at long horizons in the same backtest; (3) k in top-2 and the shrinkage strength of 0.6 were selected in that backtest (k=1 had lower error at +12 months, but winner-take-all was less stable, so 2 was selected; restricting origins to 2023 onward also improves results, using the same data); and (4) origins overlap heavily, with only 15 and 11 origins at +48 and +60 months, respectively, and fewer effectively independent observations. Using the same outcomes for selection and evaluation can bias reported performance upward; rule selection and limited effective sample size weigh more heavily at longer horizons. Standardized interval residuals also recombine historical base forecasts using weights from the current decision origin, rather than the combined forecasts actually issued at those origins.

Historical inputs come from the current data panel; point-in-time snapshots are unavailable. Time-cut training labels do not rule out data revisions or other information unavailable at the time. The Chronos-2 pretraining boundary and possible overlap with the target series remain unverified. The ledger's status is described in §4.5.

### 6.2 Regime Bias in the Backtest

Scoring origins from 2019 onward cover one complete downturn, while nearly all earlier origins fell in an upswing. The +48-month scoring origins are limited to 2019-01 through 2022-07, and the +60-month origins to 2019-01 through 2021-07. The 36 to 60 months after these origins coincide with the downturn starting in 2021. The negative +60-month result therefore records the error of momentum extrapolation at a market turn in this sample; it does not estimate the performance of other five-year forecasts.

### 6.3 Index Measurement

This paper uses the equal-weighted average of the National Bureau of Statistics' 70-city indices as its price measure. It does not test how well the index represents transaction prices or evaluate equal weighting. Chinese house price index construction has been studied separately (Wu, Deng & Liu, 2014); Fang et al. (2016) constructed their own 120-city new-home index. These measurement questions are outside this analysis.

### 6.4 Other Limitations

- **No exogenous variables.** Policy, interest rates, population, and income are excluded. Monthly data from 2022 onward for variables such as rental yields have been collected for 12 cities, but remain insufficient to estimate long-run relationships.
- **The 70 cities are not the whole country.** They cover 30 provincial-level jurisdictions (excluding Tibet), but represent only a small share of China's roughly 300 prefecture-level cities and exclude large cities such as Suzhou, Dongguan, Foshan, Zhongshan, and Zhuhai.
- **Data sources.** The 2006 to 2010 data come from a third-party mirror without official pages for verification, and the 2006 to 2007 data failed the consistency test between monthly and year-on-year indices.
- **Long-range intervals cease to be calibrated.** From +36 months, 80% interval coverage falls below nominal; this paper labels those outputs scenarios accordingly.
- **Not done:** hierarchical reconciliation (city → tier → national), online conformal calibration, and turning-point probabilities.

### 6.5 Implications for v0.2

The v0.2 qualitative conclusion that “Beijing is a mean-reverting market” rested on a 0.1% selection difference and an implementation error; it no longer holds here. The v0.2 characterization of the national market as a “downward-trending market” remains consistent with this paper at +12 months (a −2.8% national point forecast in the pre-correction ledger). This paper neither disproves nor confirms v0.2's discussion of a market bottom: it does not produce an endogenous turning-point probability.

## 7. Conclusion

In this 70-city backtest after correcting labels and masking future-bridged cells, 12-month results beat the unchanged-price baseline, and interval coverage is close to nominal. Results at 24 months are also favorable. Five-year results have not shown an advantage over the baseline and are useful as scenarios. The v0.2 five-year baseline of −22.1% relies on momentum extrapolation and does not outperform “unchanged price” in the backtest; its Beijing figure is also affected by an implementation error. Future evaluation should report baseline comparisons by horizon, calibrate interval width against realized errors, and use a frozen forecast ledger to accumulate prospective evidence. The fixed long-horizon rule in this paper still needs independent validation.

## Reproduction

```bash
python -m src.probabilistic_forecast --tsfm data/processed/chronos2_paths.json
python scripts/paper_algorithm_audit.py --cache-tsfm data/processed/chronos2_paths.json
python scripts/acceptance.py --full
```
Table 1 includes Chronos-2. Reproducing it requires first running `src.tsfm_baseline` to generate the forecast JSON; omitting `--tsfm` excludes that model. Full reproduction also requires matching the data snapshot, backtest cache, execution environment, and Chronos-2 version. The commands and summary results are provided here, while the complete input snapshots are not. The original repository site and September 2026 ledger record the pre-correction model; corrected summaries appear in the evidence index below.

### Evidence Index and Version

The table records the corrected backtest and historical ledger. The source-code correction is in commit [`ebbc0b2e2fa983d9bc3f18322d545bce5477173e`](https://github.com/Liyuk/cn-housing-price-training/commit/ebbc0b2e2fa983d9bc3f18322d545bce5477173e) on the model-fix branch. The processed panel and model cache are not included in that commit; hashes identify the local files used, with input and version requirements described in §6.1 and Reproduction.

| Stage | File or result | Relationship to this paper |
|---|---|---|
| Collection and definitions | `data/source_registry.csv`, `src/panel.py` | Source records, data validation, and definition of monthly log change |
| Cleaned panel | `data/processed/housing_indices_clean_v4.csv` | Modeling input from 2011-02 through 2026-09; SHA-256: `47f85bb3c57978dcbbfd5676cf8c486da0fbe14204965a7434c6d7bc3a1465a8`; untracked file |
| Backtest algorithm | `src/probabilistic_forecast.py`, `src/tsfm_baseline.py` | Base models, model selection, intervals, and scoring; base-model weights and caches must be obtained separately |
| Corrected results | [Backtest results](/data/research/housing-forecast/corrected-backtest.json), [comparison results](/data/research/housing-forecast/corrected-analysis.json) | The former supports Figure 3 and Tables 1–2, SHA-256: `7ce82dc3b9b3d8ebc3d891974a329c09b3674d3cdcb753ee06f615d25ba09beb`; the latter contains Table 3 and the comparison excluding Chronos-2, SHA-256: `27a3434130542e5ed99a598823b82906c39934bb1a757850a93b655eaeeee487` |
| Pre-correction forecast ledger | `reports/forecast_ledger/2026-09.csv` | Figure 6 historical point forecasts and intervals; SHA-256: `7a691f3c8159cc6d2cf03ab5990cb904e2b3af1b273a51689e702a33acaec1c5` |
| Earlier-model comparison | `scripts/paper_algorithm_audit.py`, `reports/paper_algorithm_audit.json` | Tables 3–4 and review of the v0.2 algorithm |

Figure 3 uses the eight reported horizons directly from the corrected results file. Figures 4 and 5 call the same model-selection and combination functions at each origin using the backtest cache described below, and then average by origin or city respectively. The historical line in Figure 6 is constructed by equal-weighting the cleaned panel's 70 monthly city indices, chaining them, and setting 2026-09 to 100; the forecast line and intervals come from corresponding ledger columns. The table excluding Chronos-2 uses the local backtest cache: the original report is checked first, then that model's paths are removed and the same scoring function is called. The corrected cache is not pinned as a public snapshot; its SHA-256 is `da2378a1505270c9518a696554e871381f81980611a8a17fb5102793a98ebe18`. Two runs from empty caches produced byte-identical summary reports. This calculation used Python 3.9.6, NumPy 2.0.2, pandas 2.3.3, and scikit-learn 1.6.1. Full replication will require publication or reconstruction of matching-hash data and caches, plus fixed execution environment and Chronos-2 model version.

## References

[1] Ansari, A. F., Shchur, O., Küken, J., et al. (2025). Chronos-2: From Univariate to Universal Forecasting. arXiv:2510.15821. https://arxiv.org/abs/2510.15821

[2] Bates, J. M., & Granger, C. W. J. (1969). The Combination of Forecasts. *Operational Research Quarterly*, 20(4), 451–468. https://doi.org/10.2307/3008764

[3] Capozza, D., Hendershott, P., Mack, C., & Mayer, C. (2002). Determinants of Real House Price Dynamics. NBER Working Paper 9262. https://doi.org/10.3386/w9262

[4] Case, K., & Shiller, R. (1989). The Efficiency of the Market for Single-Family Homes. *American Economic Review*, 79(1). NBER Working Paper 2506. https://doi.org/10.3386/w2506

[5] Fang, H., Gu, Q., Xiong, W., & Zhou, L.-A. (2016). Demystifying the Chinese Housing Boom. *NBER Macroeconomics Annual*, 30. NBER Working Paper 21112. https://doi.org/10.3386/w21112

[6] Gardner, E. S., & McKenzie, E. (1985). Forecasting Trends in Time Series. *Management Science*, 31(10), 1237–1246. https://doi.org/10.1287/mnsc.31.10.1237

[7] Glaeser, E., & Nathanson, C. (2017). An Extrapolative Model of House Price Dynamics. *Journal of Financial Economics*, 126(1). NBER Working Paper 21037. https://doi.org/10.3386/w21037

[8] Makridakis, S., Spiliotis, E., & Assimakopoulos, V. (2020). The M4 Competition: 100,000 time series and 61 forecasting methods. *International Journal of Forecasting*, 36(1), 54–74. https://doi.org/10.1016/j.ijforecast.2019.04.014

[9] Montero-Manso, P., & Hyndman, R. J. (2021). Principles and algorithms for forecasting groups of time series: Locality and globality. *International Journal of Forecasting*, 37(4), 1632–1653. https://doi.org/10.1016/j.ijforecast.2021.03.004

[10] Piazzesi, M., & Schneider, M. (2009). Momentum Traders in the Housing Market: Survey Evidence and a Search Model. NBER Working Paper 14669; *American Economic Review*, 99(2), 406–411. https://doi.org/10.3386/w14669

[11] Rapach, D., & Strauss, J. (2009). Differences in Housing Price Forecastability Across US States. *International Journal of Forecasting*, 25(2), 351–372. https://doi.org/10.1016/j.ijforecast.2009.01.009

[12] Timmermann, A. (2006). Forecast Combinations. In *Handbook of Economic Forecasting*, Vol. 1, 135–196. https://doi.org/10.1016/S1574-0706(05)01004-9

[13] Wu, J., Deng, Y., & Liu, H. (2014). House Price Index Construction in the Nascent Housing Market: The Case of China. *Journal of Real Estate Finance and Economics*, 48(3), 522–545. https://doi.org/10.1007/s11146-013-9416-1

[14] Author. (2026a). Measurable and Unmeasurable: A Source- and Definition-Aware Approach to Constructing Chinese House Price Data (with Beijing as a District-Level Case). Preprint, v0.4.

[15] Author. (2026b). China's Existing-Home Prices over the Next Five Years: An Interpretable Combination Forecast and Analysis of a Potential Bottom (2026–2030). Preprint, v0.2.

**Citation verification.** The descriptions of [3], [4], [5], [7], and [10] were checked against abstracts on NBER pages. [6], [8], [9], [12], [13], and [1] were verified for existence and bibliographic details via Crossref or arXiv; **their contents were not checked individually**. This paper cites them only for their titles and commonly recognized findings (damped trends, M4, global models, forecast combinations, Chinese index construction, and foundation models). Only the existence of [11] was verified; the paper does not rely on its specific conclusions.

## Author and Disclosures

**Author:** Liyuk

**Conflicts of interest:** The author declares no conflicts of interest. This project received no commercial funding, and it does not constitute investment advice; forecast outputs are not promises or guarantees of future house prices.

**Data and code availability:** Collection, cleaning, modeling, backtesting, and acceptance code is in the GitHub repository; reproduction still requires verification of the exact commit, dependencies, and model resources ([cn-housing-price-training](https://github.com/Liyuk/cn-housing-price-training)). Processed data and forecast quantiles can be downloaded from the site's “Data and Methods” page.

**About the writing:** Backtest figures come from the corrected results published below and the v0.2 audit results in the original repository. The paper and code were produced by the author with AI assistance; the author is responsible for their contents.
