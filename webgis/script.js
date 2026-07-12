// Tab Navigation Logic
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');

        // Fix map rendering issue when tab changes
        if (tabId === 'peta' && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    });
});

// Initialize Leaflet Map
const map = L.map('map').setView([-0.973, 116.702], 11); // Center on IKN

// Base Layers
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
});

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Dummy GeoJSON Layers (Akan di-load dari file lokal jika ada server, atau diganti URL raw GitHub)
// Karena tidak ada live server di file:///, loading GeoJSON lokal secara asynchronous akan kena CORS.
// Namun sebagai template struktur, berikut kodenya:

const boundaryLayer = L.geoJSON(null, {
    style: {
        color: '#3498db',
        weight: 3,
        fillOpacity: 0
    }
});

const gainLayer = L.geoJSON(null, {
    style: {
        color: '#2ecc71',
        weight: 1,
        fillColor: '#2ecc71',
        fillOpacity: 0.7
    }
});

const lossLayer = L.geoJSON(null, {
    style: {
        color: '#e74c3c',
        weight: 1,
        fillColor: '#e74c3c',
        fillOpacity: 0.7
    }
});

// Layer Control
const baseMaps = {
    "OpenStreetMap": osm,
    "Satellite (Esri)": satellite
};

const overlayMaps = {
    "Batas IKN": boundaryLayer,
    "Area Terbangun Baru (Gain)": gainLayer,
    "Area Terbangun Hilang (Loss)": lossLayer
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

// Opacity Control untuk Base Layer
const opacitySlider = document.getElementById('opacitySlider');
opacitySlider.addEventListener('input', function(e) {
    osm.setOpacity(e.target.value);
    satellite.setOpacity(e.target.value);
});

// Catatan: Jika ingin me-load file geojson lokal (boundary.geojson, dll)
// Anda harus menjalankannya lewat local web server (misal VSCode Live Server).
// Contoh cara load:
/*
fetch('../data/boundary.geojson')
    .then(res => res.json())
    .then(data => {
        boundaryLayer.addData(data);
        boundaryLayer.addTo(map);
    });
*/
