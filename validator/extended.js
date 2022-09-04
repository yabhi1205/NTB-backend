const max = 5
const dateTime = require('node-datetime');
const moment = require('moment')

const updateArray = (Array) => {
    if (Object.keys(Array).length <= max) {
        Array[`time${Object.keys(Array).length}`]=Formatted()
    }
    else{
        for (let index = 0; index < max; index++) {
            Array[`time${index}`]=Array[`time${index+1}`]
        }
        Array[`time${max}`]=Formatted()
    }
    return Array
}
const Formatted = () => {
    var dt = dateTime.create();
    return dt.format('Y-m-d H:M:S');
}

const TimeDiff = (UserTime) => {
    var startDate = moment(UserTime, 'YYYY-M-DD HH:mm:ss')
    var endDate = moment(Formatted(), 'YYYY-M-DD HH:mm:ss')
    return endDate.diff(startDate, 'seconds')
}

module.exports = { updateArray, TimeDiff, Formatted }