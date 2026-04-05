/**
 * Simple script to add interactivity to the dashboard (e.g. fetching real data or updating graphs)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Welcome Greeting
    const userStr = localStorage.getItem('agri_current_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const heading = document.getElementById('welcome-heading');
            if (heading && user.name) {
                heading.innerText = `Welcome back, ${user.name.split(' ')[0]}!`;
            }
        } catch (e) { }
    }

    // For now, we just add a small fade-in animation to the widgets
    const widgets = document.querySelectorAll('.glass-card');
    widgets.forEach((widget, index) => {
        widget.style.opacity = '0';
        widget.style.transform = 'translateY(20px)';
        widget.style.transition = 'all 0.5s ease';

        setTimeout(() => {
            widget.style.opacity = '1';
            widget.style.transform = 'translateY(0)';
        }, 100 * index);
    });

    // Initialize Yield Trend Chart
    const ctx = document.getElementById('yieldChart');
    if (ctx && window.Chart) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['2019', '2020', '2021', '2022', '2023', '2024 (Proj)'],
                datasets: [{
                    label: 'Wheat Yield (tons/ha)',
                    data: [3.2, 3.4, 3.1, 3.8, 4.1, 4.3],
                    borderColor: '#2E7D32',
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#66BB6A',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { family: 'Space Grotesk' },
                        bodyFont: { family: 'Space Grotesk' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
});

// IoT Soil Tester Sync Logic
function syncIoTData(btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '🔄 Syncing...';
    btn.disabled = true;

    // Simulate network delay to an ESP32 or backend
    setTimeout(() => {
        // Randomize mock data to simulate real-time sensor fluctuations
        const moisture = Math.floor(Math.random() * (45 - 30) + 30);
        const temp = (Math.random() * (26 - 20) + 20).toFixed(1);
        const ph = (Math.random() * (7.2 - 5.8) + 5.8).toFixed(1);

        document.getElementById('iot-moisture').innerHTML = `${moisture}<small>%</small>`;
        document.getElementById('iot-temp').innerHTML = `${temp}<small>°C</small>`;
        document.getElementById('iot-ph').innerHTML = ph;

        const npkStatuses = ['Optimal', 'Good', 'Needs N', 'Fair'];
        document.getElementById('iot-npk').innerHTML = npkStatuses[Math.floor(Math.random() * npkStatuses.length)];

        const now = new Date();
        document.getElementById('iot-last-sync').innerText = `Last synced: ${now.toLocaleTimeString()}`;

        btn.innerHTML = '✅ Synced!';
        btn.style.background = 'var(--green-bright)';

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
    }, 1500);
}

// ===== Farmer Problem Feed (Ask a Guider) Logic =====
document.addEventListener('DOMContentLoaded', () => {
    const probForm = document.getElementById('problem-form');
    const recordBtn = document.getElementById('prob-record-btn');
    const audioPlayback = document.getElementById('prob-audio-playback');
    const statusDiv = document.getElementById('prob-status');
    const feedContainer = document.getElementById('prob-feed');

    if (!probForm) return;

    let mediaRecorder;
    let audioChunks = [];
    let audioDataUrl = ''; // Base64 audio for MVP db storage
    let isRecording = false;

    // Load feed
    async function loadProblemFeed() {
        try {
            const userStr = localStorage.getItem('agri_current_user');
            const userId = userStr ? JSON.parse(userStr).id : '';

            const res = await fetch('/api/problems/user', {
                headers: { 'x-user-id': userId }
            });
            if (res.ok) {
                const problems = await res.json();
                feedContainer.innerHTML = '';
                if (problems.length === 0) {
                    feedContainer.innerHTML = '<div style="opacity:0.6; font-size:0.9rem; font-style:italic;">No problems posted yet.</div>';
                    return;
                }

                problems.forEach(p => {
                    const card = document.createElement('div');
                    card.style.background = 'rgba(255,255,255,0.7)';
                    card.style.padding = '1rem';
                    card.style.borderRadius = 'var(--radius-md)';
                    card.style.borderLeft = p.status === 'solved' ? '4px solid var(--green-mid)' : '4px solid var(--accent)';

                    const statusBadge = p.status === 'solved'
                        ? `<span style="background:var(--green-mid); color:white; padding:2px 8px; border-radius:12px; font-size:0.7rem;">Solved</span>`
                        : `<span style="background:var(--accent); color:#453000; padding:2px 8px; border-radius:12px; font-size:0.7rem;">Awaiting Guider</span>`;

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <strong style="color:var(--primary);">${p.title}</strong>
                            ${statusBadge}
                        </div>
                        <p style="font-size:0.85rem; margin-bottom:0.5rem;">${p.description}</p>
                        ${p.audioUrl ? `<audio src="${p.audioUrl}" controls style="height:30px; width:100%;"></audio>` : ''}
                    `;
                    feedContainer.appendChild(card);
                });
            }
        } catch (e) {
            feedContainer.innerHTML = '<div style="color:red; font-size:0.8rem;">Failed to load problems.</div>';
        }
    }
    loadProblemFeed();

    // Voice Recording
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        recordBtn.addEventListener('click', async () => {
            if (isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                recordBtn.innerText = '🔴 Start Recording';
                recordBtn.style.background = 'white';
                recordBtn.style.color = 'var(--text)';
            } else {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];

                    mediaRecorder.ondataavailable = e => {
                        audioChunks.push(e.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        audioPlayback.src = audioUrl;
                        audioPlayback.style.display = 'block';

                        // Convert to Base64 for MVP DB Storage
                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onloadend = () => {
                            audioDataUrl = reader.result;
                        }
                    };

                    mediaRecorder.start();
                    isRecording = true;
                    recordBtn.innerText = '⏹️ Stop Recording';
                    recordBtn.style.background = '#FEE2E2';
                    recordBtn.style.color = '#DC2626';
                } catch (err) {
                    alert('Microphone access denied or unavailable.');
                }
            }
        });
    } else {
        recordBtn.style.display = 'none';
    }

    // Submit Problem
    probForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('prob-submit-btn');
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        const userStr = localStorage.getItem('agri_current_user');
        const userId = userStr ? JSON.parse(userStr).id : '';

        const payload = {
            title: document.getElementById('prob-title').value,
            description: document.getElementById('prob-description').value, // Could optionally transcribe audio later
            audioUrl: audioDataUrl || null,
            imageUrl: null // MVP: We will skip parsing real image blobs unless needed, keeping it simple
        };

        try {
            const res = await fetch('/api/problems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                statusDiv.innerText = '✅ Problem sent to Guiders successfully!';
                statusDiv.style.background = '#D1FAE5';
                statusDiv.style.color = '#065F46';
                statusDiv.style.display = 'block';
                probForm.reset();
                audioDataUrl = '';
                audioPlayback.style.display = 'none';
                audioPlayback.src = '';

                setTimeout(() => {
                    statusDiv.style.display = 'none';
                    loadProblemFeed();
                }, 2000);
            } else {
                throw new Error("Server rejected");
            }
        } catch (err) {
            statusDiv.innerText = '❌ Failed to connect to server.';
            statusDiv.style.background = '#FEE2E2';
            statusDiv.style.color = '#991B1B';
            statusDiv.style.display = 'block';
        } finally {
            submitBtn.innerText = 'Send to Guider';
            submitBtn.disabled = false;
        }
    });

});

// Inject Live Weather into Dashboard based on Geolocation
async function loadDashboardWeather() {
    const weatherGrid = document.getElementById('weather-grid');
    if (!weatherGrid) return;

    // Check if geolocation is possible
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                // Fetch Global API Keys
                const keyRes = await fetch('/api/settings/keys');
                const keys = await keyRes.json();

                if (keys.weather) {
                    const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${keys.weather}&units=metric`);
                    const wData = await wRes.json();

                    if (wData.main && wData.weather) {
                        // Update Header
                        const weatherHeader = weatherGrid.previousElementSibling;
                        if (weatherHeader) {
                            weatherHeader.innerHTML = `🌤️ Live Weather & Climate Overview <small style="float:right; opacity:0.7; font-size:0.8rem;">📍 ${wData.name || "Local"}, ${wData.sys.country || ""}</small>`;
                        }

                        // Parse precise visual data
                        const temp = Math.round(wData.main.temp);
                        const humidity = wData.main.humidity;
                        const windSpeed = wData.wind ? Math.round(wData.wind.speed * 3.6) : 0; // m/s to km/h
                        let rain = 0;
                        if (wData.rain && wData.rain['1h']) rain = wData.rain['1h'];

                        // Inject into grid
                        weatherGrid.innerHTML = `
                        <div class="mini-stat">
                            <div class="mini-stat-label">Temperature</div>
                            <div class="mini-stat-val">${temp}°C <br><small style="font-size:0.7rem; font-weight:normal;">${wData.weather[0].description}</small></div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Humidity</div>
                            <div class="mini-stat-val">${humidity}%</div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Rainfall (1hr)</div>
                            <div class="mini-stat-val">${rain} <small>mm</small></div>
                        </div>
                        <div class="mini-stat">
                            <div class="mini-stat-label">Wind Speed</div>
                            <div class="mini-stat-val">${windSpeed} <small>km/h</small></div>
                        </div>`;
                    }
                }
            } catch (e) {
                console.error("Dashboard weather fetch error", e);
            }
        }, (error) => {
            console.warn("Dashboard Geolocation denied/failed. Using static placeholders.", error);
        });
    }
}
document.addEventListener('DOMContentLoaded', loadDashboardWeather);

// ===== SATELLITE SCANNER LOGIC =====
let satMap = null;
let fieldPolygon = null;

window.scanSatelliteField = function() {
    const btnScan = document.getElementById('btn-scan-sat');
    const overlay = document.getElementById('sat-overlay');
    const statusText = document.getElementById('sat-status-text');
    const spinner = document.getElementById('sat-spinner');
    const mapContainer = document.getElementById('sat-map-container');
    const coordsText = document.getElementById('sat-coords');
    const scoreText = document.getElementById('sat-ndvi-score');
    const btnDownload = document.getElementById('btn-download-sat');
    const scanline = document.getElementById('sat-scanline');

    if(btnScan.disabled) return;
    btnScan.disabled = true;
    
    // Reset View
    mapContainer.style.opacity = '0';
    btnDownload.style.display = 'none';
    overlay.style.display = 'flex';
    overlay.style.background = 'rgba(0,0,0,0.85)';
    spinner.style.display = 'block';

    const executeScanPhase = (lat, lon) => {
        coordsText.innerText = `[${lat}, ${lon}]`;

        // Simulate satellite connection Sequence
        statusText.innerText = `Connecting to ISRO/NASA relays for coordinates [${lat}, ${lon}]...`;
        
        setTimeout(() => {
            statusText.innerText = `Downloading Multispectral Imagery (Bands 4 & 5)...`;
            
            setTimeout(() => {
                statusText.innerText = `Processing NDVI Vegetation Index...`;
                
                // Trigger scan line animation
                scanline.style.display = 'block';
                scanline.animate([
                    { top: '0%' },
                    { top: '100%' }
                ], {
                    duration: 2500,
                    iterations: Infinity,
                    direction: 'alternate'
                });

                setTimeout(() => {
                    // Reveal Phase
                    statusText.innerText = "Processing Complete. Vegetation Mask Applied.";
                    spinner.style.display = 'none';
                    overlay.style.background = 'rgba(0,0,0,0.4)'; // Lighten overlay heavily
                    
                    // Generate realistic mock score
                    const ndviVal = (0.5 + Math.random() * 0.3); // e.g. 0.65
                    scoreText.innerText = ndviVal.toFixed(2);
                    
                    // Initialize or Update Leaflet Map
                    if (!satMap) {
                        satMap = L.map('sat-map-container', { zoomControl: false }).setView([lat, lon], 17);
                        // Using Esri World Imagery (Satellite)
                        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                            maxZoom: 19
                        }).addTo(satMap);
                    } else {
                        satMap.setView([lat, lon], 17);
                    }

                    // Remove old polygon if exists
                    if (fieldPolygon) {
                        satMap.removeLayer(fieldPolygon);
                    }

                    // Create a simulated field boundary around the user's location
                    const offsetUrl = 0.0015;
                    const latNum = parseFloat(lat);
                    const lonNum = parseFloat(lon);
                    
                    const bounds = [
                        [latNum - offsetUrl, lonNum - offsetUrl],
                        [latNum + offsetUrl, lonNum + offsetUrl]
                    ];
                    
                    // Color code based on NDVI score
                    let polyColor = ndviVal < 0.6 ? '#ef4444' : '#10b981'; // Red for stress, Green for healthy
                    
                    fieldPolygon = L.rectangle(bounds, {
                        color: polyColor, 
                        weight: 2,
                        fillColor: polyColor, 
                        fillOpacity: 0.4
                    }).addTo(satMap);

                    fieldPolygon.bindPopup(`<b>Crop Health Data</b><br>NDVI: ${ndviVal.toFixed(2)}<br>Status: ${ndviVal < 0.6 ? 'Stressed' : 'Healthy'}`).openPopup();

                    mapContainer.style.opacity = '1';
                    
                    setTimeout(() => {
                        satMap.invalidateSize(); // Fix tile loading issues if container was hidden
                        btnDownload.style.display = 'block';
                        btnScan.innerText = "📡 Rescan Field";
                        btnScan.disabled = false;
                        
                        setTimeout(() => {
                            overlay.style.display = 'none'; // fully remove dark overlay
                            scanline.style.display = 'none';
                        }, 2000);
                    }, 500);
                    
                }, 3500); // Process duration
            }, 2500); // DL Duration
        }, 1500); // Init Duration
    };

    if ("geolocation" in navigator) {
        statusText.innerText = "Acquiring accurate GPS Fix from your device...";
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude.toFixed(6);
            const lon = position.coords.longitude.toFixed(6);
            executeScanPhase(lat, lon);
        }, error => {
            console.error("GPS Denied", error);
            statusText.innerText = "GPS Access Denied. Enabling emergency mock coordinates...";
            setTimeout(() => {
                const dummyLat = (16.5 + Math.random()*0.1).toFixed(6); // Andhra Pradesh area
                const dummyLon = (80.6 + Math.random()*0.1).toFixed(6);
                executeScanPhase(dummyLat, dummyLon);
            }, 1000);
        });
    } else {
        statusText.innerText = "Geolocation not supported/blocked.";
        setTimeout(() => {
            executeScanPhase("16.506174", "80.648015");
        }, 1000);
    }
};

// Handle Map Image Download via html2canvas
document.addEventListener('DOMContentLoaded', () => {
    const btnDownload = document.getElementById('btn-download-sat');
    if (btnDownload) {
        // Remove href, we will generate the image dynamically
        btnDownload.removeAttribute('href');
        btnDownload.removeAttribute('download');
        
        btnDownload.addEventListener('click', (e) => {
            e.preventDefault();
            const mapContainer = document.getElementById('sat-map-container');
            if(!mapContainer) return;
            
            const originalText = btnDownload.innerText;
            btnDownload.innerText = "⚙️ Processing Image...";
            
            // html2canvas needs useCORS to pull cross-origin map tiles
            html2canvas(mapContainer, { useCORS: true, allowTaint: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = `Crop_Health_Map_NDVI_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                btnDownload.innerText = originalText;
            }).catch(err => {
                console.error("Error generating map image", err);
                alert("Failed to capture map image. Ensure cross-origin tiles are loaded.");
                btnDownload.innerText = originalText;
            });
        });
    }
});
