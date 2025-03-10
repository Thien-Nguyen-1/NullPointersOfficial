
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js");

//Script necessary for push notifications to work in the background

const firebaseConfig = {
    apiKey: "AIzaSyDQb9cx05Rm34vwBtrqnywzIa5LYWHhjes",
    authDomain: "readytowork-8cf2f.firebaseapp.com",
    projectId: "readytowork-8cf2f",
    storageBucket: "readytowork-8cf2f.firebasestorage.app",
    messagingSenderId: "1053389486667",
    appId: "1:1053389486667:web:abf7479522b11fc4d5abce",
    measurementId: "G-64C4KL7XTF"
  };
  

firebase.initializeApp(firebaseConfig);


const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("Received background message ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});