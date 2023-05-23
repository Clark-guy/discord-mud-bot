//const { Player } = require('./models/Player.js');
const { Client, GatewayIntentBits } = require('discord.js')
const mongoose = require('mongoose');
const { Schema } = mongoose;
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
//TODO maybe i can merge awaiting response and conversation context into one variable?
var awaitingResponse = false; //bool to determine whether the bot is waiting for a response
var responseOptions = []; //list of options j
var playerResponse = 0; // value to hold a player response in case of multiple choice
var conversationContext = "";
var registerSet = []; //This kind of seems like a terrible way to do this but let's get the ball rolling


function handleResponse(message, options){
	if(conversationContext == "newPlayerName"){
		//need to sanitize to prevent duplications of name from a single user
		registerSet.push(message.content);
		message.channel.send("What class would you like to be?\n1.Cleric\n2.Bard\n3.Peasant\n4.Jester");
		conversationContext = "newPlayerClass";
	}
	else if(conversationContext == "newPlayerClass"){
		console.log(message.author.id);
		var mc = message.content;
		if(mc=="1." || mc=="2." || mc=="3." || mc=="4."){
			registerSet.push(message.content);
			new Player({
				user: message.author.id,
				name: registerSet[0],
				inventory: ["spoon", "rock"],
				class: "Cleric",
				won: 100
			}).save();
			message.channel.send("Your character has been created.");
			registerSet = [];
			conversationContext = ""
			awaitingResponse = false;


		}
		else{
			message.channel.send("please try again- answer multiple choice questions with the number of your choice, followed by a period. E.G. '2.'");
		}
	}
	else if(conversationContext == "addPlayer"){
		if(message.content.includes("yes")){
			message.channel.send("added to party");
		}
		else{
			message.channel.send("not added");
		}
		conversationContext = "";
	}

	if(message.content.includes("yes")){
		playerResponse
	}
	else if(message.content.includes("no")){
		
	}
}


function handleInput(message){
  content = message.content
  
  if(conversationContext==""){
	  if(content.includes("!exit")) {
		console.log("disabling");
		botEnabled = false;
	  }
	  else if(content.includes("!newGame")) {
		conversationContext="newGame"
		message.channel.send("creating a new game. are all party members set?");
	  }
	  else if(content.includes("!newPlayer")) {
	  	conversationContext = "newPlayerName"
		message.channel.send("Let us make a new player. What will be your player's name?");
	  }
	  else if(content.includes("!addPlayer")) {
	  	conversationContext = "addPlayer"
		message.channel.send("add player to this server's party?");
	  }
	  else if(content.startsWith("!help")){
		message.reply({content: "usage: \n\nCOMMANDS\n!exit - quit MUD\n!enableBot - enable MUD\n" + 
				"!newPlayer - create a new player\n" +
				"!addPlayer - add a new player to party\n" +
				"!removePlayer - remove a player from party\n" +
				"!newGame - lock in players and begin\n" +
				"!map - show map\n" +
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
	var query = Party.findOne({'guild': message.guildId});
	query.select("*");
	query.exec(function(err, party){
		console.log('%s', party.id);
	})
	if(!Party.findOne({'guild': message.guildId})){
		message.channel.send("Server does not have a party initialized. initialize now?");
		conversationContext = "createParty";
	}
  }
})

// client.login logs the bot in and sets it up for use. You'll enter your token here.
client.login(process.env.DiscordToken);

mongoose.connect(process.env.MongoDBToken);


const Player = mongoose.model("Player", {
  name: String,
  class: String,
  inventory: [String],
  won: Number
});


// Node class
//
// message: the message given by the bot
// children: JSON key value pairs for answers and their resulting nodes
//		e.g. children = {
//						yes: Node("very well. we continue..."),
//						no:  Node("come back when you are ready.");
//							}



class Node {
	constructor(message, children={}) {
		this.message = message;
		this.children= children;
	}
	addChildren(children){
		this.children = children;
	}
}

//This will probably be deleted...
function intro(){
	var base = new Node("Is the party ready to continue? Yes or No");
	base.addChildren({"yes": new Node("Then we continue. Your party is chill, right?",{
								"yes": new Node("Your party is all hanging out by a cool river. Will you go swimming?",{
									"yes": new Node(""),
									"no":  new Node("")}),
								"no" : new Node("",{
									"yes": new Node(""),
									"no":  new Node("")})
							}),
						"no": new Node("Approach again when you are ready.")});

}




//store maps in database
//
//how will they look though??
//series of nodes, and directions from one to another
//

const partySchema = Schema({
	guild: String,
	members: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
});

const npcSchema = Schema({
	_id: Schema.Types.ObjectId,
	name: String,
	job: String,
	level: Number,
	maxHP: Number,
	currentHP: Number
});


//what data should be saved?
const gameSchema = Schema({
	partyLeader: String,
	partyLocation: { type: Schema.Types.ObjectId, ref: 'MapNode' }
});
	

const buildingSchema = Schema({
	name: String,
	type: String,
	patrons: { type: Schema.Types.ObjectId, ref: 'NPC' }
});

const mapNodeSchema = Schema({
  name: String,
  buildings: [String],
  north: { type: Schema.Types.ObjectId, ref: 'MapNode' },
  south: { type: Schema.Types.ObjectId, ref: 'MapNode' },
  east:  { type: Schema.Types.ObjectId, ref: 'MapNode' },
  west:  { type: Schema.Types.ObjectId, ref: 'MapNode' }
});

const mapSchema = Schema({
	locations: [{ type: Schema.Types.ObjectId, ref: 'MapNode' }]
});

const Party = mongoose.model("Party", partySchema);
const Game = mongoose.model("Game", gameSchema);
const NPC = mongoose.model('NPC', npcSchema);
const Building = mongoose.model('Building', buildingSchema);
const MapNode = mongoose.model('MapNode', mapNodeSchema);
const Map = mongoose.model("Map", mapSchema);

const guy = new Player({
  name: "Mario Guy",
  inventory: ["spoon", "rock"],
  class: "Cleric",
  won: 100
});

//guy.save().then(() => console.log(Player.findOne({})));




