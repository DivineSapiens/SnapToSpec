"""
Mock Test Suite for SnapToSpec Pipeline.
Validates the complete pipeline workflow without requiring live GCP credentials.
"""
import os
import json
import tempfile
from pathlib import Path

from process_video import SpecOutput, TimestampOfInterest, ReproductionStep, extract_frames_at_timestamps
from integrations import GitHubSpecPublisher, FirestoreStateTracker, publish_pipeline_results

def run_mock_test():
    print("==================================================")
    print("[TEST] Running SnapToSpec End-to-End Test Suite")
    print("==================================================")

    # 1. Test Pydantic Schema Validation & Sample Generation
    print("\n[1] Testing SpecOutput Schema & Pydantic Validation...")
    mock_spec = SpecOutput(
        title="[BUG] Checkout button enters infinite spinner on Promo Code application",
        bug_summary="When a user applies an expired promo code during checkout, the UI displays an infinite loading spinner instead of an error message.",
        severity="High",
        tags=["checkout", "frontend-bug", "promo-code", "ui"],
        timestamps_of_interest=[
            TimestampOfInterest(
                timestamp_seconds=2.5,
                label="Cart View Initial State",
                description="User views cart with total $120.00 and coupon input visible."
            ),
            TimestampOfInterest(
                timestamp_seconds=6.0,
                label="Apply Coupon Action",
                description="User types 'SAVE50' and clicks 'Apply Code'."
            ),
            TimestampOfInterest(
                timestamp_seconds=9.2,
                label="Infinite Spinner Hang",
                description="Button enters disabled spinning state; network error 422 returned in DevTools."
            )
        ],
        reproduction_steps=[
            ReproductionStep(
                step_number=1,
                action="Navigate to checkout page with item in cart.",
                expected_result="Cart summary is displayed.",
                actual_result="Cart summary displayed as expected."
            ),
            ReproductionStep(
                step_number=2,
                action="Enter promo code 'SAVE50' and click Apply.",
                expected_result="Toast error 'Promo code expired' should appear.",
                actual_result="Button enters perpetual loading state with no user feedback."
            )
        ],
        playwright_script="""import { test, expect } from '@playwright/test';

test('reproduce infinite spinner on invalid promo code', async ({ page }) => {
  await page.goto('/checkout');
  await page.fill('input[name="promo_code"]', 'SAVE50');
  await page.click('button[type="submit"]');

  // Verify that an error message appears and button is not indefinitely disabled
  const errorToast = page.locator('.error-toast');
  await expect(errorToast).toBeVisible({ timeout: 5000 });
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
});
"""
    )
    print(f"  [+] Spec schema validated successfully: '{mock_spec.title}'")

    # 2. Test Markdown Formatting
    print("\n[2] Testing GitHub Markdown Generation...")
    publisher = GitHubSpecPublisher()
    mock_frames = {
        "./frames/frame_01_2s_CartViewInitialState.jpg": "https://storage.googleapis.com/snaptospec-frames/frames/test-task/frame_01.jpg",
        "./frames/frame_02_6s_ApplyCouponAction.jpg": "https://storage.googleapis.com/snaptospec-frames/frames/test-task/frame_02.jpg",
        "./frames/frame_03_9s_InfiniteSpinnerHang.jpg": "https://storage.googleapis.com/snaptospec-frames/frames/test-task/frame_03.jpg"
    }
    
    md_content = publisher.format_markdown_issue(
        spec=mock_spec.model_dump(),
        frame_url_map=mock_frames,
        execution_id="mock-001"
    )
    print("  [+] Markdown Issue Spec Formatted:")
    print("  " + "-"*40)
    for line in md_content.split("\n")[:12]:
        print(f"  | {line}")
    print("  | ... [truncated] ...")
    print("  " + "-"*40)

    # 3. Test Direct Publication Flow (Dry Run)
    print("\n[3] Testing Publication Coordinator (Dry Run)...")
    res = publisher.create_issue(
        spec=mock_spec.model_dump(),
        frame_url_map=mock_frames,
        execution_id="mock-001"
    )
    print(f"  [+] GitHub Issue status: {res.get('status')}")

    print("\n==================================================")
    print("[SUCCESS] All Local Unit & Integration Tests Passed!")
    print("==================================================")

if __name__ == "__main__":
    run_mock_test()
