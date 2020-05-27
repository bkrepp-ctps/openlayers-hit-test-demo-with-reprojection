# openlayers-hit-test-demo-with-reprojection

This is a demo of using the OpenLayers library to perform a WFS GetFeatures request using the "bbbox" (boudning box) parameter to perform a "hit-test" for clicks on a web map against an underlying WFS layer. This demo __involves reprojection__ from the SRS of the map to the SRS of the underlying feature layer. The SRS of the map is EPSG:3857; the SRS of the feature layer is EPSG:26986.

Reprojection is performed using the [proj4.js](http://proj4js.org) library.

This demo depends upon the following external libraries:
* OpenLayers version 6.1.0
* Proj4.js version 2.6.2
