let currentBook = null;

// Получаем ID книги из URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

if (!bookId) {
    document.getElementById('bookTitle').textContent = 'Ошибка: не указана книга';
    document.getElementById('bookTitle').style.color = 'red';
    document.querySelector('.loading').innerHTML = `
        <h3 style="color: #d32f2f;">Ошибка</h3>
        <p>Не удалось определить книгу. Пожалуйста, вернитесь в библиотеку.</p>
        <button onclick="goBack()" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; cursor: pointer;">Назад в библиотеку</button>
    `;
    return;
}

// Загружаем книгу
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

function loadBook(book) {
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = `Автор: ${book.author}`;
    
    // Показываем сообщение о загрузке
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
        loadingElement.innerHTML = `
            <div class="spinner"></div>
            <p>Подождите, книга загружается...</p>
        `;
    }
    
    // Загружаем PDF через Google Docs Viewer
    const pdfViewer = document.getElementById('pdfViewer');
    
    // Используем Google Docs Viewer для отображения PDF
    const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(book.pdfUrl)}&embedded=true`;
    
    // Создаем iframe
    const iframe = document.createElement('iframe');
    iframe.src = googleDocsUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.setAttribute('allow', 'fullscreen');
    
    // Убираем сообщение о загрузке и добавляем iframe
    setTimeout(() => {
        pdfViewer.innerHTML = '';
        pdfViewer.appendChild(iframe);
    }, 500);
}

function showError(message) {
    const pdfViewer = document.getElementById('pdfViewer');
    pdfViewer.innerHTML = `
        <div style="background: #fff3f3; border-left: 4px solid #ff4444; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #d32f2f; margin-top: 0;">⚠️ Ошибка</h3>
            <p style="color: #555; line-height: 1.6;">${message}</p>
            <p style="color: #777; margin-top: 15px; font-size: 14px;">
                Если проблема не решается, попробуйте скачать книгу или обратитесь к администратору сайта.
            </p>
            <button onclick="downloadBook()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; cursor: pointer;">Скачать книгу</button>
        </div>
    `;
}

function goBack() {
    window.location.href = 'index.html';
}

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
