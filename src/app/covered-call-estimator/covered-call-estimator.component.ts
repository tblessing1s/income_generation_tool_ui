import {Component} from '@angular/core';
import {CoveredCallEstimatorService} from '../covered-call-estimator.service';

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
    shares: 100, // Default value
    expiration_date: '',
    strike_price: 0,
  };
  dropdownOptions: {
    expiration_dates: string[],
    strike_prices: {price: number, probability: number, premium: number}[]
  } = {
    expiration_dates: [],
    strike_prices: [],
  };
  optionsData: any[] = []; // Stores full options data fetched from the service
  premium: number | null = null;
  roiChartData: any = null;
  loading: boolean = false;
  error: string | null = null;
  dividend: number = 0;
  totalIncome: number = 0;
  projectionType: 'yearly' | 'monthly' = 'yearly'; // Default to yearly

  constructor(private optionsDataService: CoveredCallEstimatorService) {}


  /**
   * Fetch options data and populate expiration dates and strike prices.
   */
  fetchOptionsRecommendations(): void {
    this.loading = true;
    this.error = null;

    this.optionsDataService.getOptionsData(this.formData.ticker, 'covered_call').subscribe({
      next: (data: any) => {
        this.optionsData = data.recommendations;
        console.log('optionsData', this.optionsData);
        // Extract unique expiration dates
        this.dropdownOptions.expiration_dates = Array.from(
          new Set(this.optionsData.map((opt) => opt.expiration_date))
        );
        // this.stockPrice = this.optionsData[0].stock_price;
        // Set the recommended expiration date and strike price
        if (this.dropdownOptions.expiration_dates.length > 0) {
          this.setRecommendedExpirationDateAndStrikePrice();
        } else {
          this.error = 'No expiration dates available.';
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching options data:', err);
        this.error = 'Failed to fetch options data. Please try again.';
        this.loading = false;
      },
    });
  }

  /**
   * Set the recommended expiration date and strike price.
   */
  setRecommendedExpirationDateAndStrikePrice(): void {
    // Find the expiration date closest to 30 days out
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    this.formData.expiration_date = this.dropdownOptions.expiration_dates.reduce((closest, date) => {
      const currentDiff = Math.abs(new Date(date).getTime() - targetDate.getTime());
      const closestDiff = Math.abs(new Date(closest).getTime() - targetDate.getTime());
      return currentDiff < closestDiff ? date : closest;
    });

    // Update strike prices for the recommended expiration date
    this.updateStrikePrices();
  }

  /**
   * Update strike prices for the selected expiration date and recommend a strike price.
   */
  updateStrikePrices(): void {
    const selectedExpirationDate = this.formData.expiration_date;

    // Filter options data by the selected expiration date
    const relevantOptions = this.optionsData.filter(
      (opt) => opt.expiration_date === selectedExpirationDate
    );
    console.log('relevantOptions', relevantOptions);
    // Populate strike prices dropdown
    this.dropdownOptions.strike_prices = relevantOptions.map((opt) => ({
      price: opt.strike_price,
      probability: opt.probability,
      premium: opt.mark_price,
    }));


    // Recommend a strike price based on probability closest to 20%
    const targetProbability = 0.20;
    const recommendedOption = relevantOptions.reduce((best, current) => {
      const currentDiff = Math.abs(current.probability - targetProbability);
      const bestDiff = Math.abs(best.probability - targetProbability);
      return currentDiff < bestDiff ? current : best;
    });

    if (recommendedOption) {
      this.formData.strike_price = recommendedOption.strike_price;
    } else {
      this.formData.strike_price = 0;
      this.error = 'No valid strike prices available.';
    }
    console.log('Calculate premium', this.dropdownOptions.strike_prices);
    // Recalculate premium
    this.calculatePremium();
  }

  /**
   * Calculate the premium based on the selected strike price and number of shares.
   */
  calculatePremium(): void {
    const selectedStrike = this.dropdownOptions.strike_prices.find(
      (option) => option.price === this.formData.strike_price
    );
    console.log('selectedStrike', selectedStrike);
    if (selectedStrike) {
      const eligibleShares = this.eligiblePremiumShares(); // Only multiples of 100 shares

      this.premium = this.calculatePremiumByYear(selectedStrike.premium, eligibleShares);
      this.dividend = this.calculateDividendsByYear(this.optionsData[0].dividend_yield, this.optionsData[0].stock_price);
      console.log('premium', this.premium);
      // Update chart data
      this.roiChartData = {
        labels: ['Dividends', 'Premiums'],
        datasets: [
          {
            label: 'Income Comparison',
            data: [this.dividend, this.premium],
          },
        ],
      };
      this.totalIncome = this.dividend + this.premium;
    } else {
      this.premium = null;
      this.roiChartData = null;
    }
  }

  calculateByMonth(income: number): number {
    return this.projectionType === 'yearly' ? income : income / 12;
  }

  eligiblePremiumShares() {
    return Math.floor(this.formData.shares / 100) * 100;
  }

  /**
   * Calculate the dividend income.
   */
  calculateDividendsByYear(dividend_yield: number, stock_price: number): number {
    const dividendPerShare = dividend_yield * stock_price; // Example dividend per share
    let dividendAmount = this.formData.shares * dividendPerShare;
    return this.projectionType === 'yearly' ? dividendAmount : dividendAmount / 12;
  }

  calculatePremiumByYear(premium: number, eligibleShares: number): number {
    return this.projectionType === 'yearly' ? ((premium * eligibleShares) * 12) : (premium * eligibleShares);
  }

  /**
   * Handle changes to expiration date.
   */
  onExpirationDateChange(): void {
    this.updateStrikePrices();
  }

  /**
   * Handle changes to strike price or number of shares.
   */
  onInputChange(): void {
    this.calculatePremium();
  }

  calculateDaysToExpiry(expirationDate: string): number {
    const today = new Date();
    const expiryDate = new Date(expirationDate);
    const timeDifference = expiryDate.getTime() - today.getTime();
    const daysToExpiry = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Convert milliseconds to days
    return daysToExpiry >= 0 ? daysToExpiry : 0; // Ensure non-negative days
  }

}
