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
