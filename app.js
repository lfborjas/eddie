/*Capa de Datos*/

Object.prototype.lookup = function(key, deflt){
    return this.hasOwnProperty(key)? this[key] : deflt
}

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

var eddie = require('./eddie'),
    app = new eddie.Application();

app.match('^/[a-zA-Z]+\\.(js|css)$', eddie.staticHandler)
app.match('^/$', eddie.respondWithFile("index.html"))

app.match('^/messages(/recv)?$', function(request, response){
    Channel.getMessages(parseInt(request.GET.lookup('since', '0')), function(messages){
        response.asJSON({messages: messages})
    })    
})
    
app.match('^/messages/send$', function(request, response){
    var txt;
    if(txt = request.GET.lookup('text', ''))
        Channel.addMessage(txt)
    response.asJSON({agregado: true})
})

app.serve()
