//const { Player } = require('./models/Player.js');
const { Client, GatewayIntentBits } = require('discord.js')
const mongoose = require('mongoose');
const { Schema } = mongoose;

//TODO: Review intents and see if I can pull any of these
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
const clericEffects = {
	strength: 2,
	agility: -1,
	luck: 3,
	perception: 0
}
const validCommands = ["look", "examine", "observe", "view", 
				"move", "go", "walk", "run",
				"attack", "hit", "shoot",
				"talk", "speak",
				"say"];
const prepositions = ["at", "to", "on", "in", "with"];
const generalArea = ["around", "area"];
const babbleLines = ["You speak amongst your party",
					"You babble incoherently",
					"You begin talking to yourself. How worrying."];

//////////////UTILITY FUNCTIONS/////////////

function arrayEmpty(arr){
	return arr == undefined || arr.length == 0;
}


function randInt(min, max){
	max+=1;
	return Math.floor(min + (Math.random() * (max - min)));
}

//in general - 0 is yes, 1 is no
function yesNo(message){
	message = message.toLowerCase();
	return message.startsWith('y') || message.startsWith('0');
}

function multChoice(choice){
	choice = choice.replace(".", "");
	choice = choice.replace(" ", "");
	choice = Number(choice);
	return choice-=1;
}

function getParty(session){
	Party.findOne({'guild': session.guild}).exec().then(function (parties){
		//console.log(parties);
	});
};

function commandParser(content){
	var commandInfo = {};
	var contentArr = content.split(" ");
	contentArr = contentArr.map(word => word.toLowerCase());
	//start with command- ensure it is a real command. if not, return issue
	if(!validCommands.includes(contentArr[0])){
		commandInfo.command = "";
		commandInfo.target = "";
		console.log("command not understood");
		return commandInfo;
	}
	commandInfo.command = contentArr[0];
	//check second item in array
	// - if second item is a preposition, third is object
	// - otherwise second item is obj
	//MAYBE with is not good to be here? could lead to confusion (e.g. "attack with friend" results in "attack friend"
	var targetIndex;
	targetIndex = prepositions.includes(contentArr[1]) ? 2 : 1;
	
	//set target to general if target is not specific
	commandInfo.target = (!contentArr[targetIndex] || generalArea.includes(contentArr[targetIndex])) ? "general" : contentArr[targetIndex];
	return commandInfo;
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
			session.partyMembers = [];
			/*new Party({
				guild: message.guildId,
				members: [],
			}).save();*/
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
			var query = Session.findOne({'guild': message.guildId});
			query.exec().then(function (session){
				if(!session.partyMembers){
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
			var dupeFlag = false;
			for(var i=0;i<session.partyMembers.length;i++){
				if(playerToAdd._id.toString()==session.partyMembers[i].toString()){
					dupeFlag = true;
				}
			}
			if(!dupeFlag){
				session.partyMembers.push(playerToAdd);
				message.channel.send(`Added ${playerToAdd.name} to party.`);
				session.registerSet = [];
				session.conversationContext = "";
				session.save();
			}
			else{
				message.channel.send("Player is already in party!");
			}
		});
	}
	else if(session.conversationContext == "newGame"){
		if(yesNo(message.content) && !arrayEmpty(session.partyMembers)){
			//i may need to hold more information about the party in order to make
			//informed dialogue in the future.
			message.channel.send("beginning your adventure...");
			//denote the time period - setting. explain how your party met, and how they came to arrive where they did
			/*message.channel.send("Pale blue, running along an unwavering line of deep blue. In nature, perfect geometric figures are quite rare, " +
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
			);*/
			message.channel.send("[intro blurb here]");
			message.channel.send("'Who are you again??' you ask to one of your party members. in fact, you can't remember any of "+
				"them. While absurd and illogical, it is the truth- after months at sea together, none of you can remember a thing " + 
				"about each other. Perhaps you should all introduce yourselves and explain your backgrounds. (will continue when all " +
				"party members have spoken)"
			);
			session.turnQueue = []
			for(var i=0;i<session.partyMembers.length;i++){
				session.turnQueue.push(session.partyMembers[i]);
			}
			Player.findOne({'_id':session.turnQueue[0]}).exec().then(function(player){
				message.channel.send("It is " + player.name +"'s turn");
				session.turnStyle = "takeTurn";
				session.conversationContext = "partyGreeted";
				session.save();
			});
		}
		else{
			message.channel.send("return when you are ready.");
			session.conversationContext = "";
			session.save();
		}
	}
	else if(session.conversationContext == "buddy"){
		message.channel.send("hey, it's me buddy! how are you today??");
		session.conversationContext = "";
		session.save();
	}
	else if(session.turnStyle == "takeTurn"){
		//need to have a handler in here that takes the input and reflects it into
		//the world- for example, if the message is "attack elf", then I need to
		//grab whatever player did that, check their stats, and then grab the elf
		//from local area, and change HP accordingly- then reflect info to guild
		session.turnQueue.shift();
		Player.findOne({'_id':session.turnQueue[0]}).exec().then(function(player){
			//if no player, no turnQueue[0], meaning all done w/ turns
			if(player){
				if(player.owner == message.author.id){
					if(session.turnQueue[1]){
						message.channel.send("It is " + player.name +"'s turn");
						session.save();
					}
					//this is the last turn
					else if(session.turnQueue[0]){
						message.channel.send("It is " + player.name +"'s turn");
						session.save();
					}
					//there are no more turns; resolve
				}
			}
			else{
				message.channel.send("All turns complete.");
				session.turnStyle = "";
				session.conversationContext = "partyGreeted";
				handleResponse(message, session);
				//session.save();
			}
		});
	}
	else if(session.conversationContext == "partyGreeted"){
		message.channel.send("Having greeted each other, you are now in the cool place");
		Area.findOne({'name':'docks'}).exec().then(function(docks){
			session.partyLocation = docks;
			session.conversationContext = "";
			session.save();
			console.log(docks);
			console.log("this seems to work...");
			console.log(session);
		});
		//at this point, i need to finish some section of the map, so that I can start adding them to
		//the database and making them work dynamically - 
	}
	else if(session.conversationContext == ""){
		
	}
}




function handleInput(message, session){
  content = message.content;//.toLowerCase();
  if(session.conversationContext==""){
	  if(content.includes("!exit")) {
		session.botEnabled = false;
		session.channel = "";
		session.save();
		message.channel.send("Bot disabled");
	  }
	  else if(content.includes("!deleteParty")) {
	  	if(!session.partyMembers){
			message.channel.send("Server does not have a party initialized. initialize now?");
			session.conversationContext = "createParty";
			session.save();
		}
		else{
			session.partyMembers = null;
			session.save();
			message.channel.send("Party deleted.");	
		}
	  }
	  else if(content.includes("!partyStatus")) {
		if(!session.partyMembers){
			message.channel.send("Server does not have a party initialized. initialize now?");
			session.conversationContext = "createParty";
			session.save();
		}
		else{
			message.channel.send("Party Members:");
			var players = Player.find({
							_id: {
								$in: session.partyMembers
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
									for(var i=0;i<session.partyMembers.length;i++){
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
	  }
	  else if(content.includes("!newGame")) {
		console.log(session);
		if(!session.partyLocation){
			session.conversationContext="newGame"
			session.save();
			message.channel.send("creating a new game. are all party members set?");
		}
		else{
			message.channel.send("This party is already in a game.");
		}
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
				"\nGAME COMMANDS\n" + 
				"look - have the party take a looksie around\n"+
				"walk (direction) - move the party in a direction, if possible. Accepts cardinal directions.\n"+
				"hit (target) - attack something\n"+
				"talk to (target) - speak to a person or creature\n"+
				"say (text) - speak to other parties in the area\n"+
				""});
	  }
	  else if(content.startsWith("!map")){
		const fs = require('fs');
		//import * as fs from 'fs';
		fs.readFile('./mapFolder/map', 'utf8', (err,data) =>{
			message.channel.send('```\n' + data + '```');
		});
	  }

	  else if(content.startsWith("!debug")){
		console.log("test!");
		Session.findOne().exec().then(function(session){
			session.deleteOne();
		});
	  }

		//This logic needs to be broken into multiple functions
	  else if(validCommands.includes(content.split(" ")[0]) && session.partyLocation){
	    console.log(session.partyLocation);
	  	//need to determine what the player was looking at
		//command parser function - splits command into words, finds command, subject, extras
		var commandInfo = commandParser(content);
		Area.findOne({"_id":session.partyLocation}).exec().then(function(view){
			if(commandInfo.command == "look" && commandInfo.target == "general"){
				message.channel.send(view.description);
				console.log(view)
				if(view.npcPresent){
					console.log(view.npcPresent);
					for(var i=0;i<view.npcPresent.length;i++){
						NPC.findOne({"_id":view.npcPresent[i]}).exec().then(function(npc){
							message.channel.send("You see " + npc.name + " nearby.");
						});
					}
				}
				if(view.north){
					Area.findOne({"_id":view.north}).exec().then(function(north){
						message.channel.send("To the north you see " + north.name);
					});
				}
				if(view.east){
					Area.findOne({"_id":view.east}).exec().then(function(east){
						message.channel.send("To the east you see " + east.name);
					});
				}
				if(view.south){
					Area.findOne({"_id":view.south}).exec().then(function(south){
						message.channel.send("To the south you see " + south.name);
					});
				}
				if(view.west){
					Area.findOne({"_id":view.west}).exec().then(function(west){
						message.channel.send("To the west you see " + west.name);
					});
				}
			}
			if(commandInfo.command == "talk" || commandInfo.command == "speak"){
				//need to ensure message goes to all sessions in same area
				//query sessions on partyLocation = 
				//should I lock the bot to one channel for each server??
				//then I could add the channel to session
				//and then use session to send the message
				//MAYBE when they enable the bot, save the channel they used
				//to do so in session? So wherever they enable the bot is where they
				//will get updates?
				//THIS is a good idea I'm thinking. give it some more thought and revisit tomorrow
				console.log("view" + view)
				console.log("session"+session)
				console.log("message.channel"+message.channel);
				console.log("commandInfo"+commandInfo);
				if(commandInfo.target == "general"){
					message.channel.send(babbleLines[randInt(0,2)]);
				}
				else{
					//handle dialogue with target
					//set conversationContext to the person's name and handle from there??
					//maybe combine target and the sessions state with that character
					//this allows for continuing dialogue with parties, linking each NPC to
					//session for use in quests n such
					//e.g.
					// conversationContext = target + session.target_state
					
					//this isn't a great idea i don't think- why not just have a conversationContext for
					//talking to ANYONE, and then add a new session variable for target that gets set.
					//then, I can enter a SINGLE convCont, query for target and quest status and
					//what part of the conversation we're in, etc, not have a ton more code and put
					//the weight on the database. this especially will prevent issues where fucking ummm
					//I don't wanna write a whole function for every person who needs to be spoken to
					//that seems kinda stupid
					session.conversationContext = commandInfo.target;
					
					//NOTE TO SELF:: DO NOT CODE DEBT MYSELF INTO A CORNER WHERE THE NPCS ARE LOCKED
					//TO A SINGLE LOCATION BECAUSE OF THIS!!!
					//session.save();
					handleInput(message, session);
				}
			}
			if(commandInfo.command == "say"){
				Session.find().exec().then(function(sessions){
					for(var i=0;i<sessions.length;i++){
						var channelId = (sessions[i].channel.substring(2, sessions[i].channel.length-1));
						console.log(channelId);
						//var channel = client.channels.cache.get(channelId);
						var channel = client.channels.fetch(channelId);
						if(channel){
							console.log(channel);
							//channel.send("test");
						}
					}
				});
			}
			if(commandInfo.command == "attack"){
				//need a util function to get message sender
				console.log("attacking " + commandInfo.target);
			}
			if(commandInfo.command == "move" || commandInfo.command == "go"){
				if(content.includes("north") || content.includes("go n")){
					if(view.north){
						session.partyLocation = view.north;
						session.save();
						message.channel.send("Your party moves north.");
					}
					else{
						message.channel.send("You are unable to move that way.");
					}
				}
				if(content.includes("south") || content.includes("go s")){
					if(view.south){
						session.partyLocation = view.south;
						session.save();
						message.channel.send("Your party moves south.");
					}
					else{
						message.channel.send("You are unable to move that way.");
					}
				}
				if(content.includes("east") || content.includes("go e")){
					if(view.east){
						session.partyLocation = view.east;
						session.save();
						message.channel.send("Your party moves east.");
					}
					else{
						message.channel.send("You are unable to move that way.");
					}
				}
				if(content.includes("west") || content.includes("go w")){
					if(view.west){
						session.partyLocation = view.west;
						session.save();
						message.channel.send("Your party moves west.");
					}
					else{
						message.channel.send("You are unable to move that way.");
					}
				}
			}
		});
	  }
	  else if(content.startsWith("go") || content.startsWith("move")){
	  	//message.channel.send("moving");
		Area.findOne({"_id":session.partyLocation}).exec().then(function(view){
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
			session[i].channel = "";
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
				message.channel.send("Bot enabled");
				if(!session){
					//need to set partyLocation to docks
					new Session({
						guild: message.guildId,
						botEnabled: true,
						registerSet: [],
						conversationContext: "",
						currentTurn: null,
						partyMembers: null,
						turnStyle: "",
						partyLocation: null
					}).save();
				}
				else{
					session.botEnabled = true;
					session.channel = message.channel;
					if(!session.partyMembers){
						message.channel.send("Server does not have a party initialized. initialize now?");
						session.conversationContext = "createParty";
					}
					session.save();
				}
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
	channel: String,
	registerSet: [String],
	conversationContext: String,
	partyMembers: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
	partyLocation: { type: Schema.Types.ObjectId, ref: 'MapNode' },
	partyArea: { type: Schema.Types.ObjectId, ref: 'Area' },
	currentTurn: { type: Schema.Types.ObjectId, ref: 'Player' },
	turnQueue: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
	turnStyle: String,
	//inCombatWith? maybe not necessary - just check if it's in the same area
	//
});

const Player = mongoose.model("Player", {
  name: String,
  class: String,
  inventory: [String],
  won: Number,
  owner: String
});

const npcSchema = Schema({
	//_id: Schema.Types.ObjectId,
	name: String,
	description: String,
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
	
const mapNodeSchema = Schema({
  name: String,
  areas: [{ type: Schema.Types.ObjectId, ref: 'Area' }],
  north: { type: Schema.Types.ObjectId, ref: 'MapNode' },
  south: { type: Schema.Types.ObjectId, ref: 'MapNode' },
  east:  { type: Schema.Types.ObjectId, ref: 'MapNode' },
  west:  { type: Schema.Types.ObjectId, ref: 'MapNode' }
});

const areaSchema = Schema({
  name: String,
  description: String,
  type: String,
  region: String,
  sessionsPresent: [{ type: Schema.Types.ObjectId, ref: 'Session' }],
  npcPresent: [{ type: Schema.Types.ObjectId, ref: 'NPC' }],
  north: { type: Schema.Types.ObjectId, ref: 'Area' },
  south: { type: Schema.Types.ObjectId, ref: 'Area' },
  east:  { type: Schema.Types.ObjectId, ref: 'Area' },
  west:  { type: Schema.Types.ObjectId, ref: 'Area' },
});

const mapSchema = Schema({
	locations: [{ type: Schema.Types.ObjectId, ref: 'MapNode' }]
});


const Session = mongoose.model("Session", sessionSchema);
//const Party = mongoose.model("Party", partySchema);
const Game = mongoose.model("Game", gameSchema);
const NPC = mongoose.model('NPC', npcSchema);
const Area = mongoose.model('Area', areaSchema);
const MapNode = mongoose.model('MapNode', mapNodeSchema); //huh???
const Map = mongoose.model("Map", mapSchema);


/*const guy = new Player({
  name: "Mario Guy",
  inventory: ["spoon", "rock"],
  class: "Cleric",
  won: 100
});*/

//guy.save().then(() => console.log(Player.findOne({})));
