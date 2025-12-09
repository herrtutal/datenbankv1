// --- SABİT TANIMLAMALAR ---

const BASE_SINIFLAR = {
    "10-A": [ 
        { ad: "Ahmet Yılmaz", devamsiz: false, puan: 50 },
        { ad: "Ayşe Kaya", devamsiz: false, puan: 35 },
        { ad: "Burak Demir", devamsiz: false, puan: 40 }
    ],
    "11-B": [],
    "5A": [], "5B": [], "5C": [], "5D": [], "5E": [], "5F": [],
    "6A": [], "6B": [], "6E": [], "6F": [],
};

const PUAN_BUTONLARI = [
    { deger: 5, etiket: "Hızlı Cevap (+5)" },
    { deger: 10, etiket: "Mükemmel Sunum (+10)" },
    { deger: 20, etiket: "Proje Kazananı (+20)" },
    { deger: -5, etiket: "Uyar ( -5)" }
];

let siniflar = {};
let mevcutGruplar = []; // Artık bu değişkenin verisi de LocalStorage'da tutulacak.
let seciliSinif = "10-A"; 


// --- KALICILIK YÖNETİMİ (LOCALSTORAGE) ---

function veriyiKaydet() {
    try {
        // Sınıfları ve mevcut grupları tek bir obje içinde kaydet
        const kayitObjesi = {
            siniflar: siniflar,
            gruplar: mevcutGruplar 
        };
        localStorage.setItem('sinifVerileri', JSON.stringify(kayitObjesi));
    } catch (e) {
        console.error("Local storage'a veri kaydedilirken bir hata oluştu:", e);
    }
}

function veriyiYukle() {
    const kayitliVeri = localStorage.getItem('sinifVerileri');
    if (kayitliVeri) {
        try {
            const parsedData = JSON.parse(kayitliVeri);
            
            if (typeof parsedData === 'object' && parsedData !== null && parsedData.siniflar) {
                // Sınıfları ve grupları yükle
                Object.assign(siniflar, parsedData.siniflar);
                mevcutGruplar = parsedData.gruplar || []; 
                return true;
            }
        } catch (e) {
            console.error("Local storage verisi bozuk veya geçersiz. Varsayılan veriler kullanılacak.", e);
            localStorage.removeItem('sinifVerileri'); 
        }
    }
    return false;
}


// --- GENEL GÜNCELLEME İŞLEVİ ---

function tumVerileriGuncelle() {
    // 1. Sınıf Select Menülerini Doldur (Hepsini)
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
    
    // 3. İlgili Select kutularının değerlerini ayarla (yalnızca varsa)
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
        // Yönetici (Admin) sayfası
        ogrenciListesiGuncelle();
        grupTablolariniGuncelle();
    } else if (document.getElementById('ogrenci-sayfasi')) {
        // Öğrenci sayfası
        ogrenciSiralamaGoster(); // Sıralama tablosunu göster
        ogrenciGrupGoster(); // Grup tablosunu göster
    }
    
    console.log("Tüm arayüz verileri güncellendi. Yeni Seçili Sınıf:", seciliSinif);
}


// --- SINIF VE GRUP İŞLEVLERİ (Admin Sayfası için) ---

function gruplariOlustur() {
    const grupSayisi = parseInt(document.getElementById('grupSayisi').value);
    if (grupSayisi < 2) return alert("Grup sayısı en az 2 olmalıdır.");
    if (!seciliSinif || !siniflar[seciliSinif]) return alert("Lütfen önce bir sınıf seçin.");

    let aktifOgrenciler = siniflar[seciliSinif].filter(o => !o.devamsiz);
    
    // Rastgele karıştırma
    for (let i = aktifOgrenciler.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [aktifOgrenciler[i], aktifOgrenciler[j]] = [aktifOgrenciler[j], aktifOgrenciler[i]];
    }

    const yeniGruplar = Array.from({ length: grupSayisi }, (_, i) => ({ 
        ad: `Grup ${i + 1}`, 
        sinif: seciliSinif, // Hangi sınıfa ait olduğunu kaydetmek için
        uyeler: [] 
    }));

    aktifOgrenciler.forEach((ogrenci, index) => {
        const grupIndex = index % grupSayisi;
        yeniGruplar[grupIndex].uyeler.push(ogrenci);
    });

    // Sadece bu sınıfa ait grupları güncelle ve yeni grupları ekle
    mevcutGruplar = mevcutGruplar.filter(g => g.sinif !== seciliSinif);
    mevcutGruplar.push(...yeniGruplar);
    
    veriyiKaydet(); // Grupları kaydet
    grupTablolariniGuncelle();
}

// ... (Diğer Admin fonksiyonları: grupTablolariniGuncelle, devamsizligiDegistir, puanEklemeButonu, sinifSelectleriniDoldur, yeniOgrenciEkle, ogrenciListesiGuncelle, ogrenciAdiniDuzenle, sinifiSil - hepsi tumVerileriGuncelle çağıracak şekilde güncellendi) ...

function grupTablolariniGuncelle() {
    const container = document.getElementById('gruplar-container');
    if (!container) return; // Admin panelinde değilse devam etme
    container.innerHTML = ''; 
    
    // Yalnızca seçili sınıfa ait grupları göster
    const seciliSinifGruplari = mevcutGruplar.filter(g => g.sinif === seciliSinif);
    
    if (!seciliSinif || seciliSinifGruplari.length === 0) {
        container.innerHTML = "<p>Lütfen yukarıdan bir sınıf seçin ve grupları oluşturun.</p>";
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
                    <th>Seç</th>
                    <th>Öğrenci Adı</th>
                    <th>Puan</th>
                </tr>
            </thead>
            <tbody>
                ${grup.uyeler.map((uye, uIndex) => `
                    <tr>
                        <td><input type="checkbox" value="${gIndex}-${uIndex}"></td>
                        <td>${uye.ad}</td>
                        <td>${uye.puan}</td>
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
    // Gruplar değiştiği için tekrar oluşturmaya gerek yok, sadece listeden çıkarıldı
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
        
        // Puanı hem geçici grupta hem de kalıcı siniflar objesinde güncelle
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
        document.getElementById('ogrenciSinifSecimi') // Yeni öğrenci select
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
    
    // Öğrenci zaten varsa ekleme
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
        mevcutGruplar = mevcutGruplar.filter(g => g.sinif !== silinecekSinif); // Silinen sınıfa ait grupları da sil
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
        siralamaDiv.innerHTML = "<p>Lütfen bir sınıf seçin.</p>";
        return;
    }

    // Puanlara göre büyükten küçüğe sırala
    const siraliOgrenciler = [...siniflar[seciliSinif]].sort((a, b) => b.puan - a.puan);

    let html = `
        <h3>${seciliSinif} Sınıfı Puan Sıralaması</h3>
        <table class="siralama-tablosu">
            <thead>
                <tr>
                    <th>Sıra</th>
                    <th>Öğrenci Adı</th>
                    <th>Puan</th>
                </tr>
            </thead>
            <tbody>
    `;

    siraliOgrenciler.forEach((ogrenci, index) => {
        html += `
            <tr class="${ogrenci.devamsiz ? 'devamsiz-ogrenci' : ''} ${index === 0 ? 'birinci' : ''}">
                <td>${index + 1}</td>
                <td>${ogrenci.ad} ${ogrenci.devamsiz ? '(<span class="devamsiz-text">Devamsız</span>)' : ''}</td>
                <td>${ogrenci.puan}</td>
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
        grupDiv.innerHTML = "<p>Lütfen bir sınıf seçin.</p>";
        return;
    }

    // Seçili sınıfa ait öğrencileri içeren grupları filtrele
    const sinifaOzelGruplar = mevcutGruplar.filter(g => g.sinif === seciliSinif);

    if (sinifaOzelGruplar.length === 0) {
        grupDiv.innerHTML = "<p>Bu sınıfa ait henüz grup oluşturulmadı.</p>";
        return;
    }


    let html = `<h3>${seciliSinif} Sınıfı Grupları</h3><div class="gruplar-container-ogrenci">`;

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

document.addEventListener('DOMContentLoaded', () => {
    // 1. VERİ YÜKLEME
    if (!veriyiYukle()) {
        Object.assign(siniflar, BASE_SINIFLAR);
    }
    
    // 2. Select Değişim Olayları
    
    // ADMIN Panelindeki Sınıf Seçimi
    const sinifSecimElementi = document.getElementById('sinifSecimi');
    if (sinifSecimElementi) { 
        sinifSecimElementi.onchange = (e) => {
            seciliSinif = e.target.value;
            grupTablolariniGuncelle();
        };
    }
    
    // ÖĞRENCİ Sayfasındaki Sınıf Seçimi
    const ogrenciSinifSecimiElementi = document.getElementById('ogrenciSinifSecimi');
    if (ogrenciSinifSecimiElementi) { 
        ogrenciSinifSecimiElementi.onchange = (e) => {
            seciliSinif = e.target.value;
            ogrenciSiralamaGoster();
            ogrenciGrupGoster();
        };
    }
    
    // Yönetim Alanı (duzenlenecekSinifSecim) için değişim olayını ayarla (Sadece Admin'de var)
    const duzenlenecekSinifSecimElementi = document.getElementById('duzenlenecekSinifSecim');
    if (duzenlenecekSinifSecimElementi) {
        duzenlenecekSinifSecimElementi.onchange = ogrenciListesiGuncelle;
    }
    
    // Puan Butonlarını Oluştur (Sadece Admin'de var)
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