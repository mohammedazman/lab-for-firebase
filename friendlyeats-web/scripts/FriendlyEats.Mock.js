
'use strict';

/**
 * Adds a set of mock Restaurants to the Cloud Firestore.
 */
FriendlyEats.prototype.addMockRestaurants = function () {
  var promises = [];

  for (var i = 0; i < 20; i++) {
    var name =
        this.getRandomItem(this.data.words) +
        ' ' +
        this.getRandomItem(this.data.words);
    var category = this.getRandomItem(this.data.categories);
    var city = this.getRandomItem(this.data.cities);
    var price = Math.floor(Math.random() * 4) + 1;
    var photoID = Math.floor(Math.random() * 22) + 1;
    var photo = 'https://storage.googleapis.com/firestorequickstarts.appspot.com/food_' + photoID + '.png';
    var numRatings = 0;
    var avgRating = 0;

    var promise = this.addRestaurant({
      name: name,
      category: category,
      price: price,
      city: city,
      numRatings: numRatings,
      avgRating: avgRating,
      photo: photo,
    });

    if (!promise) {
      alert('addRestaurant() is not implemented yet!');
      return Promise.reject();
    } else {
      promises.push(promise);
    }
  }

  return Promise.all(promises);
};

/**
 * Adds a set of mock Ratings to the given Restaurant.
 */
FriendlyEats.prototype.addMockRatings = function (restaurantID) {
  var ratingPromises = [];
  for (var r = 0; r < 5 * Math.random(); r++) {
    var rating = this.data.ratings[
      parseInt(this.data.ratings.length * Math.random())
    ];
    rating.userName = 'Bot (Web)';
    rating.timestamp = new Date();
    rating.userId = firebase.auth().currentUser.uid;
    ratingPromises.push(this.addRating(restaurantID, rating));
  }

  return Promise.all(ratingPromises);
};




/**
 * Adds a set of mock meals to the Cloud Firestore.
 */
FriendlyEats.prototype.meals = function (restaurantID) {
  var promises = [];

  for (var i = 0; i < 20; i++) {
    var name =
        this.getRandomItem(this.data.words) +
        ' ' +
        this.getRandomItem(this.data.words);
    var price = Math.floor(Math.random() * 100) + 1;
    var photoID = Math.floor(Math.random() * 22) + 1;
    var photo = 'https://storage.googleapis.com/firestorequickstarts.appspot.com/food_' + photoID + '.png';

    var promise = this.addMeal({
      name: name,

      numRatings: numRatings,
      avgRating: avgRating,
      photo: photo,
    }, restaurantID);

    if (!promise) {
      alert('addmeal() is not implemented yet!');
      return Promise.reject();
    } else {
      promises.push(promise);
    }
  }

  return Promise.all(promises);
};
