const questionNumber = document.querySelector(".question-number");
const questionText = document.querySelector(".question-text");
const optionContainer = document.querySelector(".option-container");
const answersIndicatorContainer = document.querySelector(".answers-indicator");
const homeBox = document.querySelector(".home-box");
const quizBox = document.querySelector(".quiz-box");
const resultBox = document.querySelector(".result-box");

let questionCounter = 0;
let currentQuestion;
let availableQuestions = [];
let availableOptions = [];
let correctAnswers = 0;
let attempt = 0;
let questionLimit = 0;
let userAnswers = []; // Массив для хранения ответов пользователя

const ITEMS_PER_PAGE = 20; // Количество элементов на "страницу"
let currentPage = 1;
let isLoading = false;
let hasMoreItems = true;

// Инициализация переменных таймера
let startTime = null;
let elapsedTime = 0;
let timerInterval = null;

// Проверка наличия элемента таймера при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const timerElement = document.querySelector('.quiz-box .timer');
    console.log('Элемент таймера при загрузке:', timerElement);
    if (!timerElement) {
        console.error('Элемент таймера не найден при загрузке страницы!');
    }
});

function setAvailableQuestions(){
    const selectedTopic = document.querySelector('.dropdown-content .dropdown-item.selected') 
        ? document.querySelector('.dropdown-content .dropdown-item.selected').getAttribute('data-value') 
        : document.querySelector('.dropdown-btn span').textContent;

    console.log("Выбранный топик:", selectedTopic); // Логируем выбранный топик
    const topicQuestions = quiz.filter(q => q.topic === selectedTopic);
    console.log("Вопросы для выбранного топика:", topicQuestions); // Логируем вопросы для выбранного топика
    availableQuestions = [...topicQuestions];

    // Устанавливаем количество вопросов на основе выбранного топика
    questionLimit = availableQuestions.length; // Динамическое значение
    console.log("Доступные вопросы для топика:", availableQuestions); // Логируем доступные вопросы

    if (questionLimit === 0) {
        console.error("Нет доступных вопросов для выбранного топика!");
    }
}

function getNewQuestion(){
    console.log('Получение нового вопроса');
    scrollToTop();
    
    // Проверка таймера
    const timerElement = document.querySelector('.quiz-box .timer');
    console.log('Элемент таймера при новом вопросе:', timerElement);
    if (!timerElement) {
        console.error('Таймер не найден при смене вопроса!');
    } else {
        console.log('Текущее значение таймера:', timerElement.textContent);
    }
    
    if (availableQuestions.length === 0) {
        console.error("Нет доступных вопросов!");
        return;
    }

    const currentQuestionElement = document.querySelector('.current-question');
    currentQuestionElement.textContent = "Вопрос " + (questionCounter + 1) + " из " + questionLimit;
    
    // Берем вопросы последовательно, а не случайно
    currentQuestion = availableQuestions[0];
    console.log("Текущий вопрос:", JSON.stringify(currentQuestion));

    questionText.innerHTML = currentQuestion.q;
    availableQuestions.splice(0, 1);
    
    const optionsLength = currentQuestion.options.length;
    for (let i = 0; i < optionsLength; i++) {
        availableOptions.push(i);
    }
    optionContainer.innerHTML = '';
    let animationDelay = 0.2;
    for (let i = 0; i < optionsLength; i++) {
        const optionIndex = availableOptions[Math.floor(Math.random() * availableOptions.length)];
        const index2 = availableOptions.indexOf(optionIndex);
        availableOptions.splice(index2, 1);
        const option = document.createElement("div");
        option.innerHTML = currentQuestion.options[optionIndex];
        option.id = optionIndex;
        option.style.animationDelay = animationDelay + 's';
        animationDelay = animationDelay + 0.15;
        option.className = "option";
        optionContainer.appendChild(option);
        option.setAttribute("onclick", "toggleSelection(this)");
    }

    // Добавляем текст "множественный выбор" если это множественный выбор
    if (currentQuestion.isMultiple) {
        const multipleChoiceText = document.createElement("div");
        multipleChoiceText.innerHTML = "<small style='color: gray;'>Множественный выбор</small>";
        questionNumber.appendChild(multipleChoiceText);
    }
}

function toggleSelection(element) {
    console.log("Клик на вариант ответа:", element.innerHTML);
    
    if (!currentQuestion.isMultiple) {
        // Для одиночного выбора снимаем выделение со всех элементов
        Array.from(optionContainer.children).forEach(opt => {
            opt.classList.remove('selected');
            console.log(`Снято выделение с: ${opt.innerHTML}`);
        });
    }
    
    // Добавляем/убираем класс selected для текущего элемента
    element.classList.toggle('selected');
    console.log(`Текущее состояние для ${element.innerHTML}: ${element.classList.contains('selected') ? 'выбрано' : 'не выбрано'}`);
}

function next() {
    const selectedOptions = Array.from(optionContainer.children)
        .filter(opt => opt.classList.contains('selected'))
        .map(opt => parseInt(opt.id));
    
    // For multiple choice questions, validate at least one option is selected
    if (currentQuestion.isMultiple && selectedOptions.length === 0) {
        showError('Выбери хотя бы один вариант ответа', document.querySelector('.option-container'));
        return;
    }
    
    // Validate selection
    if (selectedOptions.length === 0) {
        showError('Выбери ответ', document.querySelector('.option-container'));
        return;
    }

    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }

    userAnswers.push({
        question: currentQuestion.q,
        selected: selectedOptions
    });
    
    questionCounter++;
    answersIndicator();
    
    if (questionCounter >= questionLimit) {
        quizOver();
    } else {
        setTimeout(() => {
            scrollToTop();
            getNewQuestion();
        }, 50)
    }
}

function answersIndicator(){
    answersIndicatorContainer.innerHTML = '';
    // Убираем отображение индикатора во время теста
    if (questionCounter === questionLimit) {
        return;
    }
    
    const totalQuestion = questionLimit;
    for(let i=0; i<totalQuestion; i++){
        const indicator = document.createElement("div");
        if (i < questionCounter) {
            indicator.classList.add('answered');
        }
        answersIndicatorContainer.appendChild(indicator);
    }
}

async function quizOver() {
    await storage.saveResult(result);
    const timeSpent = stopTimer();
    const nickname = document.getElementById('nickname').value;
    const selectedTopic = document.querySelector('.dropdown-content .dropdown-item.selected').getAttribute('data-value');


    let correctCount = 0;
    userAnswers.forEach((userAnswer, index) => {
        const question = quiz.find(q => q.q === userAnswer.question);
        const isCorrect = Array.isArray(question.answer) 
            ? JSON.stringify(userAnswer.selected.sort()) === JSON.stringify(question.answer.sort())
            : userAnswer.selected[0] === question.answer;
        if (isCorrect) correctCount++;
    });

    correctAnswers = correctCount;
    const percentage = (correctAnswers/questionLimit)*100;
    
    const result = {
        nickname: nickname,
        score: correctAnswers,
        percentage: percentage,
        topic: selectedTopic,
        timeSpent: parseFloat(timeSpent)
    };
    
    quizBox.classList.add("hide");
    resultBox.classList.remove("hide");
    
    quizResult();
    loadLeaderboard();
}

function quizResult() {
    document.querySelector(".total-question").textContent = questionLimit;
    document.querySelector(".total-score").textContent = `${correctAnswers} / ${questionLimit}`;
    document.querySelector(".percentage").textContent = ((correctAnswers/questionLimit)*100).toFixed(2) + "%";
    document.querySelector(".time-spent").textContent = elapsedTime;
    
    const existingResults = resultBox.querySelectorAll('.answers-details');
    existingResults.forEach(el => el.remove());

    // Создаем контейнер для деталей
    const detailsContainer = document.createElement("div");
    detailsContainer.className = "answers-details";

    // Создаем секцию правильных ответов
    const correctDetails = document.createElement("details");
    const correctSummary = document.createElement("summary");
    correctSummary.textContent = `Верные ответы (${userAnswers.filter(answer => {
        const question = quiz.find(q => q.q === answer.question);
        return Array.isArray(question.answer)
            ? JSON.stringify(answer.selected.sort()) === JSON.stringify(question.answer.sort())
            : answer.selected[0] === question.answer;
    }).length})`;
    const correctAnswersList = document.createElement("div");
    correctAnswersList.id = "correct-answers";
    correctDetails.appendChild(correctSummary);
    correctDetails.appendChild(correctAnswersList);

    // Создаем секцию неправильных ответов
    const wrongDetails = document.createElement("details");
    const wrongSummary = document.createElement("summary");
    const wrongCount = userAnswers.filter(answer => {
        const question = quiz.find(q => q.q === answer.question);
        return !(Array.isArray(question.answer)
            ? JSON.stringify(answer.selected.sort()) === JSON.stringify(question.answer.sort())
            : answer.selected[0] === question.answer);
    }).length;
    wrongSummary.textContent = `Неполные или неверные ответы (${wrongCount})`;
    const wrongAnswersList = document.createElement("div");
    wrongAnswersList.id = "wrong-answers";
    wrongDetails.appendChild(wrongSummary);
    wrongDetails.appendChild(wrongAnswersList);

    userAnswers.forEach((userAnswer) => {
        const question = quiz.find(q => q.q === userAnswer.question);
        const isCorrect = Array.isArray(question.answer)
            ? JSON.stringify(userAnswer.selected.sort()) === JSON.stringify(question.answer.sort())
            : userAnswer.selected[0] === question.answer;

        const questionDiv = document.createElement("div");
        questionDiv.className = "question-result";
        questionDiv.innerHTML = `
            <p><strong>${question.q}</strong></p>
            <p>Ваш ответ: ${userAnswer.selected.map(i => question.options[i]).join(', ')}</p>
            <p>Правильный ответ: ${Array.isArray(question.answer) 
                ? question.answer.map(i => question.options[i]).join(', ')
                : question.options[question.answer]}</p>
        `;

        if (isCorrect) {
            correctAnswersList.appendChild(questionDiv);
        } else {
            if (question.explanation) {
                questionDiv.innerHTML += `<p class="explanation">Объяснение: ${question.explanation}</p>`;
            }
            wrongAnswersList.appendChild(questionDiv);
        }
    });

    detailsContainer.appendChild(correctDetails);
    detailsContainer.appendChild(wrongDetails);

    const leaderboardElement = resultBox.querySelector('.leaderboard');
    resultBox.insertBefore(detailsContainer, leaderboardElement);
}

function resetQuiz(){
    questionCounter = 0;
    correctAnswers = 0;
    attempt = 0;
    availableQuestions = [];
    userAnswers = [];
}

function tryAgain(){
    resultBox.classList.add("hide");
    quizBox.classList.remove("hide");
    resetQuiz();
    startQuiz();
}

function goToHome(){
    scrollToTop();
    resultBox.classList.add("hide");
    homeBox.classList.remove("hide");
    resetQuiz();
}

function startQuiz() {
    console.log('Начало квиза');
    homeBox.classList.add("hide");
    quizBox.classList.remove("hide");
    scrollToTop();
    setAvailableQuestions();
    getNewQuestion();
    answersIndicator();
    console.log('Вызываем startTimer()');
    startTimer();
    console.log('Таймер запущен');
}

function validateNickname(nickname) {
    const nicknameRegex = /^[a-zA-Z0-9_-]+$/;
    return nicknameRegex.test(nickname);
}

async function validateAndStartQuiz() {
    const nickname = document.getElementById('nickname').value.trim();
    const selectedTopic = document.querySelector('.dropdown-content .dropdown-item.selected').getAttribute('data-value');
    const userResult = await storage.getUserResult(selectedTopic, nickname);
    
    if (!nickname) {
        showError('Введи никнейм', document.querySelector('.nickname-input'));
        return;
    }

    if (!validateNickname(nickname)) {
        showError('Никнейм может содержать только английские буквы, цифры, _ и -', document.querySelector('.nickname-input'));
        return;
    }
    
    if (userResult) {     
        // Загружаем предыдущие результаты
        questionLimit = userResult.totalQuestions;
        correctAnswers = userResult.score;
        userAnswers = userResult.answers;
        elapsedTime = userResult.timeSpent;
        
        // Показываем результаты
        homeBox.classList.add("hide");
        resultBox.classList.remove("hide");
        quizResult();
        loadLeaderboard();
        return;
    }

    resetQuiz();
    startQuiz();
}

async function loadLeaderboard() {
    const selectedTopic = document.querySelector('.dropdown-content .dropdown-item.selected').getAttribute('data-value');
    const currentNickname = document.getElementById('nickname').value;
    console.log('Loading leaderboard for topic:', selectedTopic);
    
    const leaderboardDiv = document.getElementById('leaderboard-content');
    const results = await storage.getLeaderboard(selectedTopic);
    
    if (!results || results.length === 0) {
        leaderboardDiv.innerHTML = '<p>Пока нет результатов</p>';
        return;
    }
    
    // Сортировка по очкам (по убыванию) и никнейму (по алфавиту)
    results.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.timeSpent - b.timeSpent;
    });

    // Находим индекс текущего пользователя
    const currentUserIndex = results.findIndex(r => r.nickname === currentNickname);
    
    let rowsToShow = new Set();
    
    // Добавляем топ-5
    for (let i = 0; i < Math.min(5, results.length); i++) {
        rowsToShow.add(i);
    }
    
    if (currentUserIndex !== -1) {
        // Добавляем индексы вокруг текущего пользователя
        for (let i = Math.max(0, currentUserIndex - 2); 
             i <= Math.min(results.length - 1, currentUserIndex + 2); 
             i++) {
            rowsToShow.add(i);
        }
    }
    
    let html = `<table>
        <tr>
            <th>Место</th>
            <th>Никнейм</th>
            <th>Баллы</th>
            <th>Время, сек</th>
            <th>Дата и время</th>
        </tr>`;
    
    let lastShownIndex = -1;
    
    Array.from(rowsToShow).sort((a, b) => a - b).forEach(index => {
        if (lastShownIndex !== -1 && index - lastShownIndex > 1) {
            html += `<tr><td colspan="4" style="text-align: center;">...</td></tr>`;
        }
        
        const data = results[index];
        const date = new Date(data.timestamp);
        const formattedDate = date.toLocaleString('ru-RU');
        
        html += `<tr${data.nickname === currentNickname ? ' style="background-color: #e6f3ff;"' : ''}>
            <td>${index + 1}</td>
            <td>${data.nickname}</td>
            <td>${data.score}</td>
            <td>${data.timeSpent}</td>
            <td>${formattedDate}</td>
        </tr>`;
        
        lastShownIndex = index;
    });
    
    html += '</table>';
    leaderboardDiv.innerHTML = html;
}

function toggleDropdown(button) {
    const customSelect = button.closest('.custom-select');
    const selectItems = customSelect.querySelector('.select-items');
    const arrow = button.querySelector('.arrow');
    
    // Предотвращаем всплытие события
    event.stopPropagation();
    
    // Закрываем все другие дропдауны
    const allSelectItems = document.querySelectorAll('.select-items');
    allSelectItems.forEach(items => {
        if (items !== selectItems) {
            items.classList.add('select-hide');
        }
    });
    
    selectItems.classList.toggle('select-hide');
    
    // Поворачиваем стрелку
    if (selectItems.classList.contains('select-hide')) {
        arrow.style.transform = 'rotate(0deg)';
    } else {
        arrow.style.transform = 'rotate(180deg)';
    }
}

function showError(message, element) {
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        
        // Если передан элемент, вставляем перед ним
        if (element) {
            element.insertAdjacentElement('afterend', errorDiv);
        } else {
            // Иначе вставляем перед кнопкой "Поехали"
            document.querySelector('.button-group').insertAdjacentElement('beforebegin', errorDiv);
        }
    }
    
    errorDiv.textContent = message;
    errorDiv.style.color = 'red';
    errorDiv.style.marginBottom = '10px';
    
    setTimeout(() => {
        errorDiv.textContent = '';
    }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    
    dropdownBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownContent.classList.toggle('show');
        const arrow = this.querySelector('.arrow');
        arrow.style.transform = dropdownContent.classList.contains('show') ? 'rotate(180deg)' : 'rotate(0deg)';
    });
    
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            dropdownBtn.querySelector('span').textContent = this.textContent;
            dropdownContent.classList.remove('show');
            dropdownBtn.querySelector('.arrow').style.transform = 'rotate(0deg)';
            
            // Устанавливаем выбранный элемент как активный
            dropdownItems.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');
            
            // Обновляем questionLimit при выборе топика
            setAvailableQuestions();
        });
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select')) {
            dropdownContent.classList.remove('show');
            dropdownBtn.querySelector('.arrow').style.transform = 'rotate(0deg)';
        }
    });

    // Выбираем первый элемент по умолчанию
    if (dropdownItems.length > 0) {
        dropdownItems[0].click(); // Это действие выберет первый элемент
    }
});

async function loadPreviousResults(nickname, topic) {
    const results = await storage.getLeaderboard(topic);
    const userResult = results.find(r => r.nickname === nickname);
    
    if (!userResult) {
        document.querySelector('.result-box').innerHTML = '<p>Результаты не найдены</p>';
        return;
    }
    
    // Загружаем основную информацию
    document.querySelector(".total-question").textContent = userResult.totalQuestions || 0;
    document.querySelector(".total-score").textContent = `${userResult.score} / ${userResult.totalQuestions || 0}`;
    document.querySelector(".percentage").textContent = userResult.percentage.toFixed(2) + "%";
    
    // Загружаем детальные ответы
    if (userResult.answers) {
        displayDetailedAnswers(userResult.answers);
    }
}

function displayDetailedAnswers(answers) {
    const correctAnswersList = document.createElement("div");
    const wrongAnswersList = document.createElement("div");
    correctAnswersList.id = "correct-answers";
    wrongAnswersList.id = "wrong-answers";
    
    const detailsContainer = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Подробные результаты";
    detailsContainer.appendChild(summary);
    
    correctAnswersList.innerHTML = "<h3>Верные ответы</h3>";
    wrongAnswersList.innerHTML = "<h3>Неполные или неверные ответы</h3>";
    
    answers.forEach(answer => {
        const question = quiz.find(q => q.q === answer.question);
        if (!question) return;
        
        const questionDiv = document.createElement("div");
        questionDiv.className = "question-result";
        questionDiv.innerHTML = `
            <p><strong>${question.q}</strong></p>
            <p>Ваш ответ: ${answer.selected.map(i => question.options[i]).join(', ')}</p>
            <p>Правильный ответ: ${Array.isArray(question.answer) 
                ? question.answer.map(i => question.options[i]).join(', ')
                : question.options[question.answer]}</p>
        `;
        
        if (answer.isCorrect) {
            correctAnswersList.appendChild(questionDiv);
        } else {
            if (question.explanation) {
                questionDiv.innerHTML += `<p class="explanation">Объяснение: ${question.explanation}</p>`;
            }
            wrongAnswersList.appendChild(questionDiv);
        }
    });
    
    detailsContainer.appendChild(correctAnswersList);
    detailsContainer.appendChild(wrongAnswersList);
    
    const resultBox = document.querySelector('.result-box');
    const leaderboardElement = resultBox.querySelector('.leaderboard');
    resultBox.insertBefore(detailsContainer, leaderboardElement);
}

function showFullLeaderboard() {
    const resultBox = document.querySelector('.result-box');
    const fullLeaderboardBox = document.querySelector('.full-leaderboard-box');
    resultBox.classList.add('hide');
    fullLeaderboardBox.classList.remove('hide');
    
    loadFullLeaderboard();
}

function hideFullLeaderboard() {
    const resultBox = document.querySelector('.result-box');
    const fullLeaderboardBox = document.querySelector('.full-leaderboard-box');
    fullLeaderboardBox.classList.add('hide');
    resultBox.classList.remove('hide');
    
    // Удаляем обработчик скролла
    fullLeaderboardBox.removeEventListener('scroll', handleScroll);
    
    // Сбрасываем состояние пагинации
    currentPage = 1;
    isLoading = false;
    hasMoreItems = true;
}

async function loadFullLeaderboard(resetPagination = true) {
    const selectedTopic = document.querySelector('.dropdown-content .dropdown-item.selected').getAttribute('data-value');
    const currentNickname = document.getElementById('nickname').value;
    const results = await storage.getLeaderboard(selectedTopic);
    

    if (resetPagination) {
        currentPage = 1;
        hasMoreItems = true;
        const leaderboardContent = document.getElementById('full-leaderboard-content');
        leaderboardContent.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Место</th>
                        <th>Никнейм</th>
                        <th>Баллы</th>
                        <th>Время, сек</th>
                        <th>Дата и время</th>
                    </tr>
                </thead>
                <tbody id="leaderboard-tbody"></tbody>
            </table>
            <div id="loading-indicator" style="display: none; text-align: center; padding: 20px;">
                Загрузка...
            </div>`;
        
        // Добавляем обработчик скролла
        const fullLeaderboardBox = document.querySelector('.full-leaderboard-box');
        fullLeaderboardBox.addEventListener('scroll', handleScroll);
    }
    
    loadMoreItems(results, currentNickname);
}

function loadMoreItems(results, currentNickname) {
    if (isLoading || !hasMoreItems) return;
    
    isLoading = true;
    const tbody = document.getElementById('leaderboard-tbody');
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = 'block';
    
    // Имитируем задержку загрузки для более плавного UX
    setTimeout(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageItems = results.slice(startIndex, endIndex);
        
        if (pageItems.length === 0) {
            hasMoreItems = false;
            loadingIndicator.style.display = 'none';
            isLoading = false;
            return;
        }
        
        pageItems.forEach((data, index) => {
            const absoluteIndex = startIndex + index;
            const date = new Date(data.timestamp);
            const formattedDate = date.toLocaleString('ru-RU');
            
            const row = document.createElement('tr');
            if (data.nickname === currentNickname) {
                row.style.backgroundColor = '#e6f3ff';
            }
            
            row.innerHTML = `
                <td>${absoluteIndex + 1}</td>
                <td>${data.nickname}</td>
                <td>${data.score}</td>
                <td>${data.timeSpent}</td>
                <td>${formattedDate}</td>
            `;
            

            tbody.appendChild(row);
        });
        
        currentPage++;
        isLoading = false;
        loadingIndicator.style.display = 'none';
        
        if (endIndex >= results.length) {
            hasMoreItems = false;
        }
    }, 300);
}

async function handleScroll(event) {
    const element = event.target;
    // Загружаем новые элементы, когда пользователь прокрутил до конца с небольшим запасом
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 100) {

        const selectedTopic = document.querySelector('.dropdown-content .dropdown-item.selected').getAttribute('data-value');
        const currentNickname = document.getElementById('nickname').value;
        const results = await storage.getLeaderboard(selectedTopic);
        loadMoreItems(results, currentNickname);
    }
}

function startTimer() {
    startTime = Date.now();
    const update = () => {
        const now = Date.now();
        elapsedTime = (now - startTime) / 1000;
        const timerElement = document.querySelector('.timer');
        if(timerElement) {
            timerElement.textContent = Math.floor(elapsedTime);
            requestAnimationFrame(update); // Используем rAF вместо setInterval
        }
    };
    requestAnimationFrame(update);
}

function stopTimer() {
    const elements = document.getElementsByClassName('timer');
    while(elements.length > 0) {
        elements[0].textContent = '0'; // Очищаем все таймеры
    }
    return elapsedTime.toFixed(2);
}

function updateTimer() {
    const timerElement = document.querySelector('.timer');
    if (timerElement) {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        console.log('Прошло секунд:', seconds);
        timerElement.textContent = seconds;
    } else {
        console.error('Элемент таймера не найден!');
    }
}

function scrollToTop() {
    const isSmoothScrollSupported = 'scrollBehavior' in document.documentElement.style;
    if(isSmoothScrollSupported) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        window.scrollTo(0, 0); // Фолбэк для старых браузеров
    }
}