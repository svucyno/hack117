/**
 * Unified Navigation System for AgriPredict
 * Centralizes sidebar links and role-based access.
 */

function initSidebar() {
    const sidebarNav = document.getElementById('sidebar-nav');
    if (!sidebarNav) return;

    const userStr = localStorage.getItem('agri_current_user');
    const user = userStr ? JSON.parse(userStr) : { role: 'farmer' };
    const currentPath = window.location.pathname;

    let links = [];

    // Role-Based links
    if (user.role === 'guider') {
        links = [
            { href: '/guider.html', text: '👨‍🌾 Farmer Issues', id: 'nav-guider' },
            { href: '/guider-test.html', text: '📝 Certification', id: 'nav-guider-test' },
            { href: '/profile.html', text: '👤 Profile', id: 'nav-profile' },
            { href: '/settings.html', text: '⚙️ Settings', id: 'nav-settings' }
        ];
    } else if (user.role === 'admin') {
        links = [
            { href: '/admin.html', text: '👑 Admin Panel', id: 'nav-admin' },
            { href: '/dashboard.html', text: '📊 User View', id: 'nav-dashboard' },
            { href: '/profile.html', text: '👤 Profile', id: 'nav-profile' },
            { href: '/settings.html', text: '⚙️ Settings', id: 'nav-settings' }
        ];
    } else {
        // Default Farmer role
        links = [
            { href: '/dashboard.html', text: '📊 Dashboard', id: 'nav-dashboard' },
            { href: '/prediction.html', text: '🌱 AI Crop Prediction', id: 'nav-prediction' },
            { href: '/marketplace.html', text: '🛒 Marketplace', id: 'nav-marketplace', badge: 'NEW' },
            { href: '/map.html', text: '📍 Live GPS Tracker', id: 'nav-map' },
            { href: '/soil-testing.html', text: '🧪 Soil Testing', id: 'nav-soil' },
            { href: '/analytics.html', text: '📈 Analytics', id: 'nav-analytics', badge: 'NEW' },
            { href: '/profile.html', text: '👤 Profile', id: 'nav-profile' },
            { href: '/settings.html', text: '⚙️ Settings', id: 'nav-settings' }
        ];
    }

    // Generate HTML
    let html = '';
    links.forEach(link => {
        // Handle path matching (e.g., /dashboard.html or /dashboard)
        const isActive = (currentPath === link.href || currentPath === link.href.replace('.html', '')) ? 'active' : '';
        const badge = link.badge ? `<small style="color:#00F0FF;font-size:0.6rem;font-weight:bold;margin-left:5px;">(${link.badge})</small>` : '';
        html += `<a href="${link.href}" class="${isActive}" id="${link.id}">${link.text}${badge}</a>`;
    });

    // Spacer block
    html += `<div style="flex:1"></div>`;

    // Static Bottom links
    html += `
        <a href="#" onclick="if(window.logout) window.logout(); else { localStorage.removeItem('agri_current_user'); window.location.href='/login.html'; } return false;" style="color:var(--muted)">🚪 Logout</a>
        <a href="/">🔙 Back to Home</a>
    `;

    sidebarNav.innerHTML = html;
}

// Run immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
} else {
    initSidebar();
}
