from uuid import uuid1
import shelve

class Modelo:

    conn = shelve.open('notas.db')

    def __init__(self, *args, **kwargs):
        self._id = uuid1().hex
        self.pk = self._id

    @classmethod
    def todas(cls):
        """Retorna todos los objetos"""
        return (obj for _id, obj in cls.conn.items())
    
    @classmethod
    def obtener(cls, _id):
        """Busca un objeto con el id dado"""
        return cls.conn.get(_id, None)

    @classmethod
    def crear(cls, contenido):
        """Crea una objeto"""

        #cls es la clase
        obj = cls(contenido)
        cls.conn[obj._id] = obj
