/* js/main.js */

// ========================
// SELEKTOR DOM
// ========================
const video = document.getElementById('video');
const cameraSelect = document.getElementById('cameraSelect');
const captureBtn = document.getElementById('captureBtn');
const flipMirrorBtn = document.getElementById('flipMirrorBtn');
const timerBtn = document.getElementById('timerBtn');
const previewContainer = document.getElementById('previewContainer');
const photoCountEl = document.getElementById('photoCount');
const filterPopup = document.getElementById('filterPopup');
const filterLabel = document.getElementById('filterLabel');
const filterRange = document.getElementById('filterRange');
const filterValueDisplay = document.getElementById('filterValueDisplay');
const closeFilterPopup = document.getElementById('closeFilterPopup');
const editConfirmPopup = document.getElementById('editConfirmPopup');
const proceedEditBtn = document.getElementById('proceedEditBtn');
const retakeBtn = document.getElementById('retakeBtn');

// ========================
// KONFIGURASI AWAL
// ========================
let currentStream = null;
let currentDeviceId = null;
let capturedImages = []; // Menyimpan elemen <img> hasil capture
const maxPhotos = 3;      // Batas jumlah foto
let isMirrorFlipped = false;
let useTimer = false;

// Kita juga simpan timestamp (Date) saat capture terakhir
let photoTimestamps = []; // Array menampung waktu capture setiap foto

// Nilai filter awal (rentang 0–100)
let filterValues = {
  grayscale: 0,
  blur: 0,
  retro: 0,
  vintage: 0,
  contrast: 100,
  sharpness: 100,
  brightness: 100,
  grain: 0
};

// ========================
// FUNGSI: Inisialisasi Kamera & List Kamera
// ========================
async function getCameraStream(deviceId = null) {
  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
  }
  let constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : true,
    audio: false
  };
  try {
    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = currentStream;
    await listCameras();
  } catch (err) {
    console.error(err);
    alert("Tidak dapat mengakses kamera.");
  }
}

async function listCameras() {
  let devices = await navigator.mediaDevices.enumerateDevices();
  let videoDevices = devices.filter(d => d.kind === 'videoinput');
  cameraSelect.innerHTML = '';
  videoDevices.forEach((dev, idx) => {
    let option = document.createElement('option');
    option.value = dev.deviceId;
    option.textContent = dev.label || `Camera ${idx + 1}`;
    cameraSelect.appendChild(option);
  });
  if (videoDevices.length > 0 && !currentDeviceId) {
    currentDeviceId = videoDevices[0].deviceId;
  }
  cameraSelect.value = currentDeviceId;
}

// ========================
// EVENT: Flip Mirror
// ========================
flipMirrorBtn.addEventListener('click', () => {
  isMirrorFlipped = !isMirrorFlipped;
  video.style.transform = isMirrorFlipped ? 'scaleX(-1)' : 'scaleX(1)';
});

// ========================
// EVENT: Timer
// ========================
timerBtn.addEventListener('click', () => {
  useTimer = !useTimer;
  timerBtn.style.background = useTimer ? '#ccc' : '';
});

// ========================
// FUNGSI: Capture Photo
// ========================
function capturePhoto() {
  if (capturedImages.length >= maxPhotos) return;

  let canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  let ctx = canvas.getContext('2d');

  // Terapkan filter ke context
  ctx.filter = buildFilterString();

  // Jika mirror flip aktif, kita balik canvas
  if (isMirrorFlipped) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  // Gambar frame video ke canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Buat <img> dari canvas
  let img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  previewContainer.appendChild(img);
  capturedImages.push(img);

  // Simpan timestamp capture ini
  photoTimestamps.push(new Date());

  updatePhotoCount();

  if (capturedImages.length >= maxPhotos) {
    captureBtn.textContent = "Next";
  }
}

function startTimerCapture() {
  let countdown = 3;
  captureBtn.disabled = true;
  captureBtn.textContent = `(${countdown})`;

  let interval = setInterval(() => {
    countdown--;
    captureBtn.textContent = `(${countdown})`;
    if (countdown <= 0) {
      clearInterval(interval);
      captureBtn.disabled = false;
      if (capturedImages.length < maxPhotos) {
        captureBtn.textContent = "Capture";
      }
      capturePhoto();
    }
  }, 1000);
}

// ========================
// FUNGSI: Build String CSS Filter
// ========================
function buildFilterString() {
  let { grayscale, blur, retro, vintage, contrast, sharpness, brightness, grain } = filterValues;
  let flt = [];

  if (grayscale > 0) flt.push(`grayscale(${grayscale}%)`);
  if (blur > 0) flt.push(`blur(${blur / 10}px)`);
  if (retro > 0) flt.push(`hue-rotate(${retro * 3.6}deg)`);
  if (vintage > 0) flt.push(`sepia(${vintage}%)`);
  if (contrast !== 100) flt.push(`contrast(${contrast}%)`);
  if (sharpness !== 100) {
    let extra = sharpness / 100;
    flt.push(`saturate(${extra})`);
  }
  if (brightness !== 100) flt.push(`brightness(${brightness}%)`);
  if (grain > 0) {
    let ds = Math.floor(grain * 0.05);
    flt.push(`drop-shadow(0 0 ${ds}px rgba(0,0,0,0.5))`);
  }

  return flt.join(' ');
}

// ========================
// FUNGSI: Terapkan Filter Live
// ========================
function applyLiveFilter() {
  video.style.filter = buildFilterString();
}

// ========================
// EVENT: Buka Popup Filter
// ========================
document.querySelectorAll('.icon.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    let filterType = btn.getAttribute('data-filter');
    showFilterPopup(btn, filterType);
  });
});

function showFilterPopup(buttonEl, filterType) {
  filterLabel.textContent = getFilterLabel(filterType);
  filterRange.value = filterValues[filterType];
  filterValueDisplay.textContent = filterValues[filterType];

  let rect = buttonEl.getBoundingClientRect();
  filterPopup.style.left = (rect.left + window.scrollX) + "px";
  filterPopup.style.top = (rect.top + window.scrollY - 80) + "px";
  filterPopup.classList.remove('hidden');

  filterRange.oninput = () => {
    let v = parseInt(filterRange.value);
    filterValues[filterType] = v;
    filterValueDisplay.textContent = v;
    applyLiveFilter();
  };
}

closeFilterPopup.addEventListener('click', () => {
  filterPopup.classList.add('hidden');
});

function getFilterLabel(ft) {
  switch(ft) {
    case 'grayscale': return "Grayscale Intensity";
    case 'blur': return "Soft Blur Intensity";
    case 'retro': return "Retro Filter Intensity";
    case 'vintage': return "Vintage Filter Intensity";
    case 'contrast': return "Contrast";
    case 'sharpness': return "Sharpness";
    case 'brightness': return "Brightness";
    case 'grain': return "Grain";
    default: return "Filter";
  }
}

// ========================
// FUNGSI: Update Jumlah Foto
// ========================
function updatePhotoCount() {
  photoCountEl.textContent = `${capturedImages.length}/${maxPhotos}`;
}

// ========================
// FUNGSI: Simpan Data & Pindah Editor
// ========================
function goToEditor() {
  // Konversi <img>.src jadi array dataURL
  const imageDataArray = capturedImages.map(img => img.src);

  // Ambil timestamp terakhir (foto ke-3)
  let lastTimestamp = photoTimestamps[photoTimestamps.length - 1];
  
  // Simpan ke sessionStorage
  sessionStorage.setItem("capturedPhotos", JSON.stringify(imageDataArray));
  sessionStorage.setItem("captureDateTime", lastTimestamp.toString()); 
  // .toString() agar mudah disimpan, nanti di editor kita parse

  // Pindah ke editor
  window.location.href = "editor-session.html";
}

// ========================
// EVENT: Tombol Capture / Next
// ========================
captureBtn.addEventListener('click', () => {
  if (capturedImages.length < maxPhotos) {
    if (useTimer) {
      startTimerCapture();
    } else {
      capturePhoto();
    }
  } else {
    // Sudah max => Next
    goToEditor();
  }
});

// ========================
// EVENT: Edit / Retake Popup (Opsional)
// ========================
proceedEditBtn.addEventListener('click', () => {
  editConfirmPopup.classList.add('hidden');
  alert("Editor placeholder...");
});
retakeBtn.addEventListener('click', () => {
  editConfirmPopup.classList.add('hidden');
  capturedImages = [];
  photoTimestamps = [];
  previewContainer.innerHTML = '';
  updatePhotoCount();
  captureBtn.textContent = "Capture";
});

// ========================
// EVENT: Ganti Kamera
// ========================
cameraSelect.addEventListener('change', e => {
  currentDeviceId = e.target.value;
  getCameraStream(currentDeviceId);
});

// ========================
// INISIALISASI
// ========================
window.addEventListener('load', () => {
  getCameraStream();
  applyLiveFilter();
  updatePhotoCount();
});
