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
const clericEffects = {
	strength: 2,
	agility: -1,
	luck: 3,
	perception: 0
}

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

function getParty(session){
	Party.findOne({'guild': session.guild}).exec().then(function (parties){
		//console.log(parties);
	});
};

function generateMap(){
	//Delete all npcs, areas, map nodes, maps
	NPC.deleteMany({}).then(function(npcs){
		Area.deleteMany({}).then(function(areas){
			MapNode.deleteMany({}).then(function(mapNodes){
				Map.deleteMany({}).then(function(maps){
					console.log(npcs);
					console.log(areas);
					console.log(mapNodes);
					console.log(maps);
					
					//NPCS
					const buddyHolly = new NPC({
						name:"Buddy Holly",
						description:"Buddy Holly is hanging out with Mary Tyler Moore",
						job: "guitarist",
						level: 3,
						maxHP: 10,
						currentHP: 10
					});
					
					//AREAS
					const park = new Area({
						name: "downtown park",
						description: "A charming little park in the center of downtown Mitla.",
						type: "park",
						region: "mitla",
						sessionPresent: [],
						npcPresent: [buddyHolly._id.toString()],
						north: null, 
						south: null, 
						east:  null,
						west:  null
					});
					const docks = new Area({
						name: "docks",
						description: "The docks of Mitla. Many curious folks can be seen around here.",
						type: "docks",
						region: "mitla",
						sessionPresent: [],
						npcPresent: [],
						north: park._id.toString(), 
						south: null, 
						east:  null,
						west:  null
					});
					const crossroadMain = new Area({
						name: "crossroads",
						description: "A major intersection. To the south lies Mitla",
						type: "road",
						region: "unaligned",
						sessionPresent: [],
						npcPresent: [],
						north: null, 
						south: null, 
						east:  null,
						west:  null
					});

					//MAPNODES
					const crossroads = new MapNode({
						name: "Crossroads",
						areas: [crossroadMain._id.toString()],
						north: null, 
						south: null, 
						east:  null,
						west:  null
					});
					const mitla = new MapNode({
						name: "Mitla",
						areas: [park._id.toString(), docks._id.toString()],
						north: crossroads._id.toString(), 
						south: null,
						east:  null,
						west:  null
					});
					
					//MAP
					const map = new Map({
						locations: [mitla._id.toString()]
					})

					//AMENDMENTS
					crossroads.south = mitla._id.toString(),
					park.south = docks._id.toString(),

					//SAVES
					buddyHolly.save();
					park.save();
					docks.save();
					crossroadMain.save();
					crossroads.save();
					mitla.save();
					map.save();
				});
			});
		});
	});


  //generate an npc
  //generate a few areas  
  //generate a few map nodes
  //generate base map
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
		}
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
  content = message.content
  if(session.conversationContext==""){
	  if(content.includes("!exit")) {
		session.botEnabled = false;
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
		if(!partyLocation){
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
				""});
	  }
	  else if(content.startsWith("!map")){
		const fs = require('fs');
		//import * as fs from 'fs';
		fs.readFile('./mapFolder/map', 'utf8', (err,data) =>{
			message.channel.send('```\n' + data + '```');
		});
	  }
	  else if(content.includes("look")){
		Area.findOne({"_id":session.partyLocation}).exec().then(function(view){
			message.channel.send(view.description);
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
		});
	  }
	  else if(content.startsWith("go") || content.startsWith("move")){
	  	//message.channel.send("moving");
		Area.findOne({"_id":session.partyLocation}).exec().then(function(view){
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
	//generateMap();
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
					if(!session.partyMembers){
						message.channel.send("Server does not have a party initialized. initialize now?");
						session.conversationContext = "createParty";
					}
					session.save();
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
