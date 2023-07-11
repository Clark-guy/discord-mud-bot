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
GRID_SIZE = 5
#These Area types will eventually lead to combat modifiers
AREA_TYPES = ["plains", "road", "city", "building", "waterfront", "other"] #plains, road, city, building, waterfront
REGIONS = ["Mitla"]
dictGrid=[]

def main():

	guiFrame = []



	###### MAKE TOP MENU

	mb0 = Menubutton(menuFrame, text="File",relief=FLAT)
	fileButton = Menu(mb0,tearoff=0)
	fileButton.add_command(label="New", command=lambda: newMap())
	fileButton.add_command(label="Save", command=lambda: saveFile())
	fileButton.add_command(label="Load", command=lambda: loadFile())
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

	def completeSave(window,fileName): 
		with open(fileName.get() + '.txt', 'w') as file:
			file.write(str(dictGrid))
		window.destroy()
	def saveFile():
		global dictGrid
		#window = Toplevel()
		#window.geometry('300x70')
		#Label(window, text="Save file as?").pack(anchor=W)
		#fileName=StringVar()
		#Entry(window, textvariable=fileName).pack()
		#saveButt = Button(window, text="Save", command=lambda window=window, fileName=fileName:completeSave(window, fileName)).pack()
		filename = filedialog.asksaveasfile(mode='w', initialdir= ".", defaultextension='.txt',
											title = "Select a File",
											filetypes = (("Text Files",
														"*.txt"),
														("all files",
														"*.*")))
		if filename is None:
			return
		#with open(filename.get() + '.txt', 'w') as file:
		filename.write(str(dictGrid))
		filename.close()

	def loadFile():
		global dictGrid
		filename = filedialog.askopenfilename(initialdir= ".",
											title = "Select a File",
											filetypes = (("Text Files",
														"*.txt"),
														("all files",
														"*.*")))
		if filename is None or filename is '':
			return
		#print(filename)
		with open(filename, 'r') as file:
			content = file.read()
			#convert file contents to python
			x= json.loads(content.replace('\'', '"'))
			dictGrid = x
			GRID_SIZE=len(dictGrid[0]) #changing value of constant- fix this once this is working
			print("from load function")
			printGrid(dictGrid)
			genGrid(root)
			return dictGrid
			file.close()


	def saveArea(vDict,window,btn, x,y):
		btn["text"]=vDict["nv"].get()
		window.destroy()
		dictGrid[x][y]["name"] = vDict["nv"].get()
		dictGrid[x][y]["description"] = vDict["dv"].get()
		dictGrid[x][y]["type"] = vDict["tv"].get()
		dictGrid[x][y]["region"] = vDict["rv"].get()

	def openArea(btn, x, y):
		global dictGrid
		window = Toplevel()
		window.geometry('200x200')
		if(dictGrid[x][y]!="" and dictGrid[x][y]!={}):
			nameVar = StringVar(root, value=dictGrid[x][y]["name"])
			descVar = StringVar(root, value=dictGrid[x][y]["description"])
			typeVar = StringVar(root, value=dictGrid[x][y]["type"])
			regionVar = StringVar(root, value=dictGrid[x][y]["region"])
		else:
			nameVar   = tk.StringVar()
			descVar = tk.StringVar()
			typeVar = tk.StringVar()
			regionVar = tk.StringVar()
			#don't need: sessions present, directions. both will be generated

		varDict = {"nv": nameVar, "dv": descVar, "tv": typeVar, "rv": regionVar}
		nameLabel = Label(window, text="name").pack(anchor=W)
		nameBox   = Entry(window, textvariable=nameVar).pack()
		descLabel = Label(window, text="description").pack(anchor=W)
		descBox   = Entry(window, textvariable=descVar).pack()
		typeLabel = Label(window, text="type").pack(anchor=W)
		typeBox     = ttk.Combobox(window, state='readonly', textvariable=typeVar, values=AREA_TYPES).pack()
		regionLabel = Label(window, text="region").pack(anchor=W)
		regionBox   = ttk.Combobox(window, state='readonly', textvariable=regionVar, values=REGIONS).pack()
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
					if(dictGrid[x][y]=={}):
						dictGrid[x][y]["name"]=""
						dictGrid[x][y]["description"]=""
						dictGrid[x][y]["type"]=""
						dictGrid[x][y]["region"]=""
						
					btn = tk.Button(guiFrame, height=2,width=10,text=dictGrid[x][y]["name"], relief=FLAT, background=bgColors[(x+y)%len(bgColors)])
					btn.grid(column=y,row=x)
					btn["command"]=lambda btn=btn, x=x, y=y:openArea(btn, x, y)
		printGrid(dictGrid)
	
		#return guiFrame, dictGrid

	genGrid(root)
	printGrid(dictGrid)
	root.mainloop()


if __name__ == "__main__":
	main()
