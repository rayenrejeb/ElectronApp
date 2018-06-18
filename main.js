const electron = require('electron')
const url = require('url')
const path = require('path')
const mongoose = require('mongoose');
var User = require('./models/user')
var uri = "mongodb://adminadmin1:adminadmin1@ds163700.mlab.com:63700/shoppinglist713"
var db

const { app, BrowserWindow, Menu } = electron
const { ipcMain } = electron

//Set ENV 
//process.env.NODE_ENV = 'production'

let mainWindow
let addWindow



//Listen for app to be ready
app.on('ready', function(){

    //connect to database
    db = mongoose.connect(uri, function(err, data){
    if(err)    
        console.log(err)
    });

    //create new window
    mainWindow = new BrowserWindow({})
    //load the html file into the window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/authentication.html'),
        protocol:'file',
        slashes: true
    }))

    //Quit app when closed
    mainWindow.on('closed', function(){
        app.quit()
        mongoose.connection.close()
    })

    //Build menu for template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    //Insert Menu
    Menu.setApplicationMenu(mainMenu)
})

//Handle create add window
function createAddWindow(){
    addWindow = new BrowserWindow({
        width:200,
        height:100,
        title: 'Add Shopping List Item'
    })
    //load the html file into the window
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views/addWindow.html'),
        protocol:'file',
        slashes: true
    }))

    //Garbage collection Handler
    addWindow.on('closed', function(){
        addWindow = null
    })
}

//catch item:add
ipcMain.on('item:add', function(e, item){
    if(item != '')
        mainWindow.webContents.send('item:add', item)
    addWindow.close()
})


//catch new user
ipcMain.on('new:user', function(e,user){
    e.preventDefault()
    console.log(user)
    User.find({username: user.username}, function(err, data){
        if(Object.keys(data).length != 0){
            console.log("User already exists")
            mainWindow.webContents.send('user:exists')
        }
        else
        User.create(user,function(err, u){
            if(err)
                console.log(err)
            else{
                console.log(user.username + " created.")
                mainWindow.webContents.send('user:added')
            }
        })
    })
    
})

//catch SignIn request
ipcMain.on("user:check", function(e, userSignIn){
    e.preventDefault()
    User.find({username: userSignIn.username,password: userSignIn.password}, function(err, data){
        if(err)
            console.log(err)
        else if(Object.keys(data).length == 0){
            mainWindow.webContents.send("user:doesNotExist")
            console.log("not found " + userSignIn)
        }
        else{
            let up = String(userSignIn.password)
            let dp = String(data[0].password)
            if(!up.localeCompare(dp)){
                //navigate to index page              
                mainWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'views/profile.html'),
                    protocol:'file',
                    slashes: true}))
                // 'will-navigate' is an event emitted when the window.location changes
                // newUrl should contain the tokens you need

            }
        }
    })
})

// Create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu:[
            {
                label: 'Add Item',
                accelerator: process.platform == 'darwin' ? 'Command+W' : 'Ctrl+W',
                click(){
                    createAddWindow()
                }
            },
            {
                label: 'Clear Items',
                click(){
                    mainWindow.webContents.send('item:clear')
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit()
                    mongoose.connection.close()
                }
            }
        ]
    }
]

//If Mac, add empty object in menu
if(process.platform == 'darwin')
    mainMenuTemplate.unshift({})

//Add develepor tool item if not in prodcution

if(process.env.NODE_ENV !== 'production')
    mainMenuTemplate.push({
        label: 'Developer Tool',
        submenu:[
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools()
                }
            },
            {
                role: 'reload'
            }
        ]
    })