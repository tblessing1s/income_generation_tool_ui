import {Component, OnInit} from '@angular/core';
import {CoveredCallEstimatorService} from '../covered-call-estimator.service';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MatSelectChange} from '@angular/material/select';

@Component({
  selector: 'app-strategy-estimator',
  templateUrl: './strategy-estimator.component.html',
  styleUrl: './strategy-estimator.component.css'
})
export class StrategyEstimatorComponent implements OnInit {
  strategyForm!: FormGroup;
  filteredTickers: { stock_ticker: string}[] = [];

  tickers: { stock_ticker: string}[] = [];

  dropdownOptions: {
    expiration_dates: string[],
    strike_prices: { price: number, probability: number, premium: number }[]
  } = {
    expiration_dates: [],
    strike_prices: [],
  };
  selectedStrategy: 'coveredCall' | 'cashSecuredPut' = 'coveredCall';
  shareInputLabel = 'Number of Shares You Own';
  optionsData: any[] = [];
  loading: boolean = false;
  error: string | null = null;

  inputSubject = new Subject<string>();

  constructor(private fb: FormBuilder, private optionsDataService: CoveredCallEstimatorService) {
  }

  ngOnInit(): void {
    this.buildEstimateIncomeForm()
    this.populateTickerSymbols();
  }

  private populateTickerSymbols() {
    this.optionsDataService.fetchTickers().subscribe({
      next: (data: { tickers: { stock_ticker: string }[] }) => {
        this.tickers = data.tickers.map((ticker: any) => ({stock_ticker: ticker.stock_symbol}));
        console.log('tickers', this.tickers);
      },
      error: (err: any) => {
        console.error('Error fetching tickers:', err);
      },
    });

    this.inputSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((value) => {
      this.filterTickers(value);
    });
  }

  buildEstimateIncomeForm(): void {
    this.strategyForm = this.fb.group({
      strategy: [this.selectedStrategy],
      ticker: [''],
      shares: [100],
      expiration_date: [''],
      strike_price: [0],
      premium: [0],
      dividend_yield: [0],
      stock_price: [0],
    });

    // Subscribe to form changes
    this.strategyForm.valueChanges.subscribe((formData) => {
      console.log('Form data changed:', formData);
      this.onFormChange(formData);
    });
  }

  onFormChange(formData: any): void {
    if (formData.strategy !== this.selectedStrategy) {
      this.selectedStrategy = formData.strategy;
    }
  }

  onStrategyChange(): void {
    this.shareInputLabel =
      this.selectedStrategy === 'coveredCall'
        ? 'Number of Shares You Own'
        : 'Number of Shares You Want to Own (in 100s)';
  }

  onTickerInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    this.inputSubject.next(inputValue); // Emit value to Subject
  }

  filterTickers(value: string): void {
    const filterValue = value.toUpperCase();
    this.filteredTickers = this.tickers.filter((ticker) =>
      ticker.stock_ticker.toUpperCase().includes(filterValue)
    );
  }

  onTickerSelected(event: MatAutocompleteSelectedEvent): void {
    this.strategyForm.get('ticker')?.setValue(event.option.value.toUpperCase()) // Update formData with the selected ticker
    this.fetchOptionsRecommendations(); // Trigger fetch logic
  }

  fetchOptionsRecommendations(): void {
    this.loading = true;
    this.error = null;
    this.optionsDataService.getOptionsData(this.strategyForm.get('ticker')?.value, 'covered_call').subscribe({
      next: (data: any) => {
        this.optionsData = data.recommendations;
        console.log('optionsData', this.optionsData);
        // Extract unique expiration dates
        this.dropdownOptions.expiration_dates = Array.from(
          new Set(this.optionsData.map((opt) => {
            return opt.expiration_date
          }))
        );

        this.strategyForm.patchValue({
          dividend_yield: this.optionsData[0].dividend_yield,
          stock_price: this.optionsData[0].stock_price
        })
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

  setRecommendedExpirationDateAndStrikePrice(): void {
    // Find the expiration date closest to 30 days out
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    let expiration_list = this.dropdownOptions.expiration_dates.reduce((closest, date) => {
      const currentDiff = Math.abs(new Date(date).getTime() - targetDate.getTime());
      const closestDiff = Math.abs(new Date(closest).getTime() - targetDate.getTime());
      return currentDiff < closestDiff ? date : closest;
    });

    this.strategyForm.patchValue({
      expiration_date: expiration_list
    })
    // Update strike prices for the recommended expiration date
    this.updateStrikePrices();
  }

  updateStrikePrices(): void {
    const selectedExpirationDate = this.strategyForm.get('expiration_date')?.value;

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

      this.strategyForm.patchValue({
        strike_price: recommendedOption ? recommendedOption.strike_price : 0,
        premium: recommendedOption ? recommendedOption.mark_price : 0
      });
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
  onStrikePriceChange(selectChange: MatSelectChange): void {
    this.strategyForm.patchValue({
      strike_price: selectChange.value
    });
  }

  calculateDaysToExpiry(expirationDate: string): number {
    const today = new Date();
    const expiryDate = new Date(expirationDate);
    const timeDifference = expiryDate.getTime() - today.getTime();
    const daysToExpiry = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Convert milliseconds to days
    return daysToExpiry >= 0 ? daysToExpiry : 0; // Ensure non-negative days
  }

  calculateViewportHeight(itemsCount: number): number {
    const itemHeight = 50; // Height of a single item, matching itemSize
    const maxItemsVisible = 5; // Max items to show before scrolling
    const height = Math.min(itemsCount, maxItemsVisible) * itemHeight;
    return height;
  }

  onShareChanges(event: Event) {
    let shares = (event.target as HTMLInputElement).value;

    this.strategyForm.patchValue({
      shares: shares
    });
  }
}
