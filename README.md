runrightfast-logging-service
============================

Logging Service Module
==


var loggingService = require('runrightfast-logging-service')();
loggingService.log({
	tags : ['warn','database'],
	data : {maxConns:50, poolSize:40, message:'The number of connections in use has reached 80%'}
});


// by default, there is a log
