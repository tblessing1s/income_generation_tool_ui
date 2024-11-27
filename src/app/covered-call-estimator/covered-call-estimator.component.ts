import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-covered-call-estimator',
  templateUrl: './covered-call-estimator.component.html',
  styleUrls: ['./covered-call-estimator.component.css']
})
export class CoveredCallEstimatorComponent implements OnChanges {
  @Input() strikePrice!: number;
  @Input() shares!: number;
  @Input() expirationDate!: string;
  @Input() premium!: number | null;
  @Input() dividendYield!: number;
  @Input() stockPrice!: number;

  incomeBreakdownChart: any = null;

  totalIncome: number = 0;
  projectionType: 'yearly' | 'monthly' = 'yearly'; // Default to yearly

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['expirationDate'] ||
      changes['strikePrice'] ||
      changes['shares']
    ) {
      this.calculatePremium();
    }
  }

  /**
   * Calculate the premium based on the selected strike price and number of shares.
   */
  calculatePremium(): void {
    const selectedStrike = this.strikePrice
    if (selectedStrike && this.premium) {
      let eligibleShares = this.eligiblePremiumShares(); // Only multiples of 100 shares
      let calculatePremium = this.calculatePremiumByYear(eligibleShares);
      let calculatedDividend = this.calculateDividendsByYear(this.dividendYield, this.stockPrice);
      // Update chart data
      this.createChart(calculatedDividend, calculatePremium);
      this.totalIncome = calculatedDividend + calculatePremium;
    } else {
      this.premium = null;
      this.incomeBreakdownChart = null;
    }
  }

  private createChart(calculatedDividend: number, calculatePremium: number) {
    this.incomeBreakdownChart = {
      labels: ['Dividends', 'Premiums'],
      datasets: [
        {
          label: 'Income Comparison',
          data: [calculatedDividend, calculatePremium],
        },
      ],
    };
  }

  eligiblePremiumShares() {
    return Math.floor(this.shares / 100) * 100;
  }

  /**
   * Calculate the dividend income.
   */
  calculateDividendsByYear(dividend_yield: number, stock_price: number): number {
    const dividendPerShare = dividend_yield * stock_price; // Example dividend per share
    let dividendAmount = this.shares * dividendPerShare;
    return this.projectionType === 'yearly' ? dividendAmount : dividendAmount / 12;
  }

  calculatePremiumByYear(eligibleShares: number): number {
    console.log('eligibleShares', eligibleShares, 'premium', this.premium);
    if (this.premium !== null) {
      return this.projectionType === 'yearly' ? ((this.premium * eligibleShares) * 12) : (this.premium * eligibleShares);
    } else {
      return 0;
    }
  }

  onInputChange(): void {
    this.calculatePremium();
  }
}
