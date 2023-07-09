import tkinter as tk
from tkinter import *

root = tk.Tk()
#root.geometry("800x600")
root.title("map maker")
root.resizable(0, 0)

#colors = ["red","green","blue"]
bgColors = ["grey","lightgrey"]


menuFrame=Frame(root)
menuFrame.pack()
#root.config(menu=menuFrame)

mb0 = Menubutton(menuFrame, text="File",relief=RAISED)
fileButton = Menu(mb0,tearoff=0)
fileButton.add_command(label="New", command=root.destroy)
fileButton.add_command(label="Save", command=root.destroy)
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

def openArea(x, y):
	print(str(x) + " " + str(y))
	window = Toplevel()
	window.geometry('150x150')
	newLabel = Label(window, text="test")
	newLabel.pack()


guiFrame = Frame(root)
for x in range(1,20):
	root.columnconfigure(x, weight=0)
	for y in range(0,20):
		row = tk.Button(guiFrame, text="       ", relief=FLAT, background=bgColors[(x+y)%len(bgColors)], command=lambda x=x, y=y:openArea(x, y))
		row.grid(column=y,row=x)


guiFrame.pack()





root.mainloop()



