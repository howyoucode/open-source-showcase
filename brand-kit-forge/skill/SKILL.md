---
name: brand-kit-forge
description: Use when the user gives a brand brief and wants a complete identity system, production design tokens, typography, contrast-safe colors, voice rules, and brand guidelines.
---

# Brand Kit Forge

Turn a short brand brief into a deterministic, accessible brand identity system.

## Workflow

1. Capture the **brand name**, **industry**, **target market** (Europe, Dubai-GCC, Japan, or Global), 3 personality keywords, optional base hex color, and light/dark preference.
2. Create a stable seed by joining the brand name, industry, market, three personality words, base color, and mode with `|`. Use the seed for every deterministic variation.
3. Generate primary, secondary, accent, and neutral palettes as 50, 100, 200, 300, 400, 500, 600, 700, 800, and 900 values. Keep 500 as the supplied or generated base.
4. Derive semantic colors: success `#1F7A4C`, warning `#B7791F`, error `#B42318`, and info `#1D64B7`.
5. Check every meaningful text/background pair with WCAG 2.2 contrast. Target 4.5:1 for normal text and 3:1 for large text. Adjust only the failing foreground or background lightness until the target passes; record both original and final values.
6. Map the first personality keyword to a heading/body Google Font pair. Use 1.25 as the default modular ratio, or 1.2 or 1.333 when requested.
7. Produce the 4/8pt spacing scale, radii, shadows, and 3 tone-of-voice rules. Use Do/Don't examples that follow the selected personality words.
8. Return a complete kit:
   - human-readable color and typography summary
   - W3C DTCG JSON
   - CSS custom properties
   - Tailwind `theme.extend`
   - Figma Variables/Tokens Studio JSON
   - one-page brand guidelines
9. Preserve the brief in a shareable encoded JSON representation. Never call an API or introduce nondeterministic output.
10. Validate that every export has the requested structure and every generated text color passes the target contrast threshold.

## Expected outputs

- `brand-kit.json`
- `brand-kit.css`
- `tailwind.config.js`
- `brand-guidelines.html`
- `figma-variables.json`

## References

- [Color scale algorithm](references/color-scale.md)
- [WCAG contrast rules](references/contrast.md)
- [Font pairing table](references/font-pairs.md)

## Examples

- [North & Salt](examples/north-and-salt.json)
- [Sakura Transit](examples/sakura-transit.json)
