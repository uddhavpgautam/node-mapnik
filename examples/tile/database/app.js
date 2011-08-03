#!/usr/bin/env node

// This example shows how to use node-mapnik to 
// render maps tiles based on spatial data stored in postgis
//
// To run you must configure the postgis_settings variable


var mapnik = require('mapnik')
  , mercator = require('mapnik/sphericalmercator')
  , url  = require('url')
  , fs   = require('fs')
  , http = require('http')
  , util = require('../lib/utility.js')
  , path = require('path')
  , port = 8000
  , TMS_SCHEME = false;

var postgis_settings = {
  'dbname'          : 'test2',
  'table'           : 'world_merc',
  'user'            : 'postgres',
  'type'            : 'postgis',
  'extent'          : '-20005048.4188,-9039211.13765,19907487.2779,17096598.5401',  //change this if not merc  
  'max_size'        : 1    
};

http.createServer(function(req, res) {
  util.parseXYZ(req, TMS_SCHEME, function(err,params) {
    if (err) {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end(err.message);
    } else {
      try {        
        var map     = new mapnik.Map(256, 256, mercator.proj4);                
        var layer   = new mapnik.Layer('tile', mercator.proj4);
        var postgis = new mapnik.Datasource(postgis_settings);
        var bbox    = mercator.xyz_to_envelope(parseInt(params.x),
                                               parseInt(params.y),
                                               parseInt(params.z), false);    

        layer.datasource = postgis;
        layer.styles     = ['point'];
        
        map.bufferSize = 64;
        map.load(path.join(__dirname,'point_vector.xml'), {strict:true}, function(err,map) {
            if (err) throw err;
            map.add_layer(layer);
    
            // console.log(map.toXML()); // Debug settings
            
            map.extent = bbox;
            var im = new mapnik.Image(map.width,map.height);
            map.render(im, function(err, im) {
              if (err) {
                throw err;
              } else {
                res.writeHead(200, {'Content-Type': 'image/png'});
                res.end(im.encodeSync('png'));
              }
            });
        });
      }
      catch (err) {        
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end(err.message);
      }
    }
  });  
}).listen(port);

console.log('Server running on port %d', port);
