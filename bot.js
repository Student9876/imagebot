const express = require('express');
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const dotenv = require('dotenv');
const google = require('googlethis');
const mongoose = require('mongoose');
dotenv.config();





const app = express();
const port = process.env.PORT;
app.get("/", (req,res)=>{
  res.send("Hi there, this is telegram imagebot");
})

app.listen(port, ()=>{
    console.log("Server running on port "+ port);
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
  searchedString: String

};

const Item = mongoose.model("searchdata", newItemSchema);

const options = {
  safe: false
}

function randNum() {
  var x = parseInt(Math.random() * 10);
  return x;
}

bot.start((ctx) => ctx.reply('Hi Bhai'));
bot.help((ctx) => ctx.reply('Type anything of which you want ot see photos'));
bot.on(message('sticker'), (ctx) => ctx.reply('👍'));
bot.on(message('emoji'), (ctx) => ctx.reply('👍'));

bot.on('message', async (ctx) => {
  const searched_images = await google.image(ctx.message.text, options);

  const item = new Item({
    firstName: ctx.chat.first_name,
    userName: ctx.chat.username,
    searchedString: ctx.message.text
  });
  item.save();



  let x=randNum();
  let images = searched_images.map(img => img.preview.url);
  images.slice(x, x+2).forEach(_img => ctx.sendPhoto(_img));
  delete(images);

});


bot.hears('hi', (ctx) => ctx.reply('Hey there'));
// bot.launch();

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