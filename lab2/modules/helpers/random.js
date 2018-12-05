const faker = require('faker');

module.exports.getRndDate = (from = '1940.11.27', to = '1998.11.27') => {
    return faker.date.between(from, to);
}

module.exports.getRndSexEnum = () => {
    return ['male', 'female'][Math.floor(Math.random() * 2)];
}

module.exports.getRndInteger = (min, max) => {
    let res = Math.floor(Math.random() * (max - min)) + min;
    return res;
}
