// public/js/map.js - CORRECTED

mapboxgl.accessToken = mapToken;

// Check if listing has valid geometry data before proceeding
if (listing && listing.geometry && listing.geometry.coordinates && listing.geometry.coordinates.length === 2) {

    // Center coordinates for map (Lng, Lat)
    const coordinates = listing.geometry.coordinates;

    const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v12', 
        
        // Use the coordinates array
        center: coordinates, 
        zoom: 9 
    });

    map.addControl(new mapboxgl.NavigationControl());

    const marker1 = new mapboxgl.Marker({ color: `red`})
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h4>${listing.title}</h4><p>Exact Location will be provided after booking</p>`
        )
    )
    .addTo(map);

} else {
    // Optional: Log a message or display an error if map data is missing
    console.error("Map cannot be initialized: Missing or invalid geometry coordinates.");
    document.getElementById('map').innerHTML = '<p class="text-center text-muted mt-5">Location map is unavailable for this listing.</p>';
}