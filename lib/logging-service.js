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
module.exports = function(options) {
	'use strict';

	var lodash = require('lodash');
	var EventEmitter = require('events').EventEmitter;
	var Hoek = require('hoek');

	var assert = Hoek.assert;

	// events
	var LOG = 'log', BAD_EVENT = 'badEvent';

	var loggingService = new EventEmitter();

	var eventCount = 0, invalidEvents = 0;

	loggingService.getEventCount = function() {
		return eventCount;
	};

	loggingService.getInvalidEventCount = function() {
		return invalidEvents;
	};

	/**
	 * @param event
	 *            Object that contains the following properties:
	 *            <ul>
	 *            <li>tags - REQUIRED - String Array
	 *            <li>data - OPTIONAL - any object
	 *            <li>timsetamp - OPTIONAL - Number representing the EPOCH time
	 *            for the event. If not specified, then the current time will be
	 *            set.
	 *            </ul>
	 */
	var validateEvent = function(event) {
		assert(event, "event is required");
		assert(lodash.isObject(event), "event must be an object");
		assert(lodash.isArray(event.tags), "event must contain an Array property named tags");
		if (event.data) {
			assert(lodash.isObject(event.data) || lodash.isString(event.data), "event data must be an object or string");
		}
		if (event.timestamp) {
			assert(lodash.isDate(event.timestamp), "event.timestamp must be a Date");
		} else {
			event.timestamp = new Date();
		}
	};

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
	var log = function(event) {
		try {
			validateEvent(event);
			eventCount++;
			loggingService.emit(LOG, event);
		} catch (error) {
			invalidEvents++;
			loggingService.emit(BAD_EVENT, event, error);
		}
	};

	loggingService.log = log;

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
			console.log(JSON.stringify(badEvent));
		} catch (e) {
			console.error("JSON.stringify(event) failed : %s", e.message);
			console.log(badEvent);
		}
	};

	if (options) {
		if (options.logListener) {
			if (lodash.isFunction(options.logListener)) {
				loggingService.on(LOG, options.logListener);
			} else {
				throw new Error('options.logListener must be a function');
			}
		} else {
			loggingService.on(LOG, defaultLogListener);
		}

		if (options.badEventListener) {
			if (lodash.isFunction(options.badEventListener)) {
				loggingService.on(BAD_EVENT, options.badEventListener);
			} else {
				throw new Error('options.badEventListener must be a function');
			}
		} else {
			loggingService.on(BAD_EVENT, defaultBadEventListener);
		}
	} else {
		loggingService.on(LOG, defaultLogListener);
	}

	return loggingService;
};
