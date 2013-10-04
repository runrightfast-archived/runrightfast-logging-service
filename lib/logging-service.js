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
 * 
 * <code>
 *logListener 				OPTIONAL - listener function(event) that get
 *            						   notified when log event is emitted. If not specified, then a
 *            						   default listener will be registered that simply logs to the console
 *invalidEventListener 		OPTIONAL - function(event,error) - listener that is notified of invalid events that are submitted
 *postValidate 				OPTIONAL - function(event) - hook that runs after event is validated that can be used to perform addition
 *									   validation or adding additional metadata. Must return the event.            
 *logLevel 					OPTIONAL - this controls the internal level of logging for the LoggingService itself 
 *             						   default is WARN
 *</code>
 */

(function() {
	'use strict';

	var uuid = require('uuid');
	var lodash = require('lodash');
	var Hoek = require('hoek');
	var assert = Hoek.assert;

	var logging = require('runrightfast-commons').logging;
	var logger = logging.getLogger('runrightfast-logging-service');

	// LoggingService constructor
	var LoggingService = function LoggingService() {
		this.eventCount = 0;
		this.invalidEventCount = 0;
	};

	LoggingService.prototype.handleEvent = function(event) {
		try {
			console.log(JSON.stringify(event));
		} catch (e) {
			console.error("JSON.stringify(event) failed : %s", e.message);
			console.log(event);
		}
	};

	LoggingService.prototype.handleInvalidEvent = function(event, error) {
		var badEvent = {
			ts : new Date(),
			event : 'invalidEvent',
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

	/**
	 * @param event
	 *            Object that contains the following properties:
	 *            <ul>
	 *            <li>tags - REQUIRED - String Array
	 *            <li>data - OPTIONAL - any object
	 *            <li>ts - OPTIONAL - either a Number representing the EPOCH
	 *            time for the event, a string representing an RFC2822 or ISO
	 *            8601 date, or a Date. If not specified, then the current time
	 *            will be set.
	 *            </ul>
	 *            adds a uuid property when the event is valid
	 * 
	 * @returns event
	 */
	LoggingService.prototype.validateEvent = function(event) {
		assert(lodash.isObject(event), "event must be an object");
		assert(lodash.isArray(event.tags) && !lodash.isEmpty(event.tags), "event must contain an Array property named tags and cannot be empty");
		if (event.data) {
			assert(lodash.isObject(event.data) || lodash.isString(event.data), "event data must be an object or string");
		}

		if (event.ts) {
			if (lodash.isString(event.ts)) {
				event.ts = new Date(Date.parse(event.ts));
			} else if (lodash.isNumber(event.ts)) {
				event.ts = new Date(event.ts);
			} else {
				assert(lodash.isDate(event.ts), "event.ts must be a Date");
			}
		} else {
			event.ts = new Date();
		}
		event.uuid = uuid.v4();

		return this.postValidate(event);
	};

	/**
	 * Provides a hook that runs after the event is validated.
	 * 
	 * Use cases:
	 * <ul>
	 * <li>add additional meta-data, e.g., host, pid, module name and version
	 * <li>add additional validation, e.g, data validation
	 * </ul>
	 * 
	 * @param event
	 * @returns
	 */
	LoggingService.prototype.postValidate = function(event) {
		return event;
	};

	/**
	 * If the event is valid, then it will be emitted to all registered
	 * listeners and the eventCount will be incremented.
	 * 
	 * If the event fails validation, then the invalidCounts is incremented, and
	 * an 'badEvent' event is emitted.
	 * 
	 * @param event
	 *            REQUIRED - see validate for event object description
	 */
	LoggingService.prototype.log = function(event) {
		try {
			this.validateEvent(event);
			this.eventCount++;
			this.handleEvent(event);
		} catch (error) {
			this.invalidEventCount++;
			this.handleInvalidEvent(event, error);
		}
	};

	module.exports = function(options) {
		var loggingService = new LoggingService();

		var configureLogListener = function(logListener) {
			if (logListener) {
				if (lodash.isFunction(logListener)) {
					loggingService.handleEvent = logListener;
				} else {
					throw new Error('logListener must be a function');
				}
			}
		};

		var configureInvalidEventListener = function(invalidEventListener) {
			if (invalidEventListener) {
				if (lodash.isFunction(invalidEventListener)) {
					loggingService.handleInvalidEvent = invalidEventListener;
				} else {
					throw new Error('invalidEventListener must be a function');
				}
			}
		};

		var configurePostValidate = function(postValidate) {
			if (postValidate) {
				if (lodash.isFunction(postValidate)) {
					loggingService.postValidate = postValidate;
				} else {
					throw new Error('postValidate must be a function');
				}
			}
		};

		var defaultOptions = {
			logLevel : 'WARN'
		};
		var config = Hoek.applyToDefaults(defaultOptions, options || {});

		configureLogListener(config.logListener);
		configureInvalidEventListener(config.invalidEventListener);
		configurePostValidate(config.postValidate);
		logging.setLogLevel(logger, config.logLevel);

		if (logger.isLevelEnabled('DEBUG')) {
			logger.debug(config);
		}

		return loggingService;
	};

}());
