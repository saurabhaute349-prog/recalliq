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
    handler: (response: RazorpaySuccessResponse) => void;
    prefill?: {
      name?: string;
      email?: string;
    };
    theme?: {
      color?: string;
    };
    modal?: {
      ondismiss?: () => void;
    };
    config?: {
      display?: {
        blocks?: {
          banks?: {
            name?: string;
            instruments?: Array<{ method: string }>;
          };
        };
        preferences?: {
          show_default_blocks?: boolean;
        };
      };
    };
  }

  interface RazorpayInstance {
    open: () => void;
    on: (event: "payment.failed", handler: (response: unknown) => void) => void;
  }

  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}
