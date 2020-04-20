const moment = require('moment')

const generateMessage = (text, name) => {
    return { 
        text: text,
        createdAt: moment(new Date().getTime()).format('H:mm'),
        name: name
    }
}

module.exports = {generateMessage}