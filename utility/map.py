import tkinter as tk
from tkinter import ttk
from tkinter import *

def main():
	root = tk.Tk()
	#root.geometry("800x600")
	root.title("map maker")
	root.resizable(0, 0)

	#colors = ["red","green","blue"]
	bgColors = ["grey","lightgrey"]


	menuFrame=Frame(root)
	menuFrame.pack(anchor=W)
	#root.config(menu=menuFrame)

	mb0 = Menubutton(menuFrame, text="File",relief=RAISED)
	fileButton = Menu(mb0,tearoff=0)
	fileButton.add_command(label="New", command=main)
	fileButton.add_command(label="Save", command=root.destroy)
	fileButton.add_command(label="Load", command=root.destroy)
	fileButton.add_command(label="Exit", command=root.destroy)

	mb1 = Menubutton(menuFrame, text="Edit",relief=RAISED)
	editButton = Menu(mb1,tearoff=0)
	editButton.add_command(label="Copy", command=root.destroy)
	editButton.add_command(label="Paste", command=root.destroy)
	editButton.add_command(label="Shift", command=root.destroy)

	mb2 = Menubutton(menuFrame, text="Help",relief=RAISED)
	helpButton = Menu(mb2,tearoff=0)
	helpButton.add_command(label="Does", command=root.destroy)
	helpButton.add_command(label="this", command=root.destroy)
	helpButton.add_command(label="work??", command=root.destroy)

	mb0["menu"]=fileButton
	mb1["menu"]=editButton
	mb2["menu"]=helpButton

	mb0.pack(side=LEFT)
	mb1.pack(side=LEFT)
	mb2.pack(side=LEFT)

	root.columnconfigure(0, weight=0)


	def saveArea(nameVar,window,btn, x,y):
		print(btn)
		btn["text"]="name: " + nameVar.get()
		print(nameVar.get())

	def openArea(btn, x, y):
		print(str(x) + " " + str(y))
		window = Toplevel()
		window.geometry('150x150')
		print("[" + btn.cget("text") + "]")
		if(btn.cget("text")!=""):
			nameVar = StringVar(root, value=btn.cget("text")[5:])
		else:
			nameVar   = tk.StringVar()
		nameLabel = Label(window, text="name").pack(anchor=W)
		nameBox   = Entry(window, textvariable=nameVar).pack()
		descLabel = Label(window, text="description").pack(anchor=W)
		descBox   = Entry(window).pack()
		saveButt  = Button(window, text="Save", command=lambda 
				window=window, 
				btn=btn, 
				x=x,
				y=y,
				nameVar=nameVar:saveArea(nameVar,window, btn,x,y)).pack(anchor=W)


	guiFrame = Frame(root)
	#scrollbar = Scrollbar(root, orient='vertical', command=guiFrame.yview)
	#text['yscrollcommand'] = scrollbar.set

	for x in range(1,20):
		root.columnconfigure(x, weight=0)
		for y in range(0,20):
			btn = tk.Button(guiFrame, height=2,width=10,text="", relief=FLAT, background=bgColors[(x+y)%len(bgColors)])
			btn.grid(column=y,row=x)
			btn["command"]=lambda btn=btn, x=x, y=y:openArea(btn, x, y)


	guiFrame.pack()





	root.mainloop()


if __name__ == "__main__":
	main()
