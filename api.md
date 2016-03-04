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

