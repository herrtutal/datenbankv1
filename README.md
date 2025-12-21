# Grup ve Puan Yönetim Sistemi

Bu uygulama, öğrenci grupları ve puan yönetimi için Firebase Firestore kullanarak çalışır. Veriler bulutta saklanır ve tüm kullanıcılar gerçek zamanlı olarak aynı verileri görür.

## 🔥 Firebase Kurulumu

Uygulamanın çalışması için Firebase projesi oluşturmanız ve yapılandırmanız gerekmektedir.

### 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" (Proje Ekle) butonuna tıklayın
3. Proje adını girin ve "Continue" (Devam) butonuna tıklayın
4. Google Analytics'i etkinleştirmek isteyip istemediğinizi seçin (opsiyonel)
5. "Create project" (Proje Oluştur) butonuna tıklayın

### 2. Firestore Database Kurulumu

1. Firebase Console'da sol menüden "Firestore Database" seçin
2. "Create database" (Veritabanı Oluştur) butonuna tıklayın
3. "Start in production mode" seçeneğini seçin (güvenlik kurallarını daha sonra ayarlayacağız)
4. Cloud Firestore location (Bölge) seçin (örn: `europe-west1` - Avrupa) ve "Enable" (Etkinleştir) butonuna tıklayın

### 3. Güvenlik Kuralları

Firestore Database sayfasında "Rules" (Kurallar) sekmesine gidin ve aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sinifVerileri/{document} {
      allow read, write: if true; // Herkesin okuyup yazabilmesi için (geliştirme aşaması)
      // ÜRETİM ORTAMI İÇİN: Authentication ekleyip sadece yetkili kullanıcıların yazmasına izin verin
    }
  }
}
```

**ÖNEMLİ:** Yukarıdaki güvenlik kuralı herkesin veriyi okuyup yazabilmesine izin verir. Üretim ortamında mutlaka authentication ekleyerek sadece yetkili kullanıcıların yazmasına izin verin.

### 4. Firebase Yapılandırması

1. Firebase Console'da sol menüden ⚙️ (Settings) > "Project settings" (Proje ayarları) seçin
2. Aşağı kaydırın ve "Your apps" (Uygulamalarınız) bölümüne gelin
3. Web ikonuna (</>) tıklayın
4. App nickname (Uygulama takma adı) girin (opsiyonel) ve "Register app" (Uygulamayı Kaydet) butonuna tıklayın
5. Açılan sayfada `firebaseConfig` objesindeki değerleri kopyalayın

### 5. firebase-config.js Dosyasını Güncelleme

Projenizdeki `firebase-config.js` dosyasını açın ve Firebase Console'dan kopyaladığınız değerleri yapıştırın:

```javascript
const firebaseConfig = {
    apiKey: "BURAYA_API_KEY_GELECEK",
    authDomain: "BURAYA_AUTH_DOMAIN_GELECEK",
    projectId: "BURAYA_PROJECT_ID_GELECEK",
    storageBucket: "BURAYA_STORAGE_BUCKET_GELECEK",
    messagingSenderId: "BURAYA_MESSAGING_SENDER_ID_GELECEK",
    appId: "BURAYA_APP_ID_GELECEK"
};
```

## 🚀 GitHub Pages'e Yükleme

1. Tüm dosyaları GitHub repository'nize push edin
2. GitHub repository sayfanızda "Settings" (Ayarlar) sekmesine gidin
3. Sol menüden "Pages" seçin
4. "Source" bölümünden "Deploy from a branch" seçin
5. Branch olarak "main" (veya "master") ve folder olarak "/ (root)" seçin
6. "Save" butonuna tıklayın
7. Birkaç dakika sonra siteniz `https://KULLANICI_ADINIZ.github.io/REPO_ADINIZ/` adresinde yayında olacak

## ✨ Özellikler

- ✅ Gerçek zamanlı veri senkronizasyonu (tüm kullanıcılar aynı verileri görür)
- ✅ Öğrenci ekleme/düzenleme/silme
- ✅ Grup oluşturma ve yönetimi
- ✅ Puanlama sistemi
- ✅ Devamsızlık takibi
- ✅ Puan sıralaması görüntüleme

## 📝 Kullanım

- **Yönetici Paneli (`admin.html`)**: Öğrenci ekleme, grup oluşturma, puan verme işlemleri
- **Öğrenci Sayfası (`student.html`)**: Puan sıralaması ve grup bilgilerini görüntüleme

## 🔒 Güvenlik Notu

Şu anda uygulama herkesin veriyi okuyup yazabilmesine izin veriyor. Üretim ortamında mutlaka Firebase Authentication ekleyerek sadece yetkili kullanıcıların yazma işlemi yapabilmesini sağlayın.

