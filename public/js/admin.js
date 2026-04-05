document.addEventListener('DOMContentLoaded', () => {
    
    // API Configuration Logic
    const adminSettingsForm = document.getElementById('admin-settings-form');
    const adminGeminiInput = document.getElementById('admin_gemini_key');
    const adminWeatherInput = document.getElementById('admin_weather_key');
    const adminGovInput = document.getElementById('admin_gov_key');
    const adminSaveStatus = document.getElementById('admin-save-status');

    if (adminSettingsForm) {
        // Fetch global keys from backend
        fetch('/api/settings/keys').then(res => res.json()).then(data => {
            if (adminGeminiInput) adminGeminiInput.value = data.gemini || '';
            if (adminWeatherInput) adminWeatherInput.value = data.weather || '';
            if (adminGovInput) adminGovInput.value = data.govApi || '';
        });
        
        adminSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const keys = {
                gemini: adminGeminiInput ? adminGeminiInput.value.trim() : '',
                weather: adminWeatherInput ? adminWeatherInput.value.trim() : '',
                govApi: adminGovInput ? adminGovInput.value.trim() : ''
            };
            await fetch('/api/settings/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(keys)
            });
            adminSaveStatus.style.display = 'inline';
            setTimeout(() => adminSaveStatus.style.display = 'none', 3000);
        });
    }

    const usersTable = document.getElementById('users-table').querySelector('tbody');
    const predictionsTable = document.getElementById('predictions-table').querySelector('tbody');

    async function loadAdminData() {
        const userStr = localStorage.getItem('agri_current_user');
        const adminId = userStr ? JSON.parse(userStr).id : '';

        // Load Users
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'x-user-id': adminId }
            });
            
            if (res.ok) {
                const users = await res.json();
                usersTable.innerHTML = '';
                
                users.forEach(u => {
                    let badgeClass = 'farmer';
                    if(u.role === 'admin') badgeClass = 'admin';
                    if(u.role === 'guider') badgeClass = 'guider';
                    
                    const roleBadge = `<span class="badge ${badgeClass}">${u.role}</span>`;
                    const dateObj = new Date(u.createdAt);
                    const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();

                    usersTable.innerHTML += `
                        <tr>
                            <td style="font-family:monospace; color:gray;">${u.id.substring(0,8)}...</td>
                            <td><strong>${u.firstName} ${u.lastName}</strong></td>
                            <td>${u.email}</td>
                            <td>${roleBadge}</td>
                            <td style="color:gray; font-size:0.8rem;">${formattedDate}</td>
                        </tr>
                    `;
                });
            } else {
                usersTable.innerHTML = '<tr><td colspan="5" style="color:red;text-align:center;">Unauthorized or Failed to load</td></tr>';
            }
        } catch(e) {
            usersTable.innerHTML = '<tr><td colspan="5" style="color:red;text-align:center;">Network error</td></tr>';
        }

        // Load Predictions
        try {
            const res = await fetch('/api/admin/predictions', {
                headers: { 'x-user-id': adminId }
            });
            
            if (res.ok) {
                const predictions = await res.json();
                predictionsTable.innerHTML = '';
                
                if(predictions.length === 0) {
                    predictionsTable.innerHTML = '<tr><td colspan="5" style="text-align:center; opacity:0.5;">No predictions recorded yet.</td></tr>';
                }

                predictions.forEach(p => {
                    predictionsTable.innerHTML += `
                        <tr>
                            <td style="font-family:monospace; color:gray;">${p.id.substring(0,8)}...</td>
                            <td style="font-family:monospace;">${p.userId.substring(0,8)}...</td>
                            <td><strong>${p.cropType || 'Unknown'}</strong></td>
                            <td style="color:var(--primary); font-weight:bold;">${p.predictedYield} t/ha</td>
                            <td>${p.confidence}%</td>
                        </tr>
                    `;
                });
            } else {
                predictionsTable.innerHTML = '<tr><td colspan="5" style="color:red;text-align:center;">Unauthorized or Failed to load</td></tr>';
            }
        } catch(e) {
             predictionsTable.innerHTML = '<tr><td colspan="5" style="color:red;text-align:center;">Network error</td></tr>';
        }
    }

    loadAdminData();
});
