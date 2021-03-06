const mongoose = require("mongoose");

// 모델 경로
const User = require('../models/user');
const Category = require('../models/category');
const Book = require('../models/book'); 
const Card = require('../models/card');
const Card_external = require('../models/card_external');
const Index = require('../models/index');
const Cardtype = require('../models/cardtype');
const Candibook = require('../models/candibook');
const Sellbook = require('../models/sellbook');
const Contents_tong = require('../models/contents_tong');
const category = require("../models/category");



// 책 판매를 요청합니다..
exports.req_book_sell = async (req, res) => {
    console.log("책 판매를 요청합니다.");
    console.log(req.body);

    let book_info = await Book.findOne({_id : req.body.book_id.book_id})

    let candibook = await Candibook.create({
        book_id : book_info._id,
        user_id : book_info.user_id,
        title : book_info.title,
        num_cards_by_status : book_info.num_cards,
        thumbnail : null,        
        intro_book : req.body.book_id.book_info,
        intro_author : req.body.book_id.profile,
        indexes : req.body.book_id.index,
        price_hope : req.body.book_id.price,
    });     

    res.json({isloggedIn : true, });

};

// 판매 요청 받은 책 리스트를 보여줍니다.
exports.show_candibooklist = async (req, res) => {
    console.log("판매 요청 받은 책 리스트를 보여줍니다..");
    console.log(req.body);

    let candibooklist = await Candibook.find({})
    console.log(candibooklist)

    res.json({isloggedIn : true, candibooklist});
}


// 책 판매를 허가합니다.
exports.permit_book_sell = async (req, res) => {
    console.log("책 판매를 허가합니다.");
    console.log(req.body);

    let candibook = await Candibook.findOne({_id : req.body.candi_id})
    
    // sellbook을 만들어주자
    let sellbook = new Sellbook

    // 기본 정보를 생성해주자    
    sellbook.book_info.original_book_id = candibook.book_id
    sellbook.book_info.title = candibook.title
    sellbook.book_info.author = req.session.passport.user
    sellbook.book_info.thumbnail = candibook.thumbnail
    sellbook.book_info.intro_book = candibook.intro_book
    sellbook.book_info.intro_author = candibook.intro_author
    sellbook.book_info.indexes = candibook.indexes
    sellbook.book_info.price = candibook.price_hope
    
    
    // 인덱스 뭉태기를 만들어주자
    let indexes = await Index.find({book_id : candibook.book_id})
        .sort({seq : 1})
    for (i=0; i<indexes.length; i++){
        single_set = {}
        single_set.original_index_id = 'a'+indexes[i]._id
        single_set.name = indexes[i].name
        single_set.seq = i
        single_set.level = indexes[i].level
        // single_set.num_cards = indexes[i].num_cards
        sellbook.index_set.push(single_set)
    }

    // 카드타입 뭉태기를 만들어주자
    let cardtypes = await Cardtype.find({book_id : candibook.book_id})            
    for (i=0; i<cardtypes.length; i++){
        single_set = {}
        single_set.original_cardtype_id = 'a'+cardtypes[i]._id
        single_set.type = cardtypes[i].type
        single_set.name = cardtypes[i].name
        single_set.num_of_row= cardtypes[i].num_of_row
        single_set.nick_of_row = cardtypes[i].level
        single_set.card_direction = cardtypes[i].card_direction
        single_set.left_right_ration = cardtypes[i].left_right_ration
        single_set.background_color = cardtypes[i].background_color                
        sellbook.cardtype_set.push(single_set)
    }

    // 컨텐츠를 컨텐츠통에 넣은 후, 카드정보 뭉태기를 만들어주자
    let cards = await Card.find({book_id : candibook.book_id})    
        .sort({seq_in_index : 1})
        .populate({path : 'index_id', select : 'seq'})    
    cards.sort((a,b) => a.index_id.seq - b.index_id.seq)

    // 컨텐츠는 컨텐츠통에 넣어주자    
    let contents_set = []
    for (i=0; i<cards.length; i++ ){
        single_set = {}
        single_set.original_card_id = 'a'+cards[i]._id
        single_set.contents = cards[i].contents
        contents_set.push(single_set)
    }
    let contents_tong = await Contents_tong.insertMany(contents_set)

    // 기존 거를 변환할 수 있도록 table을 하나 만들고
    let card_id_mapper = {}
    for(i=0; i<contents_tong.length; i++){        
        card_id_mapper[contents_tong[i].original_card_id] = contents_tong[i]._id
    }

    // 카드인포 뭉태기를 만들어 주고
    for (i=0; i<cards.length; i++ ){
        single_set = {}
        single_set.original_card_id = 'a'+cards[i]._id
        single_set.original_cardtype_id = 'a'+cards[i].cardtype_id
        single_set.original_index_id = 'a'+cards[i].index_id._id
        single_set.type = cards[i].type
        single_set.position_of_content = 'external'
        single_set.external_card_id = contents_tong[i]._id
        // child_card_ids를 관리해야하는지는 모르겠다.
        // single_set.child_card_ids = card_id_mapper['a'+cards[i].child_card_ids]
        if (cards[i].parent_card_ids != null) {
            single_set.parent_card_id = card_id_mapper['a'+cards[i].parent_card_ids]
        } else {
            single_set.parent_card_id = null
        }
        sellbook.cardinfo_set.push(single_set)
    }
    
    sellbook = sellbook.save()

    res.json({isloggedIn : true, contents_tong, });

};

// 북스토어의 책 리스트를 보여줍니다.
exports.get_sellbooklist = async (req, res) => {
    console.log('북스토어의 책 리스트를 보여줍니다.')

    let sellbooklist = await Sellbook.find({})
        .select('book_info')

    res.json({isloggedIn : true, sellbooklist, });
}



// 구매한 책을 내 책 리스트에 추가합니다.
exports.add_sellbook_to_mybook = async (req, res) => {
    console.log("구매한 책을 내 책 리스트에 추가합니다..");
    console.log(req.body);

    let sellbook = await Sellbook.findOne({_id : req.body.sellbook_id})    
    let unde_category = await Category.findOne({user_id : req.session.passport.user, name : '(미지정)'})        
    let max_seq_category = await Book.find({user_id : req.session.passport.user, category_id : unde_category._id})
        .select('seq_in_category')
        .sort({seq : -1})
        .limit(1)
    console.log(max_seq_category[0])

    // 일단 book을 생성하자
    let mybook = new Book
    mybook.category_id = unde_category._id
    mybook.title = sellbook.book_info.title
    mybook.type = 'buy'
    mybook.user_id = req.session.passport.user
    mybook.author = sellbook.book_info.author
    mybook.seq_in_category = (max_seq_category[0].seq_in_category)*1 + 1
    mybook.sellbook_id = sellbook._id
    mybook = await mybook.save()


    // 카드타입을 저장하고 카드타입 매퍼 만들고
    for (i=0; i<sellbook.cardtype_set.length; i++){
        sellbook.cardtype_set[i].book_id = mybook._id
        sellbook.cardtype_set[i].seq = i
    }
    let cardtypes = await Cardtype.insertMany(sellbook.cardtype_set)    
    let cardtype_mapper = {}
    for(i=0; i<cardtypes.length; i++){                
        cardtype_mapper[sellbook.cardtype_set[i].original_cardtype_id] = cardtypes[i]._id
    }

    // 인덱스를 저장하고 인덱스 매퍼 만들고
    for (i=0; i<sellbook.index_set.length; i++){
        sellbook.index_set[i].book_id = mybook._id
        sellbook.index_set[i].seq = i
    }
    let indexes = await Index.insertMany(sellbook.index_set)    
    let index_mapper = {}
    for(i=0; i<indexes.length; i++){                
        index_mapper[sellbook.index_set[i].original_index_id] = indexes[i]._id
    }
    
    // 카드 인포를 가공하고    
    for (i=0; i<sellbook.cardinfo_set.length; i++){
        sellbook.cardinfo_set[i].book_id = mybook._id
        sellbook.cardinfo_set[i].cardtype_id = cardtype_mapper[sellbook.cardinfo_set[i].original_cardtype_id]        
        sellbook.cardinfo_set[i].index_id = index_mapper[sellbook.cardinfo_set[i].original_index_id]        
    }
    
    let cards = await Card.insertMany(sellbook.cardinfo_set)    
    

    res.json({isloggedIn : true, cardtype_mapper, index_mapper, cardinfo : sellbook.cardinfo_set, cards });
    
}








