'use strict';
// keys = container instances
var containerMap = {
    root: Container('root')
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

        // get the modules who have deps that have not been registered
        var unreadyModules = modules.filter( (module) => {
            // if there are deps and some have not been registered ...
            if (module.deps.length > 0 && module.deps.some( (dep) => {
                return container.get(dep) === null;
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

    var container = {
        id: id,
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
    /*
     * @function register
     * @param modules Object a key-value pair of modules to register
     * @param container Container optional, a container instance in which
     *        the modules should be registered.
     * @returns Container the container
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
     /*
      * @function invoke
      * @param module Function a function to invoke.
      * @param container Container optional, a container instance from
      *        which the dependencies should be injected
      * @returns * The return value of the invoked function
      * @description 
      * Invoke a function through the DI system. Dependencies will
      * automatically be applied as arguments to the function. Will
      * attempt to resolve dependencies from the specified container
      * (if provided) and will fall back on the root container if
      * dependencies cannot be met
      */
    invoke: (module, container) => {
        if (container === undefined) {
            container = containerMap.root;
        }
        return container.invoke(module);
    },
    /*
     * @function getInstance
     * @param key String the key of the registered module to get
     * @param container Container optional, a container instance in which
     *        to look. If unspecified, will use the root container.
     * @returns Object the registered module
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
    getContainer: (id) => containerMap[id] || containerMap.root || null,
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
    removeAll: function () {
        Object.keys(containerMap).forEach( (key) => {
            if (key !== 'root') { 
                delete containerMap[key];
            }
        });
        containerMap.root = Container('root');
    }
};
