// Tab Switching Logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Ensure auth token is present (Supports both MVP LocalStorage and Firebase)
async function fetchWithAuth(url, options = {}) {
    const userStr = localStorage.getItem('agri_current_user');
    
    // MVP Mock Auth check
    if (userStr) {
        const user = JSON.parse(userStr);
        const headers = {
            'Content-Type': 'application/json',
            'x-user-id': user.id
        };
        return fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    }

    // Firebase check
    if (!window.currentUser && !userStr) {
        alert("Please login first.");
        return null;
    }

    const token = await window.currentUser.getIdToken();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    return fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
}

// 1. CROPS MODULE
async function loadCrops() {
    try {
        const res = await fetch('/api/marketplace/crops');
        if(!res.ok) throw new Error("Failed");
        const data = await res.json();
        const container = document.getElementById('crop-listings');
        container.innerHTML = '';
        data.forEach(item => {
            container.innerHTML += `
                <div class="listing-card">
                    <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                        <span style="font-size:1.5rem;">${window.MarketData?.CROP_EMOJIS[item.cropName] || '🌾'}</span>
                        <span class="price-badge">₹${item.pricePerUnit} / ${item.unit}</span>
                    </div>
                    <h3 style="margin-bottom:0.5rem;">${item.cropName}</h3>
                    <p style="color:var(--muted); font-size:0.9rem; margin-bottom:1rem;">📍 ${item.district}, ${item.state}</p>
                    <div style="background:rgba(0,0,0,0.05); padding:0.5rem; border-radius:4px; font-size:0.85rem;">
                        <strong>Qty:</strong> ${item.quantity} ${item.unit} <br>
                        <strong>Seller:</strong> ${item.sellerName}
                    </div>
                    <a href="tel:${item.phone}" class="phone-btn">📞 Call Seller</a>
                </div>
            `;
        });
        if(data.length === 0) container.innerHTML = '<p>No crops listed yet.</p>';
    } catch(e) {
        console.error(e);
    }
}

document.getElementById('form-crop').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        cropName: document.getElementById('c-name').value,
        category: 'grains', // hardcoded default for MVP
        quantity: parseFloat(document.getElementById('c-qty').value),
        unit: document.getElementById('c-unit').value,
        pricePerUnit: parseFloat(document.getElementById('c-price').value),
        state: document.getElementById('c-state').value,
        district: document.getElementById('c-district').value,
        location: `${document.getElementById('c-district').value}, India`,
        sellerName: document.getElementById('c-caller').value,
        phone: document.getElementById('c-phone').value,
        notes: ""
    };
    const res = await fetchWithAuth('/api/marketplace/crops', { method: 'POST', body: JSON.stringify(payload) });
    if(res && res.ok) {
        alert("Listing published successfully!");
        e.target.reset();
        loadCrops();
    }
});

// 2. AGRI TOOLS MODULE
async function loadTools() {
    try {
        const res = await fetch('/api/marketplace/tools');
        if(!res.ok) throw new Error();
        const data = await res.json();
        const container = document.getElementById('tool-listings');
        container.innerHTML = '';
        data.forEach(item => {
            container.innerHTML += `
                <div class="listing-card">
                    <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                        <span style="font-size:1.5rem;">🚜</span>
                        <span class="price-badge">${item.rentPricePerDay > 0 ? `₹${item.rentPricePerDay}/day rent` : `₹${item.salePrice} Buy`}</span>
                    </div>
                    <h3 style="margin-bottom:0.5rem;">${item.toolName}</h3>
                    <p style="color:var(--muted); font-size:0.9rem; margin-bottom:1rem;">📍 ${item.district}, ${item.state}</p>
                    <div style="background:rgba(0,0,0,0.05); padding:0.5rem; border-radius:4px; font-size:0.85rem;">
                        <strong>Type:</strong> ${item.category} <br>
                        <strong>Owner:</strong> ${item.ownerName}
                    </div>
                    <a href="tel:${item.phone}" class="phone-btn">📞 Contact Owner</a>
                </div>
            `;
        });
        if(data.length === 0) container.innerHTML = '<p>No tools listed yet.</p>';
    } catch(e) {}
}

document.getElementById('form-tool').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        toolName: document.getElementById('t-name').value,
        category: document.getElementById('t-cat').value,
        rentPricePerDay: parseFloat(document.getElementById('t-rent').value) || 0,
        salePrice: parseFloat(document.getElementById('t-sale').value) || 0,
        state: document.getElementById('t-state').value,
        district: document.getElementById('t-district').value,
        ownerName: document.getElementById('t-caller').value,
        phone: document.getElementById('t-phone').value,
        availability: "Available"
    };
    const res = await fetchWithAuth('/api/marketplace/tools', { method: 'POST', body: JSON.stringify(payload) });
    if(res && res.ok) {
        alert("Tool published!");
        e.target.reset();
        loadTools();
    }
});

// 3. ANIMAL MODULE
async function loadAnimals() {
    try {
        const res = await fetch('/api/marketplace/animals');
        if(!res.ok) throw new Error();
        const data = await res.json();
        const container = document.getElementById('animal-listings');
        container.innerHTML = '';
        data.forEach(item => {
            const animalEmoji = item.animalType === 'Cow' ? '🐄' : (item.animalType === 'Sheep' ? '🐑' : '🐐');
            container.innerHTML += `
                <div class="listing-card">
                    <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                        <span style="font-size:1.5rem;">${animalEmoji}</span>
                        <span class="price-badge">₹${item.price}</span>
                    </div>
                    <h3 style="margin-bottom:0.5rem;">${item.breed} ${item.animalType}</h3>
                    <p style="color:var(--muted); font-size:0.9rem; margin-bottom:1rem;">📍 ${item.district}, ${item.state}</p>
                    <div style="background:rgba(0,0,0,0.05); padding:0.5rem; border-radius:4px; font-size:0.85rem;">
                        <strong>Age:</strong> ${item.age} <br>
                        <strong>Health:</strong> ${item.healthStatus} ${item.vaccinated ? '(Vaccinated)' : ''}<br>
                        <strong>Seller:</strong> ${item.sellerName}
                    </div>
                    <a href="tel:${item.phone}" class="phone-btn">📞 Contact Seller</a>
                </div>
            `;
        });
        if(data.length === 0) container.innerHTML = '<p>No livestock listed yet.</p>';
    } catch(e) {}
}

document.getElementById('form-animal').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        animalType: document.getElementById('a-type').value,
        breed: document.getElementById('a-breed').value,
        age: document.getElementById('a-age').value,
        price: parseFloat(document.getElementById('a-price').value),
        healthStatus: "Healthy",
        vaccinated: true,
        state: document.getElementById('a-state').value,
        district: document.getElementById('a-district').value,
        sellerName: document.getElementById('a-caller').value,
        phone: document.getElementById('a-phone').value
    };
    const res = await fetchWithAuth('/api/marketplace/animals', { method: 'POST', body: JSON.stringify(payload) });
    if(res && res.ok) {
        alert("Livestock published!");
        e.target.reset();
        loadAnimals();
    }
});

// Market Prices Fetcher
window.fetchMandiPrices = async function() {
    const crop = document.getElementById('mandi-crop-select').value;
    const container = document.getElementById('mandi-results');
    container.innerHTML = 'Loading real-time prices...';
    try {
        const response = await fetch(`/api/market-prices/realtime?crop=${crop}`);
        if(response.ok) {
            const data = await response.json();
            container.innerHTML = '';
            if(data.length === 0) {
                container.innerHTML = '<p>No recent data found for this crop.</p>';
                return;
            }
            data.forEach(item => {
                container.innerHTML += `
                    <div style="background: rgba(255,255,255,0.7); padding: 0.8rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                        <strong>${item.market}, ${item.state}</strong><br>
                        Modal: <span style="color:var(--green-mid); font-weight:bold;">₹${item.modal_price}</span> / quintal<br>
                        <span style="font-size:0.8rem; color:var(--muted)">Range: ₹${item.min_price} - ₹${item.max_price}</span>
                    </div>
                `;
            });
        } else {
             const err = await response.json();
             container.innerHTML = '<p style="color:red">Failed to fetch API: ' + (err.error || 'Server error') + '</p>';
        }
    } catch(err) {
        container.innerHTML = '<p style="color:red">Failed to connect to backend router.</p>';
    }
}

// Init all
document.addEventListener('DOMContentLoaded', () => {
    // Wait slightly for auth to initialize before fetching guarded routes if needed
    setTimeout(() => {
        loadCrops();
        loadTools();
        loadAnimals();
        window.fetchMandiPrices();
    }, 1000);
});
