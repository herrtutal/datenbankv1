// --- SABİT TANIMLAMALAR ---

const BASE_SINIFLAR = {
    "10-A": [ 
        { ad: "Ahmet Yılmaz", devamsiz: false, puan: 0 },
        { ad: "Ayşe Kaya", devamsiz: false, puan: 0 },
        { ad: "Burak Demir", devamsiz: false, puan: 0 }
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
let mevcutGruplar = [];
let seciliSinif = "10-A"; 


// --- KALICILIK YÖNETİMİ (LOCALSTORAGE) ---

function veriyiKaydet() {
    try {
        localStorage.setItem('sinifVerileri', JSON.stringify(siniflar));
    } catch (e) {
        console.error("Local storage'a veri kaydedilirken bir hata oluştu:", e);
    }
}

function veriyiYukle() {
    const kayitliVeri = localStorage.getItem('sinifVerileri');
    if (kayitliVeri) {
        try {
            const parsedData = JSON.parse(kayitliVeri);
            
            if (typeof parsedData === 'object' && parsedData !== null) {
                Object.assign(siniflar, parsedData);
                return true;
            }
        } catch (e) {
            console.error("Local storage verisi bozuk veya geçersiz. Varsayılan veriler kullanılacak.", e);
            localStorage.removeItem('sinifVerileri'); 
        }
    }
    return false;
}


// --- GENEL GÜNCELLEME İŞLEVİ (YENİ KOMUT) ---

/**
 * Tüm sınıf seçme menülerini, aktif sınıf değişkenini ve tablo/listeleri günceller.
 * Bu, veritabanında (localStorage) bir değişiklik olduğunda arayüzün anında senkronize olmasını sağlar.
 */
function tumVerileriGuncelle() {
    // 1. Sınıf Seçme Menülerini Doldur (Yeni/Silinen sınıfları listeler)
    sinifSelectleriniDoldur(); 
    
    // 2. Aktif sınıfı güncelle
    const sinifSecimElementi = document.getElementById('sinifSecimi');
    // Eğer eskiden seçili bir sınıf varsa onu koru, yoksa ilk sınıfı seç
    if (!siniflar[seciliSinif]) {
        seciliSinif = sinifSecimElementi.value || Object.keys(siniflar)[0] || null;
    }
    sinifSecimElementi.value = seciliSinif; // Ana select'i de ayarla
    
    // 3. Mevcut grupları sıfırla (Gruplar sadece manuel basınca oluşmalı)
    mevcutGruplar = [];

    // 4. Yönetim ve Grup tablolarını güncelle
    ogrenciListesiGuncelle();
    grupTablolariniGuncelle();
    
    console.log("Tüm arayüz verileri güncellendi.");
}


// --- SINIF VE GRUP İŞLEVLERİ ---

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

    mevcutGruplar = Array.from({ length: grupSayisi }, (_, i) => ({ 
        ad: `Grup ${i + 1}`, 
        uyeler: [] 
    }));

    aktifOgrenciler.forEach((ogrenci, index) => {
        const grupIndex = index % grupSayisi;
        mevcutGruplar[grupIndex].uyeler.push(ogrenci);
    });

    grupTablolariniGuncelle();
}

function grupTablolariniGuncelle() {
    const container = document.getElementById('gruplar-container');
    container.innerHTML = ''; 
    
    if (!seciliSinif || mevcutGruplar.length === 0) {
        container.innerHTML = "<p>Lütfen yukarıdan bir sınıf seçin ve grupları oluşturun.</p>";
        devamsizlikListesiniGuncelle();
        return;
    }

    mevcutGruplar.forEach((grup, gIndex) => {
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
    gruplariOlustur();
}

function devamsizlikListesiniGuncelle() {
     const devamsizDiv = document.getElementById('devamsiz-listesi');
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


// --- PUANLAMA İŞLEVİ ---

function puanEklemeButonu(puanDegeri) {
    const secilenler = document.querySelectorAll('#gruplar-container input[type="checkbox"]:checked');
    if (secilenler.length === 0) return alert("Önce puan verilecek öğrenci(ler)i seçin.");

    secilenler.forEach(checkbox => {
        const [grupIndex, uyeIndex] = checkbox.value.split('-').map(Number);
        
        mevcutGruplar[grupIndex].uyeler[uyeIndex].puan += puanDegeri;
    });

    veriyiKaydet();
    grupTablolariniGuncelle(); 
}


// --- VERİ YÖNETİM İŞLEVLERİ (Ekleme/Düzenleme/Silme) ---

function sinifSelectleriniDoldur() {
    const sinifListesi = Object.keys(siniflar).sort();

    const selects = [
        document.getElementById('sinifSecimi'),
        document.getElementById('hedefSinifSecimi'),
        document.getElementById('duzenlenecekSinifSecim'),
        document.getElementById('silinecekSinifSecim')
    ];
    
    selects.forEach(select => select.innerHTML = '');

    sinifListesi.forEach(sinif => {
        selects.forEach(select => {
            const option = document.createElement('option');
            option.value = sinif;
            option.textContent = sinif;
            select.appendChild(option);
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

    const yeniOgrenci = { ad: ad, devamsiz: false, puan: 0 };
    siniflar[hedefSinif].push(yeniOgrenci);
    
    veriyiKaydet(); 
    
    alert(`${ad}, ${hedefSinif} sınıfına başarıyla eklendi ve kaydedildi!`);
    
    adInput.value = ''; 
    tumVerileriGuncelle(); // Tüm arayüzü güncelle
}

function ogrenciListesiGuncelle() {
    const sinifAdi = document.getElementById('duzenlenecekSinifSecim').value;
    const ogrenciSelect = document.getElementById('duzenlenecekOgrenci');
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
        
        tumVerileriGuncelle(); // Tüm arayüzü güncelle
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
        veriyiKaydet();

        tumVerileriGuncelle(); // Tüm arayüzü tek bir komutla güncelle
        
        alert(`${silinecekSinif} sınıfı başarıyla silindi.`);
    }
}


// --- BAŞLANGIÇ VE YÜKLEME ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. VERİ YÜKLEME: LocalStorage'dan veri yükle, yoksa başlangıç verilerini kullan
    if (!veriyiYukle()) {
        Object.assign(siniflar, BASE_SINIFLAR);
    }
    
    // 2. Kontrol Alanı (sinifSecimi) için değişim olayını ayarla
    const sinifSecimElementi = document.getElementById('sinifSecimi');
    sinifSecimElementi.onchange = (e) => {
        seciliSinif = e.target.value;
        mevcutGruplar = []; 
        grupTablolariniGuncelle();
    };

    // 3. Yönetim Alanı (duzenlenecekSinifSecim) için değişim olayını ayarla
    const duzenlenecekSinifSecimElementi = document.getElementById('duzenlenecekSinifSecim');
    duzenlenecekSinifSecimElementi.onchange = ogrenciListesiGuncelle;
    
    // 4. Puan Butonlarını Oluştur
    const puanButonlariContainer = document.getElementById('puan-butonlari');
    PUAN_BUTONLARI.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.etiket;
        button.onclick = () => puanEklemeButonu(btn.deger);
        puanButonlariContainer.appendChild(button);
    });
    
    // 5. TÜM VERİLERİ VE ARAYÜZÜ İLK KEZ GÜNCELLE
    // Tüm select listeleri, aktif sınıf ve tablolar bu komutla yüklenen veriye göre ayarlanır.
    tumVerileriGuncelle();
});