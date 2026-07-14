"""Fix remaining hardcoded brand colors across scattered files"""
import re, os

# Files to fix with their specific patterns
fixes = {
    'src/lib/store-context.tsx': [
        ('"#45CCD5"', 'C.teal'),
    ],
    'src/lib/share-to-wechat.ts': [
        ('#45CCD5', 'C.teal'),
    ],
    'src/app/[store]/page.tsx': [
        ('"#45CCD5"', 'C.teal'),
    ],
    'src/app/[store]/layout.tsx': [
        ('"#45CCD5"', 'C.teal'),
    ],
    'src/app/scan/page.tsx': [
        ('rgba(69,204,213,0.6)', ''),
    ],
    'src/app/favorites/page.tsx': [
        ('rgba(69,204,213,0.15)', ''),
    ],
}

for path, patterns in fixes.items():
    full = os.path.join(os.path.dirname(__file__), path)
    if not os.path.exists(full):
        print(f'⚠️  Skip (not found): {path}')
        continue
    
    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add import if applicable
    if path.endswith('.tsx') and 'import { C }' not in content:
        content = content.replace(
            'import { useState, useEffect } from "react";',
            'import { useState, useEffect } from "react";\nimport { C } from "@/lib/brand-colors";'
        )
    
    for old, new_val in patterns:
        content = content.replace(old, new_val)
    
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'✅ Fixed: {path}')

print('Done!')
