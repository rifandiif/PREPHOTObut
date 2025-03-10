/* js/editor.js */

// Variabel global untuk data foto dan timestamp
let photoDataArray = [];
let captureDateTime = null;

// Saat halaman dimuat, ambil data dari sessionStorage
window.addEventListener('DOMContentLoaded', () => {
  const storedPhotos = sessionStorage.getItem("capturedPhotos");
  const storedDateTime = sessionStorage.getItem("captureDateTime");

  if (!storedPhotos) {
    alert("Tidak ada foto ditemukan. Silakan ambil foto terlebih dahulu!");
    window.location.href = "photobox.html";
    return;
  }
  photoDataArray = JSON.parse(storedPhotos);
  if (storedDateTime) {
    captureDateTime = new Date(storedDateTime);
  }
  // Render awal dengan layout default (photobooth)
  renderPreview();
  setupEventListeners();
});

// ========================
// FUNGSI: Render Preview
// ========================
function renderPreview() {
  const photoPreview = document.getElementById('photoPreview');
  photoPreview.innerHTML = "";

  // Ambil nilai opsi
  const layoutType = document.querySelector('input[name="layoutType"]:checked').value;
  const frameColor = document.getElementById('frameColor').value;
  const removeWatermark = document.getElementById('removeWatermark').checked;
  const captionText = document.getElementById('captionText').value;
  const captionColor = document.getElementById('captionColor').value;
  const showDate = document.getElementById('showDate').checked;


  if (layoutType === "photobooth") {
    // Render 3 polaroid terpisah
    photoDataArray.forEach((dataUrl, idx) => {
      const polaroid = document.createElement('div');
      polaroid.classList.add('polaroid');
      polaroid.style.backgroundColor = frameColor;

      // Satu foto per polaroid
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = `Photo ${idx+1}`;
      polaroid.appendChild(img);

      // Watermark (jika tidak di-remove)
      if (!removeWatermark) {
        const wm = document.createElement('span');
        wm.classList.add('watermark');
        wm.textContent = captionText || "Watermark";
        wm.style.color = captionColor;
        polaroid.appendChild(wm);
      }

      // Date/Time (jika showDate aktif)
      if (showDate && captureDateTime) {
        const dateEl = document.createElement('div');
        dateEl.classList.add('date-info');
        dateEl.textContent = formatDateTime(captureDateTime);
        polaroid.appendChild(dateEl);
      }
      photoPreview.appendChild(polaroid);
    });
  } else {
    // FILMSTRIP: Gabungkan 3 foto dalam 1 polaroid
    const polaroid = document.createElement('div');
    polaroid.classList.add('polaroid');
    polaroid.style.backgroundColor = frameColor;

    // Container untuk menumpuk foto secara vertikal
    const filmstripDiv = document.createElement('div');
    filmstripDiv.classList.add('filmstrip-photos');
    photoDataArray.forEach((dataUrl, idx) => {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = `Photo ${idx+1}`;
      filmstripDiv.appendChild(img);
    });
    polaroid.appendChild(filmstripDiv);

    // Watermark
    if (!removeWatermark) {
      const wm = document.createElement('span');
      wm.classList.add('watermark');
      wm.textContent = captionText || "Watermark";
      wm.style.color = captionColor;
      polaroid.appendChild(wm);
    }

    // Date/Time
    if (showDate && captureDateTime) {
      const dateEl = document.createElement('div');
      dateEl.classList.add('date-info');
      dateEl.textContent = formatDateTime(captureDateTime);
      polaroid.appendChild(dateEl);
    }
    photoPreview.appendChild(polaroid);
  }
}

// ========================
// FUNGSI: Format Date/Time
// ========================
function formatDateTime(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const min = String(dateObj.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// ========================
// FUNGSI: Setup Event Listeners
// ========================
function setupEventListeners() {
  // Retake: Hapus data dan kembali ke Photobox
  document.getElementById('retakeBtn').addEventListener('click', () => {
    sessionStorage.removeItem("capturedPhotos");
    sessionStorage.removeItem("captureDateTime");
    window.location.href = "capture-session.html";
  });

  // Opsi Layout
  const layoutRadios = document.getElementsByName('layoutType');
  layoutRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      renderPreview();
    });
  });

  // Frame Color
  document.getElementById('frameColor').addEventListener('input', () => {
    renderPreview();
  });

  // Remove Watermark
  const removeWatermarkCb = document.getElementById('removeWatermark');
  removeWatermarkCb.addEventListener('change', () => {
    document.getElementById('captionText').disabled = removeWatermarkCb.checked;
    document.getElementById('captionColor').disabled = removeWatermarkCb.checked;
    renderPreview();
  });

  // Caption Text & Color
  document.getElementById('captionText').addEventListener('input', () => {
    renderPreview();
  });
  document.getElementById('captionColor').addEventListener('input', () => {
    renderPreview();
  });

  // Show Date
  document.getElementById('showDate').addEventListener('change', () => {
    renderPreview();
  });

  // Save Image: Munculkan prompt untuk nama user, lalu download file dengan format PREPHOTOX-YYYYMMDD-namaUser.png
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const userName = prompt("Masukkan nama Anda untuk watermark file:", "username");
    if (!userName) {
      alert("Nama pengguna tidak boleh kosong!");
      return;
    }
    let formattedDate = "unknownDate";
    if (captureDateTime) {
      const yyyy = captureDateTime.getFullYear();
      const mm = String(captureDateTime.getMonth() + 1).padStart(2, '0');
      const dd = String(captureDateTime.getDate()).padStart(2, '0');
      formattedDate = `${yyyy}${mm}${dd}`;
    }
    const fileName = `PREPHOTOX-${formattedDate}-${userName}.png`;

    try {
      const canvas = await html2canvas(document.getElementById("photoPreview"));
      let link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Error saving image:", err);
      alert("Gagal menyimpan gambar.");
    }
  });
}
