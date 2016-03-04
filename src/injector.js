/**
 * Copyright (c) 2016, Chris Bauer <cbauer@outlook.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose 
 * with or without fee is hereby granted, provided that the above copyright notice and 
 * this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT,
 * OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE,
 * DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS
 * ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

/**
    * @class Container
    */
/**
 * @module injector
 */

'use strict';

// maintain cache of containers
var containerMap = {
    root: Container('root')
};

function Container (id, parentContainer) {
    var locals = {};
    var parent = parentContainer;

    // recursive method to register dependencies
    function registerLoop (modules, instances) {
        // if nothing was resolved in the last pass, there is likely a
        // circular dependency in the modules.
        if (this.lastModules && modules.length > 0 && this.lastModules.length === modules.length) {
            console.error('circular dependencies in modules: ');
            console.error(modules);
            throw new Error('CircularDependencyError: failed to register dependencies');
        }
        
        // assuming no circular dependencies
        this.lastModules = modules;
        var moduleNames = modules.map( (module) => module.key );

        // get the modules who have deps that have not been registered
        var unreadyModules = modules.filter( (module) => {
            // if there are deps and some have not been registered ...
            if (module.deps.length > 0 && module.deps.some( (dep) => {
                return (!locals[dep] && moduleNames.indexOf(dep) !== -1) || container.get(dep) === null;
            })) {
                // ... make sure it gets in the next pass
                return true;
            }
            // otherwise go ahead and invoke it ...
            else {
                locals[module.key] = container.invoke(module.instance)
                // ... and filter it out
                return false;
            }
        });

        // if there are still some modules to be registered, recur
        if (unreadyModules.length > 0) {
            return registerLoop.call(this, unreadyModules, instances);
        }
    };

    var getInstances = (depKeys, container) => {
        return depKeys.map( (depKey) => container.get(depKey.trim()) );
    };

    var getDepKeys = (module) => {
        //  reflection code that won't work when minified so we follow
        //  the Angular 1 pattern of creating an array of deps and attaching it

        // var args = module.toString().match(/\([a-zA-Z0-9,_\$\ ]*\)/)[0];
        // args = args.substring(1, args.length - 1).split(',');
        // var args = module._inject;
        return module._inject || [];
    };

    var container = {
        /**
         * @property id String
         * @memberOf Container
         * @description
         * the id of the container
         */
        id: id,
        /**
         * @function register
         * @memberOf Container
         * @instance
         * @param modules {Object} a map of modules to register, where the key is the id
         *        with which to register the module, and the value is the invocable function
         *        which will return the instance to store
         * @return {Container} the container (for chaining)
         * @description
         * Registers one or more modules within the current container. Modules can be specified in any order.
         * If a module being registered in a child container requires a module that does not exist in the current
         * container, it will recursively look through parent containers until it finds it UNLESS a new
         * instance of that dependency is being registered as part of this call to .register()
         * 
         * Circular dependencies are caught and an exception is thrown.
         */
        register: (modules) => {
            var depList = Object.keys(modules).map( (key) => {
                var deps = getDepKeys(modules[key]);
                return {key: key, deps: deps, instance: modules[key]};
            });

            // currently handles dependencies by looping over the list
            // probably could be made quite a bit smarter with a DAG
            registerLoop.call({}, depList, locals);
            return container;
        },
        /**
         * @function get
         * @memberOf Container
         * @instance
         * @param key {String} the key corresponding to the dependency to get
         * @description
         * Get a module from this container with the specified key. If it does not
         * exist in the container, recursively search through parent containers. If
         * it has not been registered in any ancestor, return null
         */
        get: (key) => {
            if (locals[key]) {
               return locals[key];
            }
            else if (parent) {
                return parent.get(key);
            }
            return null;
        },
        // the one requirement of this system is that injector.invoke()
        // must be called on a function. This means modules
        // that export objects to be constructed must be wrapped a function
        // such as
        // function invokeFoo () { return new Foo(); }
        // or
        // function invokeReactClass () { return React.createClass(...); }
         /**
          * @function invoke
          * @memberOf Container
          * @instance
          * @param module {Function} a function to invoke.
          * @returns {*} The return value of the invoked function
          * @description 
          * Invoke a function through the DI system. Dependencies will
          * automatically be applied as arguments to the function. Will
          * attempt to resolve dependencies from the current container
          * (if provided) and recursively look through parent containers if the
          * dependencies cannot be met
          */
        invoke: (module) => {
            // if it's a function
            if (typeof module !== 'function') {
                console.error('attempted to invoke module, but was not a function: ');
                console.error(module);
                throw new Error('attempted to invoke module, but was not a function');
            }
            // if it requires injection, apply the arguments
            if (module._inject !== undefined) {
                var instances = getInstances(getDepKeys(module), container);
                return module.apply(module, instances);
            }
            // otherwise, just call the function
            else {
                return module.call(module);
            }
        }
    };

    return container;
}

// external API
module.exports = {
    // "simple API"
    /**
     * @function register
     * @instance
     * @param modules {Object} a key-value pair of modules to register
     * @param container {Container} optional, a container instance in which
     *        the modules should be registered.
     * @returns {Container} the container
     * @description
     * Registers the modules in the specified container. If
     * no container is specified, uses the root container.
     */
    register: (modules, container) => {
        if (container === undefined) {
            container = containerMap.root;
        }
        return container.register(modules);
    },
     /**
      * @function invoke
      * @instance
      * @param module {Function} a function to invoke.
      * @param container {Container} optional, a container instance from
      *        which the dependencies should be injected
      * @returns {*} The return value of the invoked function
      * @description 
      * Invoke a function through the DI system. Dependencies will
      * automatically be applied as arguments to the function. Will
      * attempt to resolve dependencies from the specified container
      * (if provided) and will recursively look through parent containers if the
      * dependencies cannot be met
      */
    invoke: (module, container) => {
        if (container === undefined) {
            container = containerMap.root;
        }
        return container.invoke(module);
    },
    /**
     * @function getInstance
     * @instance
     * @param key {String} the key of the registered module to get
     * @param container {Container} optional, a container instance in which
     *        to look. If unspecified, will use the root container.
     * @returns {*} the registered module
     * @description
     * Manually get an registered instance from the specified container
     * (if provided) or from the root container.
     */
    getInstance: (key, container) => {
        if (container === undefined) {
            container = containerMap.root;
        }
        return container.get(key)
    },
    // for handling multiple containers
    /**
     * @function getContainer
     * @instance
     * @param id {String} optional the id of the container to get
     * @returns {Container} the specified container
     * @description
     * if an id is passed, returns the matching container, or null
     * if no id is passed, returns the root container
     */
    getContainer: (id) => {
        if (id) {
            return containerMap[id] || null;
        }
        else {
            return containerMap.root;
        }
    },
    /**
     * @function createContainer
     * @instance
     * @param id {String} the id of the container to create
     * @param parent {Container|String} the container to set as the new container's parent,
     *        or an id corresponding to the container to set as the parent
     * @returns {Container} the new container
     * @description
     * Creates a new Container with the specified ID. If parent is a string, it will
     * use the container corresponding to that id. If the id does not match any containers,
     * it will throw an exception. If parent is not a string, it checks to make sure the
     * specified argument has an `id` property and that a container with this id already
     * exists. Otherwise, it will throw an exception. If parent is unspecified, the
     * root container will be set as the parent
     */
    createContainer: (id, parent) => {
        if (containerMap[id]) {
            // a container with the specified id already exists
            // throw?
            console.warn('a container with the specified id already exists. ' +
                'returning the pre-existing container');
            return containerMap[id];
        }
        // if it's a string, assume it's an id
        if (parent !== undefined) {
            if (typeof parent === 'string') {
                // parentId
                if (!containerMap[parent]) {
                    // no parent exists
                    console.error('Specified parent container ID `' + parent + '`' +
                        ', but no container has been registered with that ID');
                    throw new Error('Invalid Parent Container ID specified: `' + parent + '`'); 
                }
                parent = containerMap[parent];
            }
            else if (!parent['id'] || !containerMap.hasOwnProperty(parent['id'])) {
                console.error('Invalid argument. Second parameter must be either a valid' +
                    ' container ID, or a registered container instance. Value was');
                console.error(parent);
                throw new Error('Invalid Parent Container specified: ' + parent.toString());
            }
            containerMap[id] = Container(id, parent);
            return containerMap[id];
        }
        // create a new container using the root as a parent
        containerMap[id] = Container(id, containerMap.root);
        return containerMap[id];
    },
    // TODO: used only for testing. determine how to get multiple instances for unit testing
    removeAll: function () {
        Object.keys(containerMap).forEach( (key) => {
            if (key !== 'root') { 
                delete containerMap[key];
            }
        });
        containerMap.root = Container('root');
    }
};
