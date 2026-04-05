import fs from 'fs';
import path from 'path';

const htmls = ['analytics.html', 'dashboard.html', 'insurance.html', 'map.html', 'marketplace.html', 'prediction.html', 'profile.html', 'soil-testing.html'];
const cssLink = `    <link rel="stylesheet" href="/css/flood.css">\n`;
const widgetHtml = `
            <!-- Global Flood Risk & Causes Module -->
            <div class="flood-widget-container">
                <div class="water-wave water-wave-back"></div>
                <div class="water-wave"></div>
                <div class="flood-widget-content">
                    <h2 class="widget-header" style="color:white; text-shadow: 0 2px 4px rgba(0,0,0,0.5); margin: 0; display:flex; align-items:center; gap:0.5rem;"><span style="font-size:1.5rem">🌊</span> Flood Risk & Causes</h2>
                    <p style="color: rgba(255,255,255,0.8); font-size: 0.85rem; margin-top: 0.2rem;">Live topographical moisture analysis</p>
                    
                    <div class="flood-indicators">
                        <div class="flood-item">
                            <span>Rainfall (7 Days)</span>
                            <strong>142mm</strong>
                        </div>
                        <div class="flood-item">
                            <span>Soil Saturation</span>
                            <strong style="color: #fca5a5;">92%</strong>
                        </div>
                        <div class="flood-item">
                            <span>Drainage Factor</span>
                            <strong>Poor</strong>
                        </div>
                    </div>
                    
                    <div class="flood-recommendation">
                        <span style="font-size: 1.2rem;">⚠️</span>
                        <span><strong>Warning:</strong> High risk of root-rot and waterlogging. Recommendation: Clear field drainage trenches immediately and suspend irrigation.</span>
                    </div>
                </div>
            </div>
`;

for (const file of htmls) {
    const pt = path.join(process.cwd(), 'public', file);
    if (!fs.existsSync(pt)) continue;
    let html = fs.readFileSync(pt, 'utf-8');
    let updated = false;

    // Add CSS into head if not exists
    if (!html.includes('flood.css')) {
        html = html.replace('</head>', cssLink + '</head>');
        updated = true;
    }
    
    // Add Widget right after <header class="page-header"> block
    if (!html.includes('Flood Risk & Causes')) {
        const headerMatch = html.match(/<header class="page-header">[\s\S]*?<\/header>/);
        if (headerMatch) {
            const injectionPoint = headerMatch.index + headerMatch[0].length;
            html = html.substring(0, injectionPoint) + widgetHtml + html.substring(injectionPoint);
            updated = true;
        } else {
             // fallback to after <main>
             const mainMatch = html.match(/<main[^>]*>/);
             if (mainMatch) {
                 const injectionPoint = mainMatch.index + mainMatch[0].length;
                 html = html.substring(0, injectionPoint) + widgetHtml + html.substring(injectionPoint);
                 updated = true;
             }
        }
    }
    
    if (updated) {
        fs.writeFileSync(pt, html, 'utf-8');
        console.log("Injected Flood Widget to:", file);
    }
}
