let allBooks = [];
let currentFilter = 'all';

// Загрузка книг
fetch('books.json')
    .then(response => response.json())
    .then(data => {
        allBooks = data.books;
        displayBooks(allBooks);
    })
    .catch(error => console.error('Ошибка загрузки:', error));

// Отображение книг
function displayBooks(books) {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = '';

    if (books.length === 0) {
        bookList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; font-size: 1.2em;">Книги не найдены</p>';
        return;
    }

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.onclick = () => openReader(book.id);

        // Определяем язык для отображения
        let langText = '';
        let langColor = '';
        switch(book.language) {
            case 'shughni':
                langText = 'Шугнанский';
                langColor = '#667eea';
                break;
            case 'russian':
                langText = 'Русский';
                langColor = '#f093fb';
                break;
            case 'english':
                langText = 'English';
                langColor = '#4facfe';
                break;
        }

        bookCard.innerHTML = `
            <div class="book-cover">
                <img src="${book.cover || 'covers/default.jpg'}" alt="${book.title}">
            </div>
            <div class="book-title">${book.title}</div>
            <div class="book-author">Автор: ${book.author}</div>
            <div class="book-desc">${book.description}</div>
            <span class="book-lang" style="background: ${langColor}">${langText}</span>
        `;

        bookList.appendChild(bookCard);
    });
}

// Фильтрация по языку/категории
function filterBooks(filter) {
    currentFilter = filter;
    let filteredBooks = allBooks;

    if (filter !== 'all') {
        filteredBooks = allBooks.filter(book => 
            book.language === filter || book.category === filter
        );
    }

    displayBooks(filteredBooks);
}

// Поиск по книгам
function searchBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredBooks = allBooks.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.description.toLowerCase().includes(searchTerm)
    );

    if (currentFilter !== 'all') {
        filteredBooks = filteredBooks.filter(book => 
            book.language === currentFilter || book.category === currentFilter
        );
    }

    displayBooks(filteredBooks);
}

// Открыть читалку
function openReader(bookId) {
    window.location.href = `reader.html?id=${bookId}`;
}