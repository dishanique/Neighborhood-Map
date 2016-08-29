var map,
    largeInfowindow;

// Creates a new blank array for listing markers
var markers = [];

// Global polygon variable to ensure only one polygon is rendered. 
var polygon = null;

// USed in multiple functions to have control over the number of places that show
var placeMarkers = [];

// Places to Visit markers
var locations = [{
    title: 'Friends Select School',
    description: 'We believe in the Quaker values of respect for all, simplicity, the peaceful resolution of conflict, and a constant search for truth.',
    location: {
        lat: 39.956348,
        lng: -75.166956
    }
}, {
    title: 'Germantown Friends School',
    description: '',
    location: {
        lat: 40.032816,
        lng: -75.171196
    }
}, {
    title: 'William Penn Charter School',
    description: 'We value scholarship and inquiry. With excellence as our standard, we challenge students in a vigorous program of academics, arts and athletics.',
    location: {
        lat: 40.021935,
        lng: -75.186274
    }
}, {
    title: 'Springside Chestnut Hill Academy',
    description: 'We educate students to be innovative leaders, breakthrough thinkers, and imaginative problem solvers.',
    location: {
        lat: 40.061558,
        lng: -75.209535
    }
}, {
    title: 'The Shipley School',
    description: 'Through a balance of rigor and support, our students become confident, successful individuals who are better prepared to meet future challenges, and continue the journey that began here at Shipley.',
    location: {
        lat: 40.024923,
        lng: -75.315235
    }
}, {
    title: 'The Haverford School',
    description: 'Seeks to prepare boys to succeed and provide leadership in a world that is globally and culturally interconnected, technologically ever-advancing, and environmentally vulnerable.',
    location: {
        lat: 40.014304,
        lng: -75.305507
    }
}, {
    title: 'The Philadelphia School',
    description: 'A progressive school and vibrant learning community, is to educate the character and intellect of children.',
    location: {
        lat: 39.946964,
        lng: -75.182295
    }
}];

function initMap() {

    // Styles Array 
    var styles = [{
        featureType: 'water',
        stylers: [{
            color: '#AFD7CD'
        }]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [{
            color: '#CBC7D6'
        }, {
            weight: 6
        }]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [{
            color: '#F1002F'
        }]
    }, {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{
            color: '#FED1BE'
        }, {
            lightness: -40
        }]
    }, {
        featureType: 'transit.station',
        stylers: [{
            weighy: 9
        }, {
            hue: '#e85113'
        }]
    }, {
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [{
            visibility: 'off'
        }]
    }];
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 39.9675,
            lng: -75.16913
        },
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    });

    // Autocomplete to search within entry box
    var timeAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('search-within-time-text'));
    // Autocomplete for use in geocoder entry box
    /*var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('zoom-to-area-text'));
    // Bias the boundaries within the map for the zoom to area text
    zoomAutocomplete.bindTo('bounds', map);*/
    // Create a searchbox in order to execute a place search
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    // Bias the searchbox to within the bounds of the map
    searchBox.setBounds(map.getBounds());

    

    largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

    


    // Initialize drawing manager 
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });

    // Style Markers
    var defaultIcon = makeMarkerIcon('AFD7CD');

    // Highlighted location school and mouseover
    var highlightedIcon = makeMarkerIcon('FFD79C');

    // add marker animation 
    for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            icon: defaultIcon,
            animation: google.maps.Animation.DROP,
            id: i
        });
        markers.push(marker);
        bounds.extend(marker.position);
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
            console.log('click');
        });

        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    }

    map.fitBounds(bounds);

    document.getElementById('show-listings').addEventListener('click', showListings);
    document.getElementById('hide-listings').addEventListener('click', hideListings);

    document.getElementById('toggle-drawing').addEventListener('click', function() {
        toggleDrawing(drawingManager);
    });

    document.getElementById('search-within-time').addEventListener('click', function() {
        searchWithinTime();
    });

    // Event Listener so polygon is captured, call seach within polygon function, and shows markers in polygon and hide outside of it
    drawingManager.addListener('overlaycomplete', function(event) {
        // check for an existing polygon
        // If there is, get rid of it and remove markers
        if (polygon) {
            polygon.setMap(null);
            hideListings();
        }
        // Switch drawing mode to the Hand
        drawingManager.setDrawingMode(null);
        // Creates new editable polygon from overlay
        polygon = event.overlay;
        polygon.setEditable(true);
        // Search within polygon
        searchWithinPolygon();
        // Make sure the search is re-done if the polygon is changed
        polygon.getPath().addListener('set_at', searchWithinPolygon);
        polygon.getPath().addListener('insert_at', searchWithinPolygon);
    });
}


function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title + '</div>');
        infowindow.open(map, marker);
        infowindow.addListener('closeclick', function() {
            infowindow.setMarker(null);
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        var contentString = "";

        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                contentString += '<div>' + marker.title + '</div><div id="pano"></div>';
                getWiki(nearStreetViewLocation,heading);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
            }
        }

        // For wikipedia api
        var wikiURL ='https://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallBack&search=';

        function getWiki(nearStreetViewLocation,heading) {
          console.log('get');
          $.ajax({
            type: 'GET', // I had to add this parameter for the request to work
            url: wikiURL+'Wikipedia', 
            dataType: 'jsonp',
            timeout: 1000
          }).done(function(data) {
            console.log(data);
            contentString += '<p>' + data[2][0] + '</p>';
            infowindow.setContent(contentString);
            var panoramaOptions = {
                position: nearStreetViewLocation,
                pov: {
                    heading: heading,
                    pitch: 30
                }
            };
            var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            
          }).fail(function(jqXHR, textStatus){
            alert("The Wikipedia link search failed.");
          });
        }

        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infowindow.open(map, marker);
        
    }
}

function showListings() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

function hideMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function hideListings() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function zoomToArea() {
    // Initialize Geocoder
    var geocoder = new google.maps.Geocoder();
    // Get the address or place user entered 
    var address = document.getElementById('zoom-to-area-text').value;
    // Confirm address isn't blank
    if (address == '') {
        window.alert('You Must Enter An Area or Address.');
    } else {
        geocoder.geocode({
            address: address,
            componentRestrictions: {
                locality: 'Philadelphia'
            }
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
            } else {
                // } 
                // if (!atLeastOne) {
                window.alert('We Could Not Find That Location - Try Entering A More' + 'Specific Place.');
            }
        });
    }
}

// This function fires when user selects a searchbox pick
function searchBoxPlaces(searchBox) {
    hideMarkers(placesMarkers);
    var places = searchBox.getPlaces();
    // For each school, get the icon, name, and location
    createMarkersForPlaces(places);
    if (places.length == 0) {
        window.alert('We did not find and places matching that search');
    }
}

// When user select "go" on the school seach box
function textSearchPlaces() {
    var bounds = map.getBounds();
    hideMarkers(placeMarkers);
    var placeService = new google.maps.places.PlaceService(map);
    placeService.textSearch({
        query: document.getElementById('places-search').value,
        bounds: bounds
    }, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            createMarkersForPlaces(results);
        }
    });
}

// Creates markers for each place found in either school search
function createMarkersForPlaces(places) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };

        // Create a marker for each school.
        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.id
        });

        // Create single infowindow
        var placeInfoWindow = new google.maps.InfoWindow();
        // If marker clicked, do school details
        marker.addListener('click', function() {
          console.log('click');
            if (placeInfoWindow.marker == this) {
                console.log("This infowindow already is on this marker");
            } else {
                getPlacesDeatails(this, placeInfoWindow);
            }
        });

        placeMarkers.push(marker);
        if (place.geometry.viewport) {
            // Only geocodes have viewpoint
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}

function searchWithinTime() {
    // Distance service option
    var distanceMatrixService = new google.maps.DistanceMatrixService;
    var address = document.getElementById('search-within-time-text').value;
    // Check to make sure the school entered isn't blank
    if (address == '') {
        window.alert('You Must Enter An Address.');
    } else {
        hideListings();
        // Use distance service option to calculate distance of routes between all markers
        var origins = [];
        for (var i = 0; i < markers.length; i++) {
            origins[i] = markers[i].position;
        }
        var destination = address;
        var mode = document.getElementById('mode').value;
        // Both origins and destinations are defined, gets info for distances between then
        distanceMatrixService.getDistanceMatrix({
            origins: origins,
            destinations: [destination],
            travelMode: google.maps.travelMode[mode],
            unitSystem: google.maps.UnitSystem.IMPERIAL,
        }, function(response, status) {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
                window.alert('Error was: ' + status);
            } else {
                displayMarkersWithinTime(response);
            }
        });
    }
}

// Function will go through each result and if distance is less than the value in the picker, it will be shown in map.
function displayMarkersWithinTime(response) {
    var maxDuration = document.getElementById('max-duration').value;
    var origins = response.originsAddresses;
    var destinations = response.destinationAddresses;
    // Distance and duration of results
    var atLeastOne = false;
    for (var i = 0; i < origins.length; i++) {
        var results = response.rows[i].elements;
        for (var j = 0; j < results.length; j++) {
            var element = results[j];
            if (element.status === "OK") {
                // Distance is returned in feet, text in miles 
                var distanceText = element.distance.text;
                // Duration value is given in seconds so we make it minutes 
                var duration = element.duration.value / 60;
                var durationText = element.duration.text;
                if (duration <= maxDuration) {
                    // origin [i] should = the markers[i]
                    markers[i].setMap(map);
                    atLeastOne = true;
                    // Mini infowindow which will open immediately and contain distance in duration 
                    var infowindow = new google.maps.InfoWindow({
                        content: durationText + ' away, ' + distanceText +
                            '<div><input type=\"button\" value=\"View Route\" onclick =' + '\"displayDirections(&quot;' + origins[i] + '&quot;);\"></input></div>'
                    });
                    infowindow.open(map, markers[i]);
                    // Small Window closes if user clicks the marker when big infowindow opens
                    markers[i].infowindow = infowindow;
                    google.maps.event.addListener(markers[i], 'click', function() {
                        this.infowindow.close();
                    });
                }
            }
        }
    }
}

function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

// Shows and hides drawing options to create polygon around a specific area to search for more schools 
function toggleDrawing(drawingManager) {
    if (drawingManager.map) {
        drawingManager.setMap(null);
        // If user drew anything, gets rid of polygon
        if (polygon) {
            polygon.setMap(null);
        }
    } else {
        drawingManager.setMap(map);
    }
}

// Hides all markers outside the polygon, shows only the markers within.
function searchWithinPolygon() {
    for (var i = 0; i < markers.length; i++) {
        if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
            markers[i].setMap(map);
        } else {
            markers[i].setMap(null);
        }
    }
}

// markers to operate within side bar
var model = function() {
    var self = this;
    self.placesList = ko.observableArray(locations);

    self.placesList().forEach(function(location, place) {
        location.marker = markers[place];
    });

    self.query = ko.observable('');
    self.filteredPlaces = ko.computed(function() {
        return ko.utils.arrayFilter(self.placesList(), function(location) {
            if (location.title.toLowerCase().indexOf(self.query().toLowerCase()) >= 0) {
                location.marker.setVisible(true);
                return true;
            } else {
                location.marker.setVisible(false);
                return false;
            }
        });
    }, self);

    self.marker = ko.observableArray(markers);

    self.clickMarker = function(location) {
        populateInfoWindow(location.marker, largeInfowindow);
        location.marker.setAnimation(google.maps.Animation.BOUNCE);
        window.setTimeout(function() {
          location.marker.setAnimation(null);
        }, 750);
    };
};

window.onload = function() {
    ko.applyBindings(new model());
};
