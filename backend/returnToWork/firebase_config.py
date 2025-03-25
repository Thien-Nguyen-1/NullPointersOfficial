import firebase_admin
import os
from firebase_admin import credentials, messaging
from django.conf import settings

FIREBASE_CREDENTIAL_PATH = os.path.join(settings.BASE_DIR, 'returnToWork/firebase-key', 'readytowork-8cf2f-firebase-adminsdk-fbsvc-fa5952130f.json')


cred = credentials.Certificate(FIREBASE_CREDENTIAL_PATH)
firebase_admin.initialize_app(cred)