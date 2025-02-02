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

// Убедитесь, что эта строка не дублируется
// const useLocalStorage = true;

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
    if (availableQuestions.length === 0) {
        console.error("Нет доступных вопросов!");
        return;
    }

    questionNumber.innerHTML = "Вопрос " + (questionCounter + 1) + " из " + questionLimit;
    
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
    
    console.log('Selected options:', selectedOptions);
    
    // Validate selection
    if (selectedOptions.length === 0) {
        showError('Пожалуйста, выберите ответ');
        return;
    }
    
    // For multiple choice questions, validate at least one option is selected
    if (currentQuestion.isMultiple && selectedOptions.length === 0) {
        showError('Выберите хотя бы один вариант ответа');
        return;
    }

    // Clear any existing error message
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.textContent = '';
    }

    userAnswers.push({
        question: currentQuestion.q,
        selected: selectedOptions
    });
    
    console.log('User answers so far:', userAnswers);
    questionCounter++;
    
    console.log('Question counter:', questionCounter, 'Question limit:', questionLimit);

    if (questionCounter >= questionLimit) {
        console.log('Quiz completed, calculating results...');
        quizOver();
    } else {
        getNewQuestion();
    }
}

function answersIndicator(){
    answersIndicatorContainer.innerHTML = '';
    const totalQuestion = questionLimit;
    for(let i=0; i<totalQuestion; i++){
        const indicator = document.createElement("div");
        // Отмечаем все предыдущие вопросы как отвеченные
        if (i < questionCounter) {
            indicator.classList.add('answered');
        }
        answersIndicatorContainer.appendChild(indicator);
    }
}

function quizOver() {
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
        topic: selectedTopic
    };

    LocalStorage.saveResult(result);
    
    quizBox.classList.add("hide");
    resultBox.classList.remove("hide");
    
    quizResult();
    loadLeaderboard();
}

function quizResult(){
    // Обновляем основную информацию
    document.querySelector(".result-box .total-question").textContent = questionLimit;
    document.querySelector(".result-box .total-score").textContent = `${correctAnswers} / ${questionLimit}`;
    document.querySelector(".result-box .percentage").textContent = ((correctAnswers/questionLimit)*100).toFixed(2) + "%";

    // Очищаем предыдущие результаты
    const existingResults = resultBox.querySelectorAll('#correct-answers, #wrong-answers');
    existingResults.forEach(el => el.remove());

    // Создаем новые списки для правильных и неправильных ответов
    const correctAnswersList = document.createElement("div");
    const wrongAnswersList = document.createElement("div");
    correctAnswersList.id = "correct-answers";
    wrongAnswersList.id = "wrong-answers";
    correctAnswersList.innerHTML = "<h3>Верные ответы</h3>";
    wrongAnswersList.innerHTML = "<h3>Неполные или неверные ответы</h3>";

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

    // Добавляем списки на страницу
    const leaderboardElement = resultBox.querySelector('.leaderboard');
    resultBox.insertBefore(correctAnswersList, leaderboardElement);
    resultBox.insertBefore(wrongAnswersList, leaderboardElement);
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
    resultBox.classList.add("hide");
    homeBox.classList.remove("hide");
    resetQuiz();
}

function startQuiz() {
    console.log('Starting new quiz...');
    homeBox.classList.add("hide");
    quizBox.classList.remove("hide");
    
    // Сбрасываем все индикаторы и контейнеры
    answersIndicatorContainer.innerHTML = '';
    optionContainer.innerHTML = '';
    
    setAvailableQuestions();
    getNewQuestion();
    answersIndicator();
}

function validateAndStartQuiz() {
    const nickname = document.getElementById('nickname').value.trim();
    const selectedTopic = document.querySelector('.dropdown-content .dropdown-item.selected').getAttribute('data-value');
    
    console.log('Validating quiz start:', { nickname, selectedTopic });
    
    if (!nickname) {
        alert('Пожалуйста, введите никнейм');
        return;
    }

    const existingResults = JSON.parse(localStorage.getItem('quizResults') || '{}');
    console.log('Checking existing results:', existingResults);
    
    if (existingResults[selectedTopic] && 
        existingResults[selectedTopic].some(entry => entry.nickname === nickname)) {
        console.log('Found existing result for:', nickname);
        showError('Этот тест можно пройти только один раз');
        setTimeout(() => {
            quizBox.classList.add("hide");
            resultBox.classList.remove("hide");
            loadLeaderboard();
        }, 2000);
        return;
    }

    // Полный сброс состояния перед началом
    resetQuiz();
    startQuiz();
}

function resetQuiz() {
    console.log('Resetting quiz state...');
    questionCounter = 0;
    correctAnswers = 0;
    attempt = 0;
    availableQuestions = [];
    availableOptions = [];
    userAnswers = [];
    currentQuestion = null;
}

function loadLeaderboard() {
    const selectedTopic = document.querySelector('.dropdown-content .dropdown-item.selected').getAttribute('data-value');
    console.log('Loading leaderboard for topic:', selectedTopic);
    
    const leaderboardDiv = document.getElementById('leaderboard-content');
    const results = LocalStorage.getLeaderboard(selectedTopic);
    console.log('Formatted leaderboard results:', results);
    
    if (!results || results.length === 0) {
        leaderboardDiv.innerHTML = '<p>Пока нет результатов</p>';
        return;
    }
    
    let html = `<table>
        <tr>
            <th>Место</th>
            <th>Никнейм</th>
            <th>Баллы</th>
            <th>Дата и время</th>
        </tr>`;
    
    results.forEach((data, index) => {
        const date = new Date(data.timestamp);
        const formattedDate = date.toLocaleString('ru-RU');
        html += `<tr>
            <td>${index + 1}</td>
            <td>${data.nickname}</td>
            <td>${data.score}</td>
            <td>${formattedDate}</td>
        </tr>`;
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
            element.insertAdjacentElement('beforebegin', errorDiv);
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
    }, 3000);
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