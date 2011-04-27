/*Presentación*/

var fs = require('fs'),
    c  = require('crypto')

//leer archivos como strings de unicode
var base = fs.readFileSync("base.html", 'utf-8'),
    form = fs.readFileSync("form.html", 'utf-8')

function llenarPlantilla(plantilla, contexto){
    for(valor in contexto){
        plantilla = plantilla.replace("{{"+valor+"}}", contexto[valor])
    }
    return plantilla
}
/*Datos*/

//Objeto para guardar las notas en memoria
/*
   tratamos de leer de un archivo, si no existe, es un objeto vacío.
   JSON: Javascript Object Notation, formato de texto para representar objetos
   Persistencia súper simple, sólo las tenemos en un archivo y cargamos el objeto
 */

var notas = require('path').exists("db.json")
            && fs.JSON.parse(fs.readFileSync("db.json", 'utf-8')) 
            || {} 

function crearMD5(texto){
    //ponemos var para que se cree en este ámbito
    //una variable es global por defecto
    var md5   = c.createHash('md5')
    md5.update(texto)
    return md5.digest('hex')
} 

function crearNota(contenido){
    /*los objetos son como mapas: llave-valor
    la llave puede ser un símbolo o un string*/
    notas[crearMD5(contenido)] = {texto : contenido, creada_en: new Date()}

    //actualizamos el archivo:
    f = fs.openSync('./db.json','w')
    fs.writeSync(f, JSON.stringify(notas))
    fs.closeSync(f)
    //por defecto se retorna undefined
}

/*Aplicación*/

var http = require('http'),
    qs  = require('querystring'),
    url = require('url')

var application = function(request, response){
    //1. Analizar la solicitud:
    var POST = {},
        GET  = {}

    
    if(request.method == 'POST'){
        var body = ''
        //esperar los datos
        request.setEncoding('utf8')
        request.on('data', function(raw_data){
            body += raw_data
        })
        //cuando termine de llegar, "parsearla"
        request.on('end', function(){
            POST = qs.parse(body)
            /*TODO: aquí debería pasar todo... Esto espera al final de la request, 
              así que en las siguientes líneas, ya va por la otra (la de favicon)
            */
        })
    }else{ //asumamos que viene en el querystring
        urlInfo = url.parse(request.url)
        GET = qs.parse(urlInfo.query)
    }
    
    //2. Reaccionar a la ruta:
    //TODO: aquí llega después del end de la request, así que viene con la otra, la de favicon.ico!
    var resultado = ""
    switch(urlInfo.pathname){
        case '/notas':
            resp = ""
            if(request.method == 'POST'){
                crearNota(POST.texto)
                resp += "<div style='color: white; background-color: green;'>Nota creada con éxito </div>"
            }
            resp += "<h2>Tus notas</h2><ul>"
            for(id in notas){
                nota = notas[id]
                resp += "<li>Creada en: "+nota['creada_en']
                             +"\n"+nota.texto.slice(0,10)+"... "
                             +"<a href='/notas/"+id+"'>Ver</a></li>"
            }

            resultado = llenarPlantilla(base, {contenido: resp}) 
            break

        case '/notas/crear':
            resultado = llenarPlantilla(base, {contenido: form})
            break
        default:
            //usamos el objeto RegExp
            if(matches = /\/notas\/[a-z0-9]+/.exec(urlInfo.pathname)){
               nota = notas[matches[1]]
               resp = "<h2>Nota creada en"+nota.creada_en+"</h2>"
                      +"<p>"+nota.texto+"</p>"
               resultado =  llenarPlantilla(base, {contenido: resp})
            }else{
                resultado = llenarPlantilla(base, {contenido: 
                                                    "No sé qué hacer con "+urlInfo.pathname})
            }
    }

    //3. responder:
    response.writeHead(200, {
        'Content-type': "text/html",
        'Content-Length': resultado.length
    })

    response.end(resultado)
}

/*crear un daemon que escucha por solicitudes y sabe responder
  le pasará control a la función `application`
  */
var daemon = http.createServer(application)
daemon.listen(6660, "127.0.0.1")
console.log("El servidor está en http://127.0.0.1:6660")
