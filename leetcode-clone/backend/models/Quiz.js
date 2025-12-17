const quizzes = [];

module.exports = {
    findAll: () => quizzes,
    find: (predicate) => quizzes.find(predicate),
    filter: (predicate) => quizzes.filter(predicate),
    push: (quiz) => quizzes.push(quiz),
    length: () => quizzes.length
};
