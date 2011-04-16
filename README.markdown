#Eddie

Entendiendo y abstrayendo HTTP en [WSGI](http://wsgi.org/wsgi/WsgiStart), [Rack](http://rack.rubyforge.org/) y [Ring](http://mmcgrana.github.com/2010/03/clojure-web-development-ring.html). 

Ninguna de las branches está terminada por ahora, sólo llegué al punto de reinventar un modelo donde se separan las preocupaciones, así que no es como que podés usar esto como un "framework". Más bien, como una experiencia de aprendizaje.

##Branches

Hay un branch (versión) para cada lenguaje, cada cual con su historial incremental de progreso:

* [Python](https://github.com/lfborjas/eddie/tree/python)
* [Ruby](https://github.com/lfborjas/eddie/tree/ruby)
* [Clojure](https://github.com/lfborjas/eddie/tree/clojure)

Hasta ahora, el ganador es python: pude hacer todo lo básico **sin ninguna dependencia externa**. En ruby, hubo que usar una librería externa para rack y otra para el uuid. En clojure, igual, ring y [clj-uuid](http://clojars.org/clj-uuid), además de que hubo que escribir [una pobre imitación de shelve](https://github.com/lfborjas/eddie/blob/clojure/eddie/src/eddie/utils.clj).

En ruby, dicho sea de paso, las funciones construidas con `def` no lo son, sino que son métodos. Para construir funciones de verdad hay que usar `proc`, `Proc.new` o `lambda`, lo cual no es del todo conocido para principiantes. 


