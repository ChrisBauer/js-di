# API Reference

* [injector](#module_injector)
    * [~register(modules, container)](#module_injector..register) ⇒ <code>[Container](#Container)</code>
    * [~invoke(module, container)](#module_injector..invoke) ⇒ <code>\*</code>
    * [~getInstance(key, container)](#module_injector..getInstance) ⇒ <code>\*</code>
    * [~getContainer(id)](#module_injector..getContainer) ⇒ <code>[Container](#Container)</code>
    * [~createContainer(id, parent)](#module_injector..createContainer) ⇒ <code>[Container](#Container)</code>

<a name="module_injector..register"></a>
### injector~register(modules, container) ⇒ <code>[Container](#Container)</code>
Registers the modules in the specified container. If
no container is specified, uses the root container.

**Kind**: inner method of <code>[injector](#module_injector)</code>  
**Returns**: <code>[Container](#Container)</code> - the container  

| Param | Type | Description |
| --- | --- | --- |
| modules | <code>Object</code> | a key-value pair of modules to register |
| container | <code>[Container](#Container)</code> | optional, a container instance in which        the modules should be registered. |

<a name="module_injector..invoke"></a>
### injector~invoke(module, container) ⇒ <code>\*</code>
Invoke a function through the DI system. Dependencies will
automatically be applied as arguments to the function. Will
attempt to resolve dependencies from the specified container
(if provided) and will recursively look through parent containers if the
dependencies cannot be met

**Kind**: inner method of <code>[injector](#module_injector)</code>  
**Returns**: <code>\*</code> - The return value of the invoked function  

| Param | Type | Description |
| --- | --- | --- |
| module | <code>function</code> | a function to invoke. |
| container | <code>[Container](#Container)</code> | optional, a container instance from        which the dependencies should be injected |

<a name="module_injector..getInstance"></a>
### injector~getInstance(key, container) ⇒ <code>\*</code>
Manually get an registered instance from the specified container
(if provided) or from the root container.

**Kind**: inner method of <code>[injector](#module_injector)</code>  
**Returns**: <code>\*</code> - the registered module  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | the key of the registered module to get |
| container | <code>[Container](#Container)</code> | optional, a container instance in which        to look. If unspecified, will use the root container. |

<a name="module_injector..getContainer"></a>
### injector~getContainer(id) ⇒ <code>[Container](#Container)</code>
if an id is passed, returns the matching container, or null
if no id is passed, returns the root container

**Kind**: inner method of <code>[injector](#module_injector)</code>  
**Returns**: <code>[Container](#Container)</code> - the specified container  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | optional the id of the container to get |

<a name="module_injector..createContainer"></a>
### injector~createContainer(id, parent) ⇒ <code>[Container](#Container)</code>
Creates a new Container with the specified ID. If parent is a string, it will
use the container corresponding to that id. If the id does not match any containers,
it will throw an exception. If parent is not a string, it checks to make sure the
specified argument has an `id` property and that a container with this id already
exists. Otherwise, it will throw an exception. If parent is unspecified, the
root container will be set as the parent

**Kind**: inner method of <code>[injector](#module_injector)</code>  
**Returns**: <code>[Container](#Container)</code> - the new container  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | the id of the container to create |
| parent | <code>[Container](#Container)</code> &#124; <code>String</code> | the container to set as the new container's parent,        or an id corresponding to the container to set as the parent |



**Kind**: global class  

* [Container](#Container)
    * _instance_
        * [.register(modules)](#Container+register) ⇒ <code>[Container](#Container)</code>
        * [.get(key)](#Container+get)
        * [.invoke(module)](#Container+invoke) ⇒ <code>\*</code>
    * _static_
        * [.id](#Container.id)

<a name="Container+register"></a>
### container.register(modules) ⇒ <code>[Container](#Container)</code>
Registers one or more modules within the current container. Modules can be specified in any order.
If a module being registered in a child container requires a module that does not exist in the current
container, it will recursively look through parent containers until it finds it UNLESS a new
instance of that dependency is being registered as part of this call to .register()

Circular dependencies are caught and an exception is thrown.

**Kind**: instance method of <code>[Container](#Container)</code>  
**Returns**: <code>[Container](#Container)</code> - the container (for chaining)  

| Param | Type | Description |
| --- | --- | --- |
| modules | <code>Object</code> | a map of modules to register, where the key is the id        with which to register the module, and the value is the invocable function        which will return the instance to store |

<a name="Container+get"></a>
### container.get(key)
Get a module from this container with the specified key. If it does not
exist in the container, recursively search through parent containers. If
it has not been registered in any ancestor, return null

**Kind**: instance method of <code>[Container](#Container)</code>  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | the key corresponding to the dependency to get |

<a name="Container+invoke"></a>
### container.invoke(module) ⇒ <code>\*</code>
Invoke a function through the DI system. Dependencies will
automatically be applied as arguments to the function. Will
attempt to resolve dependencies from the current container
(if provided) and recursively look through parent containers if the
dependencies cannot be met

**Kind**: instance method of <code>[Container](#Container)</code>  
**Returns**: <code>\*</code> - The return value of the invoked function  

| Param | Type | Description |
| --- | --- | --- |
| module | <code>function</code> | a function to invoke. |

<a name="Container.id"></a>
### Container.id
the id of the container

**Kind**: static property of <code>[Container](#Container)</code>  
**Properties**

| Name | Description |
| --- | --- |
| id | String |

