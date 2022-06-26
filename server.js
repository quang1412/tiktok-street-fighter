const { WebcastPushConnection } = require('tiktok-live-connector'); 
const path = require('path');
const express = require('express');
// const app = express(); 
// const server = app.listen( 8000);  
const { WebSocketServer } = require('ws');

const { createServer } = require('https');
const { readFileSync } = require('fs');
// const { WebSocketServer } = require('ws');

const server = createServer({
  cert: readFileSync('cert.pem'),
  key: readFileSync('key.pem')
});      

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log('received: %s', data);
  }); 
  ws.send('something');
});

server.listen(8080);

var user = null;  
const tiktokUid = 'falcao8000';
var tikTokRoom = null; 


// app.use("/", express.static(__dirname + '/public')); 

// app.get('/', function(req, res){
//   res.sendFile('public/index.html' , { root : __dirname});
// })

// wss.on('connection', function connection(ws) {
// 	user = ws;
// 	console.log('client connected');

// 	if(!tikTokRoom){
// 		tikTokRoom = new TikTokRoom(tiktokUid);
// 	}
// 	else{
// 		console.log('tiktok live connected');
// 	}
 
// 	ws.on('close', function close() {
// 	  console.log('client disconnected');
// 	  tikTokRoom.tiktok.disconnect();
//     clearInterval(tikTokRoom.waitToConnect);
// 	  tikTokRoom = null;
// 	});

//   ws.on('message', function message(data) {
//     console.log('received: %s', data);
//   });

//   ws.send('something');
// });


console.log('server running');

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

class TikTokRoom{
  constructor(roomId){
    this.roomId = roomId
    this.info = null
    this.socket_clients = []
    this.waitToConnect = true
    this.reconnect = null
    this.tiktok = new WebcastPushConnection(this.roomId, {
      'requestPollingIntervalMs': 1000,
      'enableExtendedGiftInfo':true,
      'processInitialData':false
    })
    this.tryToConnect()
    this.listen()
  }

  tryToConnect(i = 1){
    console.log(`retry to connect ${i}/10`);
    console.log(`[tiktok] ${this.roomId} connecting...`)
    this.tiktok.connect()
    .then(state => {
      !tikTokRoom ? this.tiktok.disconnect() : (console.log(`[tiktok] ${this.roomId} tiktok connected!`), this.info = state)
    })
    .catch(error => {
      console.log(`[tiktok] ${this.roomId} tiktok connect fail!: ${error}`)
      console.log(`[tiktok] wait a minute to reconnect`)
      
      user.send(JSON.stringify({
          id: makeid(10),
          eventName: 'numberOfRetries', 
          eventData: i
        }))

      this.waitToConnect = setTimeout(() => {
      	this.tryToConnect(i+1)
      }, 60000)
    })
  }
  
  listen(){
    this.tiktok.on('connected', state => {
      user.send(JSON.stringify({
        id: makeid(10),
        eventName:'connected', 
        eventData: state
      }))
      this.info = state
    })
    
    this.tiktok.on('disconnected', () => {
      // this.tryToConnect()
      console.error('[tiktok] disconnected', this.roomId)
      user.send(JSON.stringify({
        id: makeid(10),
        eventName:'disconnected'
      }))
    })
    
    this.tiktok.on('streamEnd', () => {  
      user.send(JSON.stringify({
          id: makeid(10),
          eventName:'streamEnd'}))
      console.error(`[tiktok] ${this.roomId} stream is ended`)
    })
    
    this.tiktok.on('gift', data => {
      if(data.gift && data.gift.gift_type == 1 && data.gift.repeat_end == true){
    		console.log(data.uniqueId, 'send gift')
        user.send(JSON.stringify({
          id: makeid(10),
          eventName:'gift',
          uniqueId: data.uniqueId,
          profilePictureUrl: data.profilePictureUrl,
          giftName: data.giftName,
          repeatCount: data.repeatCount,
          followRole: data.followRole
        }))
      }
      else if (data.gift && data.gift.gift_type != 1){
    		console.log(data.uniqueId, 'send gift')
        user.send(JSON.stringify({
          id: makeid(10),
          eventName:'gift',
          uniqueId: data.uniqueId,
          profilePictureUrl: data.profilePictureUrl,
          giftName: data.giftName,
          repeatCount: data.repeatCount,
          followRole: data.followRole
        }))
      }
    })
    
    this.tiktok.on('like', data => {
      // console.log(data)
  		console.log(data.uniqueId, 'send', data.likeCount, 'like')
      user.send(JSON.stringify({
        id: makeid(10),
        eventName:'like', 
        likeCount: data.likeCount,
        uniqueId: data.uniqueId, 
        profilePictureUrl: data.profilePictureUrl, 
        followRole: data.followRole
      }))
    })
    
    this.tiktok.on('social', data => {
      if(data.label.includes("followed")){
        console.log(data.uniqueId, 'followed host')
      	user.send(JSON.stringify({
          id: makeid(10),
          eventName:'followed', 
          eventData: data
        }))
      }
      else if(data.label.includes("shared")){
        console.log(data.uniqueId, 'shared livestream')
        user.send(JSON.stringify({
          id: makeid(10),
          eventName:'shared', 
          eventData: data
        }))
      }
    })

    this.tiktok.on('chat', data => {
      console.log(data.uniqueId, data.comment)
      user.send(JSON.stringify({
        id: makeid(10),
        eventName:'chat', 
        uniqueId: data.uniqueId, 
        profilePictureUrl: data.profilePictureUrl, 
        content: data.comment
      }))
    })

    this.tiktok.on('roomUser', data => {
      // console.log('viewerCount:', data.viewerCount)
      // user.send(JSON.stringify({
      //   id: makeid(10),
      //   eventName:'roomUser', 
      //   eventData: data
      // }))
    })
    
    this.tiktok.on('member', data => {
      // user.send(JSON.stringify({
      //   id: makeid(10),
      //   eventName:'member', 
      //   eventData: data
      // }))
    })
  } 
}