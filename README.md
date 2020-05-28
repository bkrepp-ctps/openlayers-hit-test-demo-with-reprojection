# openlayers-hit-test-demo-with-reprojection

This is a demo of using the OpenLayers library to perform a WFS GetFeatures request using the "bbbox" (boudning box) parameter to perform a "hit-test" for clicks on a web map against an underlying WFS layer. This demo __involves reprojection__ from the SRS of the map to the SRS of the underlying feature layer. The SRS of the map is EPSG:3857; the SRS of the feature layer is EPSG:26986.

Reprojection is performed using the [proj4.js](http://proj4js.org) library.

This demo depends upon the following external libraries:
* OpenLayers version 6.1.0
* Proj4.js version 2.6.2

To perform the reprojection:
1. Preparation:
     1. Include the JS file for the proj4.js library in the application page
     2. The proj4.js library comes pre-built with "knowledge" of a few
        SRSs, including EPSG:4326 and EPSG:3857
     3. Give the proj4.js library "knowledge" of the EPSG:26986 SRS:
         1. Obtain the proj4 definition string for EPSG:26986 from [spatialreference.org](https://spatialreference.org/ref/epsg/26986/proj4/)
         2. Assign this to a JS varable - for convenience
         3. Give the proj4.js library "knowledge" of EPSG:26986:  
            proj4.defs('EPSG:26986', js_string_variable);
2. Perform the actual reprojection
     1. Get the coordinates (a 2-element array [x,y]) of the EPSG:3857 point to be projected
     2. Create a proj4.js projector object to handle projections between EPSG:3857 and EPSG:26986:  
        var oProjector = proj4('EPSG:3857', 'EPSG:26986');
     3. Note that this object will have to member functions:  
             forward - to project from EPSG:3857 to EPSG:26986  
             inverse - to project from EPSG:26986 to EPSG:3857
     4. Call the 'forward' function on the point to be projected;
        the return value is a 2-element array reprsenting the coordinates of the
        point in EPSG:26986:  
        var projected_point = oProjector.forward(point_to_be_projected);

-- B. Krepp, attending metaphysician  
26-28 May 2020
