const express = require('express');
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { fmt, link } = require("telegraf/format")
const dotenv = require('dotenv');
const google = require('googlethis');
const mongoose = require('mongoose');
dotenv.config();

const gis = require('async-g-i-s');



const app = express();
const port = process.env.PORT;
app.get("/", (req, res) => {
  res.send("<h1>Hi there, this is telegram imagebot</h1>");
})

app.listen(port, () => {
  console.log("Server running on port " + port);
})


//MongoDB
const userID = process.env.USER_ID;
const pass = process.env.PASS;
const dbNAME = "botsDB";
const bot = new Telegraf(process.env.BOT_TOKEN);
const uri = "mongodb+srv://" + userID + ":" + pass + "@cluster1.pyohgr8.mongodb.net/" + dbNAME;

mongoose.connect(uri, { useNewUrlParser: true })

const newItemSchema = {
  firstName: String,
  userName: String,
  searchedString: String,
  searchTime: String,
  searchDate: String,
  searchWeekDay: String
};

const newUserSchema = {
  chatID: Number,
  firstName: String,
  userName: String,
  totalSearches: Number
}


// const dataCollection_1 = "searchdata";
const dataCollection_2 = "searchdata2.0";
const userlist_1 = "userlist";

const Item = mongoose.model(dataCollection_2, newItemSchema);
const User = mongoose.model(userlist_1, newUserSchema);


const options = {
  safe: false
}

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Defined Functions 
function randNum(N) {
  let x = Math.floor(Math.random() * N);
  return x;
}


bot.start(async (ctx) => {
  ctx.reply('Hi There. \nType anything of which you want to see photos')
    .then(() => console.log("Message sent"))
    .catch(err => {
      console.log(err);
    })

  // if(ctx.chat.id === 1467207466){
  //   let userdata;
  //   await User.find().then(userData=>{
  //     userdata = userData;
  //   })
  //   const mes = `Hello.
  //   Thank you so much for using our bot. 😉
  //   I'm glad to inform you that our bot is being updated as there are errors occuring frequently.To make it more precise, we are working on it.
  //   Keep searching!! 😊
  //   `
  //   userdata.map(async user=>{
  //     console.log(user.chatID);
  //       bot.telegram.sendMessage(user.chatID, mes).then(()=>{
  //         console.log("Message sent")
  //       })
  //       .catch(err=>{
  //         console.log(err)
  //       })

  //   })
  // }

});

bot.help((ctx) => ctx.reply('Type anything of which you want to see photos'));
bot.on(message('sticker'), (ctx) => ctx.reply('Please send a text'))
bot.on(message('emoji'), (ctx) => ctx.reply('👍'))
bot.on(message('photo'), (ctx) => ctx.reply('Please send a text'))
bot.on('message', async (ctx) => {
  const searched_images = await gis(ctx.message.text);

  if (searched_images.length !== 0) {

    // Date and Time 
    // TimeStamp creation 
    var messageTime = ctx.message.date;
    var date = new Date(messageTime * 1000);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);


    const dateObject = new Date(messageTime * 1000);
    const day = dateObject.getDate();
    const year = dateObject.getFullYear();
    const month = dateObject.getMonth();
    const weekDay = dateObject.getDay();
    const dateWhenSearched = "" + day + "/" + month + "/" + year;


    // User Informations 
    const chatID = ctx.chat.id;
    const firstName = ctx.chat.first_name;
    const userName = ctx.chat.username;
    const searchedString = ctx.message.text;


    // Database 
    const item = new Item({
      firstName: firstName,
      userName: userName,
      searchedString: searchedString,
      searchTime: formattedTime,
      searchDate: dateWhenSearched,
      searchWeekDay: days[weekDay]
    });
    item.save();


    const doc = await User.findOne({ chatID: chatID });
    if (doc) {
      const newNumber = doc.totalSearches + 1;
      const update = { totalSearches: newNumber }
      await doc.updateOne(update);
    }
    else {
      const user = new User({
        chatID: chatID,
        firstName: firstName,
        userName: userName,
        totalSearches: 1
      });
      user.save();
    }


    const searched_images_length = searched_images.length
    let x = randNum(searched_images_length);
    let images;
    if (x < searched_images_length - 5 && x > 0) {
      images = searched_images.slice(x, x + 5).map(img => {
        return {
          preview: img.url,
          url: img.url,
        }
      });
    }
    else if (x > 5) {
      images = searched_images.slice(x - 5, x).map(img => {
        
        return {
          preview: img.url,
          url: img.url,
        }
      });
    }
    try {
      images.forEach(_img => ctx.sendPhoto(_img.url, {
        caption: fmt`${link("Link", _img.url)} `
      })
        .then(() => {
          console.log("URL!")
        })
        .catch((err) => {
          console.log(err.description, 'Not found');
        })
      );
    }
    catch (err) {
      console.log(err);
      bot.telegram.sendMessage(chatID, "No result").then(() => {
        console.log("Error message sent")
      })
    }
  }
  else {
    console.log("No search");
  }
});


bot.launch()
  .then(() => {
    console.log("Bot Running");
  })
  .catch((err) => {
    console.log(`Error Running Bot: ${err}`);
  });


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
