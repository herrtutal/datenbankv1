// Firebase yapılandırması
// NOT: Firebase Console'dan (https://console.firebase.google.com) aldığınız config değerlerini buraya girin

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firestore referansı
const db = firebase.firestore();

