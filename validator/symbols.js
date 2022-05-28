const symbols = (string) => {
    const symbolArray = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "+", "=", "{", "}", ":", ";", "'", '"', "<", ",", ">", ".", "?", "/", "`", "~", "[", "]", "|", "\\"]
    for (const alpha of string) {
        for (const sym of symbolArray) {
            if (sym === alpha) {
                return false
            }
        }
    }
    return true
}
const num = (string) => {
    for (const alpha of string) {
        if (!isNaN(alpha)) {
            return false
        }
    }
    return true
}
const miet = (string) => {
    let college = "miet.ac.in"
    let a = string.split('@')
    for (const i in string) {
        if (!(a[1][i] === college[i])) {
            return false
        }
    }
    return true
}

const bookName = (string) => {
    let a = string.split('-')
    if (!symbols(a[0]) || !num(a[0])) {
        return false
    }
    return true
}
const name = (string) => {
    let a = string.split(' ')
    for (const element of a) {
        if (!symbols(element) || !num(element)) {
            return false
        }
    }
    return true
}
const subject = (string) => {
    let a = string.split('_')
    for (const element of a) {
        if (!symbols(element) || !num(element)) {
            return false
        }
    }
    return true
}

module.exports = { symbols, miet, num, name, bookName, subject }