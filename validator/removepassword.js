const removepassword = (json)=>{
    let data = json.toJSON()
    delete data.password
    if(data.timestamp){
        delete data.timestamp
    }
    if(data.__v){
        delete data.__v
    }
    if(data.block){
        delete data.block
    }
    return data
}
module.exports = removepassword