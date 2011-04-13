#encoding=utf-8

"""
Eddie: un framework pequeño basado en WSGI
"""
#CAPA DE PRESENTACIÓN
#Las "plantillas" que usaremos para el cuerpo de las respuestas

base = """
<!DOCTYPE html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"0>
    <title>Ejemplo WSGI</title>
    <style type="text/css" media="screen">
    body {
        margin-top: 1.0em;
        background-color: #fafafa;
        font-family: "Trebuchet MS", Helvetica, sans-serif;
        font-size: 2.5em;
        color: #444;
        margin: 0 auto;
        width: 700px;
    }
    </style>
</head>
<body>
    %(contenido)s
   <hr/>
   <ul>
        <li> <a href="/notas/crear">crear una nota</a></li>
        <li> <a href='/notas'>Ver todas</a></li>
   </ul>
</body>
"""

formulario = """
<form action="/notas" method="post" accept-charset="utf-8">

    <p><label for="entrada">
        <textarea id = "entrada" name="texto" rows="8" cols="40"></textarea>
    </p>
    <p><input type="submit" value="Agregar&rarr;"0></p>
</form>
"""

from wsgiref.simple_server import make_server
from cgi import parse_qs
from datetime import datetime
import re
#CAPA DE DATOS
from eddie import Modelo
class Nota(Modelo):
    def __init__(self, c):
        Modelo.__init__(self)
        self.texto = c
        self.creada_en = datetime.now()

#CAPA DE APLICACIÓN
def application(environ, start_response): 
    
    #interpretamos el environ
    path = environ['PATH_INFO']
    method = environ['REQUEST_METHOD']
    POST, GET = {}, {}
    if method == 'POST':
        try:
            body_size = int(environ.get('CONTENT_LENGTH', 0))  
        except ValueError:
            body_size = 0
        POST = parse_qs(environ['wsgi.input'].read(body_size))
    elif method == 'GET':
        GET  = parse_qs(environ['QUERY_STRING'])

    
    #reaccionamos a la ruta
    response = ""
    if path == '/notas':
        contenido = ""
        if method == 'POST': #creamos una nueva
            Nota.crear(POST['texto'][0])    
            contenido += "<div style='color: white; background-color: green;'>Nota creada con éxito </div>"
        #creada o no, siempre devolvemos la lista
        contenido += "<h2>Tus notas</h2><ul>"
        for nota in Nota.todas():
            contenido += "<li>Creada en %s:\n %s... "%(nota.creada_en, nota.texto[:10])
            contenido += "<a href='/notas/%s'>Ver</a></li>" % nota.pk
        contenido += "</ul>"

        response = base % {'contenido' :contenido}

    elif path == "/notas/crear":
        response = base % {'contenido': formulario}

    elif re.match(r'/notas/[a-z0-9]+', path):
        _id = re.match(r'/notas/([a-z0-9]+)', path).group(1)
        nota = Nota.obtener(_id)
        response = base % {'contenido': """
                    <h2>Nota creada en %s</h2>
                    <p>%s</p>
                """%(nota.creada_en, nota.texto)}
    else:
        response = base % {'contenido': 
                            """No sé qué hacer con la ruta <strong>%s</strong>
                            """%path}
    #respondemos
    start_response(
          "200 OK",
          [('Content-Type', 'text/html'),
           ('Content-Length', str(len(response)))]
          )

    return [response]

from wsgiref.simple_server import make_server

daemon = make_server('127.0.0.1', 8000, application)

daemon.serve_forever()
