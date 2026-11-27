# Typst Typesetting

Write Typst directly in your documents and preview the typeset output immediately—ideal for formulas, tables, and finely formatted layouts. No separate Typst installation is required, and saved results can be published to your blog.

## Getting Started

1. Install **Typst Typesetting** from the **Plugin Center**, turn it on under the **Installed** tab on the Plugins page, and click **Restart now** in the top banner. It is ready to use after restarting.
2. Choose **Typst** from the document insert menu.
3. Write your content; once typesetting succeeds, the rendered result is saved along with the document.

You can also ask the AI assistant to write Typst for you.

## Local Typesetting & Offline Use

Typesetting runs locally inside Tau with no extra software to install. On first use, Tau downloads the typesetting components and default fonts (about 32 MiB) and caches them on your device so you can keep typesetting offline afterward. Download and typesetting progress appear right inside the Typst block.

## FAQ

**Why does my blog show raw code instead of the typeset output?** Your blog displays the last typeset output saved in Tau. Return to Tau, edit the Typst block so it refreshes, save, and publish again—simply opening the document does not update the output used by your blog. If the issue persists, update your blog template and republish.

**Download failed on the first run?** Check your internet connection and try again. Primary and fallback download mirrors switch automatically if one is unavailable, and already downloaded parts do not need to be downloaded again.

**Can I export to PDF?** No. This plugin focuses on previewing typeset output in documents and publishing saved results to your blog.

**Will disabling the plugin delete my content?** No. Your content remains saved in the document and will display normally once you re-enable the plugin.

**Does it work on mobile?** Yes. Once you install and enable **Typst Typesetting** on mobile, you can edit and preview blocks there too. The browser extension does not render Typst blocks, though your document content stays safe.

## Notes

- Enabling, disabling, or upgrading this plugin requires restarting Tau to take effect. The Plugins page will prompt you with **Restart now**.

## Third-Party Components and Licenses

The typesetting engine and fonts are downloaded from public CDNs on first use and are not bundled inside the plugin package:

- typst.ts (compiler and renderer wasm, 0.6.1-rc3, based on Typst): Apache License 2.0
- Libertinus Serif: SIL Open Font License 1.1
- New Computer Modern / New CM Math: SIL Open Font License 1.1
- DejaVu Sans Mono: free license derived from the Bitstream Vera license
