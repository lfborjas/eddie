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
        <li> <a href="/nota/crear">crear una nota</a></li>
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

class Request(dict):
    def __init__(self, *args, **kwargs):
        dict.__init__(self, *args, **kwargs)
        self.__dict__ = self

class Application:

    def __init__(self, controllers):
        self.controllers = controllers

    def __call__(self, environ, start_response):
        """
        Sobrecarga del operador paréntesis, ahora esta clase
        se comporta como una de las funciones que WSGI espera
        """
        request = Request()
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
        
        #Con esto podremos hacer cosas como 
        #request.method, request.POST, etc
        request.update(
                dict(method= method,
                     path = path,
                     POST = POST,
                     GET = GET)
                )

        #Buscamos entre los controladores alguno que sepa responder
        response_body = ""
        for pattern, controller in self.controllers.items():
            they_match = re.match(pattern, request.path)
            if they_match:
                #¿Qué hace groupdict?
                response_body = controller(request, **they_match.groupdict())

        #Si nadie se hizo cargo, lo de antes:
        if not response_body:
            response_body = """No sé qué hacer con la ruta <strong>%s</strong>
                            """%request.path
        
        #Acá todas son iguales:
        response = base % {'contenido': response_body}

        start_response(
              "200 OK" if response else "404 NOT FOUND",
              [('Content-Type', 'text/html'),
               ('Content-Length', str(len(response)))]
              )
        return [response]

    def serve(self):
        from wsgiref.simple_server import make_server
        daemon = make_server('127.0.0.1', 8000, self)
        daemon.serve_forever()

def manejar_notas(request):
    """Se encarga de solicitudes a la ruta /notas"""

    contenido = ""
    if request.method == 'POST': #creamos una nueva
        Nota.crear(request.POST['texto'][0])    
        contenido += "<div style='color: white; background-color: green;'>Nota creada con éxito </div>"

    #creada o no, siempre devolvemos la lista
    contenido += "<h2>Tus notas</h2><ul>"
    for nota in Nota.todas():
        contenido += "<li>Creada en %s:\n %s... "%(nota.creada_en, nota.texto[:10])
        contenido += "<a href='/notas/%s'>Ver</a></li>" % nota.pk
    contenido += "</ul>"
    
    return contenido

def nueva_nota(request):
    """Para cuando queremos crear una nota"""
    return formulario

def ver_nota(request, id_nota):
    """Para cuando vemos una nota"""
    nota = Nota.obtener(id_nota)

    return  """
             <h2>Nota creada en %s</h2>
             <p>%s</p>
            """%(nota.creada_en, nota.texto)

app = Application({
        '/notas': manejar_notas,
        '/notas/(?P<id_nota>[a-z0-9]+)': ver_nota,
        '/nota/crear': nueva_nota
      })

app.serve()
