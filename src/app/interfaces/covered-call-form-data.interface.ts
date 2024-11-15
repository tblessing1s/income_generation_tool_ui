// Define an interface for form data
export type Strategy = 'covered_call' | 'cash_secured_put' | 'protective_put';

export interface CoveredCallFormData {
  strategy: string;
  ticker: string;
  quantity: number;
  purchase_price: number;
  strike_price: number;
  premium: number;
}

export interface TooltipContent {
  ticker: string;
  quantity: string;
  strike_price: string;
  premium: string;
  purchase_price: string;
}
