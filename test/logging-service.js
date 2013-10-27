/**
 * Copyright [2013] [runrightfast.co]
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
'use strict';

var expect = require('chai').expect;
var lodash = require('lodash');

describe("LoggingService", function() {

	it("can log events to console when no options are specified", function() {
		var loggingService = require('../lib')();
		var event = {
			tags : [ 'info' ],
			data : 'LoggingService can log events to console when no options are specified'
		};
		loggingService.log(event);
		expect(loggingService.invalidEventCount).to.equal(0);

		for (var i = 0; i < 3; i++) {
			loggingService.log({
				tags : [ 'info' ],
				data : {
					i : i
				}
			});
		}

		expect(loggingService.invalidEventCount).to.equal(0);
		expect(loggingService.eventCount).to.be.gt(0);
	});

	it("logLevel is a config option and can be configured to DEBUG", function() {
		var loggingService = require('../lib')({
			logLevel : 'DEBUG'
		});
		var event = {
			tags : [ 'info' ],
			data : 'LoggingService can log events to console when no options are specified'
		};
		loggingService.log(event);
		expect(loggingService.invalidEventCount).to.equal(0);

		for (var i = 0; i < 3; i++) {
			loggingService.log({
				tags : [ 'info' ],
				data : {
					i : i
				}
			});
		}

		expect(loggingService.invalidEventCount).to.equal(0);
		expect(loggingService.eventCount).to.be.gt(0);
	});

	it("invalid logLevel config options will be rejected", function(done) {
		try {
			require('../lib')({
				logLevel : 'INVALID_LOG_LEVEL'
			});
			done(new Error('Expected an error because logLevel was invalid'));
		} catch (error) {
			done();
		}
	});

	it('can accept null options', function() {
		var loggingService = require('../lib')(null);
		loggingService.log({
			tags : [ 'info' ],
			data : 'LoggingService can except null options'
		});
		expect(loggingService.invalidEventCount).to.equal(0);
	});

	it('can accept undefined options', function() {
		var loggingService = require('../lib')(undefined);
		loggingService.log({
			tags : [ 'info' ],
			data : 'LoggingService can accept undefined options'
		});
		expect(loggingService.invalidEventCount).to.equal(0);
	});

	it("can emit events to a registered log listener that was specified in the config options", function(done) {
		var logListenerInvocationCount = 0;

		var options = {
			logListener : function(event) {
				console.log(JSON.stringify(event));
				expect(this.eventCount).to.equal(1);
				logListenerInvocationCount++;
				done();
			}
		};

		var loggingService = require('../lib')(options);

		expect(loggingService.eventCount).to.equal(0);
		expect(loggingService.invalidEventCount).to.equal(0);

		var event = {
			tags : [ 'info' ],
			data : 'LoggingService can emit events to a registered log listener that was specified in the config options'
		};
		loggingService.log(event);
		expect(logListenerInvocationCount).to.equal(1);
		expect(loggingService.invalidEventCount).to.equal(0);

	});

	it("can plugin a postValidate function that was specified in the config options", function(done) {
		var os = require('os');
		var logListenerInvocationCount = 0;

		var options = {
			logListener : function(event) {
				console.log(JSON.stringify(event));
				expect(this.eventCount).to.equal(1);
				expect(event.host).to.equal(os.hostname());
				logListenerInvocationCount++;
				done();
			},
			postValidate : function(event) {
				event.host = os.hostname();
				return event;
			}
		};

		var loggingService = require('../lib')(options);

		expect(loggingService.eventCount).to.equal(0);
		expect(loggingService.invalidEventCount).to.equal(0);

		var event = {
			tags : [ 'info' ],
			data : 'LoggingService can emit events to a registered log listener that was specified in the config options'
		};
		loggingService.log(event);
		expect(logListenerInvocationCount).to.equal(1);
		expect(loggingService.invalidEventCount).to.equal(0);

	});

	it("the postValidate config option must be a function, otherwise it causes the module not to load", function(done) {
		var options = {
			postValidate : 2
		};

		try {
			require('../lib')(options);
			done(new Error('Expected an error because options.postValidate is not a Function'));
		} catch (error) {
			done();
		}

	});

	it("can log events objects that only have a tags property", function(done) {
		var options = {
			invalidEventListener : function(event, e) {
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

				expect(loggingService.invalidEventCount).to.equal(1);
				done();
			}
		};

		var loggingService = require('../lib')(options);

		expect(loggingService.eventCount).to.equal(0);
		expect(loggingService.invalidEventCount).to.equal(0);

		var event = {};
		loggingService.log(event);
	});

	it("the event.tags must have at least 1 tag", function(done) {
		var options = {
			invalidEventListener : function(event, e) {
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

				expect(loggingService.invalidEventCount).to.equal(1);
				done();
			}
		};

		var loggingService = require('../lib')(options);

		expect(loggingService.eventCount).to.equal(0);
		expect(loggingService.invalidEventCount).to.equal(0);

		var event = {
			tags : []
		};
		loggingService.log(event);
	});

	it("has a default badEvent listener that logs bad events to the console", function(done) {
		var options = {
			logListener : function(event) {
				console.log(JSON.stringify(event));
				expect(this.eventCount).to.equal(1);
				done();
			}
		};

		var loggingService = require('../lib')(options);

		expect(loggingService.eventCount).to.equal(0);
		expect(loggingService.invalidEventCount).to.equal(0);

		// invalid event
		loggingService.log({});
		// log valid event, to give time to the invalid event to process
		loggingService.log({
			tags : [ 'info' ]
		});
		expect(loggingService.invalidEventCount).to.equal(1);
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

	it("an event can be logged with a timestamp", function(done) {
		var now = new Date();

		var options = {
			logListener : function(event) {
				console.log(JSON.stringify(event));
				expect(event.ts).to.equal(now);
				done();
			}
		};

		var loggingService = require('../lib')(options);

		expect(loggingService.eventCount).to.equal(0);
		expect(loggingService.invalidEventCount).to.equal(0);

		var event = {
			tags : [ 'info' ],
			data : 'message',
			ts : now
		};
		loggingService.log(event);

		expect(loggingService.invalidEventCount).to.equal(0);
	});

	it("default logger can handle events that can't be stringified", function() {
		var loggingService = require('../lib')();

		var eventData = {
			that : this
		};

		loggingService.log({
			tags : [ 'info' ],
			data : eventData
		});

	});

	it("badEvent logger can handle events that can't be stringified", function() {
		var loggingService = require('../lib')();

		var eventData = {
			that : this
		};

		loggingService.log({
			data : eventData
		});

		loggingService.log({
			tags : [ 'info' ]
		});

	});

	it("options.logListener must be a function if specified", function() {
		try {
			require('../lib')({
				logListener : {}
			});
			throw new Error('expected an Error to be thrown because no event.tags were specified');
		} catch (error) {
			// expected
		}
	});

	it("options.invalidEventListener must be a function if specified", function() {
		try {
			require('../lib')({
				invalidEventListener : {}
			});
			throw new Error('expected an Error to be thrown because no event.tags were specified');
		} catch (error) {
			// expected
		}
	});

	describe('validateEvent', function() {
		it('is composable - meaning it returns the event if the event is valid', function() {
			var loggingService = require('../lib')();
			var stringify = lodash.compose(function(event) {
				return JSON.stringify(event);
			}, lodash.bind(loggingService.validateEvent, loggingService));

			var event = {
				tags : [ 'info' ],
				data : "message"
			};
			var json = stringify(event);

			expect(json).to.equal(JSON.stringify(event));
		});

		it('validates that the ts is either a parsable Date string, a number representing EPOCH time, or a Date object', function() {
			var loggingService = require('../lib')();

			var event = {
				tags : [ 'info' ],
				data : "message",
				ts : new Date()
			};

			loggingService.validateEvent(event);
			loggingService.validateEvent(JSON.parse(JSON.stringify(event)));
			event = {
				tags : [ 'info' ],
				data : "message",
				ts : Date.now()
			};
			console.log('Date.now = ' + Date.now);
			console.log('event with ts set to EPOCH time: ' + JSON.stringify(event));
			loggingService.validateEvent(JSON.parse(JSON.stringify(event)));
		});

		it('adds an id property', function() {
			var loggingService = require('../lib')();

			var event = {
				tags : [ 'info' ],
				data : "message",
				ts : new Date()
			};

			event = loggingService.validateEvent(event);
			expect(event.id).to.exist;
			console.log('event.id type = ' + (typeof event.id));
		});
	});

});
