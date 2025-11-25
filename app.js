// مختصات اولیه تهران
const TEHRAN_COORDS = [35.6892, 51.3890];
let map;
let markers = []; // برای ذخیره نشانگرهای روی نقشه
let pointCoordinates = new Array(6).fill(null); // آرایه مختصات [راننده, 4 دانش‌آموز, مدرسه]

// تابع اولیه سازی نقشه
function initMap() {
    map = L.map('map').setView(TEHRAN_COORDS, 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // افزودن نشانگر با کلیک روی نقشه
    map.on('click', function(e) {
        const index = prompt("نقطه چندم را می‌خواهید تنظیم کنید؟ (0=راننده، 1-4=دانش‌آموز، 5=مدرسه)");
        const idx = parseInt(index);
        
        if (idx >= 0 && idx <= 5) {
            setMarker(idx, e.latlng.lat, e.latlng.lng);
            alert(`نقطه ${idx} با مختصات ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)} ثبت شد.`);
        } else {
            alert("ورودی نامعتبر.");
        }
    });
}

// تابع تنظیم نشانگر روی نقشه
function setMarker(index, lat, lng) {
    // حذف نشانگر قبلی
    if (markers[index]) {
        map.removeLayer(markers[index]);
    }

    // افزودن نشانگر جدید
    const marker = L.marker([lat, lng]).addTo(map);
    markers[index] = marker;
    pointCoordinates[index] = [lng, lat]; // توجه: ORS از [lng, lat] استفاده می‌کند
    
    // به‌روزرسانی فیلد ورودی (فقط برای نمایش)
    document.getElementById(`addr-${index}`).value = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}

// تابع اصلی محاسبه مسیر
function calculateRoute() {
    // فیلتر کردن مختصات خالی
    const validPoints = pointCoordinates.filter(p => p !== null);

    if (validPoints.length < 6) {
        alert("لطفاً همه ۶ نقطه (مبدأ، ۴ دانش‌آموز، مقصد) را تعیین کنید.");
        return;
    }

    // ساخت آرایه نقاط برای ارسال به بک‌اند (تمام ۶ نقطه باید به ترتیب فرستاده شوند)
    const payload = {
        points: validPoints,
        // (اینجا می‌توانستیم آدرس Geocoding را هم اضافه کنیم، اما فعلاً بر مختصات تمرکز می‌کنیم)
    };

    fetch('/optimize-route', { // مسیر API سمت سرور پایتون
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'OK') {
            displayOptimizedRoute(data.route, data.summary);
        } else {
            alert(`خطا در بهینه‌سازی مسیر: ${data.message || 'خطای ناشناس'}`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('خطا در ارتباط با سرور.');
    });
}

// نمایش مسیر بهینه و نتایج
let routeLayer = null;
function displayOptimizedRoute(geometry, summary) {
    // پاک کردن مسیر قبلی
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    // دیکد کردن پلی‌لاین از ORS
    const polyline = L.Polyline.fromEncoded(geometry).addTo(map);
    routeLayer = polyline;
    map.fitBounds(polyline.getBounds()); // تنظیم زوم نقشه

    // نمایش نتایج
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h3>نتیجه بهینه‌سازی:</h3>
        <p><strong>زمان کل سفر:</strong> ${summary.duration_text}</p>
        <p><strong>مسافت کل:</strong> ${summary.distance_text}</p>
        <p><strong>ترتیب توقف‌ها:</strong> (شامل راننده، دانش‌آموزان و مدرسه در بهترین ترتیب) </p>
        <p><em> ${summary.optimized_order} </em></p>
    `;
}

// شروع برنامه
window.onload = initMap;
