# This whole program would have worked better wrapped in a class
# I may do that at some point, but for now it has a small enough function that 
# I will focus on getting it up and running
# unfortunately this oversight means heavy use of global variables- particularly
# dictGrid (the dictionary grid, which functions as the underlying model) and
# guiFrame (the gui on which the grid is built).
#
#


import tkinter as tk
import json
#import npc.py
from tkinter import ttk
from tkinter import *
from tkinter import filedialog

###### SETUP / WINDOW CREATION 
root = tk.Tk()
root.title("map maker")
root.resizable(0, 0)
bgColors = ["grey","lightgrey"]
### Make frames and pack to root
menuFrame=Frame(root)
menuFrame.pack(anchor=W)
### Constants / Global Vars
GRID_SIZE = 10
#These Area types will eventually lead to combat modifiers
DIRECTIONS = ["NORTH" , "SOUTH" , "EAST" , "WEST"]
AREA_TYPES = ["plains", "road", "city", "building", "waterfront", "other"] #plains, road, city, building, waterfront
REGIONS = ["Other", "Mitla"]
CLASSES = ["Pirate" , "Mage" , "Normal" , "Mourner", "Burglar"]
#npcList=[]
dictGrid=[]

def main():

	guiFrame = []



	###### MAKE TOP MENU

	mb0 = Menubutton(menuFrame, text="File",relief=FLAT)
	fileButton = Menu(mb0,tearoff=0)
	fileButton.add_command(label="New", command=lambda: newMap())
	fileButton.add_command(label="Save", command=lambda: saveFile())
	fileButton.add_command(label="Load", command=lambda: loadFile())
	fileButton.add_command(label="Render", command=lambda: render())
	fileButton.add_command(label="Exit", command=root.destroy)

	mb1 = Menubutton(menuFrame, text="Edit",relief=FLAT)
	editButton = Menu(mb1,tearoff=0)
	editButton.add_command(label="Edit NPCs", command=lambda: editNpcs(root))
	editButton.add_command(label="Copy", command=lambda: testFunc())
	editButton.add_command(label="Paste", command=root.destroy)
	editButton.add_command(label="Shift", command=root.destroy)

	mb2 = Menubutton(menuFrame, text="Help",relief=FLAT)
	helpButton = Menu(mb2,tearoff=0)
	helpButton.add_command(label="Debug print console", command=lambda: printGrid(dictGrid))

	mb0["menu"]=fileButton
	mb1["menu"]=editButton
	mb2["menu"]=helpButton
	mb0.pack(side=LEFT)
	mb1.pack(side=LEFT)
	mb2.pack(side=LEFT)

	
	###### UTILITY FUNCTIONS

	def testFunc():
		strin="helo"
		for x in range(10):
			strin+="world"
			print("yo")
		print(strin)

	def render():
		global dictGrid
		#first pass: go through dictGrid and grab all entries with a name
		#	generate json for all
		introString = """
const mongoose = require('mongoose');
const { Schema } = mongoose;
function generateMap(){
	Session.deleteMany({});
	NPC.deleteMany({}).then(function(npcs){
		Area.deleteMany({}).then(function(areas){
			MapNode.deleteMany({}).then(function(mapNodes){
				Map.deleteMany({}).then(function(maps){
					console.log(npcs);
					console.log(areas);
					console.log(mapNodes);
					console.log(maps);
"""
		outroString = """
				    console.log("\(ski mask voice\) OK!");
				});
			});
		});
	});
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
});
const Player = mongoose.model("Player", {
  name: String,
  class: String,
  inventory: [String],
  won: Number,
  owner: String
});
const npcSchema = Schema({
	name: String,
	description: String,
	job: String,
	level: Number,
	maxHP: Number,
	currentHP: Number
});
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
const Game = mongoose.model("Game", gameSchema);
const NPC = mongoose.model('NPC', npcSchema);
const Area = mongoose.model('Area', areaSchema);
const MapNode = mongoose.model('MapNode', mapNodeSchema); //huh???
const Map = mongoose.model("Map", mapSchema);
generateMap();
"""

		outString=""
		locSaves=""
		npcSaves=""
		for row in dictGrid:
			for area in row:
				#this double nest should be fixed at some point
				if("name" in area):
					if area['name']!='':
						#grab all NPCs in area - make json object from them before making area

						varName = area['name'].replace(' ','_')
						if "npcPresent" in area:
							for npc in area["npcPresent"]:
								npc["level"] = int(npc["level"])
								npcSaves+=npc["name"].replace(" ","_") + ".save();\n"
						else:
							area["npcPresent"] = []
						for npc in area["npcPresent"]:
							print(json.dumps(npc))
							outString+= "const " + npc["name"].replace(' ','_') + " = new NPC(" + json.dumps(npc)+");\n"
						print("here we are")
						print("\n".join(npc["name"] for npc in area["npcPresent"]))
						print(area["npcPresent"])
						#area["level"] = int(area["level"])
						outString=(outString+"const " + str(varName) + "= new Area("+str(json.dumps({key: area[key] for key in area if key not in ['directions', 'npcPresent']})[:-1]) +
						", sessionPresent: []," + 
						" npcPresent: [" + str(", ".join(npc["name"].replace(' ','_')+".id.toString()" for npc in area["npcPresent"])) + "]," + 
						" north: null," + 
						" south: null," + 
						" east: null," + 
						" west: null" + 
						"});\n\n")
						locSaves+=(varName+".save();\n")
		#second pass: go through dictGrid and find all adjascent locations (LR)
		for row in range(len(dictGrid)):
			for area in range(len(dictGrid[row])):
				#this double nest should be fixed at some point maybe...
				if("name" in dictGrid[row][area]):
					if dictGrid[row][area]['name']!='':
						#go through directions: if E or W, link with next
						#print("yep:" + str(dictGrid[row][area]["directions"]))
						if(0 in dictGrid[row][area]["directions"]):
							outString+=(dictGrid[row][area]['name'].replace(' ','_') + '.north = ' + dictGrid[row-1][area]['name'].replace(' ','_')+'._id.toString()')
							outString+=("\n")
						if(1 in dictGrid[row][area]["directions"]):
							outString+=(dictGrid[row][area]['name'].replace(' ','_') + '.south = ' + dictGrid[row+1][area]['name'].replace(' ','_')+'._id.toString()')
							outString+=("\n")
						if(2 in dictGrid[row][area]["directions"]):
							outString+=(dictGrid[row][area]['name'].replace(' ','_') + '.east = ' + dictGrid[row][area+1]['name'].replace(' ','_')+'._id.toString()')
							outString+=("\n")
						if(3 in dictGrid[row][area]["directions"]):
							outString+=(dictGrid[row][area]['name'].replace(' ','_') + '.west= ' + dictGrid[row][area-1]['name'].replace(' ','_')+'._id.toString()')
							outString+=("\n")

						#we have the directions- now just a series of if blocks
						#e.g. if directions contains 0, link to directly above
						#placeName = str(dictGrid[row][area]['name'])
						#print(placeName)
						#something like this..
						#dictGrid[row][area].north = dictGrid[row-1][area]._id.toString()

						#if(
		#third pass for up & down possibly?

		#print(introString)
		#print(outString)
		#print(locSaves)
		#print(outroString)
		fullString = introString+outString+npcSaves+locSaves+outroString
		
		filename = filedialog.asksaveasfile(mode='w', initialdir= ".", defaultextension='.txt',
											title = "Select a File",
											filetypes = (("javascript",
														"*.js"),
														("all files",
														"*.*")))
		if filename is None:
			return
		filename.write(fullString)


		


	def printGrid(grid):
		for x in range(len(grid)):
			print(grid[x])
		print("\n")

	def newMap():
		global dictGrid
		global guiFrame
		dictGrid=[]
		guiFrame.destroy()
		guiFrame = Frame(root)
		guiFrame.pack()
		genGrid(root)

	def saveFile():
		global dictGrid
		filename = filedialog.asksaveasfile(mode='w', initialdir= ".", defaultextension='.txt',
											title = "Select a File",
											filetypes = (("Text Files",
														"*.txt"),
														("all files",
														"*.*")))
		if filename is None:
			return
		filename.write(str(json.dumps({'dictGrid':dictGrid})))
		filename.close()

	def loadFile():
		global dictGrid
		filename = filedialog.askopenfilename(initialdir= ".",
											title = "Pick a file, yo",
											filetypes = (("Text Files",
														"*.txt"),
														("all files",
														"*.*")))
		if filename is None or filename == '':
			return
		#print(filename)
		with open(filename, 'r') as file:
			content = file.read()
			print(type(content))
			#convert file contents to python
			x= json.loads(content.replace('\'', '"'))
			#this if is for legacy functionality- realistically this can be removed
			if 'dictGrid' in x:
				dictGrid = x['dictGrid']
			else:
				dictGrid = x
			global GRID_SIZE
			GRID_SIZE=len(dictGrid[0])-1 #changing value of constant- fix this once this is working
			#maybe is just shouldnt be a constant? review..
			for row in dictGrid:
				for item in row:
					if(item!={}):
						item["directions"] = tuple(item["directions"])
			printGrid(dictGrid)
			genGrid(root)
			return dictGrid
			file.close()

	def saveNpc(npcIndex,vDict,window,npcBox,parentWindow,btn,nameButton,x,y):
		#need to bring parent window along here to push button to
		if(npcIndex!=-1):
			name = vDict["nv"].get()
			dictGrid[x][y]["npcPresent"][npcIndex]["name"] = vDict["nv"].get()
			dictGrid[x][y]["npcPresent"][npcIndex]["description"] = vDict["dv"].get()
			dictGrid[x][y]["npcPresent"][npcIndex]["level"] = vDict["lv"].get()
			dictGrid[x][y]["npcPresent"][npcIndex]["hp"] = vDict["hv"].get()
			dictGrid[x][y]["npcPresent"][npcIndex]["class"] = vDict["cv"].get()
			nameButton['text'] = vDict["nv"].get()
		else:
			print("adding index" + str(len(dictGrid[x][y]["npcPresent"])))
			dictGrid[x][y]["npcPresent"].append({"name": vDict["nv"].get(),
					"description": vDict["dv"].get(),
					"level": vDict["lv"].get(),
					"hp": vDict["hv"].get(),
					"class": "test"})
			npcBtn = Button(npcBox, text=vDict["nv"].get())
			npcBtn['command']=lambda \
					npcIndex=len(dictGrid[x][y]["npcPresent"])-1, \
					btn=btn, \
					npcBtn=npcBtn, \
					x=x, \
					y=y:npcWindow(npcIndex,btn,npcBtn,x,y, window, npcBox)
			npcBtn.pack()
			
		window.destroy()
		

	def saveArea(vDict,window,btn, x,y):
		name = vDict["nv"].get()
		dirs = (vDict["db"].curselection())
		movableDirections="\n"
		if(0 in dirs):
			movableDirections+="N "
		if(1 in dirs):
			movableDirections+="S "
		if(2 in dirs):
			movableDirections+="E "
		if(3 in dirs):
			movableDirections+="W"
		#btn["text"]= "|"+spacers+"\n| " + name + "\n|"+spacers
		btn["text"]=name+movableDirections
		dictGrid[x][y]["name"] = vDict["nv"].get()
		dictGrid[x][y]["description"] = vDict["dv"].get()
		dictGrid[x][y]["type"] = vDict["tv"].get()
		dictGrid[x][y]["region"] = vDict["rv"].get()
		dictGrid[x][y]["directions"] = vDict["db"].curselection()
		#dictGrid[x][y]["npcs"] = vDict["np"].get()
		window.destroy()
	

	def removeNpcWindow(npcIndex, btn, nameButton, x, y, parentWindow, npcBox):
		global dictGrid
		#global npcList
		window = Toplevel()
		window.geometry('200x300')
		#get list of NPCs that currently exist
		nameLabel = Label(window, text="name").pack(anchor=W)
		nameBox   = ttk.Combobox(window, state='readonly', textvariable=classVar, values=CLASSES).pack()
		#


		acceptButt = Button(window, text="Save", command=lambda 
				window=window, 
				parentWindow=parentWindow,
				btn=btn, 
				nameButton=nameButton,
				x=x,
				y=y,
				varDict=varDict:saveNpc(npcIndex,varDict,window,npcBox, parentWindow, btn,nameButton, x,y)).pack(pady = 15)

	#pass in index of NPC being used. if -1, new npc - from that specific tile, not a huge list
	def npcWindow(npcIndex, btn, nameButton, x, y, parentWindow, npcBox):
		#if index -1, need to add new button for that character before "add npc" button
		#otherwise, update relevant button
		print("button:")
		print(btn.cget('text'))
		print("name button:")
		print(nameButton['text'])
		#nameButton['text'] = "yo"
		print(x)
		print(y)
		#need to get selected item from list
		global dictGrid
		#global npcList
		window = Toplevel()
		window.geometry('200x300')
		if(npcIndex != -1):
			nameVar = StringVar(root, value=dictGrid[x][y]["npcPresent"][npcIndex]["name"])
			descVar = StringVar(root, value=dictGrid[x][y]["npcPresent"][npcIndex]["description"])
			levelVar = StringVar(root, value=dictGrid[x][y]["npcPresent"][npcIndex]["level"])
			hpVar = StringVar(root, value=dictGrid[x][y]["npcPresent"][npcIndex]["hp"])
			classVar = StringVar(root, value=dictGrid[x][y]["npcPresent"][npcIndex]["class"])
		else:
			nameVar   = tk.StringVar()
			descVar = tk.StringVar()
			levelVar = tk.StringVar()
			hpVar = tk.StringVar()
			classVar = tk.StringVar()
		varDict = {"nv": nameVar, "dv": descVar, "lv": levelVar, "hv": hpVar, "cv": classVar}
		nameLabel = Label(window, text="name").pack(anchor=W)
		nameBox   = Entry(window, textvariable=nameVar).pack()
		descLabel = Label(window, text="description").pack(anchor=W)
		descBox   = Entry(window, textvariable=descVar).pack()
		levelLabel = Label(window, text="level").pack(anchor=W)
		levelBox   = Entry(window, textvariable=levelVar).pack()
		hpLabel = Label(window, text="hitpoints").pack(anchor=W)
		hpBox   = Entry(window, textvariable=hpVar).pack()
		classLabel = Label(window, text="class").pack(anchor=W)
		classBox   = ttk.Combobox(window, state='readonly', textvariable=classVar, values=CLASSES).pack()
		#print(dictGrid[x][y]['npcList'][npcIndex])
		#if("class" in dictGrid[x][y]['npcList'][npcIndex] and dictGrid[x][y]['npcList'][npcIndex]["class"]!=""):
			#classPick = dictGrid[x][y]['npcList'][npcIndex]["class"]
			#classBox.activate(classPick)
		#	classBox.selection_set(ACTIVE)


		saveButt    = Button(window, text="Save", command=lambda 
				window=window, 
				parentWindow=parentWindow,
				btn=btn, 
				nameButton=nameButton,
				x=x,
				y=y,
				varDict=varDict:saveNpc(npcIndex,varDict,window, npcBox,parentWindow, btn,nameButton, x,y)).pack(pady = 15)

	def openArea(btn, x, y):
		global dictGrid
		#global npcList
		window = Toplevel()
		window.geometry('200x500')
		#if(dictGrid[x][y]!="" and dictGrid[x][y]!={}):
		if("name" in dictGrid[x][y]):
			nameVar = StringVar(root, value=dictGrid[x][y]["name"])
			descVar = StringVar(root, value=dictGrid[x][y]["description"])
			typeVar = StringVar(root, value=dictGrid[x][y]["type"])
			regionVar = StringVar(root, value=dictGrid[x][y]["region"])
			#directVar = tk.StringVar(root, value=dictGrid[x][y]["directions"])
		else:
			nameVar   = tk.StringVar()
			descVar = tk.StringVar()
			typeVar = tk.StringVar()
			regionVar = tk.StringVar()
			#don't need: sessions present, will be generated
			#direction is done AFTER widget generation

		varDict = {"nv": nameVar, "dv": descVar, "tv": typeVar, "rv": regionVar}
		nameLabel = Label(window, text="name").pack(anchor=W)
		nameBox   = Entry(window, textvariable=nameVar).pack()
		descLabel = Label(window, text="description").pack(anchor=W)
		descBox   = Entry(window, textvariable=descVar).pack()
		typeLabel = Label(window, text="type").pack(anchor=W)
		typeBox     = ttk.Combobox(window, state='readonly', textvariable=typeVar, values=AREA_TYPES).pack()
		regionLabel = Label(window, text="region").pack(anchor=W)
		regionBox   = ttk.Combobox(window, state='readonly', textvariable=regionVar, values=REGIONS).pack()
		#oh how i love the little buppy <3
		directionLabel = Label(window, text="movableDirections").pack(anchor=W)
		directionBox = Listbox(window, selectmode="multiple", listvariable=tk.StringVar(value=DIRECTIONS))
		directionBox.pack()
		varDict["db"] = directionBox
		npcBox = tk.Frame(window, bg="white")
		npcBox.pack(anchor=W)
		npcLabel = Label(npcBox, text="npcs").pack(anchor=W)
		print("window")
		print(window)
		if("npcPresent" not in dictGrid[x][y]):
			dictGrid[x][y]["npcPresent"] = []
			#dictGrid[x][y]["npcList"].append({"name":"jim", "description":"", "class":"","level":"","hp":""})
		#npcList.append({"name":"bob", "description":"", "class":"","level":"","hp":""})

		for npc in dictGrid[x][y]["npcPresent"]:
			#these buttons should give a separate menu- options to remove, edit, etc
			npcBtn = Button(npcBox, text=npc["name"])
			npcBtn['command']=lambda \
					npcIndex=dictGrid[x][y]["npcPresent"].index(npc), \
					npcBox=npcBox, \
					btn=btn, \
					npcBtn=npcBtn, \
					x=x, \
					y=y:npcWindow(npcIndex,btn,npcBtn,x,y, window, npcBox)
			npcBtn.pack()

		#if button and dirs not empty, fill in upon load
		print(dictGrid[x][y])
		#if(dictGrid[x][y]!="" and dictGrid[x][y]!={}):
		if("directions" in dictGrid[x][y]):
			dirs = dictGrid[x][y]["directions"]
			for direc in dirs:
				directionBox.activate(direc)
				directionBox.selection_set(ACTIVE)


		npcAdd    = Button(window, text="Add NPC")
		npcAdd['command']=lambda \
				window=window, \
				npcBox=npcBox, \
				btn=btn, \
				npcAdd=npcAdd, \
				x=x, \
				y=y, \
				varDict=varDict:npcWindow(-1,btn,npcAdd,x,y, window, npcBox)
		npcAdd.pack()

		npcRem = Button(window, text="Remove NPC")
		npcRem['command']=lambda \
				window=window, \
				btn=btn, \
				x=x, \
				y=y, \
				varDict=varDict:removeNpcWindow(-1,btn,npcRem,x,y, window, npcBox)
		npcRem.pack()

		saveButt    = Button(window, text="Save", command=lambda 
				window=window, 
				btn=btn, 
				x=x,
				y=y,
				varDict=varDict:saveArea(varDict,window, btn,x,y)).pack(pady = 15)


	#scrollbar = Scrollbar(root, orient='vertical', command=guiFrame.yview)
	#text['yscrollcommand'] = scrollbar.set
	
	#add logic here to generate underlying python dict which stores all the values as well
	#don't want to just read through buttons, because they may have other text stored as
	#well as not store the full information (long descriptions, etc) 
	def genGrid(root):
		#2 scenarios - dictGrid is empty, just launched - generate
		#otherwise, dictGrid exists, loading file- need to read what's in it and gen from that
		global dictGrid
		global guiFrame

		if(dictGrid==[]):
			#print("here")
			guiFrame = Frame(root)
			guiFrame.pack()
			for x in range(0,GRID_SIZE+1):
				dictGrid.append([])
				root.columnconfigure(x+1, weight=0)
				for y in range(GRID_SIZE+1):
					dictGrid[x].append({})
					btn = tk.Button(guiFrame, height=2,width=10,text="", relief=FLAT, background=bgColors[(x+y)%len(bgColors)])
					btn.grid(column=y,row=x)
					btn["command"]=lambda btn=btn, x=x, y=y:openArea(btn, x, y)
		else:
			#print("there")
			guiFrame.destroy()
			guiFrame = Frame(root)
			guiFrame.pack()
			for x in range(0, GRID_SIZE+1):
				root.columnconfigure(x+1, weight=0)
				for y in range(GRID_SIZE+1):
					movableDirections="\n"
					if(dictGrid[x][y]=={}):
						dictGrid[x][y]["name"]=""
						dictGrid[x][y]["description"]=""
						dictGrid[x][y]["type"]=""
						dictGrid[x][y]["region"]=""
						dictGrid[x][y]["directions"]=()
						dictGrid[x][y]["npcs"]=()
						dirs=()
					else:
						dirs = (dictGrid[x][y]["directions"])
						if(0 in dirs):
							movableDirections+="N "
						if(1 in dirs):
							movableDirections+="S "
						if(2 in dirs):
							movableDirections+="E "
						if(3 in dirs):
							movableDirections+="W"
					btn = tk.Button(guiFrame, height=2,width=10,text=dictGrid[x][y]["name"]+movableDirections, relief=FLAT, background=bgColors[(x+y)%len(bgColors)])
					#btn["text"]= "|"+spacers+"\n| " + name + "\n|"+spacers
					btn.grid(column=y,row=x)
					btn["command"]=lambda btn=btn, x=x, y=y:openArea(btn, x, y)
		#printGrid(dictGrid)
	
		#return guiFrame, dictGrid
	
	def editNpcs(root):
		pass

	genGrid(root)
	printGrid(dictGrid)
	root.mainloop()


if __name__ == "__main__":
	main()
