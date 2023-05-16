const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
})


//globals
var botEnabled = true;



function handleInput(message){
  content = message.content
  
  if(content.includes("!hello")) {
    message.reply({content: "world!"})
  }
  if(content.includes("!exit")) {
    console.log("disabling");
	botEnabled = false;
  }
  else{
    message.reply({content: "usage: \n\nCOMMANDS\n!exit - quit MUD\n!enableBot - enable MUD\n"});
  }
  //help fallthru
}

// Register an event so that when the bot is ready, it will log a messsage to the terminal
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

})

// Register an event to handle incoming messages
client.on('messageCreate', (message) => {
  if (botEnabled == true && message.author.bot == false){
    handleInput(message);
  }
  else if (message.content == "!enableBot" && message.author.bot == false){
    botEnabled = true;
  }
  // Check if the message starts with '!hello' and respond with 'world!' if it does.
  //if(message.content.startsWith("!hello")) {
  //  message.reply({content: "world!"})
  //}
})

// client.login logs the bot in and sets it up for use. You'll enter your token here.
client.login(process.env.DiscordToken);
