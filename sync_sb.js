import fs from 'fs';
import path from 'path';

const htmls = ['analytics.html', 'dashboard.html', 'flood.html', 'insurance.html', 'map.html', 'marketplace.html', 'prediction.html', 'profile.html', 'soil-testing.html'];
const sidebarContent = `
                <a href="/dashboard.html" data-route="/dashboard.html">📊 Dashboard</a>
                <a href="/prediction.html" data-route="/prediction.html">🌱 AI Crop Prediction</a>
                <a href="/marketplace.html" data-route="/marketplace.html">🛒 Marketplace <small style="color:#00F0FF;font-size:0.6rem;font-weight:bold;">(NEW)</small></a>
                <a href="/map.html" data-route="/map.html">📍 Live GPS Tracker</a>
                <a href="/soil-testing.html" data-route="/soil-testing.html">🧪 Soil Testing</a>
                <a href="/flood.html" data-route="/flood.html">🌊 Flood Analysis</a>
                <a href="/dashboard.html#satellite-scan" data-route="/dashboard.html#satellite-scan">🛰️ Satellite Scan</a>
                <a href="/insurance.html" data-route="/insurance.html">🛡️ Crop Insurance <small style="color:#00F0FF;font-size:0.6rem;font-weight:bold;">(NEW)</small></a>
                <a href="/profile.html" data-route="/profile.html">👤 Profile</a>
                <a href="/analytics.html" data-route="/analytics.html">📈 Analytics</a>
                <div style="flex:1"></div>
                <a href="#" onclick="logout(); return false;" style="color:var(--muted)">🚪 Logout</a>
            `;

for (const file of htmls) {
    const pt = path.join(process.cwd(), 'public', file);
    let html = fs.readFileSync(pt, 'utf-8');
    
    const startIdx = html.indexOf('<nav class="sidebar-nav">');
    const endIdx = html.indexOf('</nav>', startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        let cleanSidebar = sidebarContent;
        // Inject class="active"
        cleanSidebar = cleanSidebar.replace('data-route="/' + file + '"', 'class="active"');
        // Clean up remaining hooks
        cleanSidebar = cleanSidebar.replace(/ data-route="[^"]+"/g, '');
        
        const newHtml = html.substring(0, startIdx + 25) + cleanSidebar + html.substring(endIdx);
        fs.writeFileSync(pt, newHtml, 'utf-8');
        console.log("Updated", file);
    }
}
