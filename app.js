class QRCryptoApp {
  constructor() {
    this.currentKey = null;
    this.stream = null;
    this.scanInterval = null;
    this.uploadedData = null;
    this.initializeElements();
    this.attachEventListeners();
  }

  initializeElements() {
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Encrypt tab
    this.messageInput = document.getElementById('messageInput');
    this.keyInput = document.getElementById('keyInput');
    this.generateBtn = document.getElementById('generateBtn');
    this.qrResult = document.getElementById('qrResult');
    this.qrCanvas = document.getElementById('qrCanvas');
    this.generatedKey = document.getElementById('generatedKey');
    this.copyKeyBtn = document.getElementById('copyKeyBtn');
    this.downloadBtn = document.getElementById('downloadBtn');

    // Decrypt tab
    this.cameraBtn = document.getElementById('cameraBtn');
    this.fileInput = document.getElementById('fileInput');
    this.decryptUploadedBtn = document.getElementById('decryptUploadedBtn');
    this.cameraContainer = document.getElementById('cameraContainer');
    this.video = document.getElementById('video');
    this.scanCanvas = document.getElementById('scanCanvas');
    this.stopCameraBtn = document.getElementById('stopCameraBtn');
    this.decryptKeyInput = document.getElementById('decryptKeyInput');
    this.decryptResult = document.getElementById('decryptResult');
    this.decryptedText = document.getElementById('decryptedText');
    this.copyDecryptedBtn = document.getElementById('copyDecryptedBtn');

    // Upload preview + status
    this.uploadStatus = document.getElementById('uploadStatus');
    this.uploadPreview = document.getElementById('uploadPreview');
    this.uploadPreviewContainer = document.getElementById('uploadPreviewContainer');

    // Toast
    this.toast = document.getElementById('toast');
    this.toastMessage = document.querySelector('.toast-message');
  }

  attachEventListeners() {
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => this.switchTab(button.dataset.tab));
    });

    // Encrypt
    this.generateBtn.addEventListener('click', () => this.generateQRCode());
    this.copyKeyBtn.addEventListener('click', () => this.copyKey());
    this.downloadBtn.addEventListener('click', () => this.downloadQRCode());

    // Decrypt
    this.cameraBtn.addEventListener('click', () => {
      console.log("Camera button clicked");
      this.startCamera();
    });
    this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
    this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    this.decryptUploadedBtn.addEventListener('click', () => this.decryptUploaded());
    this.copyDecryptedBtn.addEventListener('click', () => this.copyDecrypted());
  }

  switchTab(tabName) {
    this.tabButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabName);
    });
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    if (tabName !== 'decrypt' && this.stream) {
      this.stopCamera();
    }
  }

  // Encryption helpers ...
  async generateRandomKey() {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const keyData = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(keyData)));
  }

  async importKey(keyString) {
    let cleanKey = keyString.trim();
    let keyBuffer;
    try {
      if (/^[A-Za-z0-9+/=]+$/.test(cleanKey)) {
        try {
          let keyData = new Uint8Array(atob(cleanKey).split('').map(c => c.charCodeAt(0)));
          keyBuffer = keyData.buffer;
        } catch {
          const encoder = new TextEncoder();
          keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(cleanKey));
        }
      } else {
        const encoder = new TextEncoder();
        keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(cleanKey));
      }
      return await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    } catch (e) {
      this.showToast('Invalid key format.');
      throw e;
    }
  }

  async encryptMessage(message, keyString) {
    const key = await this.importKey(keyString);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...result));
  }

  async decryptMessage(encryptedData, keyString) {
    const key = await this.importKey(keyString);
    try {
      const cleanData = encryptedData.trim();
      const data = new Uint8Array(atob(cleanData).split('').map(c => c.charCodeAt(0)));
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
      return new TextDecoder().decode(decrypted);
    } catch {
      throw new Error('Decryption failed. Wrong key or corrupted QR data.');
    }
  }

  async generateQRCode() {
    const message = this.messageInput.value.trim();
    if (!message) {
      this.showToast('Please enter a message to encrypt.');
      return;
    }
    try {
      let keyString = this.keyInput.value.trim();
      if (!keyString) keyString = await this.generateRandomKey();

      this.currentKey = keyString;
      const encryptedData = await this.encryptMessage(message, keyString);

      await QRCode.toCanvas(this.qrCanvas, encryptedData, { width: 300, margin: 2 });
      this.generatedKey.textContent = keyString;
      this.qrResult.classList.remove('hidden');
      this.showToast('QR code generated successfully!');
    } catch (e) {
      this.showToast('Error generating QR code.');
      console.error(e);
    }
  }

  copyKey() {
    navigator.clipboard.writeText(this.currentKey)
      .then(() => this.showToast('Encryption key copied!'))
      .catch(() => this.showToast('Failed to copy key.'));
  }

  copyDecrypted() {
    const text = this.decryptedText.textContent;
    if (!text) {
      this.showToast("No message to copy.");
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => this.showToast("Decrypted message copied!"))
      .catch(() => this.showToast("Failed to copy message."));
  }

  downloadQRCode() {
    const link = document.createElement('a');
    link.download = 'encrypted-qr.png';
    link.href = this.qrCanvas.toDataURL();
    link.click();
    this.showToast('QR code downloaded.');
  }

  // Camera handling
  async startCamera() {
    console.log("Starting camera...");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.showCameraWarning("Your browser does not support camera access.");
        return;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      this.video.srcObject = this.stream;
      this.cameraContainer.classList.remove('hidden');
      document.getElementById('cameraWarning').classList.add('hidden');

      this.video.onloadedmetadata = () => {
        console.log("Camera feed loaded ✅");
        this.video.play();
        this.scanInterval = setInterval(() => this.scanQRCode(), 500);
        this.showToast('Camera started. Hold QR code steady in front of webcam.');
      };
    } catch (err) {
      console.error("Camera error:", err);
      this.showCameraWarning("⚠️ Unable to access camera. Please allow permission in your browser.");
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    clearInterval(this.scanInterval);
    this.cameraContainer.classList.add('hidden');
  }

  showCameraWarning(message) {
    const warningBox = document.getElementById('cameraWarning');
    warningBox.textContent = message;
    warningBox.classList.remove('hidden');
    this.cameraContainer.classList.add('hidden');
  }

  scanQRCode() {
    if (!this.video.videoWidth || !this.video.videoHeight) return;
    const ctx = this.scanCanvas.getContext('2d');
    this.scanCanvas.width = this.video.videoWidth;
    this.scanCanvas.height = this.video.videoHeight;
    ctx.drawImage(this.video, 0, 0, this.scanCanvas.width, this.scanCanvas.height);
    const imgData = ctx.getImageData(0, 0, this.scanCanvas.width, this.scanCanvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height);
    if (code) {
      this.stopCamera();
      this.uploadedData = code.data;
      this.showToast("QR code scanned successfully ✅. Now enter the key.");
    }
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const ctx = this.scanCanvas.getContext('2d');
        this.scanCanvas.width = img.width;
        this.scanCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) {
          this.uploadedData = code.data;
          this.uploadPreview.src = e.target.result;
          this.uploadPreviewContainer.classList.remove("hidden");
          this.uploadStatus.textContent = "✅ QR code uploaded successfully. Now please enter the decryption key.";
          this.uploadStatus.classList.remove("hidden");
          this.showToast("QR code uploaded successfully.");
        } else {
          this.uploadStatus.textContent = "❌ No valid QR code found in image.";
          this.uploadStatus.classList.remove("hidden");
          this.showToast("No QR code found in the uploaded image.");
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async decryptUploaded() {
    if (!this.uploadedData) {
      this.showToast("No QR code uploaded or scanned.");
      return;
    }
    const keyString = this.decryptKeyInput.value.trim();
    if (!keyString) {
      this.showToast("Please enter the decryption key.");
      return;
    }
    try {
      const decryptedMessage = await this.decryptMessage(this.uploadedData, keyString);
      this.decryptedText.textContent = decryptedMessage;
      this.decryptResult.classList.remove("hidden");
      this.showToast("Message decrypted successfully!");
    } catch {
      this.showToast("Decryption failed. Wrong key or corrupted QR.");
    }
  }

  showToast(message) {
    this.toastMessage.textContent = message;
    this.toast.classList.remove('hidden');
    setTimeout(() => this.toast.classList.add('hidden'), 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => new QRCryptoApp());
