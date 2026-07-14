"""Fix hardcoded brand colors in NumberPickerArea.tsx"""
import re

path = 'src/app/lottery-sim/_components/NumberPickerArea.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'import { C }' not in content:
    content = content.replace(
        'import { useState, useRef } from "react";',
        'import { useState, useRef } from "react";\nimport { C, getBrandRGB } from "@/lib/brand-colors";'
    )

# Step 1: Replace pure hex color string literals in JS context
# #F27152 -> C.coral
content = re.sub(r"'#F27152'", 'C.coral', content)
content = re.sub(r"'#45CCD5'", 'C.teal', content)

# Step 2: Replace rgba() in JS string literals with template literals using getBrandRGB
# 'rgba(242,113,82,0.1)' -> `rgba(${getBrandRGB("coral").r},${getBrandRGB("coral").g},${getBrandRGB("coral").b},0.1)`
def replace_rgba(m):
    prefix = m.group(1)  # rgb values like "242,113,82"
    opacity = m.group(2)  # opacity like "0.1"
    # Determine which brand color based on the rgb values
    if prefix == "242,113,82":
        color_key = "coral"
    elif prefix == "69,204,213":
        color_key = "teal"
    else:
        return m.group(0)  # leave unchanged
    return '`rgba(${getBrandRGB("' + color_key + '").r},${getBrandRGB("' + color_key + '").g},${getBrandRGB("' + color_key + '").b},' + opacity + ')`'

content = re.sub(
    r"'rgba\((\d+,\d+,\d+),([\d.]+)\)'",
    replace_rgba,
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done! NumberPickerArea.tsx fixed.')
