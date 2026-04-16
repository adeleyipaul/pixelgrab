# Round 4 TestSprite Triage

## Source Files Reviewed

- `testsprite_tests/round4-terminal-execution.log`
- `testsprite_tests/tmp/raw_report.md`
- `testsprite_tests/tmp/test_results.json`
- Generated test files `testsprite_tests/TC001_*.py` through `testsprite_tests/TC015_*.py`

## Round 4 Result Snapshot

- Total tests: 15
- Passed: 2
- Failed: 4
- Blocked: 9

Passed:
- TC009 Open palette tool from landing page
- TC013 Open palette tool from alternate landing CTA

## Hang Diagnosis

The TestSprite execution command did not hang during test execution. The log shows:

- `Test execution completed.`
- `Execution lock released.`
- `Server will remain active for 1 hour. Press Ctrl+C to exit early.`

Root cause: the TestSprite MCP terminal process intentionally keeps the local tunnel/server alive for one hour after execution finishes. That makes a normal blocking shell command look stuck even when the tests are done.

Safer execution approach added:
- `scripts/run-testsprite-execution.mjs`
- `scripts/run-testsprite-execution.ps1`

The safer runner starts the TestSprite execution, watches the log for `Test execution completed` or `Execution lock released`, then stops the process tree so the command returns instead of waiting for the one-hour keepalive.

Additional recovery notes:
- The first PowerShell-only watchdog returned too early and left child processes behind, so it was replaced with a Node-based runner that owns the TestSprite child process and kills the process tree after completion markers.
- An interrupted Round 5 attempt left `testsprite_tests/tmp/execution.lock` pointing to PID `21500`. That PID was no longer running, so the stale lock was removed before retrying.
- The final targeted Round 5 retry reached TestSprite but stopped before execution with a TestSprite `403` insufficient-credits response.

## Per-Test Triage

| Test | Round 4 Status | Bucket | Root Cause | Action |
|---|---:|---|---|---|
| TC001 Upload valid image via file picker and start extraction | BLOCKED | environment/setup issue | TestSprite runner could not provide a file path or accepted in-memory file payload. App upload input was present. | Replace for Round 5 with sample-image extraction smoke plus upload-control accessibility. Keep real file-picker upload as manual/TestSprite fixture follow-up. |
| TC002 Extract and display source image with swatch grid | FAILED | environment/setup issue | Upload attempts did not attach a real image, so extraction never started. No evidence of an app extraction bug. | Replace with `Try sample image` flow that exercises the real extraction pipeline without external fixture upload. |
| TC003 Copy a single color value from the extracted palette | BLOCKED | environment/setup issue | Could not reach extracted palette because TestSprite could not upload a file. | Rewrite to load bundled sample image, wait for swatches, click first swatch, assert copy toast. |
| TC004 Copy all displayed palette values at once | FAILED | environment/setup issue | Test tried copy-all after failed upload setup; palette UI never appeared. | Rewrite to load bundled sample image, wait for palette, click Copy All, assert success feedback. |
| TC005 Switch palette output format to RGB after extracting colors | BLOCKED | environment/setup issue | Format controls require extracted palette; upload was blocked. | Rewrite to load bundled sample image, switch to RGB, assert RGB-formatted swatch values. |
| TC006 Reset to upload state with Upload new image | BLOCKED | environment/setup issue | Reset requires a completed extraction state, which upload block prevented. | Rewrite to load sample image, wait for palette, click `upload-new-image`, assert dropzone returns and swatches disappear. |
| TC007 Open Export CSS modal and copy CSS variables snippet | BLOCKED | environment/setup issue | Export actions require extracted palette; upload was blocked. | Rewrite to load sample image, open CSS export, copy snippet, close modal. |
| TC008 Open Export JSON modal, copy snippet, and download JSON file | BLOCKED | environment/setup issue | Export actions require extracted palette; upload was blocked. | Rewrite to load sample image, open JSON export, copy/download from modal. |
| TC010 Copy All reflects the currently selected output format | BLOCKED | environment/setup issue | Could not reach palette state before copy. | Rewrite to load sample image, switch to HSL or RGB, click Copy All, assert format-specific success feedback. |
| TC011 Drag-and-drop upload shows drag-active only while dragging | BLOCKED | flaky/timeout issue | Drag/drop with a file cannot be simulated reliably in this TestSprite runner without a supported file attachment mechanism. | Replace with stable upload-area accessibility and guidance checks. Keep full drag/drop as manual follow-up or rerun when TestSprite supports file fixtures. |
| TC012 Open Export Tailwind modal and copy Tailwind config snippet | FAILED | environment/setup issue | Upload did not trigger extraction; export controls were unreachable. | Rewrite to load sample image, open Tailwind export, copy snippet, close modal. |
| TC014 Switch from RGB to HSL without re-uploading and keep the palette visible | BLOCKED | environment/setup issue | Format switching requires extracted palette; upload was blocked. | Rewrite to load sample image, switch RGB then HSL, assert palette remains visible with HSL values. |
| TC015 Show error state for corrupted image | FAILED | environment/setup issue, with product fix already applied | TestSprite could not provide corrupted file bytes. The app has been updated to show `The image could not be processed. Please try another image.` on image load failure. | Rewrite only if the runner can use browser-side `DataTransfer` injection; otherwise mark as manual follow-up because TestSprite cannot supply the corrupted file. |

## Product Changes Applied For Recovery

- Added a bundled sample image at `public/samples/palette-sample.png`.
- Added `Try sample image` action with `data-testid="sample-image-button"` to exercise the real palette extraction flow without TestSprite file upload.
- Added `data-testid="image-dropzone"` and `data-testid="dropzone-error"` to the upload component.
- Added `data-testid="upload-new-image"`, `data-testid="palette-error"`, `data-testid="export-modal-copy"`, `data-testid="export-modal-download"`, and `data-testid="export-modal-close"`.
- Kept the existing corrupted-image error handling from the earlier recovery pass.

## Round 5 Strategy

Do not rerun the known-invalid file-path upload tests unchanged.

Round 5 should run a targeted replacement suite that validates:

- bundled sample image extraction
- source image display and palette swatches
- single-color copy
- Copy All
- RGB/HSL format switching
- reset to upload state
- CSS/JSON/Tailwind export modals
- upload empty-state guidance and accessible input/dropzone
- landing CTA navigation on desktop/mobile

Manual or future TestSprite follow-up remains needed for:

- true OS file picker upload
- drag/drop with an attached file
- unsupported file rejection
- oversized image rejection
- corrupted image upload verification

Those require a TestSprite-supported file attachment mechanism or a runner that can execute browser-side file injection reliably.
