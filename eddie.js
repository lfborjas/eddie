var http = require('http'),
    qs  = require('querystring'),
    url = require('url'),
    fs = require('fs');

//partial function application: http://ejohn.org/blog/partial-functions-in-javascript/
Function.prototype.partial = function(){
    var fn = this,
        args = Array.prototype.slice.call(arguments)
    
    return function(){
        for (var i = 0, arg = 0; i < args.length && arg < arguments.length ; i++)
            if (args[i] === undefined)
                args[i] = arguments[arg++];

        return fn.apply(this, args)
    }
}

/*Agregar las propiedades de un objeto a otro*/
Object.prototype.merge = function(other){
    for(var prop in other){
        //por el prototipo
        if(other.hasOwnProperty(prop))
            this[prop] = other[prop]
    }
}


/*Abstracción de una solicitud*/
var Request = function(req){
    this.merge(req)
    this.merge(url.parse(req.url))
    this.GET = qs.parse(this.query)
}

/*Abstracción general de respuestas*/

//En node.js, la variable global `exports` es lo que se podrá importar de este módulo en otros
exports.staticHandler = function(req, res, filename){
      filename = filename.indexOf('/') ? filename: filename.slice(1)
      var index = filename.lastIndexOf("."),
          ext   = index < 0 ? "" : filename.substring(index),
          types = {
              '.html': "text/html",
              '.js': "application/javascript",
              '.css': "text/css"
          },
          contents = fs.readFileSync(filename, 'utf-8');
      res.writeHead(200,{
        'Content-type': types[ext],
        'Content-Length': contents.length  
      })  
      res.end(contents)
}

exports.respondWithFile = function(filename){
    return function(req, res){
        exports.staticHandler(req, res, filename)
    }
}

/*Función constructora, todo lo que asocie a `this`
  adentro será parte del objeto construido.
 */
exports.Application = function(port, host, debug){
    port = port || 6660
    host = host || '127.0.0.1'
    debug = debug || true

    var handlers = {}

    this.match = function(path, handler){
        handlers[path] = handler
    } 

    var dispatch = function(req, response){

        var Response = function(body, status, type, headers){
            body = type === "application/json"?
                   JSON.stringify(body):
                   body || ""
            headers.merge({
                'Content-type': type,
                'Content-Length': body.length
            })            
            
            //recibe un objeto que sí sabe cómo terminar la respuesta
            response.writeHead(status, headers)
            response.end(body)
        }

        //"Subclases" de response: aplicaciones parciales de la función, son otras funciones
        response.asHTML  = Response.partial(undefined, 200, "text/html", {})
        response.asJSON = Response.partial(undefined, 200, "application/json", {})

        var request = new Request(req),
            matches = null,
            handler = Response.partial("Not Found", 404, "text/plain", {}); 

        for(var route in handlers){
            if(matches = (new RegExp(route)).exec(request.pathname)){
                handler = handlers[route]
                break;
            }
        }
        if(debug)
            console.log("Requested: "+request.pathname)
        /*
           Nótese que no todas las funciones van a querer tantos parámetros
           pero a js no le importa cuántos parámetros le mandemos a una función...
        */
        handler.apply(this, [request, response].concat(matches))
    } 

    this.serve = function(){
        http.createServer(dispatch).listen(port, host)
        if(debug)
            console.log("Server listening at http://"+host+":"+port)
    }
}

