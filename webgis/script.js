// ==============================================================================
// WEBGIS JAVASCRIPT - IKN Built-Up Area Change Detection
// ==============================================================================

// Global Variables
let map;
let layers = {};
let geojsonData = {};

// Initialize Map
function initMap() {
    // Create map centered on IKN
    map = L.map('map').setView([-0.875, 116.765], 11);
    
    // Add base layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Alternative: Satellite basemap (uncomment if preferred)
    // L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    //     attribution: 'Esri',
    //     maxZoom: 18
    // }).addTo(map);
}

// Load GeoJSON Files
async function loadGeoJSON() {
    const files = {
        boundary: '../data/IKN_Boundary.geojson',
        builtup2324: '../data/IKN_BuiltUp_2023_2024.geojson',
        builtup2025: '../data/IKN_BuiltUp_2025.geojson',
        gain: '../data/IKN_Change_Gain.geojson',
        loss: '../data/IKN_Change_Loss.geojson'
    };
    
    for (const [key, path] of Object.entries(files)) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                geojsonData[key] = await response.json();
                console.log(`✅ Loaded ${key}`);
            } else {
                console.warn(`⚠️ File not found: ${path}`);
                geojsonData[key] = null;
            }
        } catch (error) {
            console.warn(`⚠️ Error loading ${key}:`, error);
            geojsonData[key] = null;
        }
    }
    
    createLayers();
    calculateStatistics();
}

// Create Map Layers
function createLayers() {
    // IKN Boundary
    if (geojsonData.boundary) {
        layers.boundary = L.geoJSON(geojsonData.boundary, {
            style: {
                color: '#ff0000',
                weight: 3,
                fillOpacity: 0,
                dashArray: '10, 5'
            }
        }).addTo(map);
        
        map.fitBounds(layers.boundary.getBounds());
    }
    
    // Built-Up 2023/24
    if (geojsonData.builtup2324) {
        layers.builtup2324 = L.geoJSON(geojsonData.builtup2324, {
            style: {
                color: '#9c27b0',
                fillColor: '#9c27b0',
                weight: 1,
                fillOpacity: 0.5
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`<h4>Built-Up Area 2023/24</h4><p>Area: ${calculateArea(feature)} ha</p>`);
            }
        });
    }
    
    // Built-Up 2025
    if (geojsonData.builtup2025) {
        layers.builtup2025 = L.geoJSON(geojsonData.builtup2025, {
            style: {
                color: '#ff9800',
                fillColor: '#ff9800',
                weight: 1,
                fillOpacity: 0.5
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`<h4>Built-Up Area 2025</h4><p>Area: ${calculateArea(feature)} ha</p>`);
            }
        }).addTo(map);
    }
    
    // Gain (Expansion)
    if (geojsonData.gain) {
        layers.gain = L.geoJSON(geojsonData.gain, {
            style: {
                color: '#4caf50',
                fillColor: '#4caf50',
                weight: 2,
                fillOpacity: 0.7
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`<h4>🟢 Gain (Expansion)</h4><p>New built-up area<br>Area: ${calculateArea(feature)} ha</p>`);
            }
        }).addTo(map);
    }
    
    // Loss
    if (geojsonData.loss) {
        layers.loss = L.geoJSON(geojsonData.loss, {
            style: {
                color: '#f44336',
                fillColor: '#f44336',
                weight: 2,
                fillOpacity: 0.7
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(`<h4>🔴 Loss</h4><p>Reverted to non-built-up<br>Area: ${calculateArea(feature)} ha</p>`);
            }
        });
    }
}

// Calculate Polygon Area (approximate, in hectares)
function calculateArea(feature) {
    if (!feature.geometry) return 0;
    
    // Leaflet's L.geoJSON provides area calculation
    const layer = L.geoJSON(feature);
    const bounds = layer.getBounds();
    
    // Rough approximation: 1 degree ≈ 111 km at equator
    const latDiff = bounds.getNorth() - bounds.getSouth();
    const lngDiff = bounds.getEast() - bounds.getWest();
    const areaKm2 = latDiff * lngDiff * 111 * 111 * Math.cos(bounds.getCenter().lat * Math.PI / 180);
    const areaHa = areaKm2 * 100;
    
    return areaHa.toFixed(2);
}

// Calculate Statistics
function calculateStatistics() {
    let area2324 = 0;
    let area2025 = 0;
    let areaGain = 0;
    let areaLoss = 0;
    
    // Calculate areas from GeoJSON features
    if (geojsonData.builtup2324) {
        geojsonData.builtup2324.features.forEach(f => {
            area2324 += parseFloat(calculateArea(f));
        });
    }
    
    if (geojsonData.builtup2025) {
        geojsonData.builtup2025.features.forEach(f => {
            area2025 += parseFloat(calculateArea(f));
        });
    }
    
    if (geojsonData.gain) {
        geojsonData.gain.features.forEach(f => {
            areaGain += parseFloat(calculateArea(f));
        });
    }
    
    if (geojsonData.loss) {
        geojsonData.loss.features.forEach(f => {
            areaLoss += parseFloat(calculateArea(f));
        });
    }
    
    // Calculate net change
    const netChange = area2025 - area2324;
    const percentChange = area2324 > 0 ? ((netChange / area2324) * 100).toFixed(2) : 0;
    
    // Update UI
    document.getElementById('stat-2324').textContent = area2324.toFixed(2);
    document.getElementById('stat-2025').textContent = area2025.toFixed(2);
    document.getElementById('stat-gain').textContent = areaGain.toFixed(2);
    document.getElementById('stat-loss').textContent = areaLoss.toFixed(2);
    document.getElementById('stat-net').textContent = netChange.toFixed(2);
    document.getElementById('stat-percent').textContent = percentChange;
    
    // Update insight text
    document.getElementById('insight-growth').textContent = 
        `Area terbangun di IKN mengalami ${netChange > 0 ? 'pertumbuhan' : 'penurunan'} sebesar ${Math.abs(netChange).toFixed(2)} hektar (${Math.abs(percentChange)}%) dari tahun 2023/2024 (${area2324.toFixed(2)} ha) ke 2025 (${area2025.toFixed(2)} ha). ` +
        `Ekspansi baru (Gain) mencapai ${areaGain.toFixed(2)} ha, sementara area yang berkurang (Loss) sebesar ${areaLoss.toFixed(2)} ha.`;
}

// Layer Control Handlers
function setupLayerControls() {
    // Checkbox controls
    document.getElementById('layer-boundary').addEventListener('change', (e) => {
        toggleLayer('boundary', e.target.checked);
    });
    
    document.getElementById('layer-2324').addEventListener('change', (e) => {
        toggleLayer('builtup2324', e.target.checked);
    });
    
    document.getElementById('layer-2025').addEventListener('change', (e) => {
        toggleLayer('builtup2025', e.target.checked);
    });
    
    document.getElementById('layer-gain').addEventListener('change', (e) => {
        toggleLayer('gain', e.target.checked);
    });
    
    document.getElementById('layer-loss').addEventListener('change', (e) => {
        toggleLayer('loss', e.target.checked);
    });
    
    // Opacity controls
    document.getElementById('opacity-builtup').addEventListener('input', (e) => {
        const opacity = e.target.value / 100;
        if (layers.builtup2324) layers.builtup2324.setStyle({fillOpacity: opacity});
        if (layers.builtup2025) layers.builtup2025.setStyle({fillOpacity: opacity});
    });
    
    document.getElementById('opacity-change').addEventListener('input', (e) => {
        const opacity = e.target.value / 100;
        if (layers.gain) layers.gain.setStyle({fillOpacity: opacity});
        if (layers.loss) layers.loss.setStyle({fillOpacity: opacity});
    });
}

function toggleLayer(layerName, show) {
    if (layers[layerName]) {
        if (show) {
            map.addLayer(layers[layerName]);
        } else {
            map.removeLayer(layers[layerName]);
        }
    }
}

// Tab Switching
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
            
            // Resize map when switching to map tab
            if (button.getAttribute('data-tab') === 'map') {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });
}

// Load Evaluation Metrics (Placeholder - replace with actual data)
function loadEvaluationMetrics() {
    // These values should come from your GEE script output
    // For now, using placeholder values
    const metrics = {
        accuracy: 0.87,    // 87%
        precision: 0.85,   // 85%
        recall: 0.89,      // 89%
        f1: 0.87,          // 87%
        confusionMatrix: {
            tn: 42,  // True Negative
            fp: 8,   // False Positive
            fn: 5,   // False Negative
            tp: 35   // True Positive
        }
    };
    
    // Update metric cards
    document.getElementById('metric-accuracy').textContent = (metrics.accuracy * 100).toFixed(1) + '%';
    document.getElementById('metric-precision').textContent = (metrics.precision * 100).toFixed(1) + '%';
    document.getElementById('metric-recall').textContent = (metrics.recall * 100).toFixed(1) + '%';
    document.getElementById('metric-f1').textContent = (metrics.f1 * 100).toFixed(1) + '%';
    
    // Update confusion matrix
    document.getElementById('cm-tn').textContent = metrics.confusionMatrix.tn;
    document.getElementById('cm-fp').textContent = metrics.confusionMatrix.fp;
    document.getElementById('cm-fn').textContent = metrics.confusionMatrix.fn;
    document.getElementById('cm-tp').textContent = metrics.confusionMatrix.tp;
}

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing WebGIS...');
    
    initMap();
    setupTabs();
    setupLayerControls();
    loadEvaluationMetrics();
    loadGeoJSON();
    
    console.log('✅ WebGIS Ready!');
});
