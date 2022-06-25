const request = require('request'); 
const path = require('path');
const express = require('express');
const app = express(); 
const server = app.listen(process.env.PORT || 3000); 
 
app.use("/", express.static(__dirname + '/public')); 

app.get('/', function(req, res){
  res.sendFile('public/index.html' , { root : __dirname});
})