const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

mongoose.connect("mongodb+srv://admin-arav:test123@clustergettingstarted.xrrscl1.mongodb.net/todolistDB");
mongoose.set('strictQuery', false);

const itemSchema = {
    name: String
}

// when modeling variable's name should start capitalised
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({
    name: "Welcome to your todo list"
})

const item2 = new Item({
    name: "Hit the + button to add a new item"
})

const item3 = new Item({
    name: "<-- hit this to delete the item"
})

const defaultItems = [item1, item2, item3]
const listSchema = {
    name: String,
    items: [itemSchema]
}
const List = mongoose.model("List", listSchema)

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.get("/", function (req, res) {
    // const day = date.getDate();
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                }
            })
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            })
        }
    })
});
app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                // create a list that does not exist
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                //  show a list that exists
                res.render("list",{listTitle:customListName,newListItems:foundList.items})
            }
        }
    })

})

app.post("/", function (req, res) {
    const newItem = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: newItem
    })
   
    if (listName === "Today") {
        item.save();
        res.redirect("/")
    } else {
        List.findOne({name:listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" +listName);
        })
    }

});

app.post("/delete", function (req, res) {
    // console.log(req.body.checkbox);
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function (err, resp) {
            if (!err) {
                console.log(`Deleted ${resp.name}`);
                res.redirect("/");
            }
        })
    } else {
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        })
    }
    
})

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});