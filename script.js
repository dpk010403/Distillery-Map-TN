const map = L.map('map').setView([20.5937, 78.9629], 5);

// Define base layers
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
});
const noBaseMap = L.layerGroup();
const googleSat = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
  attribution: '© Google'
});

osm.addTo(map);

// Layer control
const baseMaps = {
  "OpenStreetMap": osm,
  "Boundary Only": noBaseMap,
  "Google Satellite Hybrid": googleSat
};

// Add the control into the custom div
const layerControl = L.control.layers(baseMaps, null, {
  collapsed: false
});
layerControl.addTo(map);

// Move the control to the custom container
const layerControlDiv = document.querySelector('.leaflet-control-layers');
const customContainer = document.getElementById('layerControlContainer');
customContainer.appendChild(layerControlDiv);

// Toggle visibility
function toggleLayerControl() {
  customContainer.classList.toggle('show');
}

// Load Tamil Nadu boundary
fetch('TamilNadu.geojson')
  .then(response => response.json())
  .then(data => {
    const boundary = L.geoJSON(data, {
      style: {
        color: "blue",
        weight: 1,
        fillColor: "transparent",
        fillOpacity: 0
      }
    }).addTo(map);
    map.fitBounds(boundary.getBounds());
  });



  
let distilleryLayer;

fetch('Distilleries.geojson')
  .then(response => response.json())
  .then(data => {
    const allFeatures = data.features;
    const typeSet = new Set();
    const feedstockSet = new Set();
    const statusSet = new Set();

    function createPopupContent(props) {
      const plantName = props["Plant name"];
      const imagePath = `Indus_img/${plantName}_img.jpg`; // Relative path to the image

      return `
        <div style="text-align:center; color:#000080; font-weight:bold;">
          ${plantName}
        </div>
        <div style="text-align:center; margin:10px 0;">
          <img src="${imagePath}" alt="${plantName} Image" style="width:200px; max-width:100%; border-radius:8px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);" />
        </div>
        <div>
          <span style="color:#006400; font-weight:bold;">Address:</span>
          <span style="color:#333;"> ${props["Mill Address"]}</span><br>
          
          <span style="color:#006400; font-weight:bold;">Type:</span>
          <span style="color:#333;"> ${props["Type"]}</span><br>
          
          <span style="color:#006400; font-weight:bold;">Feedstock:</span>
          <span style="color:#333;"> ${props["Feedstock"]}</span><br>
          
          <span style="color:#006400; font-weight:bold;">Status:</span>
          <span style="color:#333;"> ${props["Status"]}</span>
        </div>
      `;
    }

    function filterFeatures() {
      const type = document.getElementById('typeFilter').value;
      const feedstock = document.getElementById('feedstockFilter').value;
      const status = document.getElementById('statusFilter').value;

      if (distilleryLayer) map.removeLayer(distilleryLayer);

      const filtered = allFeatures.filter(f => {
        return (!type || f.properties.Type === type) &&
               (!feedstock || f.properties.Feedstock === feedstock) &&
               (!status || f.properties.Status === status);
      });

      distilleryLayer = L.geoJSON(filtered, {
        pointToLayer: function (feature, latlng) {
          const type = feature.properties.Type?.toLowerCase();
          const status = feature.properties.Status?.toLowerCase();

          let iconFile = "default.png";

          if (type && status) {
            const filename = `${type}_${status}.png`;
            iconFile = filename.charAt(0).toUpperCase() + filename.slice(1);
          }

          const customIcon = L.icon({
            iconUrl: `icon/${iconFile}`,
            iconSize: [40, 40],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
          });

          return L.marker(latlng, { icon: customIcon });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(createPopupContent(feature.properties));
        }
      }).addTo(map);

      searchControl.setLayer(distilleryLayer);
    }

    allFeatures.forEach(f => {
      if (f.properties.Type) typeSet.add(f.properties.Type);
      if (f.properties.Feedstock) feedstockSet.add(f.properties.Feedstock);
      if (f.properties.Status) statusSet.add(f.properties.Status);
    });

    typeSet.forEach(val => {
      const opt = document.createElement('option');
      opt.value = opt.text = val;
      document.getElementById('typeFilter').appendChild(opt);
    });

    feedstockSet.forEach(val => {
      const opt = document.createElement('option');
      opt.value = opt.text = val;
      document.getElementById('feedstockFilter').appendChild(opt);
    });

    statusSet.forEach(val => {
      const opt = document.createElement('option');
      opt.value = opt.text = val;
      document.getElementById('statusFilter').appendChild(opt);
    });

    document.getElementById('typeFilter').addEventListener('change', filterFeatures);
    document.getElementById('feedstockFilter').addEventListener('change', filterFeatures);
    document.getElementById('statusFilter').addEventListener('change', filterFeatures);

    filterFeatures();

     let highlightCircle;

    const searchControl = new L.Control.Search({
      layer: distilleryLayer,
      propertyName: 'Plant name',
      marker: false,
      moveToLocation: function(latlng, title, map) {
        map.setView(latlng, 14);

        if (highlightCircle) {
          map.removeLayer(highlightCircle);
        }

        highlightCircle = L.circleMarker(latlng, {
          radius: 15,
          color: '#ff6600',
          fillColor: '#ffff00',
          fillOpacity: 0.5,
          weight: 3
        }).addTo(map);

        setTimeout(() => {
          if (highlightCircle) map.removeLayer(highlightCircle);
        }, 3000);
      }
    });
    searchControl.setPosition('bottomleft'); // custom position
    map.addControl(searchControl);
  });
