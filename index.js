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
});


//////////////GLOBAL VARIABLES/////////////
//In order for the bot to work with multiple servers, all global vars should be moved to
//the database as a "game" or "session" table, that holds a record for each server
//
var botEnabled = false;
//var currentTurn; //variable to hold whose turn it is to speak to the bot
//TODO maybe i can merge awaiting response and conversation context into one variable?

//Conversation Context Var
//Used to control the context of the conversation, particularly for progressing conversation with
//bot. necessary for basic functionality.
var conversationContext = ""; 

//Register Set Var
//This kind of seems like a terrible way to do this but let's get the ball rolling.
//Used to store input from player when multiple pieces of information must be used at a time.
//example, character creation. push name, then class, then any other necessary vars so
//that the registers are consolidated when being used. Must be cleared after use
var registerSet = []; 


//////////////UTILITY FUNCTIONS/////////////
//in general - 0 is yes, 1 is no
function yesNo(message){
	return message.startsWith('y') || message.startsWith('0');
}

function multChoice(choice){
	choice = choice.replace(".", "");
	choice = choice.replace(" ", "");
	choice = Number(choice);
	return choice-=1;
}


//////////////EVENT HANDLING//////////////////
function handleResponse(message, options){

	if(conversationContext == "choosePlayer"){
		var pQuery = Player.find({'owner': message.author.id}, 'name');
		pQuery.exec().then(function (players){
			if(!players){
				message.channel.send("No players owned by the current user. Creating new one..");
				message.channel.send("Enter a name for your character");
				conversationContext = "newPlayerName";
			}
			else{
				var outString = "";
				for(var i=0;i<players.length;i++){
					//console.log(players[i].name);
					outString+=i.toString()+". " + players[i].name+"\n";
					registerSet.push(players[i]._id)
				}
				message.channel.send(outString);
			}
		});
	}
	if(conversationContext == "newPlayerName"){
		//need to sanitize to prevent duplications of name from a single user
		registerSet.push(message.content);
		message.channel.send("What class would you like to be?\n1.Cleric\n2.Bard\n3.Peasant\n4.Jester");
		conversationContext = "newPlayerClass";
	}
	else if(conversationContext == "newPlayerClass"){
		//console.log(message.author.id);
		var mc = message.content;
		if(mc=="1." || mc=="2." || mc=="3." || mc=="4."){
			registerSet.push(message.content);
			new Player({
				//user: message.author.id,
				name: registerSet[0],
				inventory: ["spoon", "rock"],
				class: "Cleric",
				won: 100,
				owner: message.author.id
			}).save();
			message.channel.send("Your character has been created. Add player to current party?");
			registerSet = [];
			conversationContext = "addPlayer"


		}
		else{
			message.channel.send("please try again- answer multiple choice questions with the number of your choice, followed by a period. E.G. '2.'");
		}
	}
	else if(conversationContext == "createParty"){
		if(yesNo(message.content)){
			new Party({
				guild: message.guildId,
				members: [],
			}).save();
			message.channel.send("Created new party");
			registerSet = [];
		}
		else{
			message.channel.send("Not creating a new party");
		}
		conversationContext = "";
	}
	else if(conversationContext == "addPlayer"){
		if(yesNo(message.content)){
			var query = Party.findOne({'guild': message.guildId});
			//query.select("*");
			query.exec().then(function (parties){
				if(!parties){
					message.channel.send("Server does not have a party initialized. initialize now?");
					conversationContext = "createParty";
				}
				else{
					//console.log(message.author.id);
					var pQuery = Player.find({'owner': message.author.id}, 'name');
					//pQuery.select("*");
					pQuery.exec().then(function (players){
						if(!players){
							message.channel.send("No players owned by the current user. Creating new one..");
							message.channel.send("Enter a name for your character");
							conversationContext = "newPlayerName";
						}
						else{
							var outString = "";
							for(var i=0;i<players.length;i++){
								//console.log(players[i]._id);
								outString+=i.toString()+". " + players[i].name+"\n";
								registerSet.push(players[i]._id.toString());
							}
							message.channel.send("Choose a player to add to party:");
							message.channel.send(outString);
							conversationContext = "playerChosen";
						}
					});
				}
			});
		}
		else{
			message.channel.send("not added");
		}
		conversationContext = "";
	}
	else if(conversationContext == "playerChosen"){
		var character = multChoice(message.content);
		//ALSO Need to grab the array from the party table and add player
		var playerQuery = Player.findOne({'_id': registerSet[character]}).exec().then(function (playerToAdd){
			var partyQuery = Party.findOne({'guild': message.guildId}, 'members').exec().then(function (parties){
				parties.members.push(playerToAdd);
				parties.save();
				message.channel.send(`Added ${playerToAdd.name} to party.`);
				registerSet = [];
				conversationContext = "";
				//parties.members
				
			});
		});
	}
	else if(conversationContext == "newGame"){
		if(yesNo(message.content)){
			//i may need to hold more information about the party in order to make
			//informed dialogue in the future.
			message.channel.send("beginning your adventure...");
			//denote the time period - setting. explain how your party met, and how they came to arrive where they did
			message.channel.send("After weeks at sea, your party arrives in ___. It's been a long, grueling trip, " +
				"and the entire crew is exhausted. Upon docking you all stumble down the gang plank onto the docks of " +
				"the largest port city in Dilbesia." 


			);
		}
		else{
			message.channel.send("return when you are ready.");
		}
	}
}


function handleInput(message){
  content = message.content
  if(conversationContext==""){
	  if(content.includes("!exit")) {
		console.log("disabling");
		botEnabled = false;
	  }
	  else if(content.includes("!partyStatus")) {
		var query = Party.findOne({'guild': message.guildId}, 'members');
		query.select("*");
		query.exec().then(function (parties){
			if(!parties){
				message.channel.send("Server does not have a party initialized. initialize now?");
				conversationContext = "createParty";
			}
			else{
				message.channel.send("Party Members:");
				var players = Player.find({
								_id: {
									$in: parties.members
									}
								}).then(function(queryPlayers){
									if(!queryPlayers){
										message.channel.send("No players owned by the current user. Creating new one..");
										message.channel.send("Enter a name for your character");
										conversationContext = "newPlayerName";
									}
									else{
										var outString = "";
										for(var i=0;i<parties.members.length;i++){
											outString += queryPlayers[i].name + "\n";
										}
										if(outString){
											message.channel.send(outString);
										}
										else{
											message.channel.send("None!");
										}
										conversationContext = "";
									}
								});

				//});

			}
		})
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
		message.reply({content: "Help\n\n" + 
				"GETTING STARTED\n" +
				"To begin, you'll want to make a party for your server first. Then,  " +
				"create a player for each person playing, and add their players to the " +
				"party. when all party members are ready, use the !newGame command to begin.\n" +
				"\nBOT COMMANDS\n" + 
				"!exit - quit MUD\n" + 
				"!enableBot - enable MUD\n" + 
				"!partyStatus - Display current party information, if applicable\n" +
				"!newPlayer - create a new player\n" +
				"!addPlayer - add a new player to party\n" +
				"!removePlayer - remove a player from party\n" +
				"!newGame - lock in players and begin\n" +
				"!map - show map\n" +
				""});
	  }
	  else if(content.startsWith("!map")){
		message.channel.send("Map!");
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
	//query.select("*");
	query.exec().then(function (parties){
		if(!parties){
			message.channel.send("Server does not have a party initialized. initialize now?");
			conversationContext = "createParty";
		}
	})
  }
})



// client.login logs the bot in and sets it up for use. You'll enter your token here.
client.login(process.env.DiscordToken);

mongoose.connect(process.env.MongoDBToken);



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





//store maps in database
//
//how will they look though??
//series of nodes, and directions from one to another
//

const sessionSchema = Schema({
	botEnabled: Boolean,
	registerSet: [String],
	conversationContext: String
});

const Player = mongoose.model("Player", {
  name: String,
  class: String,
  inventory: [String],
  won: Number,
  owner: String
});

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




