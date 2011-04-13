#encoding=utf-8

from wsgiref.simple_server import make_server
from cgi import parse_qs
from datetime import datetime
import re

class Request(dict):
    def __init__(self, *args, **kwargs):
        dict.__init__(self, *args, **kwargs)
        self.__dict__ = self

        
class App:

    def __init__(self, base, controllers):
        self.controllers = controllers
        self.base = base

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
        response = self.base % {'contenido': response_body}

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
