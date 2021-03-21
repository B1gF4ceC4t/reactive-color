(function (context) {
	var _handlerMap = new Map();  // store effect callbacks
	var _usedReactivities = [];  // store dependencies
	var _reactivityMap = new Map();  // cache proxy objects

	function reactive(object) {
		if (Object.prototype.toString.call(object) !== "[object Object]") {
            // invalid type
			throw new TypeError("Expected a object");
			return;
		}

        // if proxy object of `object` used to be created
        // return memorized value directly
		if (_reactivityMap.has(object)) return object;

        // create proxy object
		var proxy = new Proxy(object, {
			get: function (target, prop) {
                // collect dependency
				_usedReactivities.push([target, prop]);
				if (typeof target[prop] === "object" && target[prop] !== null) {
                    // if value of `target[prop]` also is object
                    // make it reactive
					return reactive(target[prop]);
				}
                // get value
				return Reflect.get(target, prop);
			},
			set: function (target, prop, value) {
                // set value
				Reflect.set(target, prop, value);
				if (
					_handlerMap.has(target) &&
					_handlerMap.get(target).has(prop)
				) {
                    // execute callbacks
					_handlerMap
						.get(target)
						.get(prop)
						.forEach(function (handler) {
							handler();
						});
				}
			}
		});

        // memorize result
		_reactivityMap.set(object, proxy);
		_reactivityMap.set(proxy, proxy);

		return proxy;
	}

	function effect(handler) {
        // clear dependencies list
		_usedReactivities = [];

        // execute immediately
        // collect dependencies during this execution
		handler();

        // add callback according to dependency
		_usedReactivities.forEach(function (item) {
			var target = item[0];
			var prop = item[1];
			if (!_handlerMap.has(target)) {
				_handlerMap.set(target, new Map());
			}
			if (!_handlerMap.get(target).has(prop)) {
				_handlerMap.get(target).set(prop, new Set());
			}
			_handlerMap.get(target).get(prop).add(handler);
		});
	}

	context.reactive = reactive;
	context.effect = effect;
})(window);
