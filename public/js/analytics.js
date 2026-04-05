document.addEventListener('DOMContentLoaded', async () => {
    // Shared Plotly Dark Theme Config
    const layoutConfig = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#94A3B8', family: "'Inter', sans-serif" },
        margin: { t: 10, b: 40, l: 40, r: 20 },
        colorway: ['#00F0FF', '#FF00FF', '#00FF9D', '#FFB800', '#FF3366']
    };

    try {
        // Fetch the dynamically evaluated DB Dashboard Data
        const response = await fetch('/api/analytics/data-dynamic');
        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();

        // 1. Populate KPIs
        document.getElementById('kpi-top-fert').innerText = data.top_fertilizer || "28-28";
        document.getElementById('kpi-avg-temp').innerText = `${data.avg_n}/${data.avg_p} mg`;
        document.getElementById('kpi-records').innerText = data.total_records;

        // 2. Soil Type Matrix Heatmap
        if (data.matrix_z && data.matrix_z.length > 0) {
            Plotly.newPlot('chart-soil-fert', [{
                z: data.matrix_z,
                x: data.matrix_ferts,
                y: data.matrix_soil_types,
                type: 'heatmap',
                colorscale: 'Viridis'
            }], {
                ...layoutConfig,
                height: 300,
                xaxis: { title: 'Fertilizer Type', color: '#FFF' },
                yaxis: { title: 'Soil Type', color: '#FFF' }
            }, {responsive: true});
        }

        // 3. Correlation Heatmap
        if (data.corr_z && data.corr_z.length > 0) {
            Plotly.newPlot('chart-correlation', [{
                z: data.corr_z,
                x: data.corr_vars,
                y: data.corr_vars,
                type: 'heatmap',
                colorscale: 'RdBu',
                zmin: -1, zmax: 1
            }], {
                ...layoutConfig,
                margin: { t: 20, b: 60, l: 80, r: 20 }
            }, {responsive: true});
        }

        // 4. Fertilizer Impact Bar Chart
        if (data.fert_scores) {
            const fertNames = Object.keys(data.fert_scores);
            const fertVals = Object.values(data.fert_scores);
            Plotly.newPlot('chart-fert-impact', [{
                x: fertNames,
                y: fertVals,
                type: 'bar',
                marker: {
                    color: fertVals,
                    colorscale: 'Bluered'
                }
            }], {
                ...layoutConfig,
                height: 300,
                xaxis: { title: 'Fertilizer' },
                yaxis: { title: 'Avg Productivity/Nitrogen Delivery Level' }
            }, {responsive: true});
        }

        // 5. Crop Share Treemap
        if (data.crop_share) {
            const labels = Object.keys(data.crop_share);
            const values = Object.values(data.crop_share);
            Plotly.newPlot('chart-crop-share', [{
                type: "treemap",
                labels: labels,
                parents: Array(labels.length).fill("Crops"),
                values: values,
                textinfo: "label+value",
                marker: {colorscale: 'Portland'}
            }], {
                ...layoutConfig, margin: {t:0,b:0,l:0,r:0}
            }, {responsive: true});
        }

        // 6. 3D Nutrient Space
        if (data.nutrient_3d) {
            const x = data.nutrient_3d.map(d => d.Nitrogen);
            const y = data.nutrient_3d.map(d => d.Potassium);
            const z = data.nutrient_3d.map(d => d.Phosphorous);
            const text = data.nutrient_3d.map(d => d['Crop Type']);

            Plotly.newPlot('chart-nutrient-3d', [{
                x: x, y: y, z: z,
                mode: 'markers',
                marker: {
                    size: 6,
                    color: z,
                    colorscale: 'Viridis',
                    opacity: 0.8
                },
                type: 'scatter3d',
                text: text
            }], {
                ...layoutConfig,
                margin: {t:0,b:0,l:0,r:0},
                scene: {
                    xaxis: {title: 'Nitrogen'},
                    yaxis: {title: 'Potassium'},
                    zaxis: {title: 'Phosphorous'},
                    bgcolor: 'rgba(0,0,0,0)'
                }
            }, {responsive: true});
        }

        // 7. Radar Chart
        Plotly.newPlot('chart-radar', [{
            type: 'scatterpolar',
            r: [data.avg_n, data.avg_p, data.avg_k, data.avg_temp, data.avg_humidity, data.avg_n],
            theta: ['Nitrogen','Phosphorous','Potassium','Avg Temp','Avg Humidity', 'Nitrogen'],
            fill: 'toself',
            name: 'Average Crop Profile',
            line: {color: '#00F0FF'}
        }], {
            ...layoutConfig,
            polar: {
                radialaxis: { visible: true, range: [0, 80] },
                bgcolor: 'rgba(0,0,0,0.2)'
            },
            showlegend: false
        }, {responsive: true});

    } catch (e) {
        console.error("Dashboard Failed to load", e);
    }
    
    // Download Report Button Action
    document.getElementById('download-report-btn').addEventListener('click', async () => {
        try {
            const res = await fetch('/api/analytics/report');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'XGBoost_Agricultural_Summary_Report.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert("Failed to download report. Ensure the backend server is running.");
        }
    });

});
