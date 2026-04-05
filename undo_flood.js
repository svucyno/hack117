import fs from 'fs';
import path from 'path';

const htmls = ['analytics.html', 'dashboard.html', 'insurance.html', 'map.html', 'marketplace.html', 'prediction.html', 'profile.html', 'soil-testing.html'];

for (const file of htmls) {
    const pt = path.join(process.cwd(), 'public', file);
    if (!fs.existsSync(pt)) continue;
    let html = fs.readFileSync(pt, 'utf-8');
    
    let updated = false;

    // Regex out the flood widget container block precisely
    const widgetRegex = /<!-- Global Flood Risk & Causes Module -->[\s\S]*?<div class="flood-recommendation">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\n?/;
    if (widgetRegex.test(html)) {
        html = html.replace(widgetRegex, '');
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(pt, html, 'utf-8');
        console.log("Removed from:", file);
    }
}
