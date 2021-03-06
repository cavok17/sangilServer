const mongoose = require("mongoose");

// 스키마 객체를 생성
const index_schema = new mongoose.Schema({
    // original_index_id : {type : String},
    book_id : mongoose.ObjectId,    
    name : String,
    seq : Number,
    level : { type : Number, default : 1},
    
    num_cards : {
        total : {
            progress : { type : Number, default : 0},
            total : { type : Number, default : 0},    
            yet : { type : Number, default : 0},    
            ing : {
                not_studying : { type : Number, default : 0},
                until_now : { type : Number, default : 0},
                until_today : { type : Number, default : 0},
                after_tomorrow : { type : Number, default : 0},
                total : { type : Number, default : 0},
            },
            hold : { type : Number, default : 0},
            completed : { type : Number, default : 0},
        },    
        read : {
            progress : { type : Number, default : 0},
            total : { type : Number, default : 0},    
            yet : { type : Number, default : 0},    
            ing : {
                not_studying : {type : Number, default : 0},
                until_now : {type : Number, default : 0},
                until_today : {type : Number, default : 0},
                after_tomorrow : {type : Number, default : 0},
                total : {type : Number, default : 0},
            },
            hold : {type : Number, default : 0},
            completed : {type : Number, default : 0},
        },
        flip : {
            progress : { type : Number, default : 0},
            total : { type : Number, default : 0},    
            yet : { type : Number, default : 0},    
            ing : {
                not_studying : { type : Number, default : 0},
                until_now : { type : Number, default : 0},
                until_today : { type : Number, default : 0},
                after_tomorrow : { type : Number, default : 0},
                total : { type : Number, default : 0},
            },
            hold : { type : Number, default : 0},
            completed : { type : Number, default : 0},
        },
    }
});

module.exports = mongoose.model("Index", index_schema)
// module.exports = mongoose.model("users", userschema)

