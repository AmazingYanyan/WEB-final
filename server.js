const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');


// const mongoDB = ("mongodb+srv://"+
//                  process.env.USERNAME+
//                  ":"
//                  +process.env.PASSWORD+
//                  "@"
//                  +process.env.HOST+
//                  "/"
//                  +process.env.DATABASE);


const mongoDB = "mongodb+srv://YanyanLi:yTxZJL3ccbwE6d7E@maincluster.s3jgjdm.mongodb.net/"

mongoose.connect(mongoDB, {useNewUrlParser: true, retryWrites: true, serverSelectionTimeoutMS: 3000}).then(() => {
  console.log('Connection to MongoDB successful');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

const app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: true
}));

// view engine
app.set("view engine", "ejs")
app.set("views", __dirname + "/views");

// routes
const apiRouterOrder = require("./routes/apiRouterOrder");
const apiRouterHomepage = require("./routes/apiRouterHomepage");
const apiRouterAddAddress = require("./routes/apiRouterAddAddress");
// const apiRouterOrderManagement = require("./routes/apiRouterOrderManagement");
const apiRouterCart = require("./routes/apiRouterCart");
const apiRouterCheckOut = require("./routes/apiRouterCheckOut");
// const apiRouterManagement = require("./routes/apiRouterManagement");
const apiRouterSmallShopItem = require("./routes/apiRouterSmallShopItem");
const apiRouterLoginManager = require("./routes/apiRouterLoginManager");
const apiRouterShop = require("./routes/apiRouterShop");
const apiRouterLoginRegister = require("./routes/apiRouterLoginRegister");



app.use("/order", apiRouterOrder);
app.use("/homepage", apiRouterHomepage);
app.use("/add_address", apiRouterAddAddress);
// app.use("/order_management", apiRouterOrderManagement);
app.use("/cart", apiRouterCart);
app.use("/check-out", apiRouterCheckOut);
// app.use("/management", apiRouterManagement);
app.use(("/small-shop-item"), apiRouterSmallShopItem);
app.use(("/login-manager"), apiRouterLoginManager);
app.use(("/shop"), apiRouterShop);
app.use(("/login-register"), apiRouterLoginRegister);




// listen for requests :)
app.listen(3000, () => {
  console.log('Server is running on port 11178');
});

// const listener = app.listen(process.env.PORT, function() {
//     console.log('Your app is listening on port ' + listener.address().port);
//   });