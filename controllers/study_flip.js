const mongoose = require("mongoose");
const fs = require("fs").promises;
const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');

// 모델 경로
const User = require('../models/user');
const Book = require('../models/book'); 
const Card = require('../models/card');
const Card_external = require('../models/card_external');
const Content = require('../models/content');
const Index = require('../models/index');
const Category = require('../models/category');
const Cardtype = require('../models/cardtype');
const Session = require('../models/session');
const Selected_bookNindex = require('../models/selected_bookNindex');
// const Studyingcard_total = require('../models/studyingcard_total');
// const Studyingcard_current = require('../models/studyingcard_current');
const { session } = require("passport");
const Study_configuration = require("../models/study_configuration");
// const { Session } = require("inspector");

// 난이도 평가를 반영합니다.
exports.click_difficulty= async (req, res) => {
    console.log("선택된 책 정보를 DB에 저장합니다.");
    console.log(req.body);


    // req.body.session_id = ''
    // req.body.difficulty = 'lev_1'
    // req.body.book_id = ''
    // req.body.card_id = ''
    // req.body.study_hour = ''


    // 일단 북 아이디로 학습 설정을 찾고, 
    let study_configuration = await Study_configuration.findOne({book_id : req.body.book_id})
    console.log(study_configuration)

    // 카드 아이디로 카드를 찾고
    let card = await Card.findOne({_id : req.body.card_id})
    console.log(card)
    // 미학습인 카드는 학습중으로 수정해주고
    if (card.status === 'yet') {card.status = 're'}
    // 최근 학습 시점은 지금으로 수정해주고
    card.study_result.recent_study_time = Date.now();
    // 최근 난이도도 수정해주고
    card.study_result.recent_difficulty = req.body.difficulty    
    // 경험치를 더해주고
    
    if(req.body.difficulty === 'lev_5') {
        let exp
        switch(card.study_result.current_lev_study_times){
            case 0 : exp = study_configuration.exp_setting.one_time; break;
            case 1 : exp = study_configuration.exp_setting.two_times; break;
            case 2 : exp = study_configuration.exp_setting.three_times; break;
            case 3 : exp = study_configuration.exp_setting.four_times; break;
            default : exp = study_configuration.exp_setting.five_times; break;
        }
        card.study_result.exp += exp
        // 단 경험치가 마이너스면 0으로 잡아준다.
        if (card.study_result.exp < 0){
            card.study_result.exp = 0
        }
    }
    // 레벨도 다시 설정해주고
    card.study_result.level = Math.floor(card.study_result.exp/1000) + 1
    // 복습 필요 시점도 다시 잡아주고
    // 알겠음을 선택했을 때랑, 아닐 때랑 복습 주기를 다르게 적용해줌
    if (req.body.difficulty === 'lev_5'){
        let interval = study_configuration.lev_setting[req.body.difficulty]['interval']
        let time_unit = study_configuration.lev_setting[req.body.difficulty]['time_unit']
        let restudy_term
        if (time_unit === 'min'){
            restudy_term = interval*60*1000
        } else if (time_unit === 'hour') {
            restudy_term = interval*60*60*1000
        } else if (time_unit === 'day') {
            restudy_term = interval*24*60*60*1000
        }
        card.need_study_time = Date.now() + restudy_term    
    } else {
        let interval = study_configuration.difficulty_setting[req.body.difficulty]['interval']
        let time_unit = study_configuration.difficulty_setting[req.body.difficulty]['time_unit']
        let restudy_term
        if (time_unit === 'min'){
            restudy_term = interval*60*1000
        } else if (time_unit === 'hour') {
            restudy_term = interval*60*60*1000
        } else if (time_unit === 'day') {
            restudy_term = interval*24*60*60*1000
        }
        card.need_study_time = Date.now() + restudy_term
    }
    
    // 총 학습 횟수도 수정해주고
    card.study_result.total_study_times +=1
    // 현 레벨 학습 횟수는... 선택 난이도가 lev_5(알겠음)이면 현레벨 학습횟수를 0으로 바꿔주고 아니면 1 더하기만 해주고
    if(req.body.difficulty === 'lev_5') {
        card.study_result.current_lev_study_times = 0
    } else {
        card.study_result.current_lev_study_times += 1
    }
    // 총학습시간도 더해주고    
    card.study_result.total_study_hour = card.study_result.total_study_hour.getTime()+req.body.study_hour
    // 최근 학습 시간도 바꿔주고
    card.study_result.recent_study_hour = req.body.study_hour
    // 마지막으로 저장한다.
    card = await card.save()
    
    // ------------------------------------------------------------------------------------
    //                  
    // ------------------------------------------------------------------------------------
    // 세션 아이디로 세션을 찾는다.
    let session = await Session.findOne({_id : req.body.session_id}, {cardlist_working : 1})  
    

    let current_seq = session.cardlist_working.findIndex((sangil) => {
        return sangil._id == req.body.card_id
    })
    // 기존 카드에 했다는 표시만 좀 할까?
    session.cardlist_working[current_seq].status = 'done'


    // 레벨5가 아니면 뒷쪽에 신규로 카드를 만들어줘야 함
    if(req.body.difficulty != 'lev_5') {        
        let new_card = session.cardlist_working[current_seq]        
        // 나중에 아래 한 줄로 바꾸자고
        // let new_card = session.cardlist_working[req.body.current_seq]

        new_card.need_study_time = card.need_study_time

        target_position = session.cardlist_working.findIndex((single_card) => {
            single_card.need_study_time > card.study_result.need_study_time
        })
        if (target_position === -1){
            target_position = session.cardlist_working.length
        }
        console.log('target_position', target_position)
        session.cardlist_working.splice(target_position, 0 , new_card)

        session = await session.save()        
    }

    res.json({isloggedIn : true, session});
}