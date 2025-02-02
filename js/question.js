const quiz = [
    {
        q: 'Какие компоненты входят в типичный Data Warehouse?',
        options: [
            'Staging Area',
            'Data Marts',
            'Social Media API',
            'Core Data Warehouse',
            'Blockchain Storage'
        ],
        answer: [0, 1, 3], // Множественный выбор - индексы правильных ответов
        isMultiple: true,
        topic: "de-self-evaluate",
        explanation: "Компоненты, которые обычно входят в Data Warehouse."
    },
    {
        q: 'Какой тип загрузки данных подразумевает загрузку только изменившихся записей?',
        options: [
            'Full Load',
            'Incremental Load',
            'Snapshot Load',
            'Differential Load'
        ],
        answer: 1, // Единственный выбор
        isMultiple: false,
        topic: "de-self-evaluate",
        explanation: "Incremental Load загружает только изменившиеся данные."
    },
    {
        q: 'Это тестовый вопрос для проверки функционала?',
        options: [
            'Да, это тестовый вопрос'
        ],
        answer: 0,
        isMultiple: false,
        topic: "test-quiz",
        explanation: "Этот вопрос предназначен для тестирования функционала."
    },
    {
        q: 'Какой вопрос для DE?',
        options: ['Ответ 1', 'Ответ 2'],
        answer: 0,
        isMultiple: false,
        topic: "de-self-evaluate",
        explanation: "Это вопрос для проверки знаний в DE."
    },
    {
        q: 'Какой вопрос для теста?',
        options: ['Ответ 1', 'Ответ 2'],
        answer: 0,
        isMultiple: false,
        topic: "test-quiz",
        explanation: "Это вопрос для теста."
    }
]

// Функция для фильтрации вопросов по выбранной теме
function getQuestionsByTopic(topic) {
    return quiz.filter(q => q.topic === topic);
}
