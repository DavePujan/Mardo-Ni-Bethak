const evaluations = [
    { id: 1, student: "student@test.com", quiz: "React Basics", status: "Pending", actions: "Evaluate" }
];

module.exports = {
    findAll: () => evaluations,
    find: (predicate) => evaluations.find(predicate),
    filter: (predicate) => evaluations.filter(predicate),
    push: (evaluation) => evaluations.push(evaluation),
    length: () => evaluations.length
};
