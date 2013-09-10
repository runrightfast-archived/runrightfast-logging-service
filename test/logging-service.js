'use strict';

var expect = require('chai').expect;
var assert = require('chai').assert;

describe("LoggingService", function() {

	it("can log events to console when no options are specified", function() {
		var loggingService = require('../lib')();
		var event = {
			tags : [ 'info' ],
			data : 'LoggingService can log events to console when no options are specified'
		};
		loggingService.log(event);
		expect(loggingService.getInvalidEventCount()).to.equal(0);

		for ( var i = 0; i < 10; i++) {
			loggingService.log({
				tags : [ 'info' ],
				data : {
					i : i
				}
			});
		}

		expect(loggingService.getInvalidEventCount()).to.equal(0);
		expect(loggingService.getEventCount()).to.gt(0);
	});

	it("can emit events to a registered log listener that was specified in the config options", function(done) {
		var options = {
			logListener : function(event) {
				console.log(JSON.stringify(event));
				expect(this.getEventCount()).to.equal(1);
				done();
			}
		};

		var loggingService = require('../lib')(options);

		expect(loggingService.getEventCount()).to.equal(0);
		expect(loggingService.getInvalidEventCount()).to.equal(0);

		var event = {
			tags : [ 'info' ],
			data : 'LoggingService can emit events to a registered log listener that was specified in the config options'
		};
		loggingService.log(event);

		expect(loggingService.getInvalidEventCount()).to.equal(0);

	});

	it("can log events objects that only have a tags property", function(done) {
		var options = {
			badEventListener : function(event, e) {
				var badEvent = {
					ts : new Date(),
					event : 'badEvent',
					badEvent : event,
					error : e
				};
				try {
					console.log(JSON.stringify(badEvent));
				} catch (e) {
					console.error("JSON.stringify(event) failed : %s", e.message);
					console.log(badEvent);
				}

				expect(loggingService.getInvalidEventCount()).to.equal(1);
				done();
			}
		};

		var loggingService = require('../lib')(options);

		expect(loggingService.getEventCount()).to.equal(0);
		expect(loggingService.getInvalidEventCount()).to.equal(0);

		var event = {};
		loggingService.log(event);

	});

	it("will throw an error if event is undefined", function() {
		var loggingService = require('../lib')();
		try {
			loggingService.log(null);
			throw new Error('expected an Error to be thrown because a null event was passed in');
		} catch (e) {
			// expected
		}
	});

	it("will throw an error if event.tags is undefined", function() {
		var loggingService = require('../lib')();
		try {
			loggingService.log({
				data : 'message'
			});
			throw new Error('expected an Error to be thrown because no event.tags were specified');
		} catch (e) {
			// expected
		}
	});

});
