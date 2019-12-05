'use strict';

var avgRating = document.getElementById('avgRating');
var category = document.getElementById('category');
var city = document.getElementById('city');
var names = document.getElementById('name');
var numRatings = document.getElementById('numRatings');
var photo = document.getElementById('photo');
var prices = document.getElementById('prices');

var add_res = document.getElementById('add_res');
var msgs = document.getElementById('message');
var dbObject = firebase.firestore();
var authObject = firebase.auth();

add_res.addEventListener('click', function () {
  console.log('hi i am here');
  msgs.innerText = 'waiting please ...';

  msgs.className = 'alert alert-dark';
  var storage = firebase.storage();
  var storageRef = storage.ref();
  var imagesRef = storageRef.child(photo.files[0].name);
  var upload = imagesRef.put(photo.files[0]);
  upload.then(function (snapshot) {
    snapshot.ref.getDownloadURL().then(function (image) {
      var rest = dbObject.collection('restaurants').doc();
      console.log(avgRating.value);
      console.log(category.value);
      console.log(city.value);
      console.log(names.value);
      console.log(numRatings.value);
      console.log(prices.value);
      console.log(image);

      rest.set({
        avgRating: avgRating.value,
        category: category.value,
        city: city.value,
        name: names.value,
        numRatings: numRatings.value,
        photo: image,
        price: prices.value,

      }).then(function () {
        msgs.innerText = 'Add Restaurant sucssfuly';
        msgs.className = 'alert alert-success';
        avgRating.value = '';
        category.value = '';
        city.value = '';
        names.value = '';
        numRatings.value = '';
        photo.value = '';
        prices.value = '';
      }).catch(function (err) {
        msgs.innerText = err.message + '1';
        msgs.className = 'alert alert-danger';
      });
    }).catch(function (err) {
      msgs.innerText = err.message + '2';
      msgs.className = 'alert alert-danger';
    });

  }).catch(function (err) {
    msgs.innerText = err.message + '3';
    msgs.className = 'alert alert-danger';
  });

});
