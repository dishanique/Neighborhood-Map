var map,
    largeInfowindow;

// Creates a new blank array for listing markers
var markers = [];

// Global polygon variable to ensure only one polygon is rendered.
var polygon = null;

// Used in multiple functions to have control over the number of places that show
var placeMarkers = [];

// Places to visit markers
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

    largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

// Style Markers
    var defaultIcon = makeMarkerIcon('AFD7CD');

// Highlighted location school and mouseover
    var highlightedIcon = makeMarkerIcon('FFD79C');

// Add marker animation
    for (var i = 0; i < locations.length; i++) {
        var position = locations[i].location;
        var title = locations[i].title;
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            icon: defaultIcon,
            animation: google.maps.Animation.DROP,
            description: locations[i].description,
            id: i
        });
        markers.push(marker);
        bounds.extend(marker.position);
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
            // console.log('click');
        });
        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    }

    ko.applyBindings( new model() );

    map.fitBounds(bounds);

    document.getElementById('show-listings').addEventListener('click', showListings);
    document.getElementById('hide-listings').addEventListener('click', hideListings);

}


function populateInfoWindow(marker, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div>' + marker.title + '</div>' + marker.destinations + '</div>');
        infowindow.open(map, marker);
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
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

// For wikipedia API
        var wikiURL ='https://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallBack&search=';

        
        function getWiki(nearStreetViewLocation,heading) {

          

// Add a timeout function that runs if API call failssfully 
//from this lesson:  https://classroom.udacity.com/nanodegrees/nd001/parts/00113454014/modules/271165859175460/lessons/3310298553/concepts/31621285920923           
          apiTimeout = setTimeout(function() {
                alert('ERROR: Failed to load data'); 
          }, 5000);

          $.ajax({
            type: 'GET', // I had to add this parameter for the request to work
            url: wikiURL+ marker.title,
            dataType: 'jsonp',
            timeout: 1000
          }).done(function(data) {
            var schoolDescription = data[2][0] ? data[2][0] : "No description avaiable";  // Ternary -- see above
            contentString += '<p>' +  schoolDescription + '</p>';
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
// Clears the timeout when the API call returns successfully
            clearTimeout(self.apiTimeout);

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
          // console.log('click');
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

// Markers to operate within side bar
var model = function() {
    var self = this;
    self.placesList = ko.observableArray(locations);
    
// Created observable to keep track of open/closed state for list view
    self.open = ko.observable(true);

    self.placesList().forEach(function(location, place) {
        location.marker = markers[place];
    });

    self.query = ko.observable('');
    self.filteredPlaces = ko.computed(function() { console.log(location)
    return ko.utils.arrayFilter(self.placesList(), function(location) { console.log(location)
        if (location.title.toLowerCase().indexOf(self.query().toLowerCase()) >= 0) {
            location.marker.setVisible(true);
            return true;
        } else { 
            location.marker.setVisible(false);
            largeInfowindow.close();  // close infowindow 
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

// Created toggle function to change state of open observable   
    self.listToggle = function() {
        if ( self.open()) {
          self.open(false);
        } else {
          self.open(true);
        }
    };  

};

// Added function to show alert box when Google Maps request fails 
function googleError() {
  alert("Map did not load");  
}
