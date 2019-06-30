var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var geocoder = require('geocoder');
var { isLoggedIn, checkUserCampground, checkUserComment, isAdmin } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all campgrounds
router.get("/", function(req, res){
  if((req.query.search1 || req.query.search2 || req.query.search3  || req.query.search4 ) && req.xhr) {
      // const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all campgrounds from DB
    //   Campground.find({name: regex}, function(err, allCampgrounds){
    //      if(err){
    //         console.log(err);
    //      } else {
    //         res.status(200).json(allCampgrounds);
    //      }
    //   });
    Campground.find({
      $and : 
      [
        {"name": {$regex : ".*" + req.query.search1 + ".*"}},
        {"description": {$regex : ".*" + req.query.search2 + ".*"}},
        {"cost": {$regex : ".*" + req.query.search3 + ".*"}},
         {"location": {$regex : ".*" + req.query.search4 + ".*"}}
    ]}, function(err, allCampgrounds){
      if (err){
        console.log(err);
      } else {
        res.status(200).json(allCampgrounds);
      }
    });
  } else {
      // Get all campgrounds from DB
      Campground.find({}, function(err, allCampgrounds){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allCampgrounds);
            } else {
              res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
            }
         }
      });
  }
});

//CREATE - add new campground to DB
router.post("/", isLoggedIn,  function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
var cost = req.body.cost;
var location = req.body.location
 
   
    var newCampground = {name: name, image: image, description: desc, cost: cost, author:author, location:location};
    // Create a new finding and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });


//NEW - show form to create new finding entry
router.get("/new", isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one finding
router.get("/:id", function(req, res){
    //find the finding with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            return res.redirect('/campgrounds');
        }
        console.log(foundCampground)
        //render show template with that campground
        res.render("campgrounds/show", {campground: foundCampground});
    });
});

// EDIT - shows edit form for a finding
router.get("/:id/edit", isLoggedIn, checkUserCampground, function(req, res){
  //render edit template with that finding
  res.render("campgrounds/edit", {campground: req.campground});
});

// PUT - updates finding in the database
router.put("/:id",  function(req, res){
  
    var newData = {name: req.body.name, image: req.body.image, description: req.body.description, cost: req.body.cost, location:req.body.location};
    Campground.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Επιτυχής Αλλαγή!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });


// DELETE - removes finding and its comments from the database
router.delete("/:id", isLoggedIn, checkUserCampground, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.campground.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.campground.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Διαγραφή Ευρήματος Επιτυχής!');
            res.redirect('/campgrounds');
          });
      }
    })
});

module.exports = router;

