export {};

declare global {
  interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }

  interface RazorpayCheckoutOptions {
    key: string;
    subscription_id: string;
    name: string;
    description: string;
    handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
    prefill?: {
      name?: string;
      email?: string;
    };
    theme?: {
      color?: string;
      backdrop_color?: string;
    };
    modal?: {
      ondismiss?: () => void;
      backdropclose?: boolean;
      escape?: boolean;
      confirm_close?: boolean;
    };
    retry?: {
      enabled?: boolean;
      max_count?: number;
    };
    config?: {
      display?: {
        blocks?: Record<
          string,
          {
            name?: string;
            instruments?: Array<{ method: string }>;
          }
        >;
        sequence?: string[];
        preferences?: {
          show_default_blocks?: boolean;
        };
      };
    };
  }

  interface RazorpayInstance {
    open: () => void;
    on: (
      event: "payment.failed" | string,
      handler: (response: unknown) => void,
    ) => void;
  }

  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}
