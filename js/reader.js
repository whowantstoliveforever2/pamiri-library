let currentBook = null;
let pdfDoc = null;
let currentPageNum = 1;
let pdfjsLib;

// Получаем ID книги из URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

// Элементы DOM
const bookTitleEl = document.getElementById('bookTitle');
const bookAuthorEl = document.getElementById('bookAuthor');
const pdfViewer = document.getElementById('pdfViewer');

// Проверка наличия обязательных элементов
if (!bookTitleEl || !bookAuthorEl || !pdfViewer) {
    console.error('Не найдены необходимые элементы на странице');
    document.body.innerHTML = '<h1>Ошибка: страница читалки повреждена</h1>';
    return;
}

// Проверка наличия книги в параметрах URL
if (!bookId) {
    bookTitleEl.textContent = 'Ошибка: не указана книга';
    bookTitleEl.style.color = 'red';
    pdfViewer.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Не удалось открыть книгу. Пожалуйста, вернитесь в библиотеку.</p>';
    return;
}

// Показать статус загрузки
bookTitleEl.textContent = 'Загрузка книги...';
pdfViewer.innerHTML = '<div style="text-align: center; padding: 40px;"><div style="display: inline-block; width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="margin-top: 15px; color: #666;">Подождите, книга загружается...</p></div>';

// CSS для анимации загрузки
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Загружаем книгу из books.json
fetch('books.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Не удалось загрузить базу данных книг');
        }
        return response.json();
    })
    .then(data => {
        const book = data.books.find(b => b.id === bookId);
        if (book) {
            currentBook = book;
            loadBook(book);
        } else {
            showError('Книга не найдена в базе данных');
        }
    })
    .catch(error => {
        console.error('Ошибка загрузки базы данных:', error);
        showError('Ошибка загрузки базы данных: ' + error.message);
    });

// Загружаем и отображаем книгу
function loadBook(book) {
    // Обновляем информацию о книге
    bookTitleEl.textContent = book.title;
    bookAuthorEl.textContent = `Автор: ${book.author}`;
    
    // Очищаем область просмотра
    pdfViewer.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Загрузка страницы...</p>';
    
    // Загружаем библиотеку PDF.js
    loadPDFJS()
        .then(() => {
            // Загружаем документ PDF
            const loadingTask = pdfjsLib.getDocument(book.pdfUrl);
            
            loadingTask.promise
                .then(function(pdf) {
                    pdfDoc = pdf;
                    console.log('PDF загружен. Всего страниц:', pdf.numPages);
                    
                    // Отображаем первую страницу
                    renderPage(1);
                    
                    // Добавляем элементы управления
                    addControls();
                })
                .catch(function(error) {
                    console.error('Ошибка загрузки документа PDF:', error);
                    showError('Не удалось загрузить книгу: ' + error.message + 
                        '<br><br><strong>Попробуйте скачать книгу:</strong>');
                    addDownloadButton();
                });
        })
        .catch(function(error) {
            console.error('Ошибка загрузки PDF.js:', error);
            showError('Не удалось загрузить библиотеку для чтения: ' + error.message);
        });
}

// Загружаем библиотеку PDF.js
function loadPDFJS() {
    return new Promise((resolve, reject) => {
        // Проверяем, загружена ли уже библиотека
        if (typeof pdfjsLib !== 'undefined') {
            resolve();
            return;
        }
        
        // Создаем элемент скрипта для загрузки PDF.js
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.min.js';
        script.async = true;
        
        script.onload = function() {
            // Настройка worker для PDF.js
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 
                    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
                resolve();
            } else {
                reject(new Error('PDF.js не инициализирована'));
            }
        };
        
        script.onerror = function() {
            reject(new Error('Не удалось загрузить библиотеку PDF.js'));
        };
        
        document.head.appendChild(script);
    });
}

// Отображаем страницу
function renderPage(pageNumber) {
    if (!pdfDoc) {
        showError('Документ не загружен');
        return;
    }
    
    currentPageNum = pageNumber;
    
    pdfDoc.getPage(pageNumber).then(function(page) {
        // Настройки масштабирования
        const scale = 1.5;
        const viewport = page.getViewport({ scale: scale });
        
        // Создаем канвас
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Стили для канваса
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        canvas.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        canvas.style.borderRadius = '8px';
        
        // Очищаем область просмотра и добавляем канвас
        pdfViewer.innerHTML = '';
        pdfViewer.appendChild(canvas);
        
        // Рендерим страницу
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        const renderTask = page.render(renderContext);
        
        renderTask.promise.then(function() {
            console.log('Страница ' + pageNumber + ' отображена');
            // Прокручиваем к началу страницы
            window.scrollTo(0, 0);
        }).catch(function(error) {
            console.error('Ошибка рендеринга страницы:', error);
            showError('Ошибка отображения страницы: ' + error.message);
        });
    }).catch(function(error) {
        console.error('Ошибка получения страницы:', error);
        showError('Не удалось загрузить страницу: ' + error.message);
    });
}

// Добавляем элементы управления
function addControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'page-controls';
    controlsDiv.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        padding: 15px;
        background: #f5f5f5;
        border-radius: 10px;
        font-size: 16px;
        color: #333;
    `;
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Предыдущая';
    prevBtn.style.cssText = `
        background: ${currentPageNum <= 1 ? '#ccc' : '#667eea'};
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: ${currentPageNum <= 1 ? 'not-allowed' : 'pointer'};
        transition: all 0.3s;
    `;
    prevBtn.disabled = currentPageNum <= 1;
    prevBtn.onclick = function() {
        if (currentPageNum > 1) {
            renderPage(currentPageNum - 1);
        }
    };
    
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Страница ${currentPageNum} из ${pdfDoc.numPages}`;
    pageInfo.style.fontWeight = 'bold';
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Следующая →';
    nextBtn.style.cssText = `
        background: ${currentPageNum >= pdfDoc.numPages ? '#ccc' : '#667eea'};
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: ${currentPageNum >= pdfDoc.numPages ? 'not-allowed' : 'pointer'};
        transition: all 0.3s;
    `;
    nextBtn.disabled = currentPageNum >= pdfDoc.numPages;
    nextBtn.onclick = function() {
        if (currentPageNum < pdfDoc.numPages) {
            renderPage(currentPageNum + 1);
        }
    };
    
    controlsDiv.appendChild(prevBtn);
    controlsDiv.appendChild(pageInfo);
    controlsDiv.appendChild(nextBtn);
    
    pdfViewer.appendChild(controlsDiv);
}

// Показать сообщение об ошибке
function showError(message) {
    pdfViewer.innerHTML = `
        <div style="background: #fff3f3; border-left: 4px solid #ff4444; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #d32f2f; margin-top: 0;">⚠️ Ошибка</h3>
            <p style="color: #555; line-height: 1.6;">${message}</p>
            <p style="color: #777; margin-top: 15px; font-size: 14px;">
                Если проблема не решается, попробуйте скачать книгу или обратитесь к администратору сайта.
            </p>
        </div>
    `;
}

// Добавить кнопку скачивания
function addDownloadButton() {
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '⬇️ Скачать книгу (PDF)';
    downloadBtn.style.cssText = `
        background: #4CAF50;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 15px;
        transition: all 0.3s;
    `;
    downloadBtn.onclick = downloadBook;
    
    pdfViewer.appendChild(downloadBtn);
}

// Вернуться в библиотеку
function goBack() {
    window.location.href = 'index.html';
}

// Скачать книгу
function downloadBook() {
    if (currentBook && currentBook.pdfUrl) {
        const link = document.createElement('a');
        link.href = currentBook.pdfUrl;
        link.download = currentBook.title + '.pdf';
        link.click();
    } else {
        alert('Ссылка на книгу недоступна');
    }
}
