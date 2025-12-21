// --- SABİT TANIMLAMALAR ---

// BASE_SINIFLAR SABİTİ KALDIRILMIŞTIR. Veri artık JSON dosyasından yüklenecek.
const INITIAL_DATA_FILE = 'initial_data.json';

// Admin giriş bilgileri
const ADMIN_USERNAME = 'Herr Tutal';
const ADMIN_PASSWORD = 'ht2553'; 

const PUAN_BUTONLARI = [
    { deger: 1, etiket: "⚡ +1" },
    { deger: 3, etiket: "🌟 +3)" },
    { deger: 5, etiket: "🏆 +5)" },
    { deger: -1, etiket: "⚠️ -1)" }
];

let siniflar = {}; 
let mevcutGruplar = []; 
let seciliSinif = "10-A";

// --- SIRALAMA FONKSİYONU (Sınıf, Numara, Ad Soyad, Cinsiyet) ---

function ogrenciSiralamaFonksiyonu(a, b, sinifA = null, sinifB = null) {
    // 1. Önce sınıfa göre sırala (eğer sınıf bilgisi verilmişse)
    if (sinifA && sinifB && sinifA !== sinifB) {
        return sinifA.localeCompare(sinifB, 'tr');
    }
    
    // 2. Numara'ya göre sırala (sayısal)
    const numaraA = parseInt(a.numara) || 0;
    const numaraB = parseInt(b.numara) || 0;
    if (numaraA !== numaraB) {
        return numaraA - numaraB;
    }
    
    // 3. Ad Soyad'a göre sırala (alfabetik)
    if (a.ad !== b.ad) {
        return a.ad.localeCompare(b.ad, 'tr');
    }
    
    // 4. Cinsiyet'e göre sırala (Erkek önce)
    const cinsiyetA = a.cinsiyet || '';
    const cinsiyetB = b.cinsiyet || '';
    if (cinsiyetA !== cinsiyetB) {
        return cinsiyetA === 'e' ? -1 : (cinsiyetB === 'e' ? 1 : 0);
    }
    
    return 0;
} 


// --- KALICILIK YÖNETİMİ (FIREBASE FIRESTORE) ---

const FIRESTORE_COLLECTION = 'sinifVerileri';
const FIRESTORE_DOCUMENT_ID = 'anaVeri';

// Firestore'dan veri kaydetme
async function veriyiKaydet() {
    try {
        if (typeof db === 'undefined') {
            console.warn("Firebase henüz yüklenmedi. Veri kaydedilemedi.");
            return;
        }

        const kayitObjesi = {
            siniflar: siniflar,
            gruplar: mevcutGruplar,
            guncellemeTarihi: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOCUMENT_ID).set(kayitObjesi);
        console.log("Veri Firestore'a başarıyla kaydedildi.");
    } catch (e) {
        console.error("Firestore'a veri kaydedilirken bir hata oluştu:", e);
    }
}

// Firestore'dan veri yükleme
async function veriyiYukle() {
    try {
        if (typeof db === 'undefined') {
            console.warn("Firebase henüz yüklenmedi.");
            return false;
        }

        const docRef = db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOCUMENT_ID);
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            if (data && data.siniflar) {
                siniflar = data.siniflar || {};
                mevcutGruplar = data.gruplar || [];
                
                // Tüm sınıflardaki öğrencileri sırala
                Object.keys(siniflar).forEach(sinifAdi => {
                    if (Array.isArray(siniflar[sinifAdi])) {
                        siniflar[sinifAdi].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
                    }
                });
                
                console.log("Veri Firestore'dan yüklendi ve sıralandı.");
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("Firestore'dan veri yüklenirken hata oluştu:", e);
        return false;
    }
}

// Firestore'da gerçek zamanlı dinleyici kurma (tüm kullanıcılar verileri anında görsün)
function veriDinleyicisiniKur() {
    try {
        if (typeof db === 'undefined') {
            console.warn("Firebase henüz yüklenmedi. Dinleyici kurulamadı.");
            return;
        }

        db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOCUMENT_ID)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data && data.siniflar) {
                        siniflar = data.siniflar || {};
                        mevcutGruplar = data.gruplar || [];
                        
                        // Tüm sınıflardaki öğrencileri sırala
                        Object.keys(siniflar).forEach(sinifAdi => {
                            if (Array.isArray(siniflar[sinifAdi])) {
                                siniflar[sinifAdi].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
                            }
                        });
                        
                        console.log("Veri gerçek zamanlı olarak güncellendi ve sıralandı.");
                        tumVerileriGuncelle();
                    }
                }
            }, (error) => {
                console.error("Veri dinleyicisi hatası:", error);
            });
    } catch (e) {
        console.error("Veri dinleyicisi kurulurken hata oluştu:", e);
    }
}

// --- JSON DOSYASINDAN İLK VERİ YÜKLEME İŞLEVİ ---

async function ilkVeriyiYukle() {
    // 1. Firestore'dan veri yüklemeyi dene
    const firestoreVar = await veriyiYukle();
    if (firestoreVar) {
        // Veri dinleyicisini kur (gerçek zamanlı güncelleme için)
        veriDinleyicisiniKur();
        return;
    }

    // 2. Firestore'da veri yoksa, JSON dosyasından yükle ve Firestore'a kaydet
    try {
        const response = await fetch(INITIAL_DATA_FILE);
        if (!response.ok) {
            throw new Error(`JSON dosyası yüklenemedi: ${response.statusText}`);
        }
        const initialData = await response.json();
        
        // Global değişkenlere ata
        siniflar = initialData.siniflar || {};
        mevcutGruplar = initialData.gruplar || [];
        
        // Tüm sınıflardaki öğrencileri sırala
        Object.keys(siniflar).forEach(sinifAdi => {
            if (Array.isArray(siniflar[sinifAdi])) {
                siniflar[sinifAdi].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
            }
        });

        // Veriyi Firestore'a kaydet
        await veriyiKaydet();
        
        // Veri dinleyicisini kur
        veriDinleyicisiniKur();
        
    } catch (e) {
        console.error("JSON dosyasından ilk veri yüklenirken hata oluştu. Uygulama boş başlatılıyor.", e);
        // Hata durumunda boş objelerle başlat
        siniflar = {}; 
        mevcutGruplar = [];
    }
}


// --- GENEL GÜNCELLEME İŞLEVİ (Tüm Select Menülerini Senkronize Eder) ---

function tumVerileriGuncelle() {
    // 1. Sınıf Select Menülerini Doldur
    sinifSelectleriniDoldur(); 

    const kalanSiniflar = Object.keys(siniflar);

    // 2. Aktif sınıfı güvenli bir şekilde belirle 
    let yeniSeciliSinif = null;
    if (seciliSinif && kalanSiniflar.includes(seciliSinif)) {
        yeniSeciliSinif = seciliSinif;
    } else if (kalanSiniflar.length > 0) {
        yeniSeciliSinif = kalanSiniflar[0];
    }
    seciliSinif = yeniSeciliSinif;
    
    // 3. İlgili Select kutularının değerlerini ayarla
    const selects = ['sinifSecimi', 'duzenlenecekSinifSecim', 'hedefSinifSecimi', 'silinecekSinifSecim', 'ogrenciSinifSecimi'];
    const valueToSet = seciliSinif || ''; 
    
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = valueToSet;
        }
    });

    // 4. Sayfaya özgü arayüz güncellemelerini çağır
    if (document.getElementById('admin-paneli')) {
        ogrenciListesiGuncelle();
        grupTablolariniGuncelle();
    } else if (document.getElementById('ogrenci-sayfasi')) {
        ogrenciSiralamaGoster(); 
        ogrenciGrupGoster(); 
    }
    
    console.log("Tüm arayüz verileri güncellendi. Yeni Seçili Sınıf:", seciliSinif);
}


// --- SINIF VE GRUP İŞLEVLERİ (Admin Sayfası için) ---

function gruplariOlustur() {
    const grupSayisi = parseInt(document.getElementById('grupSayisi').value);
    if (grupSayisi < 2) return alert("Grup sayısı en az 2 olmalıdır.");
    if (!seciliSinif || !siniflar[seciliSinif]) return alert("Lütfen önce bir sınıf seçin.");

    let aktifOgrenciler = siniflar[seciliSinif].filter(o => !o.devamsiz);
    
    // Öğrencileri cinsiyete göre ayır (artık direkt cinsiyet bilgisi var)
    const erkekOgrenciler = [];
    const kizOgrenciler = [];
    
    aktifOgrenciler.forEach(ogrenci => {
        // Cinsiyet bilgisi varsa onu kullan, yoksa tahmin et (geriye dönük uyumluluk)
        const cinsiyet = ogrenci.cinsiyet || ogrenciCinsiyetiTahminEt(ogrenci.ad);
        if (cinsiyet === 'e') {
            erkekOgrenciler.push(ogrenci);
        } else {
            kizOgrenciler.push(ogrenci);
        }
    });
    
    // Her iki listeyi de karıştır
    for (let i = erkekOgrenciler.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [erkekOgrenciler[i], erkekOgrenciler[j]] = [erkekOgrenciler[j], erkekOgrenciler[i]];
    }
    
    for (let i = kizOgrenciler.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [kizOgrenciler[i], kizOgrenciler[j]] = [kizOgrenciler[j], kizOgrenciler[i]];
    }

    const grupEmojileri = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🟤', '🔶'];
    const yeniGruplar = Array.from({ length: grupSayisi }, (_, i) => ({ 
        ad: `${grupEmojileri[i] || '⭐'} Grup ${i + 1}`, 
        sinif: seciliSinif, 
        uyeler: [] 
    }));

    // Erkek öğrencileri dengeli dağıt
    erkekOgrenciler.forEach((ogrenci, index) => {
        const grupIndex = index % grupSayisi;
        yeniGruplar[grupIndex].uyeler.push(ogrenci);
    });
    
    // Kız öğrencileri dengeli dağıt (ters yönde başlayarak daha iyi denge sağla)
    kizOgrenciler.forEach((ogrenci, index) => {
        const grupIndex = (grupSayisi - 1 - (index % grupSayisi)) % grupSayisi;
        yeniGruplar[grupIndex].uyeler.push(ogrenci);
    });

    // Grup üyelerini sırala (Numara, Ad Soyad, Cinsiyet)
    yeniGruplar.forEach(grup => {
        grup.uyeler.sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
    });
    
    mevcutGruplar = mevcutGruplar.filter(g => g.sinif !== seciliSinif);
    mevcutGruplar.push(...yeniGruplar);
    
    veriyiKaydet(); 
    grupTablolariniGuncelle();
}


function grupTablolariniGuncelle() {
    const container = document.getElementById('gruplar-container');
    if (!container) return; 
    container.innerHTML = ''; 
    
    const seciliSinifGruplari = mevcutGruplar.filter(g => g.sinif === seciliSinif);
    
    if (!seciliSinif || seciliSinifGruplari.length === 0) {
        container.innerHTML = "<p>📝 Lütfen yukarıdan bir sınıf seçin ve grupları oluşturun. 🎯</p>";
        devamsizlikListesiniGuncelle();
        return;
    }

    seciliSinifGruplari.forEach((grup, gIndex) => {
        const grupDiv = document.createElement('div');
        grupDiv.className = 'grup-karti';
        grupDiv.innerHTML = `<h3>${grup.ad}</h3>`;
        
        // Grup üyelerini sırala (Numara, Ad Soyad, Cinsiyet)
        const siraliUyeler = [...grup.uyeler].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
        
        const tablo = document.createElement('table');
        tablo.innerHTML = `
            <thead>
                <tr>
                    <th>✅ Seç</th>
                    <th>🏫 Sınıf</th>
                    <th>🔢 Numara</th>
                    <th>👤 Adı Soyadı</th>
                    <th>⚥ Cinsiyet</th>
                    <th>⭐ Puan</th>
                </tr>
            </thead>
            <tbody>
                ${siraliUyeler.map((uye, uIndex) => {
                    const orjinalIndex = grup.uyeler.findIndex(u => u.ad === uye.ad && u.numara === uye.numara);
                    const cinsiyetText = uye.cinsiyet === 'e' ? 'Erkek' : (uye.cinsiyet === 'k' ? 'Kız' : '-');
                    const cinsiyetEmoji = uye.cinsiyet === 'e' ? '👨' : (uye.cinsiyet === 'k' ? '👩' : '❓');
                    return `
                    <tr>
                        <td><input type="checkbox" value="${gIndex}-${orjinalIndex}"></td>
                        <td>${grup.sinif}</td>
                        <td>${uye.numara || '-'}</td>
                        <td>${uye.ad}</td>
                        <td>${cinsiyetEmoji} ${cinsiyetText}</td>
                        <td><span class="puan-badge">${uye.puan}</span></td>
                    </tr>
                `;
                }).join('')}
            </tbody>
        `;
        grupDiv.appendChild(tablo);
        container.appendChild(grupDiv);
    });
    
    devamsizlikListesiniGuncelle();
}

function devamsizligiDegistir(ad) {
    if (!seciliSinif || !siniflar[seciliSinif]) return;
    
    const ogrenci = siniflar[seciliSinif].find(o => o.ad === ad);
    if (ogrenci) {
        ogrenci.devamsiz = !ogrenci.devamsiz;
    }
    
    veriyiKaydet(); 
    devamsizlikListesiniGuncelle();
    grupTablolariniGuncelle(); 
}

function devamsizlikListesiniGuncelle() {
     const devamsizDiv = document.getElementById('devamsiz-listesi');
     if (!devamsizDiv) return;
     devamsizDiv.innerHTML = ''; 

     if (!seciliSinif || !siniflar[seciliSinif]) return;

     // Öğrencileri sırala (Numara, Ad Soyad, Cinsiyet)
     const siraliOgrenciler = [...siniflar[seciliSinif]].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));

     const liste = document.createElement('ul');
     liste.innerHTML = siraliOgrenciler.map(ogrenci => {
         const cinsiyetText = ogrenci.cinsiyet === 'e' ? 'Erkek' : (ogrenci.cinsiyet === 'k' ? 'Kız' : '-');
         const cinsiyetEmoji = ogrenci.cinsiyet === 'e' ? '👨' : (ogrenci.cinsiyet === 'k' ? '👩' : '❓');
         return `
         <li>
             <input type="checkbox" 
                    onchange="devamsizligiDegistir('${ogrenci.ad.replace(/'/g, "\\'")}')"
                    ${ogrenci.devamsiz ? 'checked' : ''}>
             <strong>${ogrenci.numara || '-'}</strong> - ${ogrenci.ad} ${cinsiyetEmoji} ${cinsiyetText}
             <span class="${ogrenci.devamsiz ? 'devamsiz' : 'aktif'}">
                 ${ogrenci.devamsiz ? '(Devamsız)' : '(Aktif)'}
             </span>
         </li>
     `;
     }).join('');
     devamsizDiv.appendChild(liste);
}


function puanEklemeButonu(puanDegeri) {
    const secilenler = document.querySelectorAll('#gruplar-container input[type="checkbox"]:checked');
    if (secilenler.length === 0) return alert("Önce puan verilecek öğrenci(ler)i seçin.");

    const seciliSinifGruplari = mevcutGruplar.filter(g => g.sinif === seciliSinif);

    secilenler.forEach(checkbox => {
        const [grupIndex, uyeIndex] = checkbox.value.split('-').map(Number);
        
        const gruptakiOgrenci = seciliSinifGruplari[grupIndex].uyeler[uyeIndex];
        gruptakiOgrenci.puan += puanDegeri;

        const kaliciOgrenci = siniflar[seciliSinif].find(o => o.ad === gruptakiOgrenci.ad);
        if (kaliciOgrenci) {
            kaliciOgrenci.puan = gruptakiOgrenci.puan;
        }
    });

    veriyiKaydet();
    grupTablolariniGuncelle(); 
}

function sinifSelectleriniDoldur() {
    const sinifListesi = Object.keys(siniflar).sort();

    const selects = [
        document.getElementById('sinifSecimi'),
        document.getElementById('hedefSinifSecimi'),
        document.getElementById('duzenlenecekSinifSecim'),
        document.getElementById('silinecekSinifSecim'),
        document.getElementById('ogrenciSinifSecimi') 
    ];
    
    selects.forEach(select => {
        if(select) select.innerHTML = '';
    });

    sinifListesi.forEach(sinif => {
        selects.forEach(select => {
            if(select) {
                const option = document.createElement('option');
                option.value = sinif;
                option.textContent = sinif;
                select.appendChild(option);
            }
        });
    });
}

// Tab Değiştirme
function acTab(tabAdi) {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // Tüm tab butonlarını pasif yap
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçilen tab'ı aktif yap
    document.getElementById(tabAdi + '-tab').classList.add('active');
    event.target.classList.add('active');
}

// Tek Tek Öğrenci Ekleme
function yeniOgrenciEkle() {
    const adInput = document.getElementById('yeniOgrenciAd');
    const noInput = document.getElementById('yeniOgrenciNo');
    const cinsiyetSelect = document.getElementById('yeniOgrenciCinsiyet');
    const hedefSinif = document.getElementById('hedefSinifSecimi').value;
    
    const ad = adInput.value.trim();
    const numara = noInput.value.trim();
    const cinsiyet = cinsiyetSelect.value;

    if (!ad || !numara || !cinsiyet || !hedefSinif || !siniflar[hedefSinif]) {
        alert("Lütfen tüm alanları doldurun ve bir sınıf seçin.");
        return;
    }
    
    // Aynı numara veya ad kontrolü
    if (siniflar[hedefSinif].some(o => o.ad === ad || o.numara === numara)) {
        alert(`Hata: ${ad} öğrencisi veya ${numara} numaralı öğrenci zaten ${hedefSinif} sınıfında mevcut.`);
        return;
    }

    const yeniOgrenci = { 
        ad: ad, 
        numara: numara,
        cinsiyet: cinsiyet,
        devamsiz: false, 
        puan: 0 
    };
    siniflar[hedefSinif].push(yeniOgrenci);
    
    // Sınıfı yeniden sırala
    siniflar[hedefSinif].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
    
    veriyiKaydet(); 
    
    alert(`✅ ${ad} (${numara}), ${hedefSinif} sınıfına başarıyla eklendi!`);
    
    adInput.value = '';
    noInput.value = '';
    cinsiyetSelect.value = '';
    tumVerileriGuncelle(); 
}

// Toplu Öğrenci Ekleme
function topluOgrenciEkle() {
    const listeTextarea = document.getElementById('topluOgrenciListesi');
    const liste = listeTextarea.value.trim();
    
    if (!liste) {
        alert("Lütfen öğrenci listesini girin!");
        return;
    }
    
    const satirlar = liste.split('\n').filter(satir => satir.trim().length > 0);
    let basarili = 0;
    let basarisiz = 0;
    const hatalar = [];
    const yeniOgrenciler = []; // Önce tüm öğrencileri topla
    
    // Önce tüm öğrencileri parse et ve doğrula
    satirlar.forEach((satir, index) => {
        // "- " ile split yap (tire + boşluk) ve trim et
        const parcalar = satir.split(/\s*-\s*/).map(p => p.trim()).filter(p => p.length > 0);
        
        if (parcalar.length < 4) {
            basarisiz++;
            hatalar.push(`Satır ${index + 1}: Format hatalı (4 alan olmalı: Sınıf - Numara - Ad Soyad - Cinsiyet). Bulunan alan sayısı: ${parcalar.length}`);
            return;
        }
        
        // Eğer 4'ten fazla parça varsa, muhtemelen sınıf içinde tire var (örn: "10-A")
        // Bu durumda ilk birkaç parçayı sınıf olarak birleştir
        let sinif, numara, ad, cinsiyetStr;
        
        if (parcalar.length === 4) {
            // Normal durum: tam 4 parça
            [sinif, numara, ad, cinsiyetStr] = parcalar;
        } else {
            // Sınıf içinde tire var, son 3 parçayı al, kalanını sınıf yap
            cinsiyetStr = parcalar[parcalar.length - 1];
            ad = parcalar[parcalar.length - 2];
            numara = parcalar[parcalar.length - 3];
            sinif = parcalar.slice(0, parcalar.length - 3).join('-');
        }
        const cinsiyet = cinsiyetStr.toUpperCase() === 'E' || cinsiyetStr.toUpperCase() === 'ERKEK' ? 'e' : 
                        (cinsiyetStr.toUpperCase() === 'K' || cinsiyetStr.toUpperCase() === 'KIZ' ? 'k' : null);
        
        if (!ad || !numara || !cinsiyet || !sinif || !siniflar[sinif]) {
            basarisiz++;
            hatalar.push(`Satır ${index + 1}: Eksik veya geçersiz bilgi`);
            return;
        }
        
        // Aynı numara veya ad kontrolü (mevcut verilerde)
        if (siniflar[sinif].some(o => o.ad === ad || o.numara === numara)) {
            basarisiz++;
            hatalar.push(`Satır ${index + 1}: ${ad} veya ${numara} numaralı öğrenci zaten mevcut`);
            return;
        }
        
        // Yeni eklenen öğrenciler arasında da kontrol
        if (yeniOgrenciler.some(o => o.sinif === sinif && (o.ad === ad || o.numara === numara))) {
            basarisiz++;
            hatalar.push(`Satır ${index + 1}: ${ad} veya ${numara} numaralı öğrenci listede tekrar ediyor`);
            return;
        }
        
        const yeniOgrenci = {
            ad: ad,
            numara: numara,
            cinsiyet: cinsiyet,
            devamsiz: false,
            puan: 0,
            sinif: sinif // Sıralama için sınıf bilgisini de ekle
        };
        
        yeniOgrenciler.push(yeniOgrenci);
    });
    
    // Öğrencileri sırala (Sınıf, Numara, Ad Soyad, Cinsiyet)
    yeniOgrenciler.sort((a, b) => ogrenciSiralamaFonksiyonu(a, b, a.sinif, b.sinif));
    
    // Sıralı şekilde ekle
    yeniOgrenciler.forEach(ogrenci => {
        const ogrenciBilgileri = {
            ad: ogrenci.ad,
            numara: ogrenci.numara,
            cinsiyet: ogrenci.cinsiyet,
            devamsiz: ogrenci.devamsiz,
            puan: ogrenci.puan
        };
        const hedefSinif = ogrenci.sinif;
        siniflar[hedefSinif].push(ogrenciBilgileri);
        basarili++;
    });
    
    if (basarili > 0) {
        // Tüm sınıfları sırala (yeni eklenenler dahil)
        Object.keys(siniflar).forEach(sinifAdi => {
            if (Array.isArray(siniflar[sinifAdi])) {
                siniflar[sinifAdi].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
            }
        });
        veriyiKaydet();
        tumVerileriGuncelle();
    }
    
    let mesaj = `✅ ${basarili} öğrenci başarıyla eklendi!`;
    if (basarisiz > 0) {
        mesaj += `\n❌ ${basarisiz} öğrenci eklenemedi.\n\nHatalar:\n${hatalar.join('\n')}`;
    }
    
    alert(mesaj);
    
    if (basarili > 0) {
        listeTextarea.value = '';
    }
}

// Örnek Veri Yükleme
function ornekVeriYukle() {
    const ornekVeri = `10-A - 101 - Ahmet Yılmaz - E
10-A - 102 - Ayşe Kaya - K
10-A - 103 - Mehmet Demir - E
10-A - 104 - Fatma Şahin - K
11-B - 105 - Ali Veli - E
11-B - 106 - Zeynep Öz - K`;
    
    document.getElementById('topluOgrenciListesi').value = ornekVeri;
}

function ogrenciListesiGuncelle() {
    const sinifAdi = document.getElementById('duzenlenecekSinifSecim') ? document.getElementById('duzenlenecekSinifSecim').value : null;
    const ogrenciSelect = document.getElementById('duzenlenecekOgrenci');
    if (!ogrenciSelect) return;
    
    ogrenciSelect.innerHTML = '<option value="">Öğrenci seçin...</option>'; 

    if (siniflar[sinifAdi]) {
        // Öğrencileri sırala (Numara, Ad Soyad, Cinsiyet)
        const siraliOgrenciler = [...siniflar[sinifAdi]].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
        
        siraliOgrenciler.forEach(ogrenci => {
            const option = document.createElement('option');
            option.value = ogrenci.ad; 
            const numaraGoster = ogrenci.numara ? ` [${ogrenci.numara}]` : '';
            const cinsiyetGoster = ogrenci.cinsiyet === 'e' ? '👨' : (ogrenci.cinsiyet === 'k' ? '👩' : '');
            option.textContent = numaraGoster + ' ' + ogrenci.ad + ' ' + cinsiyetGoster;
            ogrenciSelect.appendChild(option);
        });
    }
    
    // Sınıf listesini güncelle (sınıf değiştirme için)
    const yeniSinifSelect = document.getElementById('yeniOgrenciSinifSecim');
    if (yeniSinifSelect) {
        yeniSinifSelect.innerHTML = '<option value="">Sınıf Değiştirme</option>';
        Object.keys(siniflar).sort().forEach(sinif => {
            if (sinif !== sinifAdi) {
                const option = document.createElement('option');
                option.value = sinif;
                option.textContent = sinif;
                yeniSinifSelect.appendChild(option);
            }
        });
    }
}

// Öğrenci bilgilerini form alanlarına yükle
function ogrenciBilgileriniYukle() {
    const sinifAdi = document.getElementById('duzenlenecekSinifSecim').value;
    const ogrenciAdi = document.getElementById('duzenlenecekOgrenci').value;
    
    if (!sinifAdi || !ogrenciAdi || !siniflar[sinifAdi]) return;
    
    const ogrenci = siniflar[sinifAdi].find(o => o.ad === ogrenciAdi);
    
    if (ogrenci) {
        document.getElementById('yeniOgrenciAdDuzenle').value = ogrenci.ad || '';
        document.getElementById('duzenlenecekOgrenciNo').value = ogrenci.numara || '';
        document.getElementById('duzenlenecekOgrenciCinsiyet').value = ogrenci.cinsiyet || '';
    }
}

function ogrenciBilgileriniGuncelle() {
    const sinifAdi = document.getElementById('duzenlenecekSinifSecim').value;
    const eskiAd = document.getElementById('duzenlenecekOgrenci').value;
    const yeniAd = document.getElementById('yeniOgrenciAdDuzenle').value.trim();
    const yeniNumara = document.getElementById('duzenlenecekOgrenciNo').value.trim();
    const yeniCinsiyet = document.getElementById('duzenlenecekOgrenciCinsiyet').value;
    const yeniSinif = document.getElementById('yeniOgrenciSinifSecim').value;

    if (!eskiAd) return alert("Lütfen önce bir öğrenci seçin.");
    if (!yeniAd) return alert("Lütfen öğrenci adını girin.");

    const ogrenci = siniflar[sinifAdi]?.find(o => o.ad === eskiAd);

    if (!ogrenci) {
        alert("Öğrenci bulunamadı.");
        return;
    }

    // Sınıf değiştirme
    let hedefSinif = sinifAdi;
    if (yeniSinif && yeniSinif !== sinifAdi && siniflar[yeniSinif]) {
        // Yeni sınıfta aynı numara veya ad kontrolü
        if (siniflar[yeniSinif].some(o => o.numara === yeniNumara && o.numara) || 
            siniflar[yeniSinif].some(o => o.ad === yeniAd && o.ad !== eskiAd)) {
            alert("Hedef sınıfta aynı numara veya ad ile öğrenci mevcut!");
            return;
        }
        
        // Eski sınıftan çıkar
        siniflar[sinifAdi] = siniflar[sinifAdi].filter(o => o.ad !== eskiAd);
        // Yeni sınıfa ekle
        hedefSinif = yeniSinif;
    }

    // Bilgileri güncelle
    ogrenci.ad = yeniAd;
    if (yeniNumara) ogrenci.numara = yeniNumara;
    if (yeniCinsiyet) ogrenci.cinsiyet = yeniCinsiyet;
    
    // Sınıf değiştirildiyse yeni sınıfa ekle
    if (yeniSinif && yeniSinif !== sinifAdi) {
        siniflar[yeniSinif].push(ogrenci);
        
        // Grupları da güncelle
        mevcutGruplar.forEach(grup => {
            grup.uyeler.forEach(uye => {
                if (uye.ad === eskiAd) {
                    uye.ad = yeniAd;
                    if (yeniNumara) uye.numara = yeniNumara;
                    if (yeniCinsiyet) uye.cinsiyet = yeniCinsiyet;
                }
            });
        });
    }
    
    // Güncellenen sınıfları sırala
    if (siniflar[sinifAdi]) {
        siniflar[sinifAdi].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
    }
    if (yeniSinif && yeniSinif !== sinifAdi && siniflar[yeniSinif]) {
        siniflar[yeniSinif].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
    }
    
    veriyiKaydet();
    
    // Form alanlarını temizle
    document.getElementById('yeniOgrenciAdDuzenle').value = '';
    document.getElementById('duzenlenecekOgrenciNo').value = '';
    document.getElementById('duzenlenecekOgrenciCinsiyet').value = '';
    document.getElementById('yeniOgrenciSinifSecim').value = '';
    document.getElementById('duzenlenecekOgrenci').value = '';
    
    tumVerileriGuncelle();
    
    let mesaj = `✅ ${eskiAd} öğrencisinin bilgileri güncellendi.`;
    if (yeniSinif && yeniSinif !== sinifAdi) {
        mesaj += `\n📚 Sınıf ${sinifAdi} → ${yeniSinif} olarak değiştirildi.`;
    }
    alert(mesaj);
}

function sinifiSil() {
    const silinecekSinif = document.getElementById('silinecekSinifSecim').value;

    if (!silinecekSinif) return alert("Lütfen silmek istediğiniz sınıfı seçin.");

    if (confirm(`${silinecekSinif} sınıfını ve tüm öğrencilerini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
        
        delete siniflar[silinecekSinif];
        mevcutGruplar = mevcutGruplar.filter(g => g.sinif !== silinecekSinif); 
        veriyiKaydet();

        tumVerileriGuncelle(); 
        
        alert(`${silinecekSinif} sınıfı başarıyla silindi.`);
    }
}


// --- ÖĞRENCİ SAYFASI İŞLEVLERİ ---

function ogrenciSiralamaGoster() {
    const siralamaDiv = document.getElementById('siralama-listesi');
    if (!siralamaDiv) return;
    siralamaDiv.innerHTML = '';
    
    if (!seciliSinif || !siniflar[seciliSinif]) {
        siralamaDiv.innerHTML = "<p>🎯 Lütfen bir sınıf seçin.</p>";
        return;
    }

    // Sıralama: Numara, Ad Soyad, Cinsiyet sırasına göre (Sınıf zaten seçili)
    const siraliOgrenciler = [...siniflar[seciliSinif]].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));

    let html = `
        <h3>📋 ${seciliSinif} Sınıfı Öğrenci Listesi 📋</h3>
        <table class="siralama-tablosu">
            <thead>
                <tr>
                    <th>🏫 Sınıf</th>
                    <th>🔢 Numara</th>
                    <th>👤 Adı Soyadı</th>
                    <th>⚥ Cinsiyet</th>
                </tr>
            </thead>
            <tbody>
    `;

    siraliOgrenciler.forEach((ogrenci) => {
        const cinsiyetText = ogrenci.cinsiyet === 'e' ? 'Erkek' : (ogrenci.cinsiyet === 'k' ? 'Kız' : '-');
        const cinsiyetEmoji = ogrenci.cinsiyet === 'e' ? '👨' : (ogrenci.cinsiyet === 'k' ? '👩' : '❓');
        html += `
            <tr class="${ogrenci.devamsiz ? 'devamsiz-ogrenci' : ''}">
                <td>${seciliSinif}</td>
                <td>${ogrenci.numara || '-'}</td>
                <td>${ogrenci.ad} ${ogrenci.devamsiz ? '(<span class="devamsiz-text">Devamsız</span>)' : ''}</td>
                <td>${cinsiyetEmoji} ${cinsiyetText}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    siralamaDiv.innerHTML = html;
}

function ogrenciGrupGoster() {
    const grupDiv = document.getElementById('grup-gosterim-alani');
    if (!grupDiv) return;
    grupDiv.innerHTML = '';

    if (!seciliSinif || !siniflar[seciliSinif]) {
        grupDiv.innerHTML = "<p>🎯 Lütfen bir sınıf seçin.</p>";
        return;
    }

    const sinifaOzelGruplar = mevcutGruplar.filter(g => g.sinif === seciliSinif);

    if (sinifaOzelGruplar.length === 0) {
        grupDiv.innerHTML = "<p>📝 Bu sınıfa ait henüz grup oluşturulmadı. Öğretmeninizden grup oluşturmasını isteyin! 🎯</p>";
        return;
    }


    let html = `<h3>👥 ${seciliSinif} Sınıfı Grupları 👥</h3><div class="gruplar-container-ogrenci">`;

    sinifaOzelGruplar.forEach((grup) => {
        // Grup üyelerini sırala (Numara, Ad Soyad, Cinsiyet)
        const siraliUyeler = [...grup.uyeler].sort((a, b) => ogrenciSiralamaFonksiyonu(a, b));
        
        html += `
            <div class="grup-karti-ogrenci">
                <h4>${grup.ad}</h4>
                <ul>
                    ${siraliUyeler.map(uye => {
                        const ogrenciTamData = siniflar[seciliSinif].find(o => o.ad === uye.ad);
                        const isDevamsiz = ogrenciTamData ? ogrenciTamData.devamsiz : false;
                        const numaraGoster = uye.numara ? `[${uye.numara}] ` : '';
                        const cinsiyetEmoji = uye.cinsiyet === 'e' ? '👨' : (uye.cinsiyet === 'k' ? '👩' : '');
                        return `<li class="${isDevamsiz ? 'devamsiz-ogrenci' : ''}">${numaraGoster}${uye.ad} ${cinsiyetEmoji} ${isDevamsiz ? '(Devamsız)' : ''}</li>`;
                    }).join('')}
                </ul>
            </div>
        `;
    });

    html += `</div>`;
    grupDiv.innerHTML = html;
}


// --- GİRİŞ KONTROLÜ ---

function girisKontrol() {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    const errorElement = document.getElementById('login-error');
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Giriş başarılı - localStorage'a kaydet
        localStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        
        // Sayfayı yeniden yükle ki tüm fonksiyonlar çalışsın
        window.location.reload();
    } else {
        // Giriş başarısız
        errorElement.style.display = 'block';
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password').focus();
    }
}

function adminCikisYap() {
    localStorage.removeItem('adminLoggedIn');
    window.location.reload();
}

// Giriş durumunu kontrol et
function adminGirisKontrol() {
    const loginModal = document.getElementById('login-modal');
    const adminContent = document.getElementById('admin-content');
    
    if (!loginModal || !adminContent) return false; // Admin sayfası değil
    
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (loggedIn) {
        loginModal.style.display = 'none';
        adminContent.style.display = 'block';
        return true;
    } else {
        loginModal.style.display = 'flex';
        adminContent.style.display = 'none';
        return false;
    }
}

// Enter tuşu ile giriş
document.addEventListener('DOMContentLoaded', () => {
    adminGirisKontrol(); // Sayfa yüklendiğinde giriş kontrolü yap
    
    const passwordInput = document.getElementById('admin-password');
    const usernameInput = document.getElementById('admin-username');
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                girisKontrol();
            }
        });
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                passwordInput.focus();
            }
        });
    }
});

// --- CİNSİYET TAHMİNİ (İsimden) ---

function ogrenciCinsiyetiTahminEt(isim) {
    const isimLower = isim.toLowerCase().trim();
    
    // Yaygın Türkçe kadın isimleri
    const kadinIsimleri = ['ayşe', 'fatma', 'zeynep', 'elif', 'merve', 'büşra', 'defne', 'elisa', 
                           'cemre', 'dilara', 'ece', 'eda', 'emine', 'esra', 'feride', 'gizem', 
                           'hanife', 'hatice', 'melisa', 'melis', 'nazlı', 'nur', 'seda', 'selin', 
                           'serap', 'serpil', 'sibel', 'sude', 'tuğba', 'yasemin', 'yeliz', 'yıldız',
                           'zümrüt', 'ebru', 'nurcan', 'özge', 'pınar', 'deniz', 'su', 'damla'];
    
    // Yaygın Türkçe erkek isimleri
    const erkekIsimleri = ['ahmet', 'mehmet', 'ali', 'mustafa', 'hüseyin', 'ibrahim', 'ismail', 
                           'halil', 'ömer', 'osman', 'kemal', 'hasan', 'hüseyin', 'murat', 
                           'serkan', 'eren', 'burak', 'berkan', 'can', 'cem', 'deniz', 'emre', 
                           'onur', 'volkan', 'yusuf', 'yasin', 'berat', 'berkay', 'furkan', 
                           'kerem', 'kaan', 'barış', 'ertuğrul', 'tunahan'];
    
    // Tam eşleşme kontrolü
    if (kadinIsimleri.some(ad => isimLower.includes(ad) || isimLower.startsWith(ad))) {
        return 'k';
    }
    if (erkekIsimleri.some(ad => isimLower.includes(ad) || isimLower.startsWith(ad))) {
        return 'e';
    }
    
    // İsim son harfine göre tahmin (basit yaklaşım)
    // "a" ile bitenler genelde kadın olabilir (ama güvenilir değil)
    if (isimLower.endsWith('a') || isimLower.endsWith('e') || isimLower.endsWith('i')) {
        return 'k'; // Şüpheli durumlarda varsayılan olarak kadın
    }
    
    return 'e'; // Varsayılan olarak erkek
}

// --- BAŞLANGIÇ VE YÜKLEME ---

document.addEventListener('DOMContentLoaded', async () => {
    // Admin sayfasında giriş kontrolü
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        const loggedIn = adminGirisKontrol();
        if (!loggedIn) {
            // Giriş yapılmamış, sayfanın geri kalanını yükleme
            return;
        }
    }
    
    
    // 1. JSON veya LocalStorage'dan verileri asenkron olarak yükle
    await ilkVeriyiYukle();
    
    // 2. Select Değişim Olayları
    
    const sinifSecimElementi = document.getElementById('sinifSecimi');
    if (sinifSecimElementi) { 
        sinifSecimElementi.onchange = (e) => {
            seciliSinif = e.target.value;
            grupTablolariniGuncelle();
        };
    }
    
    const ogrenciSinifSecimiElementi = document.getElementById('ogrenciSinifSecimi');
    if (ogrenciSinifSecimiElementi) { 
        ogrenciSinifSecimiElementi.onchange = (e) => {
            seciliSinif = e.target.value;
            ogrenciSiralamaGoster();
            ogrenciGrupGoster();
        };
    }
    
    const duzenlenecekSinifSecimElementi = document.getElementById('duzenlenecekSinifSecim');
    if (duzenlenecekSinifSecimElementi) {
        duzenlenecekSinifSecimElementi.onchange = ogrenciListesiGuncelle;
    }
    
    // 3. Puan Butonlarını Oluştur (Sadece Admin'de var)
    const puanButonlariContainer = document.getElementById('puan-butonlari');
    if (puanButonlariContainer) {
        PUAN_BUTONLARI.forEach(btn => {
            const button = document.createElement('button');
            button.textContent = btn.etiket;
            button.onclick = () => puanEklemeButonu(btn.deger);
            puanButonlariContainer.appendChild(button);
        });
    }
    
    // 4. TÜM VERİLERİ VE ARAYÜZÜ İLK KEZ GÜNCELLE
    tumVerileriGuncelle();
});
