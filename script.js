const IMAGE_DATA_URL = 'data.json';
const imageElement = document.getElementById('current-image');
const blurredBackground = document.getElementById('blurred-background');

let images = [];
let currentImageIndex = 0;
let slideshowInterval;

// Helper function: แปลงวันในสัปดาห์ปัจจุบันเป็นชื่อย่อ (e.g., 'Mon', 'Sun')
function getCurrentDayAbbrev() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
}

// 1. โหลดข้อมูลรูปภาพ
async function fetchImages() {
    try {
        const response = await fetch(IMAGE_DATA_URL);
        const allImages = await response.json();
        
        // กรองรูปภาพที่พร้อมแสดงผลตามเงื่อนไขทั้งหมด
        images = allImages.filter(img => {
            const now = new Date();
            const todayAbbrev = getCurrentDayAbbrev();
            
            // 1. ตรวจสอบวันหมดอายุ
            if (img.expiry_date && new Date(img.expiry_date) < now) {
                return false; 
            }
            
            // 2. ตรวจสอบตารางเวลา: วันที่วนซ้ำ
            const schedule = img.display_schedule;
            const shouldDisplayToday = schedule.every_day || schedule.repeat_days.includes(todayAbbrev);
            if (!shouldDisplayToday) {
                return false; 
            }
            
            // 3. ตรวจสอบตารางเวลา: ช่วงเวลา (เปรียบเทียบแค่เวลา HH:MM:SS)
            const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
            if (currentTime < schedule.start_time || currentTime > schedule.end_time) {
                return false;
            }
            
            return true; // ผ่านทุกเงื่อนไข
        });

        // จัดเรียงรูปภาพตาม ID หรือลำดับ (ไม่บังคับ)
        images.sort((a, b) => parseInt(a.id) - parseInt(b.id));

        if (images.length === 0) {
            console.log('No images to display for current schedule.');
            // อาจจะแสดงรูปภาพเริ่มต้นหรือข้อความแจ้งเตือน
        } else {
            startSlideshow();
        }
        
    } catch (error) {
        console.error('Error fetching image data:', error);
    }
}

// 2. เริ่มต้นและจัดการสไลด์โชว์
function startSlideshow() {
    if (images.length === 0) return;

    // เคลียร์ Interval เก่าก่อน
    if (slideshowInterval) clearInterval(slideshowInterval);

    // แสดงรูปภาพแรก
    displayImage(currentImageIndex);
    
    // ตั้งค่า Interval ตามเวลาวนซ้ำของรูปภาพปัจจุบัน
    const currentDuration = images[currentImageIndex].display_schedule.duration_sec * 1000;
    
    slideshowInterval = setInterval(() => {
        currentImageIndex = (currentImageIndex + 1) % images.length;
        displayImage(currentImageIndex);
        
        // รีเซ็ต Interval เพื่อให้ใช้ duration_sec ของรูปภาพใหม่
        startSlideshow(); 
    }, currentDuration);
}

// 3. แสดงรูปภาพปัจจุบัน
function displayImage(index) {
    const imgData = images[index];
    if (!imgData) return;

    // ตั้งค่า URL ของรูปภาพหลักและพื้นหลังเบลอ
    // Note: ใช้ `url(${...})` สำหรับ CSS background
    blurredBackground.style.backgroundImage = `url('${imgData.url}')`;
    
    // ตั้งค่ารูปภาพหลัก
    imageElement.src = imgData.url;

    console.log(`Displaying image ID ${imgData.id} for ${imgData.display_schedule.duration_sec} seconds.`);
}

// เริ่มต้นโปรแกรม
fetchImages();

// ตรวจสอบข้อมูลรูปภาพซ้ำทุกๆ ชั่วโมง (หรือช่วงเวลาที่คุณต้องการ) เพื่อรองรับการอัปเดตไฟล์ data.json
setInterval(fetchImages, 60 * 60 * 1000);
