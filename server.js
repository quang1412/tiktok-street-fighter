const request = require('request'); 
const path = require('path');
const express = require('express');
const app = express(); 
const server = app.listen(process.env.PORT || 3000); 
 
app.use("/assets", express.static(__dirname + '/assets'));
app.use('/static', express.static(path.join(__dirname, 'public')))