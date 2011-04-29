var http = require('http'),
    qs  = require('querystring'),
    url = require('url'),
    fs = require('fs')

//partial function application: http://ejohn.org/blog/partial-functions-in-javascript/
Function.prototype.partial = function(){
    var fn = this,
        args = Array.prototype.slice.call(arguments)
    
    return function(){
        var arg = 0
        for (var i = 0, arg = 0; i < args.length && arg < arguments.length ; i++)
            if (args[i] === undefined)
                args[i] = arguments[arg++];

        return fn.apply(this, args)
    }
}

Object.prototype.merge = function(other){
    for(var prop in other){
        //por el prototipo
        if(other.hasOwnProperty(prop))
            this[prop] = other[prop]
    }
}

var Request = function(req){
    this.merge(req)
    this.merge(url.parse(req.url))
    this.GET = qs.parse(this.query)
}

var Response = function(res, body, status, type, headers){
    body = type === "application/json"?
           JSON.stringify(body):
           body || ""
           
    headers.merge({
        'Content-type': type,
        'Content-Length': body.length
    })            
    
    res.writeHead(status, headers)
    res.end(body)
}

var HTMLResponse = Response.partial(undefined, undefined, 200, "text/html", {}),
    JSONResponse = Response.partial(undefined, undefined, 200, "application/json", {})

exports.respondWithFile = function(req, res, filename){
      var index = filename.lastIndexOf("."),
          ext   = index < 0 ? "" : filename.substring(index),
          types = {
              'html': "text/html",
              'js': "application/javascript",
              'css': "text/css"
          },
          contents = fs.readFileSync(filename, 'utf-8');
      res.writeHead(200,{
        'Content-type': types[ext],
        'Content-Length': contents.length  
      })  
      res.end(contents)
}

exports.Application = function(port, host, debug){
    port = port || 6660
    host = host || '127.0.0.1'
    debug = debug || true

    var handlers = {}

    this.match = function(path, handler){
        handlers[path] = handler
    } 

    var dispatch = function(req, response){
        var request = new Request(req)
        response.asHTML = HTMLResponse.partial(response)
        response.asJSON = JSONResponse.partial(response)
        if(debug)
            console.log("Requested: "+request.pathname)
        for(var route in handlers){
            if(matches = (new RegExp(route)).exec(req.pathname))
                handlers[route].apply(this, [request, response].concat(matches))
        }
    } 

    this.serve = function(){
        http.createServer(dispatch).listen(port, host)
        if(debug)
            console.log("Server listening at http://"+host+":"+port)
    }
}

