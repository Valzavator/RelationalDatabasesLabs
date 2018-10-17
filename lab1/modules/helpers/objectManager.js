const readlineSync = require('readline-sync');

module.exports.createObjectWithAttributes = (attributes) => {
    if (!attributes && attributes.length <= 0)
        throw new Error('Invalid array of attributes!')

    let obj = {};
    attributes.forEach(atr => {
        let redVal = readlineSync.question(`${atr}: `);
        if (redVal)
            obj[atr] = redVal;
    });
    return obj;
}