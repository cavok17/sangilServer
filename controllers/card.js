const mongoose = require("mongoose");
const multer = require('multer');
const upload = multer({dest : 'uploads/'});

// 모델 경로
const User = require('../models/user');
const Book = require('../models/book'); 
const Card = require('../models/card');
const Content = require('../models/content');
const Index = require('../models/index');
const Category = require('../models/category');
const Cardtype = require('../models/cardtype');
const book = require('../models/book');

// 카드를 가져옵니다.
exports.get_cardlist = async (req, res) => {
    console.log("카드리스트를 보내줄게요");
    console.log(req.body);

    let cardlist = get_cardlist_func(req.body.index_id)

    res.json({isloggedIn : true, cardlist});

};

// 카드를 만들어봅니다.
exports.create_card = async (req, res) => {
    console.log("카드를 만들어봅시다");
    console.log(req.body);

    let card = await Card.create({
        cardtype_id: req.body.cardtype_id,
        book_id: req.body.book_id,
        index_id: req.body.index_id,        
        // content_id : content._id,
        seq_in_index: get_max_seq(req.body.index_id),        
    })

    let content = await Content.create({
        card_id : card._id,
        importance : req.body.importance,
        first_face : req.body.first_face,
        second_face : req.body.second_face,
        third_face : req.body.third_face,
        annotation : req.body.annotation,
    })

    let content_id_update = await Card.updateOne(
        {_id : card._id},
        {content_id : content._id}
    )
    
    let cardlist = get_cardlist_func(req.body.index_id)

    res.json({isloggedIn : true, cardlist});

};

// 카드 순서를 변경합니다.
exports.create_card = async (req, res) => {
    console.log("카드 순서를 변경합니다.");
    console.log(req.body);

    let current_seq_card = await Card.findOne({_id : req.body.card_id});
    let current_seq = current_seq_card[0].seq_in_index;
    let target_seq = req.body.target_seq;

    if (current_seq > target_seq){
        let seq_change_result = await Card.updateMany(
            {index_id : req.body.index_id, 
            seq_in_index : {$gt : target_seq},
            seq_in_index : {$lt : current_seq}},
            {$inc : {seq_in_index : 1}})
        current_seq_card.seq_in_index = target_seq +1;
        current_seq_card = await current_seq_card.save();
    } else {
        let seq_change_result = await Card.updateMany(
            {index_id : req.body.index_id, 
            seq_in_index : {$gt : current_seq},
            seq_in_index : {$lte : target_seq}},
            {$inc : {seq_in_index : 1}})
        current_seq_card.seq_in_index = target_seq +1;
        current_seq_card = await current_seq_card.save();
    } 

    let cardlist = get_cardlist_func(req.body.index_id)

    res.json({isloggedIn : true, cardlist});
};

// 카드 내용을 변경합니다.
exports.create_card = async (req, res) => {
    console.log("카드 내용을 변경합니다.");
    console.log(req.body);

    let card_edit_result = await Card.updateOne(
        {_id : req.body.card_id},
        {
           cardtype_id : req.body.cardtype_id,
           importance :  req.body.importance,
        });
    let content_edit_result = await Content.updateOne(
        {card_id : req.body.card_id},
        {
           first_face : req.body.first_face,
           second_face : req.body.second_face,
           third_face : req.body.third_face,
           annotation : req.body.annotation,           
        }
    );    

    let cardlist = get_cardlist_func(req.body.index_id)

    res.json({isloggedIn : true, cardlist});
};


// max 시퀀스를 찾아드립니다.
const get_max_seq = async (index_id) => {   
    let max_seq_card = await Card
        .find({index_id : index_id})
        .select('seq_in_index')
        .sort({seq_in_index : -1})
        .limit(1)
    if (max_seq_card.length ===0){
        return -1
    } else {
        return max_seq_card.seq_in_index
    }    
}

// 카드리스트를 보내드려요~
const get_cardlist_func = async (index_id) => {
    let cardlist = await Card
        .find({index_id : index_id})
        .sort({seq_in_index : -1})
        .pupulate('content_id')
    
    return cardlist
}