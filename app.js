/*Capa de Presentación*/

var fs = require('fs');

//leer archivos como strings de unicode
var base = fs.readFileSync("base.html", 'utf-8'),
    crear_grupo = fs.readFileSync("entrar.html", 'utf-8'),
    ver_grupo = fs.readFileSync("grupo.html", 'utf-8');

function llenarPlantilla(plantilla, contexto){
    for(valor in contexto){
        plantilla = plantilla.replace("{{"+valor+"}}", contexto[valor])
    }
    return plantilla
}

/*Capa de Datos*/

//objeto global donde guardaremos los grupos creados
var grupos = {}

function slugify(str){
    return str.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9\-]/g,'').toLowerCase()
}

function crearGrupo(titulo){
    var slug = slugify(titulo)
    if(!grupos.hasOwnProperty(slug)){
        grupos[slug] = {mensajes : [], cola: []}
        return true
    }else{
        return false
    }
    
}

function agregarMensaje(nombre_grupo, texto){
    
    var mensaje = {texto: texto, creado: (new Date()).getTime()},
        grupo = grupos[nombre_grupo]

    if(grupo !== undefined) return;

    grupo.mensajes.push(mensaje)

    //quizá haya alguien esperando un mensaje nuevo:
    while(grupo.cola.length > 0)
        grupo.cola.shift().retrollamada([mensaje])
}

function buscarMensajes(nombre_grupo, desde, retrollamada){
    var mensajes = [],
        grupo = grupos[nombre_grupo]

    for (var i = 0; i < grupo.mensajes.length; i++) {
        var mensaje = grupo.mensajes[i]
        if(mensaje.creado > desde)
            mensajes.push(mensaje)
    }

    if (mensajes.length > 0) {
        retrollamada(mensajes)
    }else{
        //ponerla a esperar:
        grupo.cola.push({retrollamada: retrollamada,
                         esperando_desde: (new Date()).getTime()})
    }
}

/*Aplicación*/

var http = require('http'),
    qs  = require('querystring'),
    url = require('url')

var application = function(request, response){
    //1. Analizar la solicitud:
    var urlInfo = url.parse(request.url),
        GET = qs.parse(urlInfo.query)
        path = urlInfo.pathname
    
    //una función que sabrá como responder: 
    var responder = function(res){
        var respuesta = res.tipo == 'application/json'?
                        JSON.stringify(res.respuesta) :
                        res.respuesta || "";

        response.writeHead(res.status || 200, {
            'Content-type': resultado.tipo,
            'Content-Length': respuesta.length
        })

        response.end(respuesta)
    }
    
    //2. Construir respuesta
    var resultado = {tipo: "text/html"}
    if(path === '/'){
        resultado.respuesta = llenarPlantilla(base, {contenido: crear_grupo})

    }else if(path.indexOf('/grupos') == 0){
        //son de la forma /grupos/GRUPO/ACCION
        var matches = /\/grupos\/([a-zA-Z0-9\-]+)(\/[a-z]+)?/.exec(path),
            id_grupo = matches[1] && slugify(matches[1]),
            accion = matches[2] && matches[2].slice(1) || "ver";

        if(!id_grupo){
            //está queriendo crear un grupo
            resultado.tipo = "application/json"
            resultado.respuesta = {url: slugify(GET.title), 
                                  creado: crearGrupo(GET.title)}
        }else{
            switch(accion){
                case "ver":
                    var info_grupo = {'slug': }
                    resultado.respuesta = llenarPlantilla(base, 
                                                          {contenido: llenarPlantilla(ver_grupo, {}) })
                    break;
                case ""
            }
        }
            
    }else{
        resultado.status = 404
        resultado.tipo = "text/plain"
    }


    //3. responder:
    responder(resultado);
}

/*crear un daemon que escucha por solicitudes y sabe responder
  le pasará control a la función `application`
  */
var daemon = http.createServer(application)
daemon.listen(6660, "127.0.0.1")
console.log("El servidor está en http://127.0.0.1:6660")
