runrightfast-logging-service
============================

Logging Service Module
==
- Log events are logged asynchronously leveraging the events module
- The log event is modeled against Hapi log events. Log Events are objects that contains the following properties
 - tags - REQUIRED - Array of strings - at least one tag is required
 - data - OPTIONAL - any object
 - ts - OPTIONAL - event timestamp as a Date object
- Invalid events are rejected and triggers a 'badEvent' to be emitted to be handled by the badEventListener


```
var loggingService = require('runrightfast-logging-service')();

// logged asynchronously - emits an event to the registered logListener
loggingService.log({
	tags : ['warn','database'],
	data : {maxConns:50, poolSize:40, message:'The number of connections in use has reached 80%'}
});
```

- The logging service can be configured by specifying an options object :


```
var consoleLogger = function(event){
   console.log(event);
};

var badEventLogger = function(event,e){
   var badEvent = {
	ts : new Date(),
	event : BAD_EVENT,
	badEvent : event,
	error : error
   };
   console.error(badEvent);
};

var options = {
   logListener : consoleLogger,
   badEventListener : badEventLogger
};

var loggingService = require('runrightfast-logging-service')(options);
```
- Options
 - logListener : is notified when a event is logged - default listener logs to stdout
 - badEventListener : is notified when an invalid log event is received - default listener logs to stderr



