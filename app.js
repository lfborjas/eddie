/*Capa de Presentación*/

var fs = require('fs')

/*Capa de Datos*/

//objeto global donde guardaremos los messages 
var Channel = new function(){
    var messages= [],
        queue= []

    this.addMessage = function(text){
        
        var message = {text: text, timestamp: (new Date()).getTime()}

        messages.push(message)

        //quizá haya alguien esperando un message nuevo:
        while(queue.length > 0)
            queue.shift().callback([message])
    }

    this.getMessages = function(since, callback){
        var results = messages.filter(function(message){
            return message.timestamp > since
        }) 

        if (results.length > 0) {
            callback(results)
        }else{
            //ponerla a esperar:
            queue.push({callback: callback,
                                waiting_since: (new Date()).getTime()})
        }
    }
}
/*Capa de Aplicación*/

var http = require('http'),
    qs  = require('querystring'),
    url = require('url')

var application = function(request, response){
    //1. Analizar la solicitud:
    var urlInfo = url.parse(request.url),
        GET = qs.parse(urlInfo.query),
        path = urlInfo.pathname
    
    //un poco de abstracción: una función que sabe cómo construir la respuesta 
    var doResponse = function(res){
        var body = res.type == 'application/json'?
                        JSON.stringify(res.body) :
                        res.body || "";

        response.writeHead(res.status || 200, {
            'Content-type': res.type,
            'Content-Length': body.length
        })
        response.end(body)
    }
    
    //2. Construir body y doResponse
    var result = {type: "text/html"}
    if(path === '/'){
        result.body = fs.readFileSync("index.html", 'utf-8')
        doResponse(result)

    }else if(path.indexOf('.js') != -1){
        //está pidiendo algún .js
        result.body = fs.readFileSync(path.slice(1), 'utf-8')
        result.type = "application/javascript"
        doResponse(result)
        
    }else if(matches = path.match(/\/messages(\/[a-z]+)?/)){
        //son de la forma /messages/ACCION
        var action = matches[1] && matches[1].slice(1) || "recv";

        switch(action){
            case "recv":
                /*¡Función anónima como parámetro!
                  Usa la propiedad de cierre (closure)
                  Será llamada cuando los messages estén listos
                 */
                Channel.getMessages(parseInt(GET.since || '0'), function(messages){
                    result.type = 'application/json'
                    /*la función map devuelve una lista con la función
                      provista aplicada a cada elemento de la colección
                     */
                    result.body = {messages: messages}
                    doResponse(result)
                })    
                break;
            case "send":
                if(GET.text)
                    Channel.addMessage(GET.text)
                result.type = "application/json"
                result.body = {agregado : true}
                doResponse(result)
                break;
            default:
                result.body = "Acción inválida"
                result.status = 404
                doResponse(result)
        }
    }else{
        result.body = "Desconocido"
        result.status = 404
        doResponse(result)
    }
}

/*crear un daemon que escucha por solicitudes y sabe doResponse
  le pasará control a la función `application`
  */
var daemon = http.createServer(application)
daemon.listen(6660, "127.0.0.1")
console.log("El servidor está en http://127.0.0.1:6660")
