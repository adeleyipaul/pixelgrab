# Round 5 Targeted Recovery Summary

## Scope

Round 5 was a targeted recovery pass, not a fresh full-regeneration loop.

Inputs:
- `testsprite_tests/round4-triage.md`
- `testsprite_tests/round5-refined-test-plan.json`
- `testsprite_tests/mcp_args/round5-execute.json`

Selected TestSprite IDs:
- TC001, TC002, TC003, TC004, TC005, TC006, TC007, TC008, TC010, TC011, TC012, TC014

Excluded from automated Round 5:
- TC015 corrupted-image upload, unsupported-file rejection, oversized-file rejection, and full drag/drop upload with a file. Round 4 proved the TestSprite runner could not provide file bytes or usable file paths for those flows.

## Product Changes Made

Product fixes/improvements applied before Round 5:

- Added bundled sample image: `public/samples/palette-sample.png`
- Added `Try sample image` action on `/palette` using `data-testid="sample-image-button"`
- Added stable selectors for the recovery suite:
  - `image-dropzone`
  - `dropzone-error`
  - `upload-new-image`
  - `palette-error`
  - `export-modal-copy`
  - `export-modal-download`
  - `export-modal-close`

Existing earlier recovery fixes kept:

- Corrupted image load failures now show: `The image could not be processed. Please try another image.`
- Upload input has `data-testid="image-upload-input"` and an accessible label.
- Palette controls and export actions have stable test IDs.
- Landing CTAs have stable test IDs.

## Failed Tests Fixed By Product Changes

- TC013 was fixed before Round 4 by stabilizing the alternate landing CTA. It now passes.
- TC015 has a product-side fix for corrupted image load errors, but TestSprite still cannot verify it without a supported file payload mechanism.

## Blocked Tests Solved By Setup Changes

No previously blocked file-upload tests were solved by TestSprite setup changes. Attempts used:

- repo fixture files
- `/tmp` fixture creation
- in-memory file-payload instructions
- targeted Round 5 replacement instructions

The TestSprite runner continued to reject file-based upload setup before the app could process the files.

## Tests Rewritten

Round 5 rewrote these upload-dependent tests to use the bundled sample image instead of TestSprite file uploads:

- TC002 source image and swatch grid
- TC003 single-color copy
- TC004 copy all colors
- TC005 RGB format switching
- TC006 reset to upload state
- TC007 CSS export
- TC008 JSON export
- TC010 Copy All with selected format
- TC012 Tailwind export
- TC014 RGB to HSL switching without re-upload

## Tests Replaced

- TC001 was replaced with a sample-image extraction smoke test plus upload-control accessibility checks.
- TC011 was replaced with upload empty-state/dropzone guidance checks because drag/drop with an attached file was not reliable in the TestSprite runner.
- TC015 remains a manual or future fixture-enabled TestSprite follow-up. It should be rewritten with a runner-supported file attachment mechanism when available.

Replacement plan:
- `testsprite_tests/round5-refined-test-plan.json`

Concrete rewritten test artifact:
- `testsprite_tests/round5_replacement_tests.py`

## Round 5 Execution Result

TestSprite MCP was invoked for Round 5:

- MCP request artifact: `testsprite_tests/mcp_args/round5-execute.json`
- MCP response artifact: `testsprite_tests/round5-generate-execute-response.json`
- Terminal log: `testsprite_tests/round5-terminal-execution.log`

Round 5 did not execute the targeted tests because TestSprite returned:

- `403`
- `You don't have enought credits.`

No new `raw_report.md` was produced for Round 5, and `testsprite_tests/tmp/test_results.json` remained the latest completed Round 4 result set.

Setup notes before the final Round 5 attempt:

- One early watchdog attempt returned before its TestSprite child process finished; this was fixed by replacing the watchdog with `scripts/run-testsprite-execution.mjs`.
- One retry reported `checkPortListening tcp timeout: 3000 localhost`; the app was checked immediately afterward and returned HTTP 200 on both `localhost:3000/palette` and `127.0.0.1:3000/palette`.
- A stale `testsprite_tests/tmp/execution.lock` from the interrupted attempt blocked the next run. The lock referenced PID `21500`, which was no longer running, so only that stale lock file was removed.
- The final retry reached TestSprite successfully and failed at account authorization/credits before test execution.

## Final Counts

Latest completed TestSprite execution with result JSON: Round 4.

- Total tests: 15
- Passed: 2
- Failed: 4
- Blocked: 9

Round 5 targeted execution:

- Executed by TestSprite: 0
- Passed: 0
- Failed: 0
- Blocked by account credits before execution: 12 selected targeted tests

## Hang Issue

The original command appeared to hang because TestSprite kept the local tunnel/server alive for one hour after test execution completed:

- `Test execution completed.`
- `Execution lock released.`
- `Server will remain active for 1 hour. Press Ctrl+C to exit early.`

Fix:

- Added `scripts/run-testsprite-execution.mjs`
- Updated `scripts/run-testsprite-execution.ps1` to call the Node watchdog
- The watchdog stops the TestSprite process after completion markers instead of waiting for the one-hour keepalive

Additional setup cleanup:

- A stale `testsprite_tests/tmp/execution.lock` from an interrupted run pointed to PID `21500`, which was no longer running.
- The stale lock was removed before the final Round 5 attempt.

## Manual Follow-Up

- Add TestSprite credits, then rerun the targeted Round 5 command.
- Keep using `scripts/run-testsprite-execution.ps1` or `scripts/run-testsprite-execution.mjs` so the command does not wait through the one-hour keepalive.
- Use the refined sample-image tests for palette/copy/export coverage.
- For true file upload, corrupted image, oversized image, unsupported file, and drag/drop file tests, use TestSprite dashboard/file-attachment support if available.
