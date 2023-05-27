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
//In order for the bot to work with multiple servers, most global vars should be moved to
//the database as a "game" or "session" table, that holds a record for each server
//	Exceptions - shared consts, like classList

const classList = ["Cleric", "Bard", "Peasant", "Jester"]


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
function handleResponse(message, session){
	//Session.findOne({"guild":message.guildId}).exec().then(function (session){
	if(session.conversationContext == "choosePlayer"){
		var pQuery = Player.find({'owner': message.author.id}, 'name');
		pQuery.exec().then(function (players){
			if(!players){
				message.channel.send("No players owned by the current user. Creating new one..");
				message.channel.send("Enter a name for your character");
				session.conversationContext = "newPlayerName";
				session.save();
			}
			else{
				var outString = "";
				for(var i=0;i<players.length;i++){
					outString+=i.toString()+". " + players[i].name+"\n";
					session.registerSet.push(players[i]._id)
					session.save();
				}
				message.channel.send(outString);
			}
		});
	}
	if(session.conversationContext == "newPlayerName"){
		//need to sanitize to prevent duplications of name from a single user
		session.registerSet.push(message.content);
		message.channel.send("What class would you like to be?\n1.Cleric\n2.Bard\n3.Peasant\n4.Jester");
		session.conversationContext = "newPlayerClass";
		session.save();
	}
	else if(session.conversationContext == "newPlayerClass"){
		var mc = message.content;
		if(mc=="1." || mc=="2." || mc=="3." || mc=="4."){
			//session.registerSet.push(message.content);
			//session.save();
			var classChoice = classList[multChoice(mc)]
			new Player({
				//user: message.author.id,
				name: session.registerSet[0],
				inventory: ["spoon", "rock"],
				class: classChoice,
				won: 100,
				owner: message.author.id
			}).save();
			message.channel.send("Your character has been created. Add player to current party?");
			session.registerSet = [];
			session.conversationContext = "addPlayer"
			session.save();

		}
		else{
			message.channel.send("please try again- answer multiple choice questions with the number of your choice, followed by a period. E.G. '2.'");
		}
	}
	else if(session.conversationContext == "createParty"){
		if(yesNo(message.content)){
			new Party({
				guild: message.guildId,
				members: [],
			}).save();
			message.channel.send("Created new party");
			session.registerSet = [];
			//session.save();
		}
		else{
			message.channel.send("Not creating a new party");
		}
		session.conversationContext = "";
		session.save();
	}
	else if(session.conversationContext == "addPlayer"){
		if(yesNo(message.content)){
			var query = Party.findOne({'guild': message.guildId});
			query.exec().then(function (parties){
				if(!parties){
					message.channel.send("Server does not have a party initialized. initialize now?");
					session.conversationContext = "createParty";
					session.save();
				}
				else{
					var pQuery = Player.find({'owner': message.author.id}, 'name');
					//pQuery.select("*");
					pQuery.exec().then(function (players){
						if(!players){
							message.channel.send("No players owned by the current user. Creating new one..");
							message.channel.send("Enter a name for your character");
							session.conversationContext = "newPlayerName";
							session.save();
						}
						else{
							var outString = "";
							for(var i=0;i<players.length;i++){
								outString+=i.toString()+". " + players[i].name+"\n";
								session.registerSet.push(players[i]._id.toString());
							}
							message.channel.send("Choose a player to add to party:");
							message.channel.send(outString);
							session.conversationContext = "playerChosen";
							session.save();
						}
					});
				}
			});
		}
		else{
			message.channel.send("not added");
			session.conversationContext = "";
			session.save();
		}
	}
	else if(session.conversationContext == "playerChosen"){
		var character = multChoice(message.content);
		var playerQuery = Player.findOne({'_id': session.registerSet[character]}).exec().then(function (playerToAdd){
			var partyQuery = Party.findOne({'guild': message.guildId}, 'members').exec().then(function (parties){
				var dupeFlag = false;
				for(var i=0;i<parties.members.length;i++){
					if(playerToAdd._id.toString()==parties.members[i].toString()){
						dupeFlag = true;
					}
				}
				if(!dupeFlag){
					parties.members.push(playerToAdd);
					parties.save();
					message.channel.send(`Added ${playerToAdd.name} to party.`);
					session.registerSet = [];
					session.conversationContext = "";
					session.save();
				}
				else{
					message.channel.send("Player is already in party!");
				}
				//parties.members
				
			});
		});
	}
	else if(session.conversationContext == "newGame"){
		if(yesNo(message.content)){
			//i may need to hold more information about the party in order to make
			//informed dialogue in the future.
			message.channel.send("beginning your adventure...");
			//denote the time period - setting. explain how your party met, and how they came to arrive where they did
			message.channel.send("Pale blue, running along an unwavering line of deep blue. In nature, perfect geometric figures are quite rare, " +
				"and so you and your party spend many hours of the day watching it. The colors of each blend from their respective " +
				"blues to brilliant yellows, reds, and finally black- all the while respecting the boundary drawn between them that " +
				"you call the horizon. What a point that is, indeed- the edge of what is tangible, beyond which is everything else. " +
				"everything you've seen and known, but cannot see now, shrouded by the curvature of the earth- as well as " +
				"everything you've not seen, but heard of- stories of great beasts roaming the earth, armies conquering and being conquered, "+
				"individuals with strange talents and great aspirations, forests thousands of years older than those who " + 
				"reside in them- the list goes " +
				"on. Of course it does, it contains just shy of everything...");
			message.channel.send("\nThe sea laps weakly against the hull of the ship. The hull creaks in tune with the rolling motion which " +
				"took you all so long to adjust to. Beyond this, it is a quiet night- the fatigue that accompanies many weeks at sea can " +
				"remind the importance of some peace and quiet. Apparently, the lookout did not get the memo."
			);
			message.channel.send("\n'LAND!' Shouts the lookout, rousing the crew. Your party, not being directly involved in " + 
				"the ship's navigation, begin preparing for landing in this strange land. You gather around a table to discuss what you " +
				"will be doing upon arrival."
			);
			message.channel.send("'Who are you again??' you ask to one of your party members. in fact, you can't remember any of "+
				"them. While absurd and illogical, it is the truth- after months at sea together, none of you can remember a thing " + 
				"about each other. Perhaps you should all introduce yourselves and explain your backgrounds."
			);
			session.conversationContext = "";
			session.save();
			//would be nice now to wait for each player to speak, then continue when they have. 
			//maybe add json to register set, key:value of player:bool (bool being whether or not
			//they've talked yet - check on this until everyone has talked then move on)

		}
		else{
			message.channel.send("return when you are ready.");
		}
	}
	else if(session.conversationContext == ""){
		
	}
}


function handleInput(message, session){
  content = message.content
  if(session.conversationContext==""){
	  if(content.includes("!exit")) {
		session.botEnabled = false;
		session.save();
		message.channel.send("Bot disabled");
	  }
	  else if(content.includes("!deleteParty")) {
		var query = Party.findOneAndDelete({'guild': message.guildId}).exec().then(function (parties){
			if(!parties){
				message.channel.send("Server does not have a party initialized. initialize now?");
				session.conversationContext = "createParty";
				session.save();
			}
			else{
				message.channel.send("Party deleted.");	
			}
		});
	  }

	  else if(content.includes("!partyStatus")) {
		var query = Party.findOne({'guild': message.guildId}, 'members').exec().then(function (parties){
			if(!parties){
				message.channel.send("Server does not have a party initialized. initialize now?");
				session.conversationContext = "createParty";
				session.save();
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
										session.conversationContext = "newPlayerName";
										session.save();
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
										session.conversationContext = "";
										session.save();
									}
								});

				//});

			}
		})
	  }
	  else if(content.includes("!newGame")) {
		session.conversationContext="newGame"
		session.save();
		message.channel.send("creating a new game. are all party members set?");
	  }
	  else if(content.includes("!newPlayer")) {
	  	session.conversationContext = "newPlayerName"
		session.save();
		message.channel.send("Let us make a new player. What will be your player's name?");
	  }
	  else if(content.includes("!addPlayer")) {
	  	session.conversationContext = "addPlayer"
		session.save();
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
		const fs = require('fs');
		//import * as fs from 'fs';
		fs.readFile('./mapFolder/map', 'utf8', (err,data) =>{
			message.channel.send('```\n' + data + '```');
		});
	  }
  }
	else{
		//how to handle response?
		handleResponse(message, session);
	}
	//help fallthru
}

// Register an event so that when the bot is ready, it will log a messsage to the terminal
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	//const Guilds = client.guilds.cache.map(guild => guild.id);
	Session.find().exec().then(function (session){
		for(var i=0;i<session.length;i++){
			session[i].botEnabled = false;
			session[i].conversationContext = "";
			session[i].registerSet = [];
			session[i].save();
		}
	});
});

// Register an event to handle incoming messages
client.on('messageCreate', (message) => {
	Session.findOne({'guild': message.guildId}).exec().then(function (session){
		if (message.content == "!enableBot" && message.author.bot == false){
			//var sessionQuery = Session.findOne({'guild': message.guildId}).exec().then(function (sessions){
				//if no session has been made, create new session
				if(!session){
					new Session({
						guild: message.guildId,
						botEnabled: true,
						registerSet: [],
						conversationContext: "",
						currentTurn: null 
					}).save();
				}
				else{
					var query = Party.findOne({'guild': message.guildId}).exec().then(function (parties){
						session.botEnabled = true;
						if(!parties){
							message.channel.send("Server does not have a party initialized. initialize now?");
							session.conversationContext = "createParty";
						}
						session.save();
					});
				}
				message.channel.send("Bot enabled");
			//});
		}
		else if (session.botEnabled == true && message.author.bot == false){
			handleInput(message, session);
		}
	});
});



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
	guild: String,
	botEnabled: Boolean,
	registerSet: [String],
	conversationContext: String,
	currentTurn: [{ type: Schema.Types.ObjectId, ref: 'Player' }]
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

const Session = mongoose.model("Session", sessionSchema);
const Party = mongoose.model("Party", partySchema);
const Game = mongoose.model("Game", gameSchema);
const NPC = mongoose.model('NPC', npcSchema);
const Building = mongoose.model('Building', buildingSchema);
const MapNode = mongoose.model('MapNode', mapNodeSchema);
const Map = mongoose.model("Map", mapSchema);

/*const guy = new Player({
  name: "Mario Guy",
  inventory: ["spoon", "rock"],
  class: "Cleric",
  won: 100
});*/

//guy.save().then(() => console.log(Player.findOne({})));




