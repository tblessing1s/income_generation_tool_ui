import {Component} from '@angular/core';
import {CoveredCallEstimatorService} from '../covered-call-estimator.service';
import {ChartConfiguration, ChartType} from 'chart.js';

const SHORT_TERM_TAX_RATE = 0.37; // 37% for short-term gains (example value)
const LONG_TERM_TAX_RATE = 0.20;  // 20% for long-term gains (example value)

@Component({
  selector: 'app-covered-call-estimator',
  templateUrl: './covered-call-estimator.component.html',
  styleUrls: ['./covered-call-estimator.component.css']
})
export class CoveredCallEstimatorComponent {
  formData = {
    ticker: '',
    expiration_date: '',
    strike_price: null
  };



  optionsData: any[] = [];
  dropdownOptions = {
    expiration_dates: [] as string[],
    strike_prices: [] as { price: number; probability: number }[]
  };

  premium: number | null = null;
  dividendYield: number = 0; // 2% dividend yield
  stockPrice: number = 0;
  loading: boolean = false;
  error: string | null = null;
  viewMode: 'monthly' | 'yearly' = 'monthly';

  roiChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Dividends Only', 'Dividends + Premiums'],
    datasets: [
      { data: [], label: 'Dividends Only ROI', backgroundColor: 'rgba(0,123,255,0.5)' },
      { data: [], label: 'Dividends + Premiums ROI', backgroundColor: 'rgba(40,167,69,0.5)' }
    ]
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
      },
    },
  };
  roiChartType: ChartType = 'bar';

  // Chart data and configuration
  incomeChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Potential Income' }]
  };

  probabilityChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Probability (%)', borderColor: '#3e95cd', fill: false }]
  };

  incomeChartType: ChartType = 'bar';
  probabilityChartType: ChartType = 'line';

  constructor(private optionsDataService: CoveredCallEstimatorService) {}

  // Fetch expiration dates after ticker input
  onTickerBlur() {
    if (this.formData.ticker.trim()) {
      this.loading = true;
      this.fetchExpirationDates();
    } else {
      this.error = 'Please enter a valid stock ticker.';
    }
  }

  fetchExpirationDates() {
    this.loading = true;
    this.error = null;

    this.optionsDataService.getOptionsData(this.formData.ticker, 'covered_call').subscribe({
      next: (data: any) => {
        this.optionsData = data.recommendations;

        this.dropdownOptions.expiration_dates = Array.from(
          new Set(this.optionsData.map((opt: any) => opt.expiration_date))
        );

        this.formData.expiration_date = '';
        this.dropdownOptions.strike_prices = [];
        this.formData.strike_price = null;
        this.premium = null;

        this.loading = false;
      }
      ,
      error: (err: any) => {
        console.error('Error fetching expiration dates:', err);
        this.error = 'Failed to load expiration dates. Please try again.';
        this.loading = false;
      }
    });
  }

  onExpirationDateChange() {
    if (this.formData.expiration_date) {
      const filteredOptions = this.optionsData.filter(
        (opt: any) => opt.expiration_date === this.formData.expiration_date
      );

      this.dropdownOptions.strike_prices = filteredOptions.map((opt: any) => ({
        price: opt.strike_price,
        probability: opt.probability
      }));

      this.formData.strike_price = null;
      this.premium = null;
    }
  }

  onStrikePriceChange() {
    if (this.formData.strike_price) {
      const selectedOption = this.optionsData.find(
        (opt: any) =>
          opt.expiration_date === this.formData.expiration_date &&
          opt.strike_price === this.formData.strike_price
      );
      if (selectedOption) {
        this.premium = selectedOption.mark_price;
        this.dividendYield = selectedOption.dividend_yield;
        this.stockPrice = selectedOption.stock_price;
        this.updateIncomeComparisonChart();
      }
    }
  }

  // ROI Calculations
  getDividendIncome(): number {
    let dividend_per_year = (this.stockPrice * this.dividendYield) * 100;
    return this.viewMode === 'monthly' ?
      dividend_per_year / 12 : dividend_per_year;
  }

  getPremiumIncome(): number {
    const premiumValue = this.premium ?? 0;
    const premiumIncome = premiumValue * 100;
    return this.viewMode === 'monthly' ? premiumIncome : premiumIncome * 12;
  }

  calculateIncomeBelowStrike(): number {
    // Income if stock price stays below the strike price
    const dividendIncome = this.getDividendIncome();
    const premiumIncome = this.getPremiumIncome();// Calculate dividend income
    return dividendIncome + (premiumIncome ?? 0);
  }

  calculateIncomeAtStrike(): number {
    // Income if stock price hits the strike price
    const dividendIncome = this.getDividendIncome();
    const premiumIncome = this.getPremiumIncome();
    const capitalGain = this.calculateCapitalGainsAtStrike(); // Gain from selling at strike price
    return dividendIncome + (premiumIncome ?? 0) + capitalGain;
  }

  calculateIncomeAboveStrike(): number {
    // Income if stock price exceeds the strike price
    const dividendIncome = this.getDividendIncome();
    const premiumIncome = this.getPremiumIncome();
    const capitalGain = this.calculateCapitalGainsAtStrike();
    return dividendIncome + (premiumIncome ?? 0) + capitalGain; // Income is capped at strike price
  }

  calculateCapitalGainsAtStrike(): number {
    // Capital gain from selling at the strike price
    const purchasePrice = this.stockPrice; // Assume the current stock price is the purchase price
    return (this.formData.strike_price! - purchasePrice) * 100!;
  }

  calculateShortTermTaxAtStrike(): number {
    // Short-term capital gains tax
    const gains = this.calculateCapitalGainsAtStrike();
    return gains * SHORT_TERM_TAX_RATE;
  }

  calculateLongTermTaxAtStrike(): number {
    // Long-term capital gains tax
    const gains = this.calculateCapitalGainsAtStrike();
    return gains * LONG_TERM_TAX_RATE;
  }

  updateIncomeComparisonChart() {
    const dividendAmount = this.getDividendIncome();
    const premiumAmount = this.getPremiumIncome() + dividendAmount;
    console.log('dividendAmount:', dividendAmount, 'premiumAmount:', premiumAmount);
    this.roiChartData = {
      labels: ['Income Comparison'],
      datasets: [
        {
          data: [dividendAmount],
          label: 'Dividends Amount',
          backgroundColor: 'rgba(0,123,255,0.5)',
          barThickness: 50,
          barPercentage: 0.5,
          categoryPercentage: 0.5
        },
        {
          data: [premiumAmount],
          label: 'Dividends + Premiums Amount',
          backgroundColor: 'rgba(40,167,69,0.5)',
          barThickness: 50,
          barPercentage: 0.5,
          categoryPercentage: 0.5
        }
      ]
    };
  }
}
