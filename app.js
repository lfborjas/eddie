/*Capa de Presentación*/

var fs = require('fs');
var plantillas = {}
function llenarPlantilla(nombre, contexto){
    var plantilla;

    if (plantillas[nombre]) 
        plantilla = plantillas[nombre]
    else
        plantilla = plantillas[nombre] = fs.readFileSync(nombre, 'utf-8')

    for(var valor in contexto){
        plantilla = plantilla.replace("{{"+valor+"}}", contexto[valor])
    }
    return plantilla
}

/*Capa de Datos*/

//objeto global donde guardaremos los mensajes 
var Canal = {mensajes: [], cola: []}

function agregarMensaje(texto){
    
    var mensaje = {texto: texto, creado: (new Date()).getTime()}

    Canal.mensajes.push(mensaje)

    //quizá haya alguien esperando un mensaje nuevo:
    while(Canal.cola.length > 0)
        Canal.cola.shift().retrollamada([mensaje])
}

function buscarMensajes(desde, retrollamada){
    var mensajes = []

    for (var i = 0; i < Canal.mensajes.length; i++) {
        var mensaje = Canal.mensajes[i]
        if(mensaje.creado > desde)
            mensajes.push(mensaje)
    }

    if (mensajes.length > 0) {
        retrollamada(mensajes)
    }else{
        //ponerla a esperar:
        Canal.cola.push({retrollamada: retrollamada,
                         esperando_desde: (new Date()).getTime()})
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
    var responder = function(res){
        var respuesta = res.tipo == 'application/json'?
                        JSON.stringify(res.respuesta) :
                        res.respuesta || "";

        response.writeHead(res.status || 200, {
            'Content-type': res.tipo,
            'Content-Length': respuesta.length
        })

        response.end(respuesta)
    }
    
    //2. Construir respuesta y responder
    var resultado = {tipo: "text/html"}
    if(path === '/'){
        resultado.respuesta = fs.readFileSync("index.html", 'utf-8')
        responder(resultado)

    }else if(path.indexOf('.js') != -1){
        //está pidiendo algún .js
        resultado.respuesta = fs.readFileSync(path.slice(1), 'utf-8')
        resultado.tipo = "application/javascript"
        responder(resultado)
        
    }else if(matches = path.match(/\/mensajes(\/[a-z]+)?/)){
        //son de la forma /mensajes/ACCION
        var accion = matches[1] && matches[1].slice(1) || "obtener";

        switch(accion){
            case "obtener":
                /*¡Función anónima como parámetro!
                  Usa la propiedad de cierre (closure)
                  Será llamada cuando los mensajes estén listos
                 */
                buscarMensajes(parseInt(GET.since || '0'), function(mensajes){
                    resultado.tipo = 'application/json'
                    /*la función map devuelve una lista con la función
                      provista aplicada a cada elemento de la colección
                     */
                    resultado.respuesta = {messages: mensajes.map(function(mensaje){
                      return llenarPlantilla("mensaje.html", mensaje)  
                    })}
                    responder(resultado)
                })    
                break;
            case "nuevo":
                if(GET.text)
                    agregarMensaje(GET.text)

                resultado.respuesta = {agregado : true}
                responder(resultado)
                break;
            default:
                resultado.respuesta = "Acción inválida"
                resultado.status = 404
                responder(resultado)
        }
    }else{
        resultado.respuesta = "Desconocido"
        resultado.status = 404
        responder(resultado)
    }
}

/*crear un daemon que escucha por solicitudes y sabe responder
  le pasará control a la función `application`
  */
var daemon = http.createServer(application)
daemon.listen(6660, "127.0.0.1")
console.log("El servidor está en http://127.0.0.1:6660")
