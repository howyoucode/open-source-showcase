# WCAG 2.2 contrast rules

1. Convert sRGB channels to linear RGB using a threshold of 0.04045.
2. Calculate relative luminance:

`0.2126R + 0.7152G + 0.0722B`

3. Calculate contrast:

`(lighter + 0.05) / (darker + 0.05)`

4. Apply:
   - 7:1 — AAA
   - 4.5:1 — AA for normal text
   - 3:1 — AA for large text

For a failing pair, adjust the foreground lightness toward black or white based on the background luminance. Retest after each 1% lightness step. Do not change hue or saturation during this pass. If no text state reaches 4.5:1, use black or white and report the limitation.
