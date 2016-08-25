var map;

     // Creates a new blank array for listing markers
     var markers=[];

     // Global polygon variable to ensure only one polygon is rendered. 
     var polygon = null;

     // USed in multiple functions to have control over the number of places that show
     var placeMarkers = [];

      function initMap() {

        // Styles Array 
        var styles = [
        {
          featureType: 'water',
          stylers: [
            {color: '#AFD7CD'}
          ]
        },{
          featureType: 'administrative',
          elementType: 'labels.text.stroke',
          stylers: [
            {color: '#CBC7D6' },
            {weight: 6}
          ]
        },{
          featureType: 'administrative',
          elementType: 'labels.text.fill',
          stylers: [
            {color: '#F1002F' }
            ]
        }, {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [
          {
            color: '#FED1BE'},
            {lightness: -40 }
          ]
        },{
          featureType: 'transit.station',
          stylers: [
            {weighy: 9},
            {hue: '#e85113' }
          ]
        },{
          featureType: 'road.highway',
          elementType: 'labels.icon',
          stylers: [
            {visibility: 'off'}
          ]
        }
        ];
     map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 39.9675, lng: -75.16913},
          zoom: 13,
          styles: styles,
          mapTypeControl: false
        });

         // Autocomplete to search within entry box
        var timeAutocomplete = new google.maps.places.Autocomplete(
          document.getElementById('search-within-time-text'));
        // Autocomplete for use in geocoder entry box
        var zoomAutocomplete = new google.maps.places.Autocomplete(
          document.getElementById('zoom-to-area-text'));
        // Bias the boundaries within the map for the zoom to area text
        zoomAutocomplete.bindTo('bounds', map);
        // Create a searchbox in order to execute a place search
        var searchBox = new google.maps.places.SearchBox (
          document.getElementById('places-search'));
        // Bias the searchbox to within the bounds of the map
        searchBox.setBounds(map.getBounds());

        // Places to Visit markers
        var locations = [
        {title: 'Eastern State Penitentiary', location: {lat: 39.968336 , lng: -75.172665 }},
        {title: 'Girard College', location: {lat: 39.973628 , lng: -75.172778 }},
        {title: 'The Franklin Institute', location: {lat: 39.958211 , lng: -75.173135 }},
        {title: 'The Academy of Natural Sciences', location: {lat: 39.957119 , lng: -75.171212 }},
        {title: 'Free Library of Philadelphia', location: {lat: 39.959633 , lng: -75.171043  }}
        ];

        var largeInfowindow = new google.maps.InfoWindow();
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
        var defaultIcon = makeMarkerIcon('0091ff');

        // Highlighted location and mouseover
        var highlightedIcon = makeMarkerIcon('FFFF24');


        for  (var i = 0; i < locations.length; i++) {
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

      document.getElementById('zoom-to-area').addEventListener('click', function() {
        zoomToArea();
      });

      document.getElementById('search-within-time').addEventListener('click', function() {
        searchWithinTime();
      });



      // // Event when user selects a prediction
      // searchBox.addListener('places_changed', function () {
      //   searchBoxPlaces(this);
      //   )};

      // Event when user selcts a predicts and click "go"
      // document.getElementById('go-places').addEventListener('click', textSearchPlaces);

      // Event Listener so polygon is captured, call seach within polygon function, and shows markers in polygon and hide outside of it
      drawingManager.addListener('overlaycomplete', function(event) {
        // check for an existing polygon
        // If there is, get rid of it and remove markers
        if(polygon) {
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
          if (infowindow.marker !=marker) {
            infowindow.marker = marker;
            infowindow.setContent('<div>' + marker.title + '</div>');
            infowindow.open(map, marker);
            infowindow.addListener('closeclick',function(){
              infowindow.setMarker(null);
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;

            function getStreetView(data, status) {
              if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                  nearStreetViewLocation, marker.position);
                  infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                  var panoramaOptions ={
                    position: nearStreetViewLocation,
                    pov: {
                      heading: heading,
                      pitch: 30
                  }
                };
                var panorama = new google.maps.StreetViewPanorama(
                  document.getElementById('pano'), panoramaOptions);
                 } else {
                  infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
              }
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

        function zoomToArea() {
          // Initialize Geocoder
          var geocoder = new google.maps.Geocoder();
          // Get the address or place user entered 
          var address = document.getElementById('zoom-to-area-text').value;
          // Confirm address isn't blank
          if (address == '') {
            window.alert('You Must Enter An Area or Address.');
          } else {
            geocoder.geocode(
            { address: address,
              componentRestrictions: {locality: 'Philadelphia'}
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
            // For each place, get the icon, name, and location
            createMarkersForPlaces(places);
            if (places.length == 0) {
              window.alert('We did not find and places matching that search');
            }
          }

          // When user select "go" on the places seach
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

          // Creates markers for each place found in either places search
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

            // Create a marker for each place.
            var marker = new google.maps.Marker({
              map: map,
              icom: icom,
              title: place.name,
              position: place.geometry.location,
              id: place.id
            });

            // Create single infowindow
            var placeInfoWindow = new google.maps.InfoWindow();
            // If marker clicked, do place details
            marker.addListener('click', function() {
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

        //   // Place Details search
        //   function getPlacesDetails(marker, infowindow) {
        //     var service = new google.maps.places.PlaceService(map);
        //     service.getDetails({
        //       placeId: marker.id
        //     }. function(place, status) {
        //       if (status === google.maps.places.PlacesServiceStatus.OK) {
        //         // Set the marker propert on infowindow
        //         infowindow.marker = marker;
        //         var innerHTML = '<div';
        //         if (place.name) {
        //           innerHTML += '<strong>' + place.name + '</strong>';
        //         }
        //         if (place.formatted_address) {
        //           innerHTML += '<hr>' + place.formatted_address;
        //         }
        //         if (place.formatted_phone_number) {
        //           innerHTML += '<br>' + place.formatted_phone_number;
        //         }
        //         if (place.opening_hours) {
        //           innerHTML += '<br><br><strong>Hours: </strong><br>' +
        //           place.opening_hours.weeday_text[0] + '<br>' +
        //           place.opening_hours.weeday_text[1] + '<br>' +
        //           place.opening_hours.weeday_text[2] + '<br>' +
        //           place.opening_hours.weeday_text[3] + '<br>' +
        //           place.opening_hours.weeday_text[4] + '<br>' +
        //         }
        //         if (place.photos) {
        //           innerHTML += '<br><br><img src="' + place.photos[0].getURl(
        //           {maxHeight: 100, maxWidth: 200}) + '">';
        //         }
        //         innerHTML += '</div>';
        //         infowindow.setContent(innerHTML);
        //         infowindow.open(map, marker);
        //         // Make sure marker property is cleared if infowindow is closed
        //         infowindow.addListener('closeclick', function() {
        //           infowindow.marker = null;
        //         })
        //       }
        //     }
        //     })
        //   }

        // function displayDirections(origins) {
        //   hideListings();
        //   var directionsService = new google.maps.DirectionsService;
        //   var destinationAddress = 
        //     document.getElementById('search-within-time-text').value;
        //   var mode = document.getElementById('mode').value;
        //   directionsService.route({
        //     origin: origin,
        //     destination: destinationAddress,
        //     travelMode: google.maps.TravelMode[mode]
        //     ), function(response, status) {
        //     if (status === google.maps.DirectionsStatus.OK) {
        //       var directionsDisplay = new google.maps.DirectionsRenderer({
        //         map: map,
        //         directions: response,
        //         draggable: true,
        //         polylineOptions: {
        //           strokeColor: 'green'
        //         }
        //       });
        //     } else {
        //       window.alert:'Directions request failed due to ' + status);
        //     }
        //   });
        //   }
        // }

        function searchWithinTime() {
          // Distance Matrix Service
          var distanceMatrixService = new google.maps.DistanceMatrixService;
          var address = document.getElementById('search-within-time-text').value;
          // Check to make sure the place entered isn't blank
          if (address == '') {
            window.alert('You Must Enter An Address.');
          } else {
            hideListings();
            // Use distance matrix service to calculate distance of routes between all markers
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
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor + 
            '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
          return markerImage;
        }
        
        // Shows and hides drawing options
        function toggleDrawing(drawingManager) {
          if (drawingManager.map) {
            drawingManager.setMap(null);
            // If user drew anything, get rid of polygon
            if(polygon) {
              polygon.setMap(null);
            }
          } else {
            drawingManager.setMap(map);
          }
        }

        // Hides all markers outside the polygon, shows only the markers within.
        function searchWithinPolygon() {
          for (var i = 0; i < markers.length; i++) {
            if (google.maps.geometry.poly.containsLocation(marker[i].position)) {
              markers[i].setMap(map);
            } else {
              markers[i].setMap(null);
            }
          }
        }