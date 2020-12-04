const mongoose = require("mongoose");

// 스키마 객체를 생성
const session_schema = new mongoose.Schema({
    user_id : String,
    current_seq : {type : Number, default : 0},
    time_create : {type : Date, default : Date.now},
    num_cards : {
        yet : {type : Number, default : 0},
        re : {type : Number, default : 0},
        hold : {type : Number, default : 0},
        completed : {type : Number, default : 0},
        total : {type : Number, default : 0},
        re_until_now : {type : Number, default : 0},
        re_until_today : {type : Number, default : 0},
    },
    num_used_cards : {
        yet : {type : Number, default : 0},
        re : {type : Number, default : 0},
        hold : {type : Number, default : 0},
        completed : {type : Number, default : 0},
    },
    current_study_config : {
        study_mode : {type : String, default : 'read'},
        card_order : {type : String, default : 'sort_by_index'},
        re_card_collect_criteria : {type : String, default : 'all'},
        on_off : {
            yet : {type : String, default : 'on'},
            re : {type : String, default : 'on'},
            hold : {type : String, default : 'off'},
            completed : {type : String, default : 'off'},
        },
        num_cards : {
            yet : {type : Number, default : 50},
            re : {type : Number, default : 50},
            hold : {type : Number, default : 0},
            completed : {type : Number, default : 0},
        }              
    },
    cardlist_total : Array,
    cardlist_working : Array,
    cardlist_sepa : {
        yet : Array,
        re : Array,
        hold : Array,
        complited : Array
    }
});

module.exports = mongoose.model("Session", session_schema)
