# This whole program would have worked better wrapped in a class
# I may do that at some point, but for now it has a small enough function that 
# I will focus on getting it up and running
# unfortunately this oversight means heavy use of global variables- particularly
# dictGrid (the dictionary grid, which functions as the underlying model) and
# guiFrame (the gui on which the frid is built).
#
#


import tkinter as tk
import json
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
	editButton.add_command(label="Copy", command=root.destroy)
	editButton.add_command(label="Paste", command=root.destroy)
	editButton.add_command(label="Shift", command=root.destroy)

	mb2 = Menubutton(menuFrame, text="Help",relief=FLAT)
	helpButton = Menu(mb2,tearoff=0)
	helpButton.add_command(label="Does", command=lambda: printGrid(dictGrid))
	helpButton.add_command(label="this", command=root.destroy)
	helpButton.add_command(label="work??", command=root.destroy)

	mb0["menu"]=fileButton
	mb1["menu"]=editButton
	mb2["menu"]=helpButton
	mb0.pack(side=LEFT)
	mb1.pack(side=LEFT)
	mb2.pack(side=LEFT)

	
	###### UTILITY FUNCTIONS

	def render():
		global dictGrid
		#first pass: go through dictGrid and grab all entries with a name
		#	generate json for all
		for row in dictGrid:
			for area in row:
				#this double nest should be fixed at some point
				if("name" in area):
					if area['name']!='':
						varName = area['name'].replace(' ','_')
						print("const " + str(varName) + "= new Area("+str(json.dumps({key: area[key] for key in area if key not in ['directions']})[:-1]) +
						", sessionPresent: [], npcPresent: []," + 
						" north: null," + 
						" south: null," + 
						" east: null," + 
						" west: null" + 
						"});")
		#second pass: go through dictGrid and find all adjascent locations (LR)
		for row in range(len(dictGrid)):
			for area in range(len(dictGrid[row])):
				#this double nest should be fixed at some point
				if("name" in dictGrid[row][area]):
					if dictGrid[row][area]['name']!='':
						#go through directions: if E or W, link with next
						#print("yep:" + str(dictGrid[row][area]["directions"]))
						if(0 in dictGrid[row][area]["directions"]):
							print(dictGrid[row][area]['name'].replace(' ','_') + '.north = ' + dictGrid[row-1][area]['name'].replace(' ','_')+'._id.toString()')
						if(1 in dictGrid[row][area]["directions"]):
							print(dictGrid[row][area]['name'].replace(' ','_') + '.south = ' + dictGrid[row+1][area]['name'].replace(' ','_')+'._id.toString()')
						if(2 in dictGrid[row][area]["directions"]):
							print(dictGrid[row][area]['name'].replace(' ','_') + '.east = ' + dictGrid[row][area+1]['name'].replace(' ','_')+'._id.toString()')
						if(3 in dictGrid[row][area]["directions"]):
							print(dictGrid[row][area]['name'].replace(' ','_') + '.west= ' + dictGrid[row][area-1]['name'].replace(' ','_')+'._id.toString()')
						#we have the directions- now just a series of if blocks
						#e.g. if directions contains 0, link to directly above
						placeName = str(dictGrid[row][area]['name'])
						#print(placeName)
						#something like this..
						#dictGrid[row][area].north = dictGrid[row-1][area]._id.toString()

						#if(
		#third pass for up & down possibly?
		


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
		filename.write(str(json.dumps(dictGrid)))
		filename.close()

	def loadFile():
		global dictGrid
		filename = filedialog.askopenfilename(initialdir= ".",
											title = "Select a File",
											filetypes = (("Text Files",
														"*.txt"),
														("all files",
														"*.*")))
		if filename is None or filename == '':
			return
		#print(filename)
		with open(filename, 'r') as file:
			content = file.read()
			#convert file contents to python
			x= json.loads(content.replace('\'', '"'))
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
		window.destroy()

	def openArea(btn, x, y):
		global dictGrid
		window = Toplevel()
		window.geometry('200x400')
		if(dictGrid[x][y]!="" and dictGrid[x][y]!={}):
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
		directionLabel = Label(window, text="movableDirections").pack(anchor=W)
		#print(directVar.get())
		directionBox = Listbox(window, selectmode="multiple", listvariable=tk.StringVar(value=DIRECTIONS))
		directionBox.pack()
		varDict["db"] = directionBox

		if(dictGrid[x][y]!="" and dictGrid[x][y]!={}):
			if(dictGrid[x][y]["directions"]!=()):
				dirs = dictGrid[x][y]["directions"]
				for direc in dirs:
					directionBox.activate(direc)
					directionBox.selection_set(ACTIVE)
		saveButt    = Button(window, text="Save", command=lambda 
				window=window, 
				btn=btn, 
				x=x,
				y=y,
				varDict=varDict:saveArea(varDict,window, btn,x,y)).pack()


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
			print("here")
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
			print("there")
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

	genGrid(root)
	printGrid(dictGrid)
	root.mainloop()


if __name__ == "__main__":
	main()
