import asyncio
from playwright import async_api
from playwright.async_api import expect


async def run_test():
    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
            ],
        )
        context = await browser.new_context()
        context.set_default_timeout(8000)
        page = await context.new_page()

        await page.goto("http://localhost:3000/palette")
        dropzone = page.locator("[data-testid='image-dropzone']")
        prompt = page.locator("[data-testid='dropzone-prompt']")
        indicator = page.locator("[data-testid='drag-active-indicator']")

        await expect(dropzone).to_be_visible()
        await expect(dropzone).to_have_attribute("aria-label", "Image upload dropzone")
        await expect(dropzone).to_have_attribute("data-drag-active", "false")
        await expect(prompt).to_contain_text("Drop an image or click to browse")
        assert await indicator.count() == 0, "Drag-active indicator should not be present before dragging."

        await dropzone.hover()
        await expect(dropzone).to_have_attribute("data-drag-active", "false")
        await expect(prompt).to_contain_text("Drop an image or click to browse")
        assert await indicator.count() == 0, "Hover must not falsely activate drag-active state."

        await dropzone.focus()
        await expect(dropzone).to_have_attribute("data-drag-active", "false")
        await expect(prompt).to_contain_text("Drop an image or click to browse")
        assert await indicator.count() == 0, "Focus must not falsely activate drag-active state."

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
