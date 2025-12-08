// script.js dosyasındaki siniflar objesi
const siniflar = {
    // Mevcut sınıfınızı güncelleyebilirsiniz
    "10-A": [ 
        { ad: "Ahmet Yılmaz", devamsiz: false, puan: 0 },
        { ad: "Ayşe Kaya", devamsiz: false, puan: 0 },
        // Yeni öğrencileri buraya ekleyin
        { ad: "Yeni Öğrenci Adı", devamsiz: false, puan: 0 } 
    ],
    // Yeni bir sınıf ekleyebilirsiniz
    "9-C": [ 
        { ad: "Cemil Güneş", devamsiz: false, puan: 0 },
        // ... diğer 9-C öğrencileri
    ]
};

// script.js dosyasındaki PUAN_BUTONLARI dizisi
const PUAN_BUTONLARI = [
    { deger: 5, etiket: "Hızlı Cevap (+5)" },
    { deger: 10, etiket: "Mükemmel Sunum (+10)" },
    { deger: 20, etiket: "Proje Kazananı (+20)" }, // Yeni Buton
    { deger: -5, etiket: "Uyar ( -5)" }
];

document.addEventListener('DOMContentLoaded', () => {
    // Sınıf Seçimini Doldur
    const sinifSecimElementi = document.getElementById('sinifSecimi');
    Object.keys(siniflar).forEach(sinif => {
        const option = document.createElement('option');
        option.value = sinif;
        option.textContent = sinif;
        sinifSecimElementi.appendChild(option);
    });
    sinifSecimElementi.onchange = (e) => {
        seciliSinif = e.target.value;
        mevcutGruplar = []; // Sınıf değişince grupları sıfırla
        grupTablolariniGuncelle();
    };

    // Puan Butonlarını Oluştur
    const puanButonlariContainer = document.getElementById('puan-butonlari');
    PUAN_BUTONLARI.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.etiket;
        button.onclick = () => puanEklemeButonu(btn.deger);
        puanButonlariContainer.appendChild(button);
    });
});
// Örnek öğrenci verisi (Excel'den aktarılmış/sadeleştirilmiş)
const siniflar = {
    "10-A": [
        { ad: "Ahmet Yılmaz", devamsiz: false, puan: 0 },
        { ad: "Ayşe Kaya", devamsiz: false, puan: 0 },
        { ad: "Burak Demir", devamsiz: false, puan: 0 },
        // ... diğer 10-A öğrencileri
    ],
    "11-B": [
        // ... 11-B öğrencileri
    ]
};

// Puan Butonlarının Tanımlanması
const PUAN_BUTONLARI = [
    { deger: 5, etiket: "Hızlı Cevap (+5)" },
    { deger: 10, etiket: "Mükemmel Sunum (+10)" },
    { deger: -5, etiket: "Uyar ( -5)" }
];

let mevcutGruplar = [];
let seciliSinif = "10-A"; // Başlangıç sınıfı

document.addEventListener('DOMContentLoaded', () => {
    // Sınıf Seçimini Doldur
    const sinifSecimElementi = document.getElementById('sinifSecimi');
    Object.keys(siniflar).forEach(sinif => {
        const option = document.createElement('option');
        option.value = sinif;
        option.textContent = sinif;
        sinifSecimElementi.appendChild(option);
    });
    sinifSecimElementi.onchange = (e) => {
        seciliSinif = e.target.value;
        mevcutGruplar = []; // Sınıf değişince grupları sıfırla
        grupTablolariniGuncelle();
    };

    // Puan Butonlarını Oluştur
    const puanButonlariContainer = document.getElementById('puan-butonlari');
    PUAN_BUTONLARI.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.etiket;
        button.onclick = () => puanEklemeButonu(btn.deger);
        puanButonlariContainer.appendChild(button);
    });
});
// Seçilen tüm grup/öğrenci üyelerine puan ekler
function puanEklemeButonu(puanDegeri) {
    const secilenler = document.querySelectorAll('#gruplar-container input[type="checkbox"]:checked');
    if (secilenler.length === 0) return alert("Önce puan verilecek öğrenci(ler)i/grubu seçin.");

    secilenler.forEach(checkbox => {
        const [grupIndex, uyeIndex] = checkbox.value.split('-').map(Number);
        
        // Puanı güncelle
        mevcutGruplar[grupIndex].uyeler[uyeIndex].puan += puanDegeri;
    });

    // Grupları sıfırla ve tabloyu yeniden çiz
    // Seçili kalmalarını isterseniz sıfırlama satırını kaldırabilirsiniz
    grupTablolariniGuncelle(); 
}

// Devamsızlık İşareti Koyma/Kaldırma
function devamsizligiDegistir(ad) {
    const ogrenci = siniflar[seciliSinif].find(o => o.ad === ad);
    if (ogrenci) {
        ogrenci.devamsiz = !ogrenci.devamsiz;
    }
    
    // Değişiklik grupları etkileyeceği için yeniden dağıtım yapılabilir.
    // Ancak sadece devamsızlık listesinin güncellenmesi daha temiz bir yaklaşımdır.
    grupTablolariniGuncelle(); 
    gruplariOlustur(); // Grupları yeniden dağıt (gelmeyeni çıkar)
}
function grupTablolariniGuncelle() {
    const container = document.getElementById('gruplar-container');
    container.innerHTML = ''; // Önceki tabloları temizle

    if (mevcutGruplar.length === 0) {
        container.innerHTML = "<p>Lütfen önce sınıf seçip grupları oluşturun.</p>";
        return;
    }

    // 1. Gruplar Tablosu
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
    
    // 2. Devamsız Öğrenciler Listesi (Opsiyonel: Liste halinde)
    const devamsizlar = siniflar[seciliSinif].filter(o => o.devamsiz);
    const devamsizDiv = document.createElement('div');
    devamsizDiv.innerHTML = '<h3>Devamsız Öğrenciler (Gruplara Dahil Değil)</h3>';
    
    devamsizDiv.innerHTML += `<ul>
        ${siniflar[seciliSinif].map(ogrenci => `
            <li>
                <input type="checkbox" 
                       onchange="devamsizligiDegistir('${ogrenci.ad}')"
                       ${ogrenci.devamsiz ? 'checked' : ''}>
                ${ogrenci.ad} 
                ${ogrenci.devamsiz ? '(Devamsız)' : '(Aktif)'}
            </li>
        `).join('')}
    </ul>`;

    container.prepend(devamsizDiv); // En üste ekle
}
function yeniOgrenciEkle() {
    const ad = document.getElementById('yeniOgrenciAd').value.trim();
    const hedefSinif = document.getElementById('hedefSinifSecimi').value;

    if (!ad || !hedefSinif || !siniflar[hedefSinif]) {
        alert("Lütfen geçerli bir ad ve sınıf seçin.");
        return;
    }

    // Yeni öğrenci objesi
    const yeniOgrenci = { ad: ad, devamsiz: false, puan: 0 };
    
    // Sınıfa ekle
    siniflar[hedefSinif].push(yeniOgrenci);
    
    // Veriyi kalıcı olarak kaydet
    veriyiKaydet(); 
    
    alert(`${ad}, ${hedefSinif} sınıfına eklendi.`);
    document.getElementById('yeniOgrenciAd').value = ''; // Input'u temizle
    
    // Sınıf seçim listesini ve tabloları güncelleyin
    grupTablolariniGuncelle(); 
}