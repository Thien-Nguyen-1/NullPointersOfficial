from django.apps import AppConfig


class ReturntoworkConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'returnToWork'


    def ready(self):
        from . import firebase_config
        print("Start up!")
