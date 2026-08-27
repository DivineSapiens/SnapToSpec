export const SAMPLE_SPEC = {
  task_id: "demo-89a1",
  status: "COMPLETED",
  spec: {
    title: "[BUG] Checkout Modal Fails with 500 Network Error on Discount Code Application",
    bug_summary: "During the checkout workflow, entering an alphanumeric promo code ('SUMMER2026') and clicking 'Apply Code' triggers an unhandled 500 Internal Server Error in the payment gateway orchestration service. The UI enters a perpetual loading freeze and fails to render an inline error notice, blocking the user from completing the purchase.",
    severity: "High",
    tags: ["checkout", "payment-service", "ui-freeze", "500-internal-error", "regression"],
    reproduction_steps: [
      {
        step_number: 1,
        action: "Navigate to the eCommerce storefront and add 'Cloud Architecture Pro Plan' to cart.",
        expected_result: "Item is successfully added to the cart drawer.",
        actual_result: "Cart drawer slides out displaying 1 item ($249.00 USD)."
      },
      {
        step_number: 2,
        action: "Click 'Proceed to Checkout' and fill in standard shipping credentials.",
        expected_result: "Payment step becomes active with promo code accordion open.",
        actual_result: "User arrives at step 2 'Payment & Billing Information'."
      },
      {
        step_number: 3,
        action: "Enter 'SUMMER2026' into the discount input field and click 'Apply'.",
        expected_result: "Discount applied (20% off) and subtotal recalculates immediately to $199.20.",
        actual_result: "HTTP 500 error returned from /api/v1/coupons/validate; button spinner spins indefinitely."
      },
      {
        step_number: 4,
        action: "Attempt clicking the 'Complete Purchase' primary CTA button.",
        expected_result: "Either process payment or notify user with actionable error banner.",
        actual_result: "CTA button is permanently disabled with disabled cursor."
      }
    ],
    timestamps_of_interest: [
      {
        timestamp_seconds: 1.2,
        label: "Cart Overview",
        description: "User opens the cart overlay with 1 item selected."
      },
      {
        timestamp_seconds: 4.8,
        label: "Coupon Code Entered",
        description: "User inputs 'SUMMER2026' into promo code form field."
      },
      {
        timestamp_seconds: 8.5,
        label: "Network 500 Error",
        description: "Fetch call fails with 500 Status code in Chrome DevTools network panel."
      },
      {
        timestamp_seconds: 12.1,
        label: "UI Frozen State",
        description: "Primary submit button disabled and spinner stuck in loop."
      }
    ],
    playwright_script: `import { test, expect } from '@playwright/test';

test.describe('Checkout Workflow Regression - Discount Code 500 Bug', () => {
  test('reproduces promo code application crash and verifies error state', async ({ page }) => {
    // 1. Navigate to product page and add item
    await page.goto('https://app.snaptospec.example/store/product/cloud-pro');
    await page.getByRole('button', { name: /add to cart/i }).click();

    // 2. Open checkout modal
    await page.getByRole('button', { name: /checkout/i }).click();
    await expect(page.locator('#checkout-modal')).toBeVisible();

    // 3. Fill billing details
    await page.locator('input[name="email"]').fill('qa-tester@snaptospec.io');
    await page.locator('input[name="full_name"]').fill('Alex Johnson');
    await page.getByRole('button', { name: /continue to payment/i }).click();

    // 4. Trigger coupon code application
    const promoInput = page.locator('input[placeholder="Enter promo code"]');
    await promoInput.fill('SUMMER2026');
    
    // Intercept network call to monitor 500 response
    const couponPromise = page.waitForResponse(
      resp => resp.url().includes('/api/v1/coupons/validate') && resp.status() === 500
    );
    await page.getByRole('button', { name: /apply/i }).click();
    await couponPromise;

    // 5. Assert that checkout does NOT become unrecoverably frozen
    const completeBtn = page.getByRole('button', { name: /complete purchase/i });
    await expect(completeBtn).toBeEnabled({ timeout: 5000 });
    
    // 6. Assert user-friendly toast/alert is rendered
    await expect(page.getByRole('alert')).toContainText(/unable to validate promo code/i);
  });
});`
  },
  frame_urls: [
    {
      id: 1,
      timestamp: "1.2s",
      label: "Cart Overview",
      url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      description: "Cart opened with 1 item selected ($249.00 USD)."
    },
    {
      id: 2,
      timestamp: "4.8s",
      label: "Coupon Code Entered",
      url: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
      description: "User inputs promo code 'SUMMER2026'."
    },
    {
      id: 3,
      timestamp: "8.5s",
      label: "Network 500 Error",
      url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      description: "DevTools console shows 500 Internal Server Error."
    },
    {
      id: 4,
      timestamp: "12.1s",
      label: "UI Frozen State",
      url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
      description: "Submit button disabled and loading spinner stuck."
    }
  ],
  github_issue_url: "https://github.com/DivineSapiens/SnapToSpec/issues/42",
  github_issue_number: 42,
  created_at: new Date().toISOString()
};
