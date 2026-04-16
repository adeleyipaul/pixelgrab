import os

import pytest
from playwright.async_api import Page, expect


BASE_URL = os.getenv("PIXEL_GRAB_URL", "http://localhost:3000")


async def open_palette(page: Page) -> None:
    await page.goto(f"{BASE_URL}/palette")
    await expect(page.get_by_test_id("image-dropzone")).to_be_visible()


async def load_sample_palette(page: Page) -> None:
    await open_palette(page)
    await page.get_by_test_id("sample-image-button").click()
    await expect(page.get_by_test_id("source-image")).to_be_visible(timeout=10000)
    await expect(page.get_by_test_id("palette-color-0")).to_be_visible(timeout=15000)


@pytest.mark.asyncio
async def test_sample_image_extracts_source_and_palette(page: Page) -> None:
    await load_sample_palette(page)
    assert await page.locator("[data-testid^='palette-color-']").count() > 0


@pytest.mark.asyncio
async def test_copy_single_color_from_sample_palette(page: Page) -> None:
    await load_sample_palette(page)
    await page.get_by_test_id("palette-color-0").click()
    await expect(page.get_by_text("Copied", exact=False)).to_be_visible()


@pytest.mark.asyncio
async def test_copy_all_colors_from_sample_palette(page: Page) -> None:
    await load_sample_palette(page)
    await page.get_by_test_id("copy-all-colors").click()
    await expect(page.get_by_text("Copied all", exact=False)).to_be_visible()


@pytest.mark.asyncio
async def test_switch_rgb_and_hsl_without_reupload(page: Page) -> None:
    await load_sample_palette(page)
    initial_count = await page.locator("[data-testid^='palette-color-']").count()
    await page.get_by_test_id("format-rgb").click()
    await expect(page.get_by_test_id("palette-results")).to_have_attribute("data-color-format", "rgb")
    await expect(page.get_by_test_id("format-rgb")).to_have_attribute("aria-pressed", "true")
    await expect(page.get_by_test_id("palette-color-0")).to_contain_text("rgb(")
    await page.get_by_test_id("format-hsl").click()
    await expect(page.get_by_test_id("palette-results")).to_have_attribute("data-color-format", "hsl")
    await expect(page.get_by_test_id("format-hsl")).to_have_attribute("aria-pressed", "true")
    await expect(page.get_by_test_id("palette-color-0")).to_contain_text("hsl(")
    assert await page.locator("[data-testid^='palette-color-']").count() == initial_count


@pytest.mark.asyncio
async def test_reset_sample_palette_to_upload_state(page: Page) -> None:
    await load_sample_palette(page)
    await page.get_by_test_id("upload-new-image").click()
    await expect(page.get_by_test_id("image-dropzone")).to_be_visible()
    assert await page.locator("[data-testid^='palette-color-']").count() == 0


@pytest.mark.asyncio
async def test_export_css_from_sample_palette(page: Page) -> None:
    await load_sample_palette(page)
    await page.get_by_test_id("export-css").click()
    await expect(page.get_by_text(":root", exact=False)).to_be_visible()
    await page.get_by_test_id("export-modal-copy").click()
    await expect(page.get_by_text("Snippet copied", exact=False)).to_be_visible()
    await page.get_by_test_id("export-modal-close").click()


@pytest.mark.asyncio
async def test_export_json_from_sample_palette(page: Page) -> None:
    await load_sample_palette(page)
    await page.get_by_test_id("export-json").click()
    await expect(page.get_by_text('"colors"', exact=False)).to_be_visible()
    await page.get_by_test_id("export-modal-copy").click()
    await expect(page.get_by_text("Snippet copied", exact=False)).to_be_visible()


@pytest.mark.asyncio
async def test_export_tailwind_from_sample_palette(page: Page) -> None:
    await load_sample_palette(page)
    await page.get_by_test_id("export-tailwind").click()
    await expect(page.get_by_test_id("export-modal")).to_be_visible()
    await expect(page.get_by_test_id("export-modal")).to_have_attribute("data-export-format", "Tailwind Config")
    await expect(page.get_by_test_id("export-modal-content")).to_contain_text("module.exports")
    await expect(page.get_by_test_id("export-modal-content")).to_contain_text("palette-1")
    await page.get_by_test_id("export-modal-copy").click()
    await expect(page.get_by_text("Snippet copied", exact=False)).to_be_visible()
    await page.get_by_test_id("export-modal-close").click()
    await expect(page.get_by_test_id("export-modal")).not_to_be_visible()


@pytest.mark.asyncio
async def test_upload_empty_state_guidance_and_accessibility(page: Page) -> None:
    await open_palette(page)
    upload_input = page.get_by_test_id("image-upload-input")
    await expect(upload_input).to_have_attribute("aria-label", "Upload image file")
    await expect(upload_input).to_have_attribute("accept", r".*image.*")
    await expect(page.get_by_text("Max 10 MB", exact=False)).to_be_visible()


@pytest.mark.asyncio
async def test_drag_active_state_toggles_with_browser_drag_events(page: Page) -> None:
    await open_palette(page)
    dropzone = page.get_by_test_id("image-dropzone")
    await expect(dropzone).to_have_attribute("data-drag-active", "false")
    data_transfer = await page.evaluate_handle(
        """() => {
            const dt = new DataTransfer();
            dt.items.add(new File(["pixelgrab"], "palette.png", { type: "image/png" }));
            return dt;
        }"""
    )

    await dropzone.dispatch_event("dragenter", {"dataTransfer": data_transfer})
    await dropzone.dispatch_event("dragover", {"dataTransfer": data_transfer})
    await expect(dropzone).to_have_attribute("data-drag-active", "true")
    await expect(page.get_by_test_id("dropzone-prompt")).to_contain_text("Release to extract palette")

    await dropzone.dispatch_event("dragleave", {"dataTransfer": data_transfer})
    await expect(dropzone).to_have_attribute("data-drag-active", "false")

    await dropzone.dispatch_event("dragenter", {"dataTransfer": data_transfer})
    await expect(dropzone).to_have_attribute("data-drag-active", "true")
    drop_transfer = await page.evaluate_handle("() => new DataTransfer()")
    await dropzone.dispatch_event("drop", {"dataTransfer": drop_transfer})
    await expect(dropzone).to_have_attribute("data-drag-active", "false")


@pytest.mark.asyncio
async def test_landing_ctas_navigate_to_palette(page: Page) -> None:
    await page.goto(BASE_URL)
    await page.get_by_test_id("primary-palette-cta").click()
    await expect(page).to_have_url(r".*/palette$")

    await page.goto(BASE_URL)
    await page.get_by_test_id("secondary-palette-cta").click()
    await expect(page).to_have_url(r".*/palette$")
