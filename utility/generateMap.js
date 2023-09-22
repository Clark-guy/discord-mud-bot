const mongoose = require('mongoose');
const { Schema } = mongoose;

function generateMap(){
	Session.deleteMany({}).then(function(sessions){
		//sessions.partyLocation = null;
		//sessions.save();
	});
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
						"name":"Buddy Holly",
						description:"Buddy Holly is hanging out with Mary Tyler Moore",
						job: "guitarist",
						level: 3,
						maxHP: 10,
						currentHP: 10
					});
					
					//AREAS
					const market = new Area({
						name: "Mitla Market Square",
						description: "The Mitla Market Square- a bustling ",
						type: "park",
						region: "mitla",
						sessionPresent: [],
						npcPresent: [buddyHolly._id.toString()],
						north: null, 
						south: null, 
						east:  null,
						west:  null
					});
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
						north: null,
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
					/*const crossroads = new MapNode({
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
					});*/
					
					//MAP
					//const map = new Map({
					//	locations: [mitla._id.toString()]
					//})

					//AMENDMENTS
					//crossroads.south = mitla._id.toString(),
					docks.north = park._id.toString(), 
					park.south = docks._id.toString(),

					//SAVES
					buddyHolly.save();
					park.save();
					docks.save();
					crossroadMain.save();
					//crossroads.save();
					//mitla.save();
					//map.save();
				    console.log("OK!");
				});
			});
		});
	});


  //generate an npc
  //generate a few areas  
  //generate a few map nodes
  //generate base map
}




mongoose.connect(process.env.MongoDBToken);



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


generateMap();
