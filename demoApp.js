// OpenLayers hit-test demo: with reprojection
// Base layer is in EPSG:3857; and layer for hit-test is in EPSG:26986
//
// To perform the reprojection:
// 1. Preparation:
//      a. Include the JS file for the proj4.js library in the application page
//      b. The proj4.js library comes pre-built with "knowledge" of a few
//         SRSs, including EPSG:4326 and EPSG:3857
//      c. Give the proj4.js library "knowledge" of the EPSG:26986 SRS:
//          1. Obtain the proj4 definition string for EPSG:26986 from spatialreference.org:
//             https://spatialreference.org/ref/epsg/26986/proj4/
//          2. Assign this to a JS varable (for convenience)
//          3. Give the proj4.js library "knowledge" of EPSG:26986:
//             proj4.defs('EPSG:26986', js_string_variable);
// 2. Perform the actual reprojection
//      a. Get the coordinates (a 2-element array [x,y]) of the EPSG:3857 point to be projected
//      b. Create a proj4.js projector object to handle projections between EPSG:3857 and EPSG:26986:
//         var oProjector = proj4('EPSG:3857', 'EPSG:26986');
//      c. Note that this object will have to member functions: 
//              forward - to project from EPSG:3857 to EPSG:26986
//              inverse - to project from EPSG:26986 to EPSG:3857
//      d. Call the 'forward' function on the point to be projected;
//         the return value is a 2-element array reprsenting the coordinates of the
//         point in EPSG:26986:
//         var projected_point = oProjector.forward(point_to_be_projected);
//
// -- B. Krepp, attending metaphysician
// 26-28 May 2020


// URLs for MassGIS basemap layer services
var mgis_serviceUrls = { 
    'topo_features'     :  "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Topographic_Features_for_Basemap/MapServer",
    'basemap_features'  :  "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Basemap_Detailed_Features/MapServer",
    'structures'        :  "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Structures/MapServer",
    'parcels'           :  "https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGIS_Level3_Parcels/MapServer"
};

// OpenLayers layers for MassGIS basemap layers used in our map
var mgis_basemap_layers = { 'topo_features'     : null,     // bottom layer
                            'structures'        : null,     
                            'basemap_features'  : null,     // on top of 'structures' so labels aren't obscured
                            'parcels'           : null      // unused; not populated
};


szServerRoot = location.protocol + '//' + location.hostname;
if (location.hostname.includes('appsrvr3')) {   
    szServerRoot += ':8080/geoserver/';    
} else {
    szServerRoot += '/maploc/';    
}
szWMSserverRoot = szServerRoot + '/wms'; 
szWFSserverRoot = szServerRoot + '/wfs'; 

// Set up OpenLayers Map Projection (MA State Plane NAD83, meters)
var projection = new ol.proj.Projection({
	code: 'EPSG:26986',
	extent: [33861.26,777514.31,330846.09,959747.44],
	units: 'm'
});
ol.proj.addProjection(projection);
var MaStatePlane = '+proj=lcc +lat_1=42.68333333333333 +lat_2=41.71666666666667 +lat_0=41 +lon_0=-71.5 +x_0=200000 +y_0=750000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs';
ol.proj.addCoordinateTransforms(
	'EPSG:4326',
	projection,
	function(coordinate){
		var WGS_to_MAState = proj4(MaStatePlane).forward(coordinate);
		return WGS_to_MAState;
	},
	function(coordinate){
		var MAState_to_WGS = proj4(MaStatePlane).inverse(coordinate);
		return MAState_to_WGS;
	}
);


// Add EPSG:26986 to list of projections known to the proj4 library
proj4.defs('EPSG:26986', MaStatePlane);

var ol_map = null;

function onClick_handler(e) {
    // The parameter 'e' is the JS event object passed in by the browser 
    var IDENTIFY_TOLERANCE = 150;
    console.log('map clicked at pixel location: ' + e.pixel);
    console.log('map clicked at coordinate location: ' + e.coordinate);
    
    // Transform from EPSG:3857 to EPSG:26986 SRS
    
    // Make a copy of e.coordinate - just for the record :-)
    var coord_to_project = [];
    coord_to_project[0] = e.coordinate[0];
    coord_to_project[1] = e.coordinate[1];
   
    // Create projector object (it has forward and inverse member functions)
    var oProjector = proj4('EPSG:3857', 'EPSG:26986');
    // Perform the projection from EPSG:3857 to EPSG:26986
    var projected_coord = oProjector.forward(coord_to_project);
    
    var sUrl = szWFSserverRoot + '?';
    sUrl += "service=wfs&version=1.0.0";
    sUrl += "&request=getfeature";
    sUrl += "&typename=ctps_pg:ctps_pnr_station_points"; 
    sUrl += '&outputformat=json';
    sUrl += "&bbox=";
    
    // Construct bounding box:
    // Lower left coordinate of bounding box
    var oLowerLeft = [];
    oLowerLeft[0] = projected_coord[0] + (-1 * IDENTIFY_TOLERANCE);
    oLowerLeft[1] = projected_coord[1] + (-1 * IDENTIFY_TOLERANCE);
    // Upper right coordinate of bounding box
    var oUpperRight = [];
    oUpperRight[0] = projected_coord[0] + IDENTIFY_TOLERANCE;
    oUpperRight[1] = projected_coord[1] + IDENTIFY_TOLERANCE;
    
    // Add the bounding box coordinates to the WFS request URL
    sUrl += oLowerLeft[0] + ',' + oLowerLeft[1] + ',';
    sUrl += oUpperRight[0] + "," + oUpperRight[1];    
   
    $.ajax({ url	: sUrl,
         type		: 'GET',
         dataType	: 'json',
         success	: 	function (data, textStatus, jqXHR) {	
                            var reader, aFeatures = [], props = {}, s;
                            reader = new ol.format.GeoJSON();
                            aFeatures = reader.readFeatures(jqXHR.responseText);
                            if (aFeatures.length === 0) {
                                alert('WFS BBOX query returned no features.');
                                return;
                            } else if (aFeatures.length > 1) {
                                // TBD: Have to figure out what to do in this case...
                                //      Right now, just fall through to report on aFeatures[0]...
                                console.log('WFS BBOX query returned > 1 feature.');
                            }
                            props = aFeatures[0].getProperties();
                            s = 'You clicked on ' + props['stan_addr'] + '.'
                            console.log(s);
                            alert(s);
                            //etc.
                        }, // end of 'success' handler
        error       :   function (qXHR, textStatus, errorThrown ) {
                            alert('WFS BBOX query.\n' +
                                    'Status: ' + textStatus + '\n' +
                                    'Error:  ' + errorThrown);
                        } // end of error handler
    });  // End of WFS BBOX query                              
                                
} // onClick_hander()


function initialize() { 
    // Initialize OpenLayers map, gets MassGIS basemap service properties by executing AJAX request
    $.ajax({ url: mgis_serviceUrls['topo_features'], jsonp: 'callback', dataType: 'jsonp', data: { f: 'json' }, 
             success: function(config) {     
                // Body of "success" handler starts here.
                // Get resolutions
                var tileInfo = config.tileInfo;
                var resolutions = [];
                for (var i = 0, ii = tileInfo.lods.length; i < ii; ++i) {
                    resolutions.push(tileInfo.lods[i].resolution);
                }               
                // Get projection
                var epsg = 'EPSG:' + config.spatialReference.wkid;
                var units = config.units === 'esriMeters' ? 'm' : 'degrees';
                var projection = ol.proj.get(epsg) ? ol.proj.get(epsg) : new ol.proj.Projection({ code: epsg, units: units });                              
                // Get attribution
                var attribution = new ol.control.Attribution({ html: config.copyrightText });               
                // Get full extent
                var fullExtent = [config.fullExtent.xmin, config.fullExtent.ymin, config.fullExtent.xmax, config.fullExtent.ymax];
                
                var tileInfo = config.tileInfo;
                var tileSize = [tileInfo.width || tileInfo.cols, tileInfo.height || tileInfo.rows];
                var tileOrigin = [tileInfo.origin.x, tileInfo.origin.y];
                var urls;
                var suffix = '/tile/{z}/{y}/{x}';
                urls = [mgis_serviceUrls['topo_features'] += suffix];               
                var width = tileSize[0] * resolutions[0];
                var height = tileSize[1] * resolutions[0];     
                var tileUrlFunction, extent, tileGrid;               
                if (projection.getCode() === 'EPSG:4326') {
                    tileUrlFunction = function tileUrlFunction(tileCoord) {
                        var url = urls.length === 1 ? urls[0] : urls[Math.floor(Math.random() * (urls.length - 0 + 1)) + 0];
                        return url.replace('{z}', (tileCoord[0] - 1).toString()).replace('{x}', tileCoord[1].toString()).replace('{y}', (-tileCoord[2] - 1).toString());
                    };
                } else {
                    extent = [tileOrigin[0], tileOrigin[1] - height, tileOrigin[0] + width, tileOrigin[1]];
                    tileGrid = new ol.tilegrid.TileGrid({ origin: tileOrigin, extent: extent, resolutions: resolutions });
                }     

                // Layer 1 - topographic features
                var layerSource;
                layerSource = new ol.source.XYZ({ attributions: [attribution], projection: projection,
                                                  tileSize: tileSize, tileGrid: tileGrid,
                                                  tileUrlFunction: tileUrlFunction, urls: urls });
                                  
                mgis_basemap_layers['topo_features'] = new ol.layer.Tile();
                mgis_basemap_layers['topo_features'].setSource(layerSource);
                mgis_basemap_layers['topo_features'].setVisible(true);
                
                // We make the rash assumption that since this set of tiled basemap layers were designed to overlay one another,
                // their projection, extent, and resolutions are the same.
        
                // Layer 2 - structures
                urls = [mgis_serviceUrls['structures'] += suffix];  
                layerSource = new ol.source.XYZ({ attributions: [attribution], projection: projection,
                                                  tileSize: tileSize, tileGrid: tileGrid,
                                                  tileUrlFunction: tileUrlFunction, urls: urls });;
                mgis_basemap_layers['structures'] = new ol.layer.Tile();
                mgis_basemap_layers['structures'].setSource(layerSource); 
                mgis_basemap_layers['structures'].setVisible(true);          
                
                
                // Layer 3 - "detailed" features - these include labels
                urls = [mgis_serviceUrls['basemap_features'] += suffix];  
                layerSource = new ol.source.XYZ({ attributions: [attribution], projection: projection,
                                                  tileSize: tileSize, tileGrid: tileGrid,
                                                  tileUrlFunction: tileUrlFunction, urls: urls });                                  
                mgis_basemap_layers['basemap_features'] = new ol.layer.Tile();
                mgis_basemap_layers['basemap_features'].setSource(layerSource);
                mgis_basemap_layers['basemap_features'].setVisible(true);
    
                // The ol_map object is global (not local to this function)
                ol_map = new ol.Map({ layers:   [ mgis_basemap_layers['topo_features'],
                                                  mgis_basemap_layers['structures'],
                                                  mgis_basemap_layers['basemap_features']
                                                ],
                                      target: 'map',                             
                                      view:   new ol.View({ projection  : 'EPSG:3857',
                                                            center      : ol.proj.fromLonLat([-71.0589, 42.3601], 'EPSG:3857'),
                                                            zoom        : 11 }),
                                      // The following actually suppresses zooming on single-clicks
                                      interactions: ol.interaction.defaults({doubleClickZoom: false})
                                   });
    
                // Register on-click event hanlder for map
                ol_map.on('click', onClick_handler);
            } // WFS success handler      
    });      
} // initialize()
