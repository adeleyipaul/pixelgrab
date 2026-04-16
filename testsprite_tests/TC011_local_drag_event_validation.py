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
        await expect(dropzone).to_be_visible()
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
        await expect(page.locator("[data-testid='dropzone-prompt']")).to_contain_text("Release to extract palette")
        await expect(page.locator("[data-testid='drag-active-indicator']")).to_be_attached()

        await dropzone.dispatch_event("dragleave", {"dataTransfer": data_transfer})
        await expect(dropzone).to_have_attribute("data-drag-active", "false")
        await expect(page.locator("[data-testid='dropzone-prompt']")).to_contain_text("Drop an image or click to browse")

        await dropzone.dispatch_event("dragenter", {"dataTransfer": data_transfer})
        await expect(dropzone).to_have_attribute("data-drag-active", "true")
        drop_transfer = await page.evaluate_handle("() => new DataTransfer()")
        await dropzone.dispatch_event("drop", {"dataTransfer": drop_transfer})
        await expect(dropzone).to_have_attribute("data-drag-active", "false")

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()


asyncio.run(run_test())
