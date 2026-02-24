let currentBook = null;

// Получаем ID книги из URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

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
    .catch(error => console.error('Ошибка:', error));

function loadBook(book) {
    document.getElementById('bookTitle').textContent = book.title;
    document.getElementById('bookAuthor').textContent = `Автор: ${book.author}`;
    
    // Загружаем PDF в iframe
    const pdfFrame = document.getElementById('pdfFrame');
    pdfFrame.src = book.pdfUrl;
}

function goBack() {
    window.location.href = 'index.html';
}

function downloadBook() {
    if (currentBook) {
        window.open(currentBook.pdfUrl, '_blank');
    }
}