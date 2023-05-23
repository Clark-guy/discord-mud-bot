//const { Player } = require('./models/Player.js');
const { Client, GatewayIntentBits } = require('discord.js')
const mongoose = require('mongoose');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ]
})


//globals
var botEnabled = false;
var currentTurn; //variable to hold whose turn it is to speak to the bot
var awaitingResponse = false; //bool to determine whether the bot is waiting for a response
var responseOptions = []; //list of options j
var playerResponse = 0; // value to hold a player response in case of multiple choice

function handleResponse(message, options){
	if(message.content.includes("yes"){
		playerResponse
	}
	else if(message.content.includes("no"){
		
	}
}


function handleInput(message){
  content = message.content
  
  if(!awaitingResponse){
	  if(content.includes("!exit")) {
		console.log("disabling");
		botEnabled = false;
	  }
	  else if(content.includes("!newGame")) {
		message.channel.send("creating a new game. are all party members set?");
		awaitingResponse = true;
		responseOptions = ["yes", "no"];
	  }
	  else if(content.startsWith("!help")){
		message.reply({content: "usage: \n\nCOMMANDS\n!exit - quit MUD\n!enableBot - enable MUD\n" + 
				"!addPlayer - add a new player to party" +
				"!removePlayer - remove a player from party" +
				"!newGame - lock in players and begin" +
				"!map - show map" +
				""});
	  }
  }
	else{
		//how to handle response?
		handleResponse(message);
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
    message.channel.send("Bot enabled");
  }
})

// client.login logs the bot in and sets it up for use. You'll enter your token here.
client.login(process.env.DiscordToken);

mongoose.connect(process.env.MongoDBToken);


const Player = mongoose.model("Player", {
  name: String,
  inventory: [String],
  won: Number
});


class Node {
	constructor(message) {
		this.message = message;
		//this.children= [];
	}
	constructor(message, children) {
		this.message = message;
		this.children= children;
	}
	addChildren(children){
		this.children = children;
	}
}

function intro(){
	var base = new Node("Is the party ready to continue? Yes or No");
	base.addChildren([new Node("Then we continue..."),new Node("Approach again when you are ready.")]);
}




//store maps in database
//
//how will they look though??
//
//
const Map = mongoose.model("Map", {
  
  
});

const guy = new Player({
  name: "Mario Guy",
  inventory: ["spoon", "rock"],
  won: 100
});

//guy.save().then(() => console.log(Player.findOne({})));
