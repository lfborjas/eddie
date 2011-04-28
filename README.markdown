#Eddie: una muestra de abstracción en Javascript

El servidor usa [node.js](http://nodejs.org/). El cliente usa [jquery](http://jquery.com/), 
[showdown (para markdown)](http://softwaremaniacs.org/playground/showdown-highlight/)
y [highlight js](http://softwaremaniacs.org/soft/highlight/en/) para coloreo de sintaxis.


##La aplicación

Se entra a la página principal y el cliente hace long polling para obtener mensajes.
También puede crear mensajes. Los clientes reciben los mensajes en tiempo real.
