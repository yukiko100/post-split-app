document.addEventListener('DOMContentLoaded', () => {
    // Labels corresponding to requirements
    const labels = ['A (分割用元画像)', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    
    // Output image names (base names)
    const outputNames = ['post_1.jpg', 'post_2.jpg', 'post_3.jpg', 'post_4.jpg'];

    // State to hold uploaded images as HTMLImageElement
    const imagesState = {
        A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null
    };

    const EXPECTED_WIDTH = 1600;
    const EXPECTED_HEIGHT = 900;

    const dropzoneContainer = document.getElementById('dropzone-container');
    const generateBtn = document.getElementById('generate-btn');
    const previewSection = document.getElementById('preview-section');
    const previewContainer = document.getElementById('preview-container');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const resetBtn = document.getElementById('reset-btn');

    if (qualitySlider) {
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = Number(e.target.value).toFixed(1);
        });
    }

    // Create Toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);

    function showToast(message, isSuccess = false) {
        toast.textContent = message;
        toast.className = `toast show ${isSuccess ? 'success' : ''}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Initialize Dropzones
    keys.forEach((key, index) => {
        const dropzone = document.createElement('div');
        dropzone.className = 'dropzone';
        dropzone.id = `dropzone-${key}`;
        
        const labelClass = key === 'A' ? 'dropzone-label is-A' : 'dropzone-label';
        
        dropzone.innerHTML = `
            <div class="${labelClass}">${labels[index]}</div>
            <div class="dropzone-content">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                <span>Click or Drop Image</span>
            </div>
            <img src="" alt="${key} Preview" id="img-preview-${key}">
            <button class="delete-btn" aria-label="Remove image" data-key="${key}">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <input type="file" accept="image/*" style="display:none" id="file-input-${key}">
        `;

        // Event Listeners for file input
        const fileInput = dropzone.querySelector(`#file-input-${key}`);
        const deleteBtn = dropzone.querySelector('.delete-btn');

        dropzone.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0], key);
            }
        });

        // Drag and drop events
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0], key);
            }
        });

        // Delete button
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeImage(key);
        });

        dropzoneContainer.appendChild(dropzone);
    });

    function handleFile(file, key) {
        if (!file.type.match('image.*')) {
            showToast('画像ファイルを選択してください');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Aspect Ratio validation warning (No strict block, just warning)
                const EXPECTED_RATIO = 16 / 9;
                const actualRatio = img.width / img.height;
                const tolerance = 0.05;
                
                if (Math.abs(actualRatio - EXPECTED_RATIO) > tolerance) {
                    showToast(`警告: 推奨の画像比率は 16:9 です (${key})`);
                }
                
                imagesState[key] = img;
                
                const dropzone = document.getElementById(`dropzone-${key}`);
                const imgPreview = document.getElementById(`img-preview-${key}`);
                
                imgPreview.src = e.target.result;
                dropzone.classList.add('has-image');
                
                checkAllImagesLoaded();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function removeImage(key) {
        imagesState[key] = null;
        const dropzone = document.getElementById(`dropzone-${key}`);
        const imgPreview = document.getElementById(`img-preview-${key}`);
        const fileInput = document.getElementById(`file-input-${key}`);
        
        imgPreview.src = '';
        fileInput.value = '';
        dropzone.classList.remove('has-image');
        
        checkAllImagesLoaded();
    }

    function checkAllImagesLoaded() {
        const allLoaded = keys.every(key => imagesState[key] !== null);
        generateBtn.disabled = !allLoaded;
    }

    // Reset Logic
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            keys.forEach(key => {
                removeImage(key);
            });
            previewSection.style.display = 'none';
            previewContainer.innerHTML = '';
            generatedDownloads = [];
            showToast('画像をリセットしました', true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Generation Logic
    generateBtn.addEventListener('click', async () => {
        if (generateBtn.disabled) return;
        
        generateBtn.innerHTML = '<span class="btn-text">Generating...</span>';
        generateBtn.disabled = true;

        // Give UI time to update
        await new Promise(r => setTimeout(r, 100));

        try {
            const outputs = await generateCompositions();
            renderPreviews(outputs);
            showToast('生成完了！', true);
            previewSection.style.display = 'block';
            previewSection.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            console.error(err);
            showToast('生成エラーが発生しました');
        } finally {
            generateBtn.innerHTML = '<span class="btn-text">Generate Images</span><span class="btn-glow"></span>';
            generateBtn.disabled = false;
        }
    });

    async function generateCompositions() {
        function createScaledA(imageA) {
            const canvas = document.createElement("canvas");
            canvas.width = 3200;
            canvas.height = 1800;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(imageA, 0, 0, 3200, 1800);

            return canvas;
        }

        function drawMiddleBand(ctx, scaledA, partIndex) {
            const positions = [
                { sx: 0,    sy: 0 },
                { sx: 1600, sy: 0 },
                { sx: 0,    sy: 900 },
                { sx: 1600, sy: 900 }
            ];

            const part = positions[partIndex];

            ctx.drawImage(
                scaledA,
                part.sx,
                part.sy,
                1600,
                900,
                0,
                900,
                1600,
                900
            );
        }

        function generateComposite(topImage, scaledA, partIndex, bottomImage) {
            const canvas = document.createElement("canvas");
            canvas.width = 1600;
            canvas.height = 2700;
            const ctx = canvas.getContext("2d");

            ctx.drawImage(topImage, 0, 0, 1600, 900);
            drawMiddleBand(ctx, scaledA, partIndex);
            ctx.drawImage(bottomImage, 0, 1800, 1600, 900);

            return canvas;
        }

        const images = imagesState;
        const scaledA = createScaledA(images.A);

        const compositions = [
            {
                name: "post_1",
                top: images.B,
                partIndex: 0,
                bottom: images.C
            },
            {
                name: "post_2",
                top: images.D,
                partIndex: 1,
                bottom: images.E
            },
            {
                name: "post_3",
                top: images.F,
                partIndex: 2,
                bottom: images.G
            },
            {
                name: "post_4",
                top: images.H,
                partIndex: 3,
                bottom: images.I
            }
        ];

        return compositions.map(comp => {
            const EXPORT_FORMAT = "image/jpeg";
            const EXPORT_QUALITY = qualitySlider ? parseFloat(qualitySlider.value) : 0.8;
            
            const canvas = generateComposite(comp.top, scaledA, comp.partIndex, comp.bottom);
            return {
                name: comp.name + '.jpg',
                url: canvas.toDataURL(EXPORT_FORMAT, EXPORT_QUALITY)
            };
        });
    }

    let generatedDownloads = [];

    function renderPreviews(outputs) {
        previewContainer.innerHTML = '';
        generatedDownloads = outputs;

        outputs.forEach(out => {
            const card = document.createElement('div');
            card.className = 'preview-card';
            
            card.innerHTML = `
                <div class="preview-img-container">
                    <img src="${out.url}" alt="${out.name}">
                </div>
                <div style="font-weight: 600;">${out.name}</div>
                <a href="${out.url}" download="${out.name}" class="download-single">
                    Download
                </a>
            `;
            
            previewContainer.appendChild(card);
        });
    }

    downloadAllBtn.addEventListener('click', () => {
        if (!generatedDownloads.length) return;
        
        // To download all without external Zip library, we programmatically click download links with delay
        generatedDownloads.forEach((out, index) => {
            setTimeout(() => {
                const a = document.createElement('a');
                a.href = out.url;
                a.download = out.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }, index * 300); // 300ms delay between each download to avoid browser blocking
        });
    });
});

// Force file refresh v8
