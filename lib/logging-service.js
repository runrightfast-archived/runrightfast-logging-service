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

/**
 * @param options
 *            OPTIONAL - where options is an object with the following
 *            properties:
 *            <ul>
 *            <li>logListener - OPTIONAL - listener function(event) that get
 *            notified when log event is emitted. If not specified, then a
 *            default listener will be registered that simply logs to the
 *            console
 *            <li>badEventListener - OPTIONAL - function(event,error) -
 *            listener that is notified of invalid events that are submitted
 *            </ul>
 * 
 */

(function() {
	'use strict';

	var util = require("util");
	var EventEmitter = require('events').EventEmitter;
	var lodash = require('lodash');
	var Hoek = require('hoek');
	var assert = Hoek.assert;

	// events
	var LOG = 'log', BAD_EVENT = 'badEvent';

	// LoggingService constructor
	function LoggingService() {
		EventEmitter.call(this);
		this.eventCount = 0;
		this.invalidEventCount = 0;
	}

	util.inherits(LoggingService, EventEmitter);

	/**
	 * If the event is valid, then it will be emitted to all registered
	 * listeners and the eventCount will be incremented.
	 * 
	 * If the event fails validation, then the invalidCounts is incremented, and
	 * an 'badEvent' event is emitted.
	 * 
	 * @param event -
	 *            REQUIRED - see validate for event object description
	 */
	LoggingService.prototype.log = function(event) {
		/**
		 * @param event
		 *            Object that contains the following properties:
		 *            <ul>
		 *            <li>tags - REQUIRED - String Array
		 *            <li>data - OPTIONAL - any object
		 *            <li>ts - OPTIONAL - Number representing the EPOCH time
		 *            for the event. If not specified, then the current time
		 *            will be set.
		 *            </ul>
		 */
		var validateEvent = function(event) {
			assert(lodash.isObject(event), "event must be an object");
			assert(lodash.isArray(event.tags) && !lodash.isEmpty(event.tags), "event must contain an Array property named tags and cannot be empty");
			if (event.data) {
				assert(lodash.isObject(event.data) || lodash.isString(event.data), "event data must be an object or string");
			}
			if (event.ts) {
				assert(lodash.isDate(event.ts), "event.ts must be a Date");
			} else {
				event.ts = new Date();
			}
		};

		try {
			validateEvent(event);
			this.eventCount++;
			this.emit(LOG, event);
		} catch (error) {
			this.invalidEventCount++;
			this.emit(BAD_EVENT, event, error);
		}
	};

	var defaultLogListener = function(event) {
		try {
			console.log(JSON.stringify(event));
		} catch (e) {
			console.error("JSON.stringify(event) failed : %s", e.message);
			console.log(event);
		}
	};

	var defaultBadEventListener = function(event, error) {
		var badEvent = {
			ts : new Date(),
			event : BAD_EVENT,
			badEvent : event,
			error : error
		};
		try {
			console.error(JSON.stringify(badEvent));
		} catch (e) {
			console.error("JSON.stringify(badEvent) failed : %s", e.message);
			console.error(badEvent);
		}
	};

	module.exports = function(options) {
		var loggingService = new LoggingService();

		var configureLogListener = function(logListener) {
			if (logListener) {
				if (lodash.isFunction(logListener)) {
					loggingService.on(LOG, logListener);
				} else {
					throw new Error('logListener must be a function');
				}
			} else {
				loggingService.on(LOG, defaultLogListener);
			}
		};

		var configureBadEventListener = function(badEventListener) {
			if (badEventListener) {
				if (lodash.isFunction(badEventListener)) {
					loggingService.on(BAD_EVENT, badEventListener);
				} else {
					throw new Error('badEventListener must be a function');
				}
			} else {
				loggingService.on(BAD_EVENT, defaultBadEventListener);
			}
		};

		if (options) {
			configureLogListener(options.logListener);
			configureBadEventListener(options.badEventListener);
		} else {
			loggingService.on(LOG, defaultLogListener);
			loggingService.on(BAD_EVENT, defaultBadEventListener);
		}

		return loggingService;
	};

}());
