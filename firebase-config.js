// Firebase yapılandırması
// NOT: Firebase Console'dan (https://console.firebase.google.com) aldığınız config değerlerini buraya girin

const firebaseConfig = {
    apiKey: "AIzaSyD4pPgfXgjlKNtthWBStkd-34Caz4IM43A",
    authDomain: "datenbank-6c1e4.firebaseapp.com",
    projectId: "datenbank-6c1e4",
    storageBucket: "datenbank-6c1e4.firebasestorage.app",
    messagingSenderId: "489369376326",
    appId: "1:489369376326:web:d50ba05feea5cc52655c47"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firestore referansı
const db = firebase.firestore();

