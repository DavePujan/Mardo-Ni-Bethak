const requests = [];

module.exports = {
    findAll: () => requests,
    push: (req) => requests.push(req),
    find: (predicate) => requests.find(predicate),
    filter: (predicate) => requests.filter(predicate),
    remove: (email) => {
        const idx = requests.findIndex(r => r.email === email);
        if (idx !== -1) requests.splice(idx, 1);
    }
};
