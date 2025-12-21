// --- SABİT TANIMLAMALAR ---

// BASE_SINIFLAR SABİTİ KALDIRILMIŞTIR. Veri artık JSON dosyasından yüklenecek.
const INITIAL_DATA_FILE = 'initial_data.json'; 

const PUAN_BUTONLARI = [
    { deger: 5, etiket: "⚡ Hızlı Cevap (+5)" },
    { deger: 10, etiket: "🌟 Mükemmel Sunum (+10)" },
    { deger: 20, etiket: "🏆 Proje Kazananı (+20)" },
    { deger: -5, etiket: "⚠️ Uyarı (-5)" }
];

let siniflar = {}; 
let mevcutGruplar = []; 
let seciliSinif = "10-A"; 


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
                console.log("Veri Firestore'dan yüklendi.");
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
                        console.log("Veri gerçek zamanlı olarak güncellendi.");
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
    
    for (let i = aktifOgrenciler.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [aktifOgrenciler[i], aktifOgrenciler[j]] = [aktifOgrenciler[j], aktifOgrenciler[i]];
    }

    const grupEmojileri = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🟤', '🔶'];
    const yeniGruplar = Array.from({ length: grupSayisi }, (_, i) => ({ 
        ad: `${grupEmojileri[i] || '⭐'} Grup ${i + 1}`, 
        sinif: seciliSinif, 
        uyeler: [] 
    }));

    aktifOgrenciler.forEach((ogrenci, index) => {
        const grupIndex = index % grupSayisi;
        yeniGruplar[grupIndex].uyeler.push(ogrenci);
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
        
        const tablo = document.createElement('table');
        tablo.innerHTML = `
            <thead>
                <tr>
                    <th>✅ Seç</th>
                    <th>👤 Öğrenci Adı</th>
                    <th>⭐ Puan</th>
                </tr>
            </thead>
            <tbody>
                ${grup.uyeler.map((uye, uIndex) => `
                    <tr>
                        <td><input type="checkbox" value="${gIndex}-${uIndex}"></td>
                        <td>${uye.ad}</td>
                        <td><span class="puan-badge">${uye.puan}</span></td>
                    </tr>
                `).join('')}
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

     const liste = document.createElement('ul');
     liste.innerHTML = siniflar[seciliSinif].map(ogrenci => `
         <li>
             <input type="checkbox" 
                    onchange="devamsizligiDegistir('${ogrenci.ad}')"
                    ${ogrenci.devamsiz ? 'checked' : ''}>
             ${ogrenci.ad} 
             <span class="${ogrenci.devamsiz ? 'devamsiz' : 'aktif'}">
                 ${ogrenci.devamsiz ? '(Devamsız)' : '(Aktif)'}
             </span>
         </li>
     `).join('');
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

function yeniOgrenciEkle() {
    const adInput = document.getElementById('yeniOgrenciAd');
    const hedefSinif = document.getElementById('hedefSinifSecimi').value;
    const ad = adInput.value.trim();

    if (!ad || !hedefSinif || !siniflar[hedefSinif]) {
        alert("Lütfen geçerli bir öğrenci adı girin ve bir sınıf seçin.");
        return;
    }
    
    if (siniflar[hedefSinif].some(o => o.ad === ad)) {
        alert(`Hata: ${ad} öğrencisi zaten ${hedefSinif} sınıfında mevcut.`);
        return;
    }

    const yeniOgrenci = { ad: ad, devamsiz: false, puan: 0 };
    siniflar[hedefSinif].push(yeniOgrenci);
    
    veriyiKaydet(); 
    
    alert(`${ad}, ${hedefSinif} sınıfına başarıyla eklendi ve kaydedildi!`);
    
    adInput.value = ''; 
    tumVerileriGuncelle(); 
}

function ogrenciListesiGuncelle() {
    const sinifAdi = document.getElementById('duzenlenecekSinifSecim') ? document.getElementById('duzenlenecekSinifSecim').value : null;
    const ogrenciSelect = document.getElementById('duzenlenecekOgrenci');
    if (!ogrenciSelect) return;
    
    ogrenciSelect.innerHTML = ''; 

    if (siniflar[sinifAdi]) {
        siniflar[sinifAdi].forEach(ogrenci => {
            const option = document.createElement('option');
            option.value = ogrenci.ad; 
            option.textContent = ogrenci.ad;
            ogrenciSelect.appendChild(option);
        });
    }
}

function ogrenciAdiniDuzenle() {
    const sinifAdi = document.getElementById('duzenlenecekSinifSecim').value;
    const eskiAd = document.getElementById('duzenlenecekOgrenci').value;
    const yeniAdInput = document.getElementById('yeniOgrenciAdDuzenle');
    const yeniAd = yeniAdInput.value.trim();

    if (!yeniAd || !eskiAd) return alert("Lütfen hem öğrenciyi seçin hem de yeni adı girin.");

    const ogrenci = siniflar[sinifAdi].find(o => o.ad === eskiAd);

    if (ogrenci) {
        ogrenci.ad = yeniAd; 
        
        veriyiKaydet();
        yeniAdInput.value = ''; 
        
        tumVerileriGuncelle(); 
        alert(`${eskiAd} öğrencisinin adı başarıyla ${yeniAd} olarak güncellendi.`);
    } else {
        alert("Öğrenci bulunamadı.");
    }
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

    const siraliOgrenciler = [...siniflar[seciliSinif]].sort((a, b) => b.puan - a.puan);

    let html = `
        <h3>🏆 ${seciliSinif} Sınıfı Puan Sıralaması 🏆</h3>
        <table class="siralama-tablosu">
            <thead>
                <tr>
                    <th>🥇 Sıra</th>
                    <th>👤 Öğrenci Adı</th>
                    <th>⭐ Puan</th>
                </tr>
            </thead>
            <tbody>
    `;

    const madalyaEmojileri = ['🥇', '🥈', '🥉'];
    siraliOgrenciler.forEach((ogrenci, index) => {
        const madalya = index < 3 ? madalyaEmojileri[index] + ' ' : '';
        html += `
            <tr class="${ogrenci.devamsiz ? 'devamsiz-ogrenci' : ''} ${index === 0 ? 'birinci' : ''}">
                <td>${madalya}${index + 1}</td>
                <td>${ogrenci.ad} ${ogrenci.devamsiz ? '(<span class="devamsiz-text">Devamsız</span>)' : ''}</td>
                <td><span class="puan-badge">${ogrenci.puan}</span></td>
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
        html += `
            <div class="grup-karti-ogrenci">
                <h4>${grup.ad}</h4>
                <ul>
                    ${grup.uyeler.map(uye => {
                        const ogrenciTamData = siniflar[seciliSinif].find(o => o.ad === uye.ad);
                        const isDevamsiz = ogrenciTamData ? ogrenciTamData.devamsiz : false;
                        return `<li class="${isDevamsiz ? 'devamsiz-ogrenci' : ''}">${uye.ad} ${isDevamsiz ? '(Devamsız)' : ''}</li>`;
                    }).join('')}
                </ul>
            </div>
        `;
    });

    html += `</div>`;
    grupDiv.innerHTML = html;
}


// --- BAŞLANGIÇ VE YÜKLEME ---

document.addEventListener('DOMContentLoaded', async () => {
    
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