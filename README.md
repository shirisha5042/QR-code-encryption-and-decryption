<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/7998baa0-7278-4a0a-8a6a-8bb9e4d0a0c3" />

*🔐 Encrypted QR Message Transfer*

A secure QR code generator and scanner built with HTML, CSS, and JavaScript that lets you:
• ✨ Encrypt messages with AES-GCM and generate QR codes
• 🔑 Use either a custom key or let the app generate a random encryption key
• 📥 Download encrypted QR codes for sharing
• 📤 Upload QR images and decrypt them by entering the correct key
• 📷 Scan QR codes live using your laptop/PC camera
• ⚠ Built-in camera warning system if permissions are blocked
• 🎨 Modern UI with separated boxes for encrypted & decrypted results

*🚀 Features*

• AES-GCM encryption ensures strong message security
• Random or custom keys supported
• QR Code generation using qrcode.js
• QR Code scanning from uploaded images using jsQR
• Live QR scanning with webcam (via getUserMedia)
• Copy to clipboard buttons for encryption key & decrypted message
•Toast notifications & warning boxes for smooth UX

*🛠 Tech Stack*

• Frontend: HTML, CSS, JavaScript
• Libraries:
 • qrcode.js
 (QR generation)
 • jsQR
 (QR scanning)
• Crypto: Web Crypto API (AES-GCM)

*📸 Screenshots*

• Encryption Tab → Enter message + key → Generate QR
• Decryption Tab → Upload QR / Scan with camera → Enter key → Get decrypted message

*📂 How to Run*

• Clone the repository
 git clone https://github.com/your-username/encrypted-qr-msg-transfer.git
• Open the project in VS Code
• Right-click index.html → Open with Live Server
• Done ✅

*🌟 Use Cases*

• Secure message sharing via QR codes
• Classroom / exam secure info transfer
• Fun projects for cryptography learners
