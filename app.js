// System prompt configuration for Pollinations AI
const SYSTEM_INSTRUCTION = `You are FoodGuardian AI, a simple and easy-to-understand food ingredient analyzer.

Your goal is to look at food ingredients and give a clear, simple rating and explanation for everyday people.

You receive:
1. Product Name (optional)
2. OCR Extracted Text from package
3. User Health Profile (optional)

----------------------------------------
ANALYSIS PROCESS & OUTPUT FORMAT

Keep the response extremely simple, visually appealing, and easy to read for a general audience. Avoid overly complex medical or scientific jargon.

# 🌟 Final Verdict
Give a simple scale rating:
🟢 **EXCELLENT choice**
🟡 **GOOD in moderation**
🔴 **BETTER TO AVOID**
Write 2-3 simple sentences explaining why.

# 📋 What's Inside? (The Good & The Bad)
List the most important ingredients the user should care about. Don't list every single ingredient if there are too many.
- ✅ **The Good:** (e.g., Whole grains, high protein, natural flavors, etc.)
- ⚠️ **The Bad / Watch Out:** (e.g., High added sugar, artificial dyes, trans fats, high sodium, etc.)

# 👤 How it fits YOUR profile
(If health profile is provided, explain how the food impacts their specific conditions, allergies, or diet in simple terms. If no profile, provide a general health tip.)

# 🔢 Simple Health Scores
Provide a quick visual score:
- **Overall Health Score:** X / 10
- **Processing Level:** (1 = Unprocessed, 4 = Ultra-processed)

----------------------------------------
IMPORTANT RULES:
- Keep text short and punchy. No long walls of text.
- If the OCR text is garbled, do your best to guess the main ingredients but add a small note that the text was hard to read.
- Do NOT output long reasoning or complex tables.
- Make sure to format nicely with markdown.`;

// Constant lists for tags
const MEDICAL_CONDITIONS = [
  "Diabetes", "Prediabetes", "Hypertension", "Kidney Disease", "Fatty Liver",
  "Heart Disease", "Obesity", "PCOS", "High Cholesterol", "Thyroid Disorder",
  "Celiac Disease", "IBS", "Lactose Intolerance"
];

const FOOD_ALLERGIES = [
  "Peanut", "Milk", "Soy", "Wheat", "Gluten", "Egg", "Tree Nuts", "Sesame", "Fish", "Shellfish"
];

const DIET_TYPES = [
  "Vegetarian", "Vegan", "Jain", "Keto", "Low Carb", "Low Sodium", "High Protein"
];

// Additives Dictionary Data
const ADDITIVES_DATA = [
  { name: "Aspartame", rating: "avoid", desc: "Artificial sweetener used in diet sodas. May cause headaches or digestive disturbances in some; controversial regarding long-term health." },
  { name: "High Fructose Corn Syrup (HFCS)", rating: "avoid", desc: "Highly refined sweetener linked strongly to insulin resistance, obesity, type 2 diabetes, and fatty liver disease." },
  { name: "Monosodium Glutamate (MSG)", rating: "moderation", desc: "Flavor enhancer. Generally safe, but some report headaches, sweating, or chest pressure." },
  { name: "Sodium Nitrite", rating: "avoid", desc: "Preservative in cured meats. Can react with stomach acids to form nitrosamines, which are linked to cancer risk." },
  { name: "Carrageenan", rating: "moderation", desc: "Thickener derived from seaweed. Some studies suggest it may cause intestinal irritation." },
  { name: "Yellow 5 (Tartrazine)", rating: "avoid", desc: "Artificial food dye linked to hyperactivity in children and occasional allergic reactions." },
  { name: "Xanthan Gum", rating: "excellent", desc: "Common binder and thickener. Safe for most people, though high amounts can cause mild digestive changes." },
  { name: "Stevia Extract", rating: "excellent", desc: "Natural zero-calorie sweetener derived from Stevia leaves. Generally safe and doesn't raise blood sugar." },
  { name: "Erythritol", rating: "moderation", desc: "Sugar alcohol used as a sweetener. Can cause bloating or digestive issues in larger quantities." },
  { name: "BHA & BHT", rating: "avoid", desc: "Preservatives used to keep oils from spoiling. Declared as 'reasonably anticipated human carcinogens'." },
  { name: "Titanium Dioxide", rating: "avoid", desc: "Whitening pigment used in candies. Banned in the EU due to concerns about genotoxicity." },
  { name: "Citric Acid", rating: "excellent", desc: "Natural acid found in citrus fruits, used for sourness or preservation. Safe and natural." }
];

// App State
const state = {
  productName: "",
  ocrText: "",
  profile: {
    age: "",
    gender: "",
    pregnant: false,
    conditions: [],
    allergies: [],
    diet: [],
    avoid: "",
    preferred: ""
  },
  isLoading: false,
  imageProcessed: false,
  stream: null,
  history: [],
  theme: "light",
  isPasteExpanded: false
};

// DOM Elements
const elements = {
  // Global Actions
  profileBtn: document.getElementById("profile-btn"),
  analyzeBtn: document.getElementById("analyze-btn"),
  printBtn: document.getElementById("print-btn"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  historyToggleBtn: document.getElementById("history-toggle-btn"),
  tabDictionary: document.getElementById("tab-dictionary"),
  
  // 2-Step Views
  stepInputView: document.getElementById("step-input-view"),
  stepOnboardingView: document.getElementById("step-onboarding-view"),
  stepLoadingView: document.getElementById("step-loading-view"),
  stepErrorView: document.getElementById("step-error-view"),
  stepResultView: document.getElementById("step-result-view"),
  backToScanBtn: document.getElementById("back-to-scan-btn"),
  dashboardGrid: document.querySelector(".dashboard-grid"),
  panelRight: document.querySelector(".panel-right"),
  
  // Inputs
  productNameInput: document.getElementById("product-name"),
  ocrTextarea: document.getElementById("ocr-textarea"),
  fileInput: document.getElementById("file-input"),
  uploadBtn: document.getElementById("upload-btn"),
  cameraBtn: document.getElementById("camera-btn"),
  
  // Manual Paste Toggles
  togglePasteBtn: document.getElementById("toggle-paste-btn"),
  pasteChevron: document.getElementById("paste-chevron"),
  manualPasteBox: document.getElementById("manual-paste-box"),
  
  // OCR & Results Output
  processingState: document.getElementById("processing-state"),
  ocrStatusMessage: document.getElementById("ocr-status-message"),
  errorMessage: document.getElementById("error-message"),
  errorRetryBtn: document.getElementById("error-retry-btn"),
  
  // Result details elements
  gaugeProgress: document.getElementById("gauge-progress"),
  gaugeScoreValue: document.getElementById("gauge-score-value"),
  verdictBadge: document.getElementById("verdict-badge"),
  simpleVerdictTitle: document.getElementById("simple-verdict-title"),
  simpleVerdictText: document.getElementById("simple-verdict-text"),
  goodHighlightsList: document.getElementById("good-highlights-list"),
  badHighlightsList: document.getElementById("bad-highlights-list"),
  resultHtml: document.getElementById("result-html"),
  profileSummaryTags: document.getElementById("profile-summary-tags"),
  
  // Profile Modal
  profileModal: document.getElementById("profile-modal"),
  modalClose: document.getElementById("modal-close"),
  profileAge: document.getElementById("profile-age"),
  profileGender: document.getElementById("profile-gender"),
  profilePregnant: document.getElementById("profile-pregnant"),
  medicalConditionsTags: document.getElementById("medical-conditions-tags"),
  foodAllergiesTags: document.getElementById("food-allergies-tags"),
  dietTypesTags: document.getElementById("diet-types-tags"),
  profileAvoid: document.getElementById("profile-avoid"),
  profilePreferred: document.getElementById("profile-preferred"),
  profileSaveBtn: document.getElementById("profile-save-btn"),
  
  // Camera Modal
  cameraModal: document.getElementById("camera-modal"),
  cameraClose: document.getElementById("camera-close"),
  cameraStream: document.getElementById("camera-stream"),
  captureBtn: document.getElementById("capture-btn"),
  cameraScanningOverlay: document.getElementById("camera-scanning-overlay"),
  cameraProgressBar: document.getElementById("camera-progress-bar"),
  cameraProgressPercent: document.getElementById("camera-progress-percent"),
  cameraErrorMessage: document.getElementById("camera-error-message"),
  cameraRetryBtn: document.getElementById("camera-retry-btn"),
  
  // History Drawer
  historyDrawer: document.getElementById("history-drawer"),
  historyClose: document.getElementById("history-close"),
  historyList: document.getElementById("history-list"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),

  // Dictionary Modal
  dictionaryModal: document.getElementById("dictionary-modal"),
  dictionaryClose: document.getElementById("dictionary-close"),
  dictionarySearch: document.getElementById("dictionary-search"),
  dictionaryList: document.getElementById("dictionary-list")
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();

  populateTags(MEDICAL_CONDITIONS, elements.medicalConditionsTags, "conditions", "active-condition");
  populateTags(FOOD_ALLERGIES, elements.foodAllergiesTags, "allergies", "active-allergy");
  populateTags(DIET_TYPES, elements.dietTypesTags, "diet", "active-diet");
  renderDictionary(ADDITIVES_DATA);
  updateProfileSummaryBar();

  // Load Lucide Icons
  lucide.createIcons();

  setupEventListeners();
  updateAnalyzeButtonState();
});

// Load persistent configurations
function loadSettings() {
  const savedTheme = localStorage.getItem("fg_theme") || "light";
  state.theme = savedTheme;
  document.documentElement.setAttribute("data-theme", savedTheme);

  const savedProfile = localStorage.getItem("fg_profile");
  if (savedProfile) {
    state.profile = JSON.parse(savedProfile);
  }

  const savedHistory = localStorage.getItem("fg_history");
  if (savedHistory) {
    state.history = JSON.parse(savedHistory);
  }
}

// Update active health tags bar
function updateProfileSummaryBar() {
  const tags = [];
  if (state.profile.diet.length > 0) tags.push(...state.profile.diet);
  if (state.profile.allergies.length > 0) tags.push(...state.profile.allergies.map(a => `${a} Free`));
  if (state.profile.conditions.length > 0) tags.push(...state.profile.conditions);
  if (state.profile.pregnant) tags.push("Pregnant");

  if (tags.length === 0) {
    elements.profileSummaryTags.textContent = "General Health (Default)";
  } else {
    elements.profileSummaryTags.textContent = tags.join(", ");
  }
}

// Save profile data
function saveProfileData() {
  state.profile.age = elements.profileAge.value;
  state.profile.gender = elements.profileGender.value;
  state.profile.pregnant = elements.profilePregnant.checked;
  state.profile.avoid = elements.profileAvoid.value;
  state.profile.preferred = elements.profilePreferred.value;

  localStorage.setItem("fg_profile", JSON.stringify(state.profile));
  updateProfileSummaryBar();
  closeProfileModal();
}

// Populate Tag options
function populateTags(list, container, stateField, activeClass) {
  container.innerHTML = "";
  list.forEach(item => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-btn";
    btn.textContent = item;
    btn.addEventListener("click", () => {
      const index = state.profile[stateField].indexOf(item);
      if (index > -1) {
        state.profile[stateField].splice(index, 1);
        btn.classList.remove(activeClass);
      } else {
        state.profile[stateField].push(item);
        btn.classList.add(activeClass);
      }
    });
    container.appendChild(btn);
  });
}

// Setup Event Listeners
function setupEventListeners() {
  elements.themeToggleBtn.addEventListener("click", toggleTheme);

  // Toggle manual paste container
  elements.togglePasteBtn.addEventListener("click", toggleManualPaste);

  // Dictionary modal toggle
  elements.tabDictionary.addEventListener("click", openDictionaryModal);
  elements.dictionaryClose.addEventListener("click", closeDictionaryModal);
  elements.dictionaryModal.addEventListener("click", (e) => {
    if (e.target === elements.dictionaryModal) closeDictionaryModal();
  });
  elements.dictionarySearch.addEventListener("input", filterDictionary);

  // Drawer Toggle
  elements.historyToggleBtn.addEventListener("click", openHistoryDrawer);
  elements.historyClose.addEventListener("click", closeHistoryDrawer);
  elements.clearHistoryBtn.addEventListener("click", clearHistory);
  elements.historyDrawer.addEventListener("click", (e) => {
    if (e.target === elements.historyDrawer) closeHistoryDrawer();
  });

  // Profile Modal Events
  elements.profileBtn.addEventListener("click", openProfileModal);
  elements.modalClose.addEventListener("click", closeProfileModal);
  elements.profileSaveBtn.addEventListener("click", saveProfileData);
  elements.profileModal.addEventListener("click", (e) => {
    if (e.target === elements.profileModal) closeProfileModal();
  });

  // Textarea manual inputs
  elements.ocrTextarea.addEventListener("input", (e) => {
    state.ocrText = e.target.value;
    updateAnalyzeButtonState();
  });
  elements.productNameInput.addEventListener("input", (e) => {
    state.productName = e.target.value;
  });

  // Media triggers
  elements.uploadBtn.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", handleFileUpload);
  elements.cameraBtn.addEventListener("click", openCameraModal);
  elements.cameraClose.addEventListener("click", closeCameraModal);
  elements.captureBtn.addEventListener("click", captureAndScan);
  elements.cameraRetryBtn.addEventListener("click", startCamera);

  // Wizard Navigation
  elements.analyzeBtn.addEventListener("click", () => startAnalysisFlow());
  elements.backToScanBtn.addEventListener("click", backToScanScreen);
  elements.errorRetryBtn.addEventListener("click", backToScanScreen);
  elements.printBtn.addEventListener("click", () => window.print());
}

// Toggle manual paste accordion
function toggleManualPaste() {
  state.isPasteExpanded = !state.isPasteExpanded;
  if (state.isPasteExpanded) {
    elements.togglePasteBtn.classList.add("expanded");
    elements.manualPasteBox.classList.remove("hidden");
  } else {
    elements.togglePasteBtn.classList.remove("expanded");
    elements.manualPasteBox.classList.add("hidden");
  }
}

// Switch themes
function toggleTheme() {
  const newTheme = state.theme === "light" ? "dark" : "light";
  state.theme = newTheme;
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("fg_theme", newTheme);
}

// Update Analyze Button State
function updateAnalyzeButtonState() {
  const hasText = state.ocrText.trim().length > 0;
  elements.analyzeBtn.disabled = !hasText || state.isLoading;
}

// Dictionary Modal Controllers
function openDictionaryModal() {
  elements.dictionaryModal.classList.remove("hidden");
}

function closeDictionaryModal() {
  elements.dictionaryModal.classList.add("hidden");
}

// Return to Step 1 scan screen
function backToScanScreen() {
  elements.stepResultView.classList.add("hidden");
  elements.stepErrorView.classList.add("hidden");
  elements.stepLoadingView.classList.add("hidden");
  elements.stepOnboardingView.classList.add("hidden");
  
  elements.dashboardGrid.classList.remove("results-active");
  elements.stepInputView.classList.remove("hidden");
  
  // Reset inputs
  state.ocrText = "";
  elements.ocrTextarea.value = "";
  state.productName = "";
  elements.productNameInput.value = "";
  elements.ocrStatusMessage.classList.add("hidden");
  updateAnalyzeButtonState();

  // Scroll back to the top of the inputs on mobile
  if (window.innerWidth < 1024) {
    elements.stepInputView.scrollIntoView({ behavior: 'smooth' });
  }
}

// Otsu's adaptive thresholding for high accuracy OCR pre-processing
function otsuThreshold(imageData) {
  const data = imageData.data;
  const len = data.length;
  
  // 1. Convert to grayscale & calculate histogram
  const hist = new Array(256).fill(0);
  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    data[i] = gray; // store gray in place
    hist[gray]++;
  }
  
  const total = len / 4;
  let sum = 0;
  for (let t = 0; t < 256; t++) {
    sum += t * hist[t];
  }
  
  let sumB = 0;
  let wB = 0;
  let wF = 0;
  
  let varMax = 0;
  let threshold = 127;
  
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    
    wF = total - wB;
    if (wF === 0) break;
    
    sumB += t * hist[t];
    
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    
    const varBetween = wB * wF * (mB - mF) * (mB - mF);
    
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }
  
  // Apply binarization
  for (let i = 0; i < len; i += 4) {
    const val = data[i] > threshold ? 255 : 0;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  
  return threshold;
}

// High Accuracy OCR processing
function processImageForOCR(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const scale = 2; // high-resolution scale
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Draw scaled colored image first
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Extract binarized pixel intensities dynamically using Otsu's threshold
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        otsuThreshold(imageData);
        ctx.putImageData(imageData, 0, 0);

        try {
          // Initialize Tesseract with character whitelist limits to filter garbage noise
          const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
            tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(),.:;%&/+-* ',
            logger: m => console.log(m)
          });
          
          resolve(text);
        } catch (err) {
          // If Otsu failed, fall back to basic grayscale scan
          try {
            console.log("Otsu OCR failed, trying grayscale fallback...");
            const rawCanvas = document.createElement("canvas");
            rawCanvas.width = img.width * scale;
            rawCanvas.height = img.height * scale;
            const rawCtx = rawCanvas.getContext("2d");
            if (rawCtx) {
              rawCtx.drawImage(img, 0, 0, rawCanvas.width, rawCanvas.height);
              const rawResult = await Tesseract.recognize(rawCanvas, 'eng');
              resolve(rawResult.data.text);
              return;
            }
          } catch (innerErr) {
            console.error("Grayscale fallback failed:", innerErr);
          }
          reject(err);
        }
      } else {
        reject(new Error("No canvas context"));
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// File Upload Handler
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  state.isLoading = true;
  updateAnalyzeButtonState();
  
  // Transition to loading step showing OCR progress status
  elements.stepInputView.classList.add("hidden");
  elements.stepOnboardingView.classList.add("hidden");
  elements.stepLoadingView.classList.remove("hidden");
  elements.processingState.classList.remove("hidden");
  elements.dashboardGrid.classList.add("results-active");

  try {
    const text = await processImageForOCR(file);
    state.ocrText = text;
    elements.ocrTextarea.value = text;
    
    // Automatically open manual paste section to show the result
    if (!state.isPasteExpanded) {
      toggleManualPaste();
    }
    
    elements.ocrStatusMessage.classList.remove("hidden");
    elements.processingState.classList.add("hidden");
    
    // Run direct AI analysis immediately
    startAnalysisFlow(text);
  } catch (err) {
    console.error("OCR upload error:", err);
    alert("Failed to extract text from the image. Please try again.");
    elements.processingState.classList.add("hidden");
    backToScanScreen();
  } finally {
    state.isLoading = false;
    elements.fileInput.value = "";
    updateAnalyzeButtonState();
  }
}

// Camera Scanner Controllers
async function openCameraModal() {
  elements.cameraErrorMessage.classList.add("hidden");
  elements.cameraScanningOverlay.classList.add("hidden");
  elements.cameraModal.classList.remove("hidden");
  await startCamera();
}

async function startCamera() {
  elements.cameraErrorMessage.classList.add("hidden");
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    state.stream = mediaStream;
    elements.cameraStream.srcObject = mediaStream;
  } catch (err) {
    console.error("Camera access error:", err);
    elements.cameraErrorMessage.classList.remove("hidden");
  }
}

function closeCameraModal() {
  if (state.stream) {
    state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
  }
  elements.cameraModal.classList.add("hidden");
}

async function captureAndScan() {
  if (!state.stream || !elements.cameraStream.videoWidth) return;

  elements.cameraScanningOverlay.classList.remove("hidden");
  elements.cameraProgressBar.style.width = "0%";
  elements.cameraProgressPercent.textContent = "0%";

  const video = elements.cameraStream;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Draw and run Otsu's threshold on image scan buffer
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    otsuThreshold(imageData);
    ctx.putImageData(imageData, 0, 0);

    try {
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng', {
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789(),.:;%&/+-* ',
        logger: m => {
          if (m.status === 'recognizing text') {
            const progressVal = Math.round(m.progress * 100);
            elements.cameraProgressBar.style.width = `${progressVal}%`;
            elements.cameraProgressPercent.textContent = `${progressVal}%`;
          }
        }
      });
      
      closeCameraModal();
      
      state.ocrText = text;
      elements.ocrTextarea.value = text;
      
      if (!state.isPasteExpanded) {
        toggleManualPaste();
      }
      elements.ocrStatusMessage.classList.remove("hidden");
      
      // Load loading screen and analysis
      elements.stepInputView.classList.add("hidden");
      elements.stepOnboardingView.classList.add("hidden");
      elements.stepLoadingView.classList.remove("hidden");
      elements.dashboardGrid.classList.add("results-active");
      
      startAnalysisFlow(text);
    } catch (err) {
      console.error("OCR Scan Error:", err);
      alert("Failed to extract text from the camera scan. Please try again.");
      elements.cameraScanningOverlay.classList.add("hidden");
      closeCameraModal();
    }
  }
}

// Client side serverless analysis fetch
async function startAnalysisFlow(directText) {
  const textToAnalyze = directText || state.ocrText;
  if (!textToAnalyze.trim()) {
    alert("Please provide some ingredients or scan a product to analyze.");
    return;
  }

  state.isLoading = true;
  updateAnalyzeButtonState();

  // Transitions to Loading Step
  elements.stepInputView.classList.add("hidden");
  elements.stepOnboardingView.classList.add("hidden");
  elements.stepResultView.classList.add("hidden");
  elements.stepErrorView.classList.add("hidden");
  elements.stepLoadingView.classList.remove("hidden");
  elements.dashboardGrid.classList.add("results-active");

  // Smooth scroll to loading on mobile
  if (window.innerWidth < 1024) {
    elements.panelRight.scrollIntoView({ behavior: 'smooth' });
  }

  // Construct health profile settings prompt block
  const isProfileEmpty = !state.profile.age && !state.profile.gender && !state.profile.pregnant && 
                         state.profile.conditions.length === 0 && state.profile.allergies.length === 0 && 
                         state.profile.diet.length === 0 && !state.profile.avoid && !state.profile.preferred;

  const profileSection = isProfileEmpty ? "User Health Profile: Not Provided (Provide general evaluation)" : `User Health Profile:
Age: ${state.profile.age || 'Not Provided'}
Gender: ${state.profile.gender || 'Not Provided'}
Pregnant: ${state.profile.pregnant ? 'Yes' : 'No'}
Medical Conditions: ${state.profile.conditions.join(', ') || 'None'}
Food Allergies: ${state.profile.allergies.join(', ') || 'None'}
Diet: ${state.profile.diet.join(', ') || 'None'}
Avoid: ${state.profile.avoid || 'None'}
Preferred: ${state.profile.preferred || 'None'}`;

  const prompt = `Product Name: ${state.productName || 'Not Provided'}

OCR Extracted Text:
${textToAnalyze}

${profileSection}
`;

  try {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const endpoint = isLocalhost ? "/api/analyze" : "https://text.pollinations.ai/";
    const aiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Service returned status ${aiResponse.status}`);
    }

    const resultText = await aiResponse.text();

    // Save scan to local history log
    saveToHistory(state.productName || "Unknown Product", resultText);

    displayResult(resultText);
  } catch (err) {
    console.error("AI Analysis failed:", err);
    elements.errorMessage.textContent = err.message || "Could not complete analysis. Check internet connection and try again.";
    elements.stepLoadingView.classList.add("hidden");
    elements.stepErrorView.classList.remove("hidden");
  } finally {
    state.isLoading = false;
    updateAnalyzeButtonState();
  }
}

// Display results & parse parameters for 2-step simplified layout
function displayResult(markdownText) {
  // Render full reasoning markdown inside accordion
  elements.resultHtml.innerHTML = marked.parse(markdownText);
  
  // Extract Health Score (robust parsing supporting markdown bold stars)
  let score = null;
  const scoreRegex = /Overall Health Score:[^\d]*(\d+(\.\d+)?)/i;
  const scoreMatch = markdownText.match(scoreRegex);
  if (scoreMatch) {
    score = parseFloat(scoreMatch[1]);
  } else {
    const fallbackRegex = /Score:[^\d]*(\d+(\.\d+)?)/i;
    const fallbackMatch = markdownText.match(fallbackRegex);
    if (fallbackMatch) {
      score = parseFloat(fallbackMatch[1]);
    }
  }
  updateGauge(score);

  // Parse simple verdict description text
  let verdictText = "Click the accordion dropdown below to view reasoning details.";
  const verdictMatch = markdownText.match(/# 🌟 Final Verdict\s*\n+([\s\S]*?)(?=\n+#|$)/i);
  if (verdictMatch) {
    verdictText = verdictMatch[1].replace(/[🟢🟡🔴]/g, '').trim();
  }
  elements.simpleVerdictText.innerHTML = verdictText;

  // Set safety verdict badge classes
  elements.verdictBadge.className = "verdict-badge-pill";
  if (markdownText.includes("🟢") || markdownText.toLowerCase().includes("excellent")) {
    elements.verdictBadge.classList.add("excellent");
    elements.verdictBadge.textContent = "Excellent Choice";
  } else if (markdownText.includes("🔴") || markdownText.toLowerCase().includes("avoid")) {
    elements.verdictBadge.classList.add("avoid");
    elements.verdictBadge.textContent = "Better To Avoid";
  } else {
    elements.verdictBadge.classList.add("moderation");
    elements.verdictBadge.textContent = "Good in Moderation";
  }

  // Helper function for parsing highlights
  function extractHighlights(text, type) {
    const list = [];
    const lines = text.split('\n');
    let inSection = false;
    
    const startMarkers = type === 'good' 
      ? ['the good', '✅', 'good choices', 'excellent choice']
      : ['the bad', 'watch out', '⚠️', 'better to avoid', 'avoid'];
      
    const stopMarkers = type === 'good'
      ? ['the bad', 'watch out', '⚠️', 'better to avoid', 'avoid', '# 👤', '# 🔢', 'verdict', 'score']
      : ['the good', '✅', 'good choices', 'excellent choice', '# 👤', '# 🔢', 'verdict', 'score'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const lowerLine = line.toLowerCase();
      
      if (startMarkers.some(marker => lowerLine.includes(marker))) {
        inSection = true;
        const headerIndex = lowerLine.indexOf('good') !== -1 ? lowerLine.indexOf('good') + 4 : lowerLine.indexOf('✅') !== -1 ? lowerLine.indexOf('✅') + 1 : lowerLine.indexOf('⚠️') !== -1 ? lowerLine.indexOf('⚠️') + 1 : 0;
        let afterHeader = line.substring(headerIndex).replace(/^[*\s:()⚠️✅\-]+/g, '').trim();
        if (afterHeader && !afterHeader.startsWith('-') && !afterHeader.startsWith('*')) {
          const parts = afterHeader.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
          list.push(...parts);
        }
        continue;
      }
      
      if (inSection && (stopMarkers.some(marker => lowerLine.includes(marker)) || line.startsWith('#'))) {
        break;
      }
      
      if (inSection) {
        if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
          const item = line.replace(/^[-*•\s]+/, '').replace(/\*\*+/g, '').trim();
          if (item) list.push(item);
        } else {
          const parts = line.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
          if (parts.length > 1) {
            list.push(...parts);
          } else if (parts.length === 1 && parts[0].length < 100) {
            list.push(parts[0]);
          }
        }
      }
    }
    return list.slice(0, 3);
  }

  // Parse Good Highlights
  elements.goodHighlightsList.innerHTML = "";
  const goodList = extractHighlights(markdownText, 'good');
  if (goodList.length === 0) {
    goodList.push("High nutritional values", "Good dietary profile alignment");
  }
  goodList.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    elements.goodHighlightsList.appendChild(li);
  });

  // Parse Bad/Watch Out Highlights
  elements.badHighlightsList.innerHTML = "";
  const badList = extractHighlights(markdownText, 'bad');
  if (badList.length === 0) {
    badList.push("Verify additive contents below", "Review processing scores");
  }
  badList.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    elements.badHighlightsList.appendChild(li);
  });

  // Switch step views
  elements.stepLoadingView.classList.add("hidden");
  elements.stepResultView.classList.remove("hidden");
}

// Animate Circular Gauge
function updateGauge(score) {
  if (score === null || isNaN(score)) {
    elements.gaugeScoreValue.textContent = "--";
    elements.gaugeProgress.style.strokeDashoffset = 251.2;
    return;
  }
  
  elements.gaugeScoreValue.textContent = score;
  const maxOffset = 251.2;
  const percent = score / 10;
  const offset = maxOffset - (percent * maxOffset);
  
  if (score >= 7) {
    elements.gaugeProgress.style.stroke = "var(--emerald)";
  } else if (score >= 4) {
    elements.gaugeProgress.style.stroke = "var(--orange)";
  } else {
    elements.gaugeProgress.style.stroke = "var(--rose)";
  }
  
  elements.gaugeProgress.style.strokeDashoffset = offset;
}

// Save history log
function saveToHistory(productName, resultText) {
  let verdictClass = "moderation";
  let verdictLabel = "MODERATION";

  if (resultText.includes("🟢") || resultText.toLowerCase().includes("excellent")) {
    verdictClass = "excellent";
    verdictLabel = "EXCELLENT";
  } else if (resultText.includes("🔴") || resultText.toLowerCase().includes("avoid")) {
    verdictClass = "avoid";
    verdictLabel = "AVOID";
  }

  const newScan = {
    id: Date.now(),
    date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    productName: productName,
    verdictClass: verdictClass,
    verdictLabel: verdictLabel,
    markdown: resultText
  };

  state.history.unshift(newScan);
  if (state.history.length > 20) state.history.pop();

  localStorage.setItem("fg_history", JSON.stringify(state.history));
  renderHistoryList();
}

// History drawer
function openHistoryDrawer() {
  renderHistoryList();
  elements.historyDrawer.classList.remove("hidden");
}

function closeHistoryDrawer() {
  elements.historyDrawer.classList.add("hidden");
}

function renderHistoryList() {
  elements.historyList.innerHTML = "";
  if (state.history.length === 0) {
    elements.historyList.innerHTML = `<p class="text-center text-muted" style="margin-top: 40px;">No scan history yet.</p>`;
    return;
  }

  state.history.forEach(item => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <div class="history-card-header">
        <span class="date">${item.date}</span>
        <span class="score-badge ${item.verdictClass}">${item.verdictLabel}</span>
      </div>
      <div class="history-card-title">${item.productName}</div>
      <div class="history-card-desc">${item.markdown.substring(0, 100).replace(/[#*`_]/g, '')}...</div>
    `;
    card.addEventListener("click", () => {
      closeHistoryDrawer();
      elements.stepOnboardingView.classList.add("hidden");
      elements.stepErrorView.classList.add("hidden");
      elements.dashboardGrid.classList.add("results-active");
      
      state.productName = item.productName;
      elements.productNameInput.value = item.productName;
      state.ocrText = "";
      
      displayResult(item.markdown);
    });
    elements.historyList.appendChild(card);
  });
}

function clearHistory() {
  if (confirm("Are you sure you want to clear your scan history?")) {
    state.history = [];
    localStorage.removeItem("fg_history");
    renderHistoryList();
  }
}

// Dictionary Modal setup
function renderDictionary(data) {
  elements.dictionaryList.innerHTML = "";
  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "additive-card";
    
    let badgeClass = "moderation";
    if (item.rating === "excellent") badgeClass = "excellent";
    if (item.rating === "avoid") badgeClass = "avoid";

    card.innerHTML = `
      <div class="additive-card-header">
        <span class="additive-name">${item.name}</span>
        <span class="additive-rating ${badgeClass}">${item.rating}</span>
      </div>
      <p class="additive-description">${item.desc}</p>
    `;
    elements.dictionaryList.appendChild(card);
  });
}

function filterDictionary(e) {
  const query = e.target.value.toLowerCase().trim();
  const filtered = ADDITIVES_DATA.filter(item => 
    item.name.toLowerCase().includes(query) || 
    item.desc.toLowerCase().includes(query)
  );
  renderDictionary(filtered);
}

// Profile Modal Controller
function openProfileModal() {
  elements.profileAge.value = state.profile.age;
  elements.profileGender.value = state.profile.gender;
  elements.profilePregnant.checked = state.profile.pregnant;
  elements.profileAvoid.value = state.profile.avoid;
  elements.profilePreferred.value = state.profile.preferred;

  syncTagClass(elements.medicalConditionsTags, state.profile.conditions, "active-condition");
  syncTagClass(elements.foodAllergiesTags, state.profile.allergies, "active-allergy");
  syncTagClass(elements.dietTypesTags, state.profile.diet, "active-diet");

  elements.profileModal.classList.remove("hidden");
}

function syncTagClass(container, stateArray, activeClass) {
  const buttons = container.querySelectorAll(".tag-btn");
  buttons.forEach(btn => {
    if (stateArray.includes(btn.textContent)) {
      btn.classList.add(activeClass);
    } else {
      btn.classList.remove(activeClass);
    }
  });
}

function closeProfileModal() {
  elements.profileModal.classList.add("hidden");
}
