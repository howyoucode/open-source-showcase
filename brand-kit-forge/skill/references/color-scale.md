# Color scale algorithm

Use the base hex as the 500 step. Convert the color to HSL. Build the upper half of the scale by decreasing lightness and slightly reducing saturation. Use these lightness targets:

| Step | Lightness |
|---|---:|
| 50 | 97% |
| 100 | 93% |
| 200 | 86% |
| 300 | 76% |
| 400 | 65% |
| 500 | Base |
| 600 | 43% |
| 700 | 35% |
| 800 | 27% |
| 900 | 18% |

Keep the hue stable. Preserve moderate saturation where possible, but lower saturation in pale 50–400 steps so the upper palette remains readable and restrained.
