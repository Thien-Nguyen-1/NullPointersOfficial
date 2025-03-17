
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js");

// Firebase Configuration

// TO DO: MUST MOVE THIS TO ENVIRONMENTAL VARIABLE BEFORE DPELOYMENT

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




// FOR GENERAL BROWSERS (except Safari)

messaging.onBackgroundMessage((payload) => {
    console.log("Received background message:", payload);

    if (!payload.notification) {
        console.warn("No notification found");
        return;
    }

    const notificationTitle = payload.notification.title || "New Notification";
    const notificationOptions = {
        body: payload.notification.body || "You have a new message.",
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});



// FOR SAFARI HANDLING PUSH EVENTS //
// -safari doesn't accept implicit push notification invokes, must be listened to

self.addEventListener("push", (event) => {
    console.log("Push even received")

    if (!event.data) {
        console.warn(" NO DATA ");
        return;
    }

    try {
        const payload = event.data.json();
      

        const notificationTitle = payload.notification?.title || "New Notification";

        const notificationOptions = {
            body: payload.notification?.body || "New notification",
            data: payload.data || {}
        };

        event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));

    } catch (error) {

        console.error(error);
    }
});





self.addEventListener("notificationclick", (event) => {
   
    event.notification.close();

    const clickAction = event.notification.data?.click_action || "/";
    event.waitUntil(clients.openWindow(clickAction));
});

