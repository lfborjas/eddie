#encoding=utf-8

"""
Eddie: un framework pequeño basado en WSGI
"""
#CAPA DE PRESENTACIÓN
#Las "plantillas" que usaremos para el cuerpo de las respuestas

base = open('base.html').read()

formulario = open('formulario.html').read()

#CAPA DE DATOS
from eddie import Modelo, App
from datetime import datetime

class Nota(Modelo):
    def __init__(self, c):
        Modelo.__init__(self)
        self.texto = c
        self.creada_en = datetime.now()

#CAPA DE APLICACIÓN
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

application = App(base, {
        '/notas': manejar_notas,
        '/notas/(?P<id_nota>[a-z0-9]+)': ver_nota,
        '/nota/crear': nueva_nota
      })

application.serve()
