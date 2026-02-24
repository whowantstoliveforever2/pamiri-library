let currentBook = null;
let pdfDoc = null;
let currentPageNum = 1;

// Получаем ID книги из URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

if (!bookId) {
    document.getElementById('bookTitle').textContent = 'Ошибка: не указана книга';
    return;
}

// Загружаем книгу
fetch('books.json')
    .then(response => response.json())
    .then(data => {
        const book = data.books.find(b => b.id === bookId);
        if (book) {
            currentBook = book;
            loadBook(book);
        } else {
            document.getElementById('bookTitle').textContent = 'Книга не найдена';
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        document.getElementById('bookTitle').textContent = 'Ошибка загрузки книги';
    });

function loadBook(book) {
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = `Автор: ${book.author}`;
    
    // Загружаем PDF через PDF.js
    const pdfViewer = document.getElementById('pdfViewer');
    pdfViewer.innerHTML = '';
    
    const loadingTask = pdfjsLib.getDocument(book.pdfUrl);
    loadingTask.promise.then(function(pdf) {
        pdfDoc = pdf;
        renderPage(1);
    });
}

function renderPage(pageNumber) {
    pdfDoc.getPage(pageNumber).then(function(page) {
        const scale = 1.5;
        const viewport = page.getViewport({scale: scale});
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        pdfViewer.appendChild(canvas);
        
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        
        page.render(renderContext);
    });
}

function goBack() {
    window.location.href = 'index.html';
}

function downloadBook() {
    if (currentBook && currentBook.pdfUrl) {
        window.open(currentBook.pdfUrl, '_blank');
    } else {
        alert('Ссылка на книгу недоступна');
    }
}
