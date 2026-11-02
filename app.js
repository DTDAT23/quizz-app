/**
 * Ôn Tập Trắc Nghiệm Thông Minh Dành Cho Học Sinh Cấp 2
 * Toàn bộ logic ứng dụng SPA (Single Page Application)
 */

class QuizApp {
  constructor() {
    this.storageKey = 'on_thi_247_history_v1';
    this.apiKeyStorageKey = 'on_thi_247_gemini_key';

    // State hiện tại
    this.currentDocName = '';
    this.originalQuestions = []; // Bộ câu hỏi gốc chuẩn trích xuất từ tài liệu
    this.currentQuizQuestions = []; // Bộ câu hỏi đang dùng làm bài (đã shuffle)
    this.userAnswers = {}; // Map: questionId -> selectedOptionId
    this.currentQuestionIdx = 0;
    this.isAdvancedMode = false;
    this.timerInterval = null;
    this.secondsElapsed = 0;
    this.currentDocId = null;

    // Khởi tạo các sự kiện
    this.initEventListeners();
    this.renderHistory();
  }

  /* ========================================================================== */
  /* 1. KHỞI TẠO EVENT LISTENERS & UI HELPERS                                   */
  /* ========================================================================== */
  initEventListeners() {
    // Drop zone kéo thả file
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-indigo-600', 'bg-indigo-100/50');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-indigo-600', 'bg-indigo-100/50');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-indigo-600', 'bg-indigo-100/50');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleFileSelection(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFileSelection(e.target.files[0]);
        }
      });
    }

    // Modal Gemini API Key
    const savedKey = localStorage.getItem(this.apiKeyStorageKey) || '';
    const keyInput = document.getElementById('gemini-api-key-input');
    if (keyInput && savedKey) {
      keyInput.value = savedKey;
    }
  }

  showScreen(screenId) {
    const screens = ['screen-home', 'screen-confirm', 'screen-quiz', 'screen-result', 'screen-advanced'];
    screens.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === screenId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showLoading(text = 'Đang xử lý tài liệu...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (overlay && loadingText) {
      loadingText.textContent = text;
      overlay.classList.remove('hidden');
      overlay.classList.add('flex');
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  switchInputTab(tab) {
    const fileBtn = document.getElementById('tab-file-btn');
    const textBtn = document.getElementById('tab-text-btn');
    const fileContent = document.getElementById('tab-file-content');
    const textContent = document.getElementById('tab-text-content');

    if (tab === 'file') {
      fileBtn.className = 'flex-1 py-2 text-xs font-bold rounded-xl bg-white text-indigo-600 shadow-sm transition';
      textBtn.className = 'flex-1 py-2 text-xs font-bold rounded-xl text-slate-500 hover:text-slate-800 transition';
      fileContent.classList.remove('hidden');
      textContent.classList.add('hidden');
    } else {
      textBtn.className = 'flex-1 py-2 text-xs font-bold rounded-xl bg-white text-indigo-600 shadow-sm transition';
      fileBtn.className = 'flex-1 py-2 text-xs font-bold rounded-xl text-slate-500 hover:text-slate-800 transition';
      textContent.classList.remove('hidden');
      fileContent.classList.add('hidden');
    }
  }

  handleFileSelection(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      alert('Vui lòng chọn file định dạng .PDF hoặc .DOCX!');
      return;
    }

    this.selectedFile = file;
    const nameEl = document.getElementById('selected-file-name');
    const sizeEl = document.getElementById('selected-file-size');
    const infoEl = document.getElementById('file-selected-info');

    if (nameEl && sizeEl && infoEl) {
      nameEl.textContent = file.name;
      sizeEl.textContent = `${(file.size / 1024).toFixed(1)} KB`;
      infoEl.classList.remove('hidden');
      infoEl.classList.add('flex');
    }
  }

  clearSelectedFile() {
    this.selectedFile = null;
    const infoEl = document.getElementById('file-selected-info');
    const fileInput = document.getElementById('file-input');
    if (infoEl) infoEl.classList.add('hidden');
    if (fileInput) fileInput.value = '';
  }

  pasteSample() {
    const sample = `Câu 1: Số nào sau đây là số nguyên tố chẵn duy nhất?
A. 0
B. 1
C. 2
D. 4
Đáp án: C

Câu 2: Trong các tam giác sau, tam giác nào có 3 góc đều bằng 60 độ?
A. Tam giác vuông cân
B. Tam giác đều
C. Tam giác tù
D. Tam giác vuông
Đáp án: B

Câu 3: Ai là tác giả của tác phẩm "Dế Mèn phiêu lưu ký"?
A. Tô Hoài
B. Nam Cao
C. Ngô Tất Tố
D. Thạch Lam
Đáp án: A

Câu 4: Quá trình quang hợp của cây xanh chủ yếu thải ra khí gì?
A. Khí Cacbonic (CO2)
B. Khí Nitơ (N2)
C. Khí Oxi (O2)
D. Khí Hidro (H2)
Đáp án: C

Câu 5: Chiến thắng Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" diễn ra vào năm nào?
A. 1945
B. 1954
C. 1975
D. 1968
Đáp án: B`;

    const textarea = document.getElementById('paste-input');
    if (textarea) {
      textarea.value = sample;
    }
  }

  openApiKeyModal() {
    this.openModal('modal-api-key');
  }

  saveApiKey() {
    const input = document.getElementById('gemini-api-key-input');
    if (input) {
      const val = input.value.trim();
      localStorage.setItem(this.apiKeyStorageKey, val);
      alert('Đã lưu API Key thành công!');
      this.closeModal('modal-api-key');
    }
  }

  /* ========================================================================== */
  /* 2. ĐỌC FILE PDF / DOCX & XỬ LÝ LỖI PDF SCAN                               */
  /* ========================================================================== */
  async processInputDocument() {
    const isFileTab = !document.getElementById('tab-file-content').classList.contains('hidden');

    let rawText = '';
    let docName = '';

    if (isFileTab) {
      if (!this.selectedFile) {
        alert('Vui lòng chọn hoặc kéo thả file .PDF hoặc .DOCX vào ô bên trên!');
        return;
      }

      const file = this.selectedFile;
      docName = file.name;
      const ext = file.name.split('.').pop().toLowerCase();

      this.showLoading('Đang đọc tài liệu ' + file.name + '...');

      try {
        if (ext === 'docx') {
          rawText = await this.readDocxFile(file);
        } else if (ext === 'pdf') {
          rawText = await this.readPdfFile(file);
        }
      } catch (err) {
        console.error('Lỗi khi đọc file:', err);
        this.hideLoading();
        this.openModal('modal-pdf-error');
        return;
      }
    } else {
      // Dán văn bản
      const textarea = document.getElementById('paste-input');
      rawText = textarea ? textarea.value.trim() : '';
      docName = 'Tai_lieu_' + new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');

      if (!rawText) {
        alert('Vui lòng dán nội dung câu hỏi trắc nghiệm vào khung soạn thảo!');
        return;
      }
      this.showLoading('Đang phân tích câu hỏi...');
    }

    // Kiểm tra tính hợp lệ của văn bản đọc được
    // ĐẶC BIỆT THEO YÊU CẦU: Nếu file PDF không đọc được (hoặc quá ít ký tự do ảnh scan)
    const cleanedText = rawText.replace(/\s+/g, ' ').trim();
    if (!cleanedText || cleanedText.length < 40) {
      this.hideLoading();
      this.openModal('modal-pdf-error');
      return;
    }

    // Trích xuất câu hỏi
    const questions = this.parseQuestionsFromText(rawText);

    this.hideLoading();

    if (!questions || questions.length === 0) {
      alert('Không tìm thấy câu hỏi trắc nghiệm nào trong tài liệu! Vui lòng kiểm tra định dạng câu hỏi (Ví dụ: "Câu 1: ... A. ... B. ... Đáp án: A").');
      return;
    }

    // Nạp thành công
    this.currentDocName = docName;
    this.originalQuestions = questions;
    this.currentDocId = 'doc_' + Date.now();

    // Lưu vào lịch sử
    this.saveDocumentToHistory(this.currentDocId, this.currentDocName, this.originalQuestions);

    // Chuyển sang Màn hình xác nhận thành công
    this.showConfirmationScreen();
  }

  // Đọc file DOCX bằng Mammoth.js
  readDocxFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
          .then(result => resolve(result.value))
          .catch(err => reject(err));
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  // Đọc file PDF bằng PDF.js
  async readPdfFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let fullText = '';

          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
          }

          resolve(fullText);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  /* ========================================================================== */
  /* 3. PARSER THÔNG MINH TRÍCH XUẤT CÂU HỎI & BẢO TOÀN ĐÁP ÁN GỐC             */
  /* ========================================================================== */
  parseQuestionsFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const normalizedText = lines.join('\n');

    // 1. Kiểm tra xem có bảng đáp án ở cuối văn bản không (Dạng: 1.A 2.B 3.C hoặc 1-A 2-B...)
    const answerKeyMap = this.extractAnswerKeyTable(normalizedText);

    // 2. Tách các khối câu hỏi dựa trên các mẫu nhận diện: "Câu 1:", "1.", "Bài 1:"
    const questionRegex = /(?:^|\n)(?:Câu\s*\d+[\.:\)]|\d+[\.:\)]|Bài\s*\d+[\.:\)])\s*/gi;
    
    // Tìm các vị trí xuất hiện của câu hỏi
    const matches = [];
    let match;
    while ((match = questionRegex.exec(normalizedText)) !== null) {
      matches.push({
        index: match.index,
        header: match[0].trim()
      });
    }

    const questionBlocks = [];
    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index;
        const end = (i + 1 < matches.length) ? matches[i + 1].index : normalizedText.length;
        const block = normalizedText.substring(start, end).trim();
        questionBlocks.push(block);
      }
    } else {
      // Trường hợp các câu phân tách bởi dòng trống
      const splitByBlank = normalizedText.split(/\n\s*\n/);
      if (splitByBlank.length > 1) {
        questionBlocks.push(...splitByBlank);
      } else {
        questionBlocks.push(normalizedText);
      }
    }

    const parsedQuestions = [];
    let qIdCounter = 1;

    for (let block of questionBlocks) {
      const q = this.parseSingleQuestionBlock(block, qIdCounter, answerKeyMap);
      if (q) {
        parsedQuestions.push(q);
        qIdCounter++;
      }
    }

    return parsedQuestions;
  }

  // Trích xuất bảng đáp án nếu đề gom đáp án ở cuối
  extractAnswerKeyTable(text) {
    const keyMap = {};
    const keyPattern = /(?:Bảng đáp án|Đáp án|Answer Key)[\s\S]*$/i;
    const match = text.match(keyPattern);
    if (match) {
      const section = match[0];
      const pairRegex = /(\d+)\s*[\.\:\-\s]\s*([A-Da-d])/g;
      let p;
      while ((p = pairRegex.exec(section)) !== null) {
        keyMap[parseInt(p[1], 10)] = p[2].toUpperCase();
      }
    }
    return keyMap;
  }

  parseSingleQuestionBlock(block, index, answerKeyMap) {
    // 1. Tách phần đáp án đúng nếu có ghi ngay trong câu (Ví dụ: "Đáp án: A", "[ĐA: B]", "-> C")
    let correctAnswerLetter = null;
    const answerMatch = block.match(/(?:Đáp\s*án|Đ\/A|ĐA|Answer|Chọn)[\s\:\.\-\>\[\(]*([A-Da-d])[\)\]\.]?/i);
    if (answerMatch) {
      correctAnswerLetter = answerMatch[1].toUpperCase();
      // Loại bỏ dòng đáp án khỏi nội dung để không làm xấu đề
      block = block.replace(answerMatch[0], '').trim();
    } else if (answerKeyMap[index]) {
      correctAnswerLetter = answerKeyMap[index];
    }

    // 2. Tìm 4 lựa chọn A, B, C, D (hoặc nhiều hơn)
    // Hỗ trợ các kiểu: "A.", "A)", "(A)", "A - "
    const optRegex = /(?:^|\s|\n)([A-Da-d])[\.\)\-\:\/]\s+/g;
    const optMatches = [];
    let m;
    while ((m = optRegex.exec(block)) !== null) {
      optMatches.push({
        index: m.index,
        letter: m[1].toUpperCase(),
        length: m[0].length
      });
    }

    if (optMatches.length < 2) {
      // Không đủ tối thiểu 2 đáp án lựa chọn để thành câu trắc nghiệm
      return null;
    }

    // Nội dung câu hỏi là từ đầu block đến vị trí lựa chọn đầu tiên
    let questionText = block.substring(0, optMatches[0].index).trim();
    // Làm sạch đầu câu hỏi (bỏ "Câu 1:", "1.", ...)
    questionText = questionText.replace(/^(?:Câu\s*\d+[\.:\)]|\d+[\.:\)]|Bài\s*\d+[\.:\)])\s*/i, '').trim();

    // Trích xuất từng lựa chọn
    const options = [];
    for (let i = 0; i < optMatches.length; i++) {
      const cur = optMatches[i];
      const start = cur.index + cur.length;
      const end = (i + 1 < optMatches.length) ? optMatches[i + 1].index : block.length;
      let optText = block.substring(start, end).trim();

      // Kiểm tra xem trong text lựa chọn có dấu hiệu đánh dấu đúng không (ví dụ "*A.", hoặc có chữ "Đúng")
      let isExplicitlyMarkedCorrect = false;
      if (optText.startsWith('*') || optText.endsWith('*')) {
        isExplicitlyMarkedCorrect = true;
        optText = optText.replace(/\*/g, '').trim();
      }

      const optObj = {
        id: `opt_${index}_${cur.letter}`,
        originalLetter: cur.letter,
        text: optText
      };

      if (isExplicitlyMarkedCorrect) {
        correctAnswerLetter = cur.letter;
      }

      options.push(optObj);
    }

    // Nếu vẫn chưa tìm thấy đáp án đúng thì mặc định lấy A để học sinh vẫn có thể ôn tập
    if (!correctAnswerLetter) {
      correctAnswerLetter = 'A';
    }

    // Tìm option ứng với đáp án đúng để lưu nội dung gốc (bảo toàn đáp án)
    const correctOpt = options.find(o => o.originalLetter === correctAnswerLetter) || options[0];

    return {
      id: `q_${index}`,
      index: index,
      content: questionText || `Câu hỏi ${index}`,
      options: options,
      correctOriginalLetter: correctOpt.originalLetter,
      correctText: correctOpt.text, // Mốc chuẩn không bao giờ thay đổi
      correctOptionId: correctOpt.id
    };
  }

  /* ========================================================================== */
  /* 4. MÀN HÌNH XÁC NHẬN NẠP TÀI NGUYÊN THÀNH CÔNG                             */
  /* ========================================================================== */
  showConfirmationScreen() {
    const docNameEl = document.getElementById('confirm-doc-name');
    const countEl = document.getElementById('confirm-question-count');
    const previewCountEl = document.getElementById('preview-count');
    const previewBox = document.getElementById('preview-box');

    if (docNameEl) docNameEl.textContent = this.currentDocName;
    if (countEl) countEl.textContent = `${this.originalQuestions.length} câu`;
    if (previewCountEl) previewCountEl.textContent = this.originalQuestions.length;

    if (previewBox) {
      previewBox.innerHTML = this.originalQuestions.map((q, idx) => `
        <div class="border-b border-slate-200 pb-2">
          <p class="font-bold text-slate-800">Câu ${idx + 1}: ${this.escapeHtml(q.content)}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 text-slate-600">
            ${q.options.map(opt => `
              <span class="${opt.id === q.correctOptionId ? 'text-emerald-600 font-bold' : ''}">
                ${opt.originalLetter}. ${this.escapeHtml(opt.text)} ${opt.id === q.correctOptionId ? '✓ (Đáp án gốc)' : ''}
              </span>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    this.showScreen('screen-confirm');
  }

  togglePreviewQuestions() {
    const box = document.getElementById('preview-box');
    if (box) {
      box.classList.toggle('hidden');
    }
  }

  /* ========================================================================== */
  /* 5. THUẬT TOÁN XÁO TRỘN FISHER-YATES (BẢO TOÀN ĐÁP ÁN GỐC 100%)            */
  /* ========================================================================== */
  // Fisher-Yates shuffle
  shuffleArray(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Quy định xuất lại bộ câu hỏi trắc nghiệm:
   * - Các câu bị đảo vị trí của nhau
   * - Đáp án trong câu cũng bị đảo vị trí
   * - Hệ thống KHÔNG ĐƯỢC PHÉP thay đổi đáp án của file gốc!
   */
  generateShuffledQuiz(questionsList) {
    // 1. Đảo vị trí các câu hỏi
    const shuffledQuestionsOrder = this.shuffleArray(questionsList);

    const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    // 2. Đảo vị trí các đáp án trong từng câu
    return shuffledQuestionsOrder.map((q, qIndex) => {
      // Đảo thứ tự các options
      const shuffledOpts = this.shuffleArray(q.options);

      // Gán lại nhãn A, B, C, D mới theo vị trí sau đảo
      const remappedOptions = shuffledOpts.map((opt, optIndex) => ({
        ...opt,
        currentLetter: alphabet[optIndex] || `${optIndex + 1}`
      }));

      return {
        ...q,
        displayIndex: qIndex + 1,
        options: remappedOptions
      };
    });
  }

  /* ========================================================================== */
  /* 6. MÀN HÌNH ÔN TẬP TRẮC NGHIỆM (PHÒNG THI)                                 */
  /* ========================================================================== */
  startQuiz(isAdvanced = false, advancedQuestions = null) {
    this.isAdvancedMode = isAdvanced;
    const baseList = isAdvanced ? advancedQuestions : this.originalQuestions;

    if (!baseList || baseList.length === 0) {
      alert('Không có dữ liệu câu hỏi để ôn tập!');
      return;
    }

    // Xáo trộn đề
    this.currentQuizQuestions = this.generateShuffledQuiz(baseList);
    this.userAnswers = {};
    this.currentQuestionIdx = 0;
    this.secondsElapsed = 0;

    // Cập nhật UI Header
    const titleEl = document.getElementById('quiz-title');
    const badgeEl = document.getElementById('quiz-badge-mode');
    if (titleEl) {
      titleEl.textContent = isAdvanced ? `Nâng cao: 10 câu tổng hợp (${this.currentDocName})` : this.currentDocName;
    }
    if (badgeEl) {
      badgeEl.textContent = isAdvanced ? '🚀 ÔN TẬP NÂNG CAO' : 'ÔN TẬP GỐC';
      badgeEl.className = isAdvanced
        ? 'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800'
        : 'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700';
    }

    // Khởi động đồng hồ
    this.startTimer();

    // Render palette câu hỏi
    this.renderQuestionPalette();

    // Render câu hỏi đầu tiên
    this.renderCurrentQuestion();

    this.showScreen('screen-quiz');
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    const timerEl = document.getElementById('quiz-timer');
    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
      const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
      const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
      if (timerEl) timerEl.textContent = `${mins}:${secs}`;
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  renderQuestionPalette() {
    const container = document.getElementById('palette-container');
    const progressText = document.getElementById('progress-text');
    if (!container) return;

    container.innerHTML = '';
    const total = this.currentQuizQuestions.length;
    const answeredCount = Object.keys(this.userAnswers).length;

    if (progressText) {
      progressText.textContent = `${answeredCount}/${total} câu`;
    }

    this.currentQuizQuestions.forEach((q, idx) => {
      const btn = document.createElement('button');
      btn.className = 'palette-btn';
      btn.textContent = idx + 1;

      if (this.userAnswers[q.id]) {
        btn.classList.add('answered');
      }
      if (idx === this.currentQuestionIdx) {
        btn.classList.add('active');
      }

      btn.onclick = () => {
        this.currentQuestionIdx = idx;
        this.renderCurrentQuestion();
        this.renderQuestionPalette();
      };

      container.appendChild(btn);
    });
  }

  renderCurrentQuestion() {
    const q = this.currentQuizQuestions[this.currentQuestionIdx];
    if (!q) return;

    const curIdxEl = document.getElementById('current-q-index');
    const totalIdxEl = document.getElementById('total-q-index');
    const contentEl = document.getElementById('question-content');
    const statusBadge = document.getElementById('q-status-badge');
    const optionsContainer = document.getElementById('options-container');
    const prevBtn = document.getElementById('btn-prev-q');
    const nextBtn = document.getElementById('btn-next-q');

    if (curIdxEl) curIdxEl.textContent = this.currentQuestionIdx + 1;
    if (totalIdxEl) totalIdxEl.textContent = this.currentQuizQuestions.length;
    if (contentEl) contentEl.textContent = q.content;

    const isAnswered = !!this.userAnswers[q.id];
    if (statusBadge) {
      statusBadge.textContent = isAnswered ? 'Đã trả lời' : 'Chưa chọn đáp án';
      statusBadge.className = isAnswered ? 'text-xs font-bold text-emerald-600' : 'text-xs font-semibold text-slate-400';
    }

    // Render danh sách options
    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      q.options.forEach(opt => {
        const btn = document.createElement('button');
        const isSelected = this.userAnswers[q.id] === opt.id;
        btn.className = `option-btn ${isSelected ? 'selected' : ''}`;

        btn.innerHTML = `
          <div class="option-label">${opt.currentLetter}</div>
          <div class="flex-1 text-left">${this.escapeHtml(opt.text)}</div>
          ${isSelected ? '<i class="fa-solid fa-circle-check text-indigo-600 text-lg"></i>' : ''}
        `;

        btn.onclick = () => {
          this.selectOption(q.id, opt.id);
        };

        optionsContainer.appendChild(btn);
      });
    }

    // Trạng thái các nút trước/sau
    if (prevBtn) {
      prevBtn.disabled = this.currentQuestionIdx === 0;
      prevBtn.classList.toggle('opacity-40', this.currentQuestionIdx === 0);
    }
    if (nextBtn) {
      const isLast = this.currentQuestionIdx === this.currentQuizQuestions.length - 1;
      nextBtn.innerHTML = isLast
        ? '<span>Đến câu đầu</span> <i class="fa-solid fa-rotate"></i>'
        : '<span>Câu sau</span> <i class="fa-solid fa-chevron-right"></i>';
    }
  }

  selectOption(questionId, optionId) {
    this.userAnswers[questionId] = optionId;
    this.renderCurrentQuestion();
    this.renderQuestionPalette();

    // Tự động chuyển nhẹ nhàng sang câu kế tiếp nếu chưa hết
    if (this.currentQuestionIdx < this.currentQuizQuestions.length - 1) {
      setTimeout(() => {
        this.nextQuestion();
      }, 250);
    }
  }

  prevQuestion() {
    if (this.currentQuestionIdx > 0) {
      this.currentQuestionIdx--;
      this.renderCurrentQuestion();
      this.renderQuestionPalette();
    }
  }

  nextQuestion() {
    if (this.currentQuestionIdx < this.currentQuizQuestions.length - 1) {
      this.currentQuestionIdx++;
    } else {
      this.currentQuestionIdx = 0; // Quay về câu 1
    }
    this.renderCurrentQuestion();
    this.renderQuestionPalette();
  }

  confirmQuitQuiz() {
    if (confirm('Bạn có chắc muốn dừng bài ôn tập và quay về trang chủ không?')) {
      this.stopTimer();
      this.goHome();
    }
  }

  /* ========================================================================== */
  /* 7. NỘP BÀI, CHẤM ĐIỂM & ĐIỀU KIỆN MỞ KHÓA ÔN TẬP NÂNG CAO                  */
  /* ========================================================================== */
  submitQuiz() {
    const total = this.currentQuizQuestions.length;
    const answeredCount = Object.keys(this.userAnswers).length;

    if (answeredCount < total) {
      const unanswered = total - answeredCount;
      if (!confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài luôn không?`)) {
        return;
      }
    }

    this.stopTimer();
    this.calculateAndShowResult();
  }

  calculateAndShowResult() {
    let correctCount = 0;
    const total = this.currentQuizQuestions.length;
    const details = [];

    this.currentQuizQuestions.forEach(q => {
      const userSelectedOptId = this.userAnswers[q.id];
      const isCorrect = userSelectedOptId === q.correctOptionId;

      if (isCorrect) correctCount++;

      const selectedOpt = q.options.find(o => o.id === userSelectedOptId);
      const correctOpt = q.options.find(o => o.id === q.correctOptionId);

      details.push({
        question: q,
        isCorrect: isCorrect,
        selectedOpt: selectedOpt,
        correctOpt: correctOpt
      });
    });

    const isPerfect = (correctCount === total && total > 0);
    const percent = Math.round((correctCount / total) * 100);

    // Cập nhật số lần đúng tuyệt đối vào localStorage (chỉ áp dụng cho bài thi gốc)
    let perfectCount = 0;
    if (!this.isAdvancedMode) {
      perfectCount = this.recordAttempt(this.currentDocId, correctCount, total, isPerfect, this.secondsElapsed);
    } else {
      perfectCount = this.getPerfectCount(this.currentDocId);
    }

    // Hiển thị giao diện kết quả
    this.renderResultScreen(correctCount, total, percent, isPerfect, perfectCount, details);
  }

  renderResultScreen(correctCount, total, percent, isPerfect, perfectCount, details) {
    const badgeContainer = document.getElementById('result-badge-container');
    const titleEl = document.getElementById('result-title');
    const subtitleEl = document.getElementById('result-subtitle');
    const scoreEl = document.getElementById('res-score');
    const totalEl = document.getElementById('res-total');
    const percentEl = document.getElementById('res-percent');
    const timeEl = document.getElementById('res-time');
    const perfectCountEl = document.getElementById('res-perfect-count');
    const btnAdvanced = document.getElementById('btn-advanced-mode');
    const bannerAdvanced = document.getElementById('advanced-unlocked-banner');
    const detailsContainer = document.getElementById('result-questions-list');

    if (scoreEl) scoreEl.textContent = correctCount;
    if (totalEl) totalEl.textContent = total;
    if (percentEl) percentEl.textContent = `${percent}%`;

    const mins = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
    const secs = (this.secondsElapsed % 60).toString().padStart(2, '0');
    if (timeEl) timeEl.textContent = `${mins}:${secs}`;

    if (perfectCountEl) perfectCountEl.textContent = perfectCount;

    // Đánh giá và hiệu ứng
    if (isPerfect) {
      // Pháo hoa ăn mừng!
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
      if (badgeContainer) badgeContainer.innerHTML = '<div class="text-6xl animate-bounce">🌟</div>';
      if (titleEl) titleEl.textContent = 'XUẤT SẮC! ĐÚNG TUYỆT ĐỐI 100%! 🎉';
      if (subtitleEl) subtitleEl.textContent = `Bạn đã không sai một câu nào! Tích lũy được ${perfectCount}/5 lần đúng tuyệt đối.`;
    } else if (percent >= 80) {
      if (badgeContainer) badgeContainer.innerHTML = '<div class="text-5xl">👏</div>';
      if (titleEl) titleEl.textContent = 'Làm rất tốt! Bạn nắm bài rất chắc! 💪';
      if (subtitleEl) subtitleEl.textContent = 'Chỉ một chút nữa là đạt điểm tuyệt đối rồi, hãy thử làm lại nhé!';
    } else {
      if (badgeContainer) badgeContainer.innerHTML = '<div class="text-5xl">🌱</div>';
      if (titleEl) titleEl.textContent = 'Cố gắng lên nhé! Luyện tập sẽ giỏi hơn! 📚';
      if (subtitleEl) subtitleEl.textContent = 'Hãy xem lại các câu chưa đúng bên dưới và bấm nút Làm lại để ôn thêm nhé.';
    }

    // ĐIỀU KIỆN ĐẶC BIỆT THEO YÊU CẦU:
    // "Nếu học sinh đã làm đúng tuyệt đối 5 lần từ nội dung file gốc thì mới hiện nút ôn tập nâng cao"
    const canUnlockAdvanced = (perfectCount >= 5);

    if (btnAdvanced) {
      if (canUnlockAdvanced) {
        btnAdvanced.classList.remove('hidden');
      } else {
        btnAdvanced.classList.add('hidden');
      }
    }

    if (bannerAdvanced) {
      if (canUnlockAdvanced && isPerfect) {
        bannerAdvanced.classList.remove('hidden');
      } else {
        bannerAdvanced.classList.add('hidden');
      }
    }

    // Render danh sách chi tiết các câu
    if (detailsContainer) {
      detailsContainer.innerHTML = details.map((item, idx) => {
        const q = item.question;
        const cardClass = item.isCorrect ? 'res-card-correct' : 'res-card-incorrect';
        const icon = item.isCorrect
          ? '<i class="fa-solid fa-circle-check text-emerald-500 text-xl"></i>'
          : '<i class="fa-solid fa-circle-xmark text-rose-500 text-xl"></i>';

        return `
          <div class="p-5 rounded-2xl ${cardClass}">
            <div class="flex items-start gap-3">
              <div class="mt-0.5">${icon}</div>
              <div class="flex-1">
                <p class="font-bold text-slate-800 text-sm sm:text-base mb-2">
                  Câu ${idx + 1}: ${this.escapeHtml(q.content)}
                </p>

                <div class="text-xs space-y-1.5 mt-2">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-500">Bạn đã chọn:</span>
                    <span class="font-extrabold ${item.isCorrect ? 'text-emerald-700' : 'text-rose-600'}">
                      ${item.selectedOpt ? `${item.selectedOpt.currentLetter}. ${this.escapeHtml(item.selectedOpt.text)}` : 'Chưa chọn'}
                    </span>
                  </div>

                  ${!item.isCorrect ? `
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-500">Đáp án đúng gốc:</span>
                      <span class="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ${item.correctOpt ? `${item.correctOpt.currentLetter}. ${this.escapeHtml(item.correctOpt.text)}` : ''}
                      </span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    this.showScreen('screen-result');
  }

  /**
   * NÚT LÀM LẠI:
   * "khi làm lại thì hệ thống sẽ tự động đổi lại theo trật tự mới như quy định xuất bộ câu trắc nghiệm đã quy định bên trên"
   */
  retryQuiz() {
    this.startQuiz(this.isAdvancedMode);
  }

  /* ========================================================================== */
  /* 8. CHỨC NĂNG ÔN TẬP NÂNG CAO (10 CÂU 1 LẦN)                               */
  /* ========================================================================== */
  async startAdvancedQuiz() {
    this.showLoading('AI đang tổng hợp và tạo 10 câu hỏi nâng cao...');

    try {
      const advancedQuestions = await this.generateAdvanced10Questions();
      this.hideLoading();

      if (!advancedQuestions || advancedQuestions.length === 0) {
        alert('Không thể tạo câu hỏi nâng cao lúc này. Vui lòng thử lại!');
        return;
      }

      this.startQuiz(true, advancedQuestions);
    } catch (err) {
      console.error('Lỗi sinh câu hỏi nâng cao:', err);
      this.hideLoading();
      alert('Đã xảy ra lỗi khi tạo câu hỏi nâng cao. Hệ thống sẽ chuyển sang bộ câu hỏi tổng hợp thông minh!');
      const fallbackQuestions = this.generateSmartFallbackQuestions();
      this.startQuiz(true, fallbackQuestions);
    }
  }

  // Tùy chọn quay lại ôn tập bình thường
  returnToNormalQuiz() {
    if (confirm('Bạn có muốn quay lại ôn tập bộ đề bình thường không?')) {
      this.startQuiz(false);
    }
  }

  // Tổng hợp câu hỏi nâng cao: Ưu tiên Gemini API nếu có key, nếu không dùng Smart Generator
  async generateAdvanced10Questions() {
    const apiKey = localStorage.getItem(this.apiKeyStorageKey);

    if (apiKey) {
      try {
        const aiQuestions = await this.callGeminiForAdvanced(apiKey);
        if (aiQuestions && aiQuestions.length >= 5) {
          return aiQuestions.slice(0, 10);
        }
      } catch (e) {
        console.warn('Gemini API call failed, fallback to smart generator:', e);
      }
    }

    // Tự động dùng Smart Generator tích hợp sẵn:
    return this.generateSmartFallbackQuestions();
  }

  // Smart Generator: Tự động tổng hợp 10 câu nâng cao từ kiến thức của bộ câu hỏi gốc
  generateSmartFallbackQuestions() {
    const base = [...this.originalQuestions];
    const totalNeeded = 10;
    const generated = [];

    // Lấy ngẫu nhiên hoặc biến thể từ các câu gốc
    const shuffledBase = this.shuffleArray(base);

    for (let i = 0; i < totalNeeded; i++) {
      const sourceQ = shuffledBase[i % shuffledBase.length];
      
      // Tạo biến thể nâng cao: dạng phủ định hoặc câu hỏi suy luận
      const isNegativeForm = (i % 3 === 0);
      let newContent = '';
      let newOptions = [];
      let correctOptId = '';
      let correctText = '';

      if (isNegativeForm && sourceQ.options.length >= 4) {
        // Biến thể phủ định: "Trong các phát biểu sau, phát biểu nào KHÔNG đúng..."
        newContent = `[Nâng cao - Suy luận] Xét kiến thức liên quan đến: "${sourceQ.content}". Khẳng định nào sau đây là KHÔNG chính xác hoặc khác biệt nhất?`;
        
        // Tạo các options đảo
        newOptions = sourceQ.options.map((o, idx) => ({
          id: `adv_opt_${i}_${idx}`,
          originalLetter: o.originalLetter,
          text: o.text
        }));

        // Tìm một option sai để làm đáp án đúng cho câu hỏi phủ định, hoặc giữ logic an toàn
        const wrongOpts = newOptions.filter(o => o.text !== sourceQ.correctText);
        const targetCorrect = wrongOpts.length > 0 ? wrongOpts[0] : newOptions[0];
        
        correctOptId = targetCorrect.id;
        correctText = targetCorrect.text;
      } else {
        // Biến thể tổng hợp / vận dụng cao
        newContent = `[Nâng cao - Vận dụng] ${sourceQ.content}`;
        newOptions = sourceQ.options.map((o, idx) => ({
          id: `adv_opt_${i}_${idx}`,
          originalLetter: o.originalLetter,
          text: o.text
        }));
        const matching = newOptions.find(o => o.text === sourceQ.correctText) || newOptions[0];
        correctOptId = matching.id;
        correctText = matching.text;
      }

      generated.push({
        id: `adv_q_${i + 1}`,
        index: i + 1,
        content: newContent,
        options: newOptions,
        correctOriginalLetter: 'A',
        correctText: correctText,
        correctOptionId: correctOptId
      });
    }

    return generated;
  }

  // Gọi Google Gemini API để tạo 10 câu hỏi nâng cao
  async callGeminiForAdvanced(apiKey) {
    const summaryKnowledge = this.originalQuestions.slice(0, 15).map(q => {
      return `Câu: ${q.content} -> Đáp án đúng: ${q.correctText}`;
    }).join('\n');

    const prompt = `Bạn là giáo viên giỏi ra đề trắc nghiệm cho học sinh cấp 2. Dựa vào nội dung kiến thức sau đây:
${summaryKnowledge}

Hãy tạo ĐÚNG 10 câu hỏi trắc nghiệm NÂNG CAO (suy luận sâu hơn, vận dụng, câu hỏi bẫy tư duy) cho học sinh cấp 2.
Mỗi câu có 4 đáp án A, B, C, D và chỉ 1 đáp án đúng.
Trả về dữ liệu dưới định dạng JSON duy nhất (không bọc trong markdown) như sau:
[
  {
    "content": "Nội dung câu hỏi nâng cao?",
    "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"],
    "correctIndex": 0
  }
]`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const rawAiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON
    const cleanJson = rawAiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return parsed.map((item, idx) => {
      const letters = ['A', 'B', 'C', 'D'];
      const opts = item.options.map((optText, oIdx) => ({
        id: `gemini_opt_${idx}_${oIdx}`,
        originalLetter: letters[oIdx] || 'A',
        text: optText
      }));

      const correctOpt = opts[item.correctIndex] || opts[0];

      return {
        id: `gemini_q_${idx + 1}`,
        index: idx + 1,
        content: item.content,
        options: opts,
        correctOriginalLetter: correctOpt.originalLetter,
        correctText: correctOpt.text,
        correctOptionId: correctOpt.id
      };
    });
  }

  /* ========================================================================== */
  /* 9. QUẢN LÝ LỊCH SỬ ÔN TẬP (LOCALSTORAGE)                                   */
  /* ========================================================================== */
  getHistoryList() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Lỗi đọc localStorage:', e);
      return [];
    }
  }

  saveDocumentToHistory(docId, docName, questions) {
    const list = this.getHistoryList();
    const existingIdx = list.findIndex(item => item.id === docId || item.name === docName);

    const docObj = {
      id: docId,
      name: docName,
      createdAt: new Date().toISOString(),
      questionsCount: questions.length,
      questions: questions,
      perfectCount: 0,
      attemptsCount: 0,
      bestScore: 0
    };

    if (existingIdx >= 0) {
      list[existingIdx].questions = questions;
      list[existingIdx].questionsCount = questions.length;
    } else {
      list.unshift(docObj);
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage đầy hoặc không ghi được:', e);
    }

    this.renderHistory();
  }

  recordAttempt(docId, score, total, isPerfect, timeSpent) {
    const list = this.getHistoryList();
    const doc = list.find(item => item.id === docId || item.name === this.currentDocName);
    if (!doc) return 0;

    doc.attemptsCount = (doc.attemptsCount || 0) + 1;
    if (score > (doc.bestScore || 0)) {
      doc.bestScore = score;
    }

    if (isPerfect) {
      doc.perfectCount = (doc.perfectCount || 0) + 1;
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.warn('Lỗi ghi attempt:', e);
    }

    this.renderHistory();
    return doc.perfectCount || 0;
  }

  getPerfectCount(docId) {
    const list = this.getHistoryList();
    const doc = list.find(item => item.id === docId || item.name === this.currentDocName);
    return doc ? (doc.perfectCount || 0) : 0;
  }

  renderHistory() {
    const list = this.getHistoryList();
    const container = document.getElementById('history-list');
    const emptyEl = document.getElementById('history-empty');
    const countEl = document.getElementById('history-count');

    if (countEl) countEl.textContent = `${list.length} bài`;

    if (!container || !emptyEl) return;

    if (list.length === 0) {
      container.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');
    container.innerHTML = list.map(item => {
      const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
      const isAdvancedReady = (item.perfectCount >= 5);

      return `
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/30 transition shadow-sm gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
              <i class="fa-solid fa-file-lines"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-800 text-sm truncate max-w-xs sm:max-w-md">${this.escapeHtml(item.name)}</h4>
              <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                <span><i class="fa-regular fa-calendar mr-1"></i>${dateStr}</span>
                <span>•</span>
                <span><strong class="text-indigo-600">${item.questionsCount}</strong> câu</span>
                <span>•</span>
                <span>Đã ôn: <strong class="text-slate-700">${item.attemptsCount || 0}</strong> lần</span>
                <span>•</span>
                <span class="text-amber-600 font-bold">100%: ${item.perfectCount || 0}/5 lần</span>
                ${isAdvancedReady ? '<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">🚀 Nâng cao sẵn sàng</span>' : ''}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button onclick="app.loadFromHistory('${item.id}')" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5">
              <i class="fa-solid fa-play"></i> Ôn bài này
            </button>
            <button onclick="app.deleteHistoryItem('${item.id}', event)" class="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition text-xs" title="Xóa bài">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  loadFromHistory(docId) {
    const list = this.getHistoryList();
    const doc = list.find(item => item.id === docId);
    if (!doc || !doc.questions || doc.questions.length === 0) {
      alert('Không tìm thấy dữ liệu bài ôn này!');
      return;
    }

    this.currentDocId = doc.id;
    this.currentDocName = doc.name;
    this.originalQuestions = doc.questions;

    // Bắt đầu ôn tập ngay lập tức không cần tải lại file!
    this.startQuiz(false);
  }

  deleteHistoryItem(docId, event) {
    if (event) event.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa bài ôn này khỏi lịch sử không?')) {
      let list = this.getHistoryList();
      list = list.filter(item => item.id !== docId);
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      this.renderHistory();
    }
  }

  goHome() {
    this.stopTimer();
    this.renderHistory();
    this.showScreen('screen-home');
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Khởi chạy ứng dụng toàn cục
let app;
window.addEventListener('DOMContentLoaded', () => {
  app = new QuizApp();
});
